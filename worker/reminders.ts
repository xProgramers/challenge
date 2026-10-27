import type { Env } from './auth.ts';
import { pushToUser, type PushMessage } from './push.ts';
import { addDays, localDay, localHM, streak } from './util.ts';

/** Horários fixos em que o app insiste se ainda tem desafio pendente. */
export const INSIST_SLOTS = ['12:00', '22:00', '23:30'] as const;

const dias = (n: number) => (n === 1 ? 'dia' : 'dias');

export interface Pending { id: string; name: string; streak: number }

/** Texto de cada aviso, no tom escolhido. `friend` é um amigo que já fez tudo hoje (para provocar). */
export function insistMessage(slot: string, tone: string, c: Pending, more: number, friend?: string): PushMessage {
  const P = tone !== 'gentil';
  const n = c.name, s = c.streak;
  const extra = more > 0 ? ` (e mais ${more})` : '';
  const url = `/desafio/${c.id}`;
  if (slot === '12:00') return P
    ? { title: 'Sua chama está te olhando', body: `Resolve ${n} antes do almoço e fica livre o resto do dia.${extra}`, url }
    : { title: `Bom momento para ${n}`, body: `Que tal tirar ${n} do caminho antes do almoço?${extra}`, url };
  if (slot === '22:00') return P
    ? { title: 'Faltam 2 horas', body: s > 0 ? `${s} ${dias(s)} de ${n} não se jogam fora assim. São 2 minutinhos.${extra}` : `Ainda dá para começar a ofensiva de ${n} hoje. São 2 minutinhos.${extra}`, url }
    : { title: 'Um lembrete com carinho', body: `Faltam 2 horas para fechar o dia. Você consegue.${extra}`, url };
  // 23:30
  if (P) {
    const base = s > 0 ? `Sua ofensiva de ${s} ${dias(s)} em ${n} acaba à meia-noite.` : `Meia hora para fazer ${n} hoje.`;
    return { title: 'Vai deixar a chama apagar?', body: base + (friend ? ` ${friend} já fez os desafios de hoje.` : '') + extra, url };
  }
  return { title: 'Ainda dá tempo', body: (s > 0 ? `Sua ofensiva de ${s} ${dias(s)} em ${n} vai até a meia-noite.` : `Ainda dá para fazer ${n} hoje.`) + ' Um pouquinho já conta.' + extra, url };
}

export function timeMessage(c: Pending, time: string): PushMessage {
  const h = time.endsWith(':00') ? `${Number(time.slice(0, 2))}h` : time;
  return { title: `Hora de ${c.name}`, body: `Seu lembrete das ${h}. Fez hoje, conta.`, url: `/desafio/${c.id}` };
}

/** Arredonda para o quarto de hora (o cron roda a cada 15 min e pode atrasar uns segundos). */
export function quarter(hm: string): string {
  const [h, m] = hm.split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(m - (m % 15)).padStart(2, '0')}`;
}

/** Marca o aviso como enviado; devolve false se já tinha sido. */
export async function claim(env: Env, userId: string, day: string, slot: string): Promise<boolean> {
  const r = await env.DB.prepare('INSERT OR IGNORE INTO sent_log (user_id, day, slot, created_at) VALUES (?, ?, ?, ?)')
    .bind(userId, day, slot, Date.now()).run();
  return r.meta.changes > 0;
}

export async function runReminders(env: Env, now = new Date()): Promise<void> {
  const { results: users } = await env.DB.prepare(
    'SELECT DISTINCT u.id, u.tz, u.tone FROM users u JOIN push_subs p ON p.user_id = u.id',
  ).all<{ id: string; tz: string; tone: string }>();

  for (const u of users) {
    const today = localDay(u.tz, now);
    const slot = quarter(localHM(u.tz, now));
    const { results: chs } = await env.DB.prepare(
      'SELECT id, name, remind, remind_time, insist FROM challenges WHERE user_id = ?',
    ).bind(u.id).all<{ id: string; name: string; remind: number; remind_time: string; insist: number }>();
    if (!chs.length) continue;
    const { results: comps } = await env.DB.prepare(
      'SELECT challenge_id, day FROM completions WHERE user_id = ? AND day >= ?',
    ).bind(u.id, addDays(today, -400)).all<{ challenge_id: string; day: string }>();
    const daysOf = new Map<string, Set<string>>();
    for (const c of comps) (daysOf.get(c.challenge_id) ?? daysOf.set(c.challenge_id, new Set()).get(c.challenge_id)!).add(c.day);

    const pending = chs.filter(c => !daysOf.get(c.id)?.has(today))
      .map(c => ({ ...c, streak: streak(daysOf.get(c.id) ?? new Set(), today) }))
      .sort((a, b) => b.streak - a.streak);
    if (!pending.length) continue;

    // Lembrete no horário escolhido em cada desafio.
    for (const c of pending) {
      if (c.remind && quarter(c.remind_time) === slot && await claim(env, u.id, today, `time:${c.id}`)) {
        await pushToUser(env, u.id, { ...timeMessage(c, c.remind_time), tag: `c-${c.id}` });
      }
    }

    // Insistência ao longo do dia.
    const insisting = pending.filter(c => c.insist);
    if ((INSIST_SLOTS as readonly string[]).includes(slot) && insisting.length && await claim(env, u.id, today, `insist:${slot}`)) {
      let friend: string | undefined;
      if (slot === '23:30' && u.tone !== 'gentil') friend = await friendDoneToday(env, u.id, now);
      await pushToUser(env, u.id, { ...insistMessage(slot, u.tone, insisting[0], insisting.length - 1, friend), tag: 'insist' });
    }
  }
}

/** Nome de um amigo que já fez todos os desafios hoje (no fuso dele), se houver. */
async function friendDoneToday(env: Env, userId: string, now: Date): Promise<string | undefined> {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.name, u.tz,
       (SELECT COUNT(*) FROM challenges c WHERE c.user_id = u.id) AS total
     FROM friendships f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ?`,
  ).bind(userId).all<{ id: string; name: string; tz: string; total: number }>();
  for (const f of results) {
    if (!f.total) continue;
    const done = await env.DB.prepare('SELECT COUNT(*) AS n FROM completions WHERE user_id = ? AND day = ?')
      .bind(f.id, localDay(f.tz, now)).first<{ n: number }>();
    if (done && done.n >= f.total) return f.name.split(' ')[0];
  }
  return undefined;
}
