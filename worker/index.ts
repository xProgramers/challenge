import {
  checkPassword, createSession, currentUser, endSession, getCookie, hashPassword, verifyGoogleToken,
  type Env, type User,
} from './auth.ts';
import { pushToUser, vapid } from './push.ts';
import { claim, runReminders } from './reminders.ts';
import { invitePage } from './invite.ts';
import { addDays, err, inviteCode, json, localDay, randomId, streak, validTz, weekStart } from './util.ts';

const ICONS = ['pushup', 'squat', 'run', 'gym', 'generic', 'book', 'water', 'mind'];
const AVATAR_COLORS = ['#FF9500', '#FF3B30', '#FF2D55', '#AF52DE', '#5856D6', '#007AFF', '#30B0C7', '#34C759'];
const MAX_CHALLENGES = 20;
const HISTORY_DAYS = 400;

type Ctx = { env: Env; req: Request; url: URL; exec: ExecutionContext };

export default {
  async fetch(req: Request, env: Env, exec: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (url.pathname.startsWith('/i/')) return await invitePage(env, url);
      if (url.pathname.startsWith('/api/')) return await api({ env, req, url, exec });
      return env.ASSETS.fetch(req);
    } catch (e) {
      console.log('erro', url.pathname, String(e), (e as Error).stack);
      return err(500, 'Algo deu errado. Tente de novo.');
    }
  },
  async scheduled(ev: ScheduledController, env: Env, exec: ExecutionContext) {
    exec.waitUntil(runReminders(env, new Date(ev.scheduledTime)));
  },
} satisfies ExportedHandler<Env>;

async function body<T>(req: Request): Promise<Partial<T>> {
  try { return await req.json(); } catch { return {}; }
}

async function api(c: Ctx): Promise<Response> {
  const { env, req, url } = c;
  const path = url.pathname.slice(4); // tira "/api"
  const m = req.method;

  // Login do Google em modo redirect: o Google posta um formulário (proteção pelo cookie g_csrf_token).
  if (path === '/auth/google' && m === 'POST') return googleLogin(c);

  // Demais escritas só com JSON: um site de fora não consegue mandar isso com os cookies sem passar pelo CORS.
  if (m !== 'GET' && !(req.headers.get('content-type') || '').includes('application/json')) {
    return err(415, 'Envie JSON');
  }

  if (path === '/config' && m === 'GET') {
    // Não muda entre aberturas do app: o navegador guarda por 1 hora.
    return json({ googleClientId: env.GOOGLE_CLIENT_ID || null, vapidPublicKey: (await vapid(env)).publicKey }, 200, { 'cache-control': 'private, max-age=3600' });
  }
  if (path === '/auth/signup' && m === 'POST') return signup(c);
  if (path === '/auth/login' && m === 'POST') return login(c);
  if (path === '/auth/logout' && m === 'POST') return json({ ok: true }, 200, { 'set-cookie': await endSession(env, req) });
  if (path.startsWith('/invite/') && m === 'GET') {
    const inv = await env.DB.prepare('SELECT name FROM users WHERE invite_code = ?').bind(path.slice(8).toUpperCase()).first<{ name: string }>();
    return inv ? json({ name: inv.name }) : err(404, 'Convite não encontrado');
  }

  const user = await currentUser(env, req);
  if (!user) return err(401, 'Entre para continuar');

  // O app manda o fuso a cada pedido; se a pessoa viajou, o "hoje" acompanha.
  const tz = req.headers.get('x-tz');
  if (validTz(tz) && tz !== user.tz) {
    await env.DB.prepare('UPDATE users SET tz = ? WHERE id = ?').bind(tz, user.id).run();
    user.tz = tz;
  }

  if (path === '/state' && m === 'GET') return state(env, user);
  if (path === '/me' && m === 'PATCH') return updateMe(c, user);
  if (path === '/challenges' && m === 'POST') return saveChallenge(c, user, null);

  let r = path.match(/^\/challenges\/([\w-]+)$/);
  if (r && m === 'PATCH') return saveChallenge(c, user, r[1]);
  if (r && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM challenges WHERE id = ? AND user_id = ?').bind(r[1], user.id).run();
    return json({ ok: true });
  }
  r = path.match(/^\/challenges\/([\w-]+)\/done$/);
  if (r && (m === 'POST' || m === 'DELETE')) return setDone(c, user, r[1], m === 'POST');

  if (path === '/friends' && m === 'GET') return friends(env, user);
  if (path === '/invite/accept' && m === 'POST') return acceptInvite(c, user);
  r = path.match(/^\/friends\/([\w-]+)\/nudge$/);
  if (r && m === 'POST') return nudge(c, user, r[1]);
  r = path.match(/^\/friends\/([\w-]+)$/);
  if (r && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM friendships WHERE (user_id = ?1 AND friend_id = ?2) OR (user_id = ?2 AND friend_id = ?1)')
      .bind(user.id, r[1]).run();
    return json({ ok: true });
  }

  if (path === '/push/subscribe' && m === 'POST') {
    const b = await body<{ endpoint: string; keys: { p256dh: string; auth: string } }>(req);
    if (!b.endpoint?.startsWith('https://') || !b.keys?.p256dh || !b.keys?.auth) return err(400, 'Inscrição inválida');
    await env.DB.prepare(
      `INSERT INTO push_subs (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    ).bind(b.endpoint, user.id, b.keys.p256dh, b.keys.auth, Date.now()).run();
    return json({ ok: true });
  }
  if (path === '/push/unsubscribe' && m === 'POST') {
    const b = await body<{ endpoint: string }>(req);
    await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ? AND user_id = ?').bind(b.endpoint ?? '', user.id).run();
    return json({ ok: true });
  }
  if (path === '/push/test' && m === 'POST') {
    const sent = await pushToUser(env, user.id, {
      title: 'Avisos ligados',
      body: user.tone === 'gentil' ? 'É assim que eu vou te lembrar dos desafios.' : 'Agora não tem desculpa: eu vou te lembrar.',
      url: '/', tag: 'test',
    });
    return json({ sent });
  }

  return err(404, 'Não encontrado');
}

/* ---------- contas ---------- */

async function createUser(env: Env, u: { name: string; email?: string | null; googleSub?: string | null; passwordHash?: string | null; tz?: string | null }): Promise<string> {
  const id = randomId();
  const color = AVATAR_COLORS[crypto.getRandomValues(new Uint8Array(1))[0] % AVATAR_COLORS.length];
  for (let i = 0; i < 5; i++) {
    try {
      await env.DB.prepare(
        `INSERT INTO users (id, google_sub, email, password_hash, name, color, invite_code, tz, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, u.googleSub ?? null, u.email ?? null, u.passwordHash ?? null, u.name.slice(0, 40), color,
        inviteCode(), validTz(u.tz) ? u.tz : 'America/Sao_Paulo', Date.now()).run();
      return id;
    } catch (e) {
      if (!String(e).includes('invite_code')) throw e; // código repetido: tenta outro
    }
  }
  throw new Error('Não deu para gerar o código de convite');
}

const cleanEmail = (e?: string) => (e ?? '').trim().toLowerCase();

async function signup({ env, req }: Ctx): Promise<Response> {
  const b = await body<{ name: string; email: string; password: string }>(req);
  const email = cleanEmail(b.email), name = (b.name ?? '').trim();
  if (!name) return err(400, 'Coloque seu nome');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err(400, 'E-mail inválido');
  if ((b.password ?? '').length < 6) return err(400, 'A senha precisa de pelo menos 6 caracteres');
  if (await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) {
    return err(409, 'Esse e-mail já tem conta. Toque em Entrar.');
  }
  const id = await createUser(env, { name, email, passwordHash: await hashPassword(b.password!), tz: req.headers.get('x-tz') });
  return json({ ok: true }, 200, { 'set-cookie': await createSession(env, id) });
}

async function login({ env, req }: Ctx): Promise<Response> {
  const b = await body<{ email: string; password: string }>(req);
  const row = await env.DB.prepare('SELECT id, password_hash FROM users WHERE email = ?')
    .bind(cleanEmail(b.email)).first<{ id: string; password_hash: string | null }>();
  if (!row?.password_hash) {
    return err(401, row ? 'Essa conta entra com o Google.' : 'E-mail ou senha incorretos');
  }
  if (!await checkPassword(b.password ?? '', row.password_hash)) return err(401, 'E-mail ou senha incorretos');
  return json({ ok: true }, 200, { 'set-cookie': await createSession(env, row.id) });
}

async function googleLogin({ env, req }: Ctx): Promise<Response> {
  if (!env.GOOGLE_CLIENT_ID) return err(503, 'Login com Google ainda não configurado');
  const isForm = (req.headers.get('content-type') || '').includes('form');
  let credential: string | null = null;
  if (isForm) {
    const f = await req.formData();
    const csrf = f.get('g_csrf_token');
    if (!csrf || csrf !== getCookie(req, 'g_csrf_token')) return Response.redirect(new URL('/?erro=login', req.url).toString(), 303);
    credential = f.get('credential') as string | null;
  } else {
    credential = (await body<{ credential: string }>(req)).credential ?? null;
  }
  if (!credential) return err(400, 'Faltou o token do Google');

  let p;
  try { p = await verifyGoogleToken(credential, env.GOOGLE_CLIENT_ID); }
  catch (e) {
    console.log('google', String(e));
    return isForm ? Response.redirect(new URL('/?erro=login', req.url).toString(), 303) : err(401, 'Login do Google inválido');
  }

  const email = p.email && p.email_verified ? p.email.toLowerCase() : null;
  let row = await env.DB.prepare('SELECT id FROM users WHERE google_sub = ?').bind(p.sub).first<{ id: string }>();
  if (!row && email) {
    // Já tinha conta por e-mail: liga o Google nela.
    row = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
    if (row) await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(p.sub, row.id).run();
  }
  const id = row?.id ?? await createUser(env, { name: p.given_name || p.name || 'Você', email, googleSub: p.sub, tz: req.headers.get('x-tz') });
  const cookie = await createSession(env, id);
  if (isForm) return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': cookie } });
  return json({ ok: true }, 200, { 'set-cookie': cookie });
}

async function updateMe({ env, req }: Ctx, user: User): Promise<Response> {
  const b = await body<{ name: string; tone: string; theme: string | null }>(req);
  const name = b.name !== undefined ? b.name.trim().slice(0, 40) : user.name;
  const tone = b.tone === 'gentil' || b.tone === 'provocador' ? b.tone : user.tone;
  const theme = b.theme === 'light' || b.theme === 'dark' || b.theme === null ? b.theme : user.theme;
  if (!name) return err(400, 'Coloque seu nome');
  await env.DB.prepare('UPDATE users SET name = ?, tone = ?, theme = ? WHERE id = ?').bind(name, tone, theme, user.id).run();
  return json({ ok: true });
}

/* ---------- desafios ---------- */

async function state(env: Env, user: User): Promise<Response> {
  const today = localDay(user.tz);
  const [chs, comps, nFriends] = await env.DB.batch([
    env.DB.prepare('SELECT id, name, icon, color, remind, remind_time, insist, created_on FROM challenges WHERE user_id = ? ORDER BY created_at DESC').bind(user.id),
    env.DB.prepare('SELECT challenge_id, day FROM completions WHERE user_id = ? AND day >= ? ORDER BY day').bind(user.id, addDays(today, -HISTORY_DAYS)),
    env.DB.prepare('SELECT COUNT(*) AS n FROM friendships WHERE user_id = ?').bind(user.id),
  ]);
  const days = new Map<string, string[]>();
  for (const r of comps.results as { challenge_id: string; day: string }[]) {
    (days.get(r.challenge_id) ?? days.set(r.challenge_id, []).get(r.challenge_id)!).push(r.day);
  }
  return json({
    today,
    user: { ...user, friends: (nFriends.results[0] as { n: number }).n },
    challenges: (chs.results as Record<string, unknown>[]).map(c => ({
      ...c, remind: !!c.remind, insist: !!c.insist, days: days.get(c.id as string) ?? [],
    })),
  });
}

async function saveChallenge({ env, req }: Ctx, user: User, id: string | null): Promise<Response> {
  const b = await body<{ name: string; icon: string; color: string; remind: boolean; remind_time: string; insist: boolean }>(req);
  const name = (b.name ?? '').trim().slice(0, 28);
  if (!name) return err(400, 'Dê um nome ao desafio');
  const icon = ICONS.includes(b.icon ?? '') ? b.icon! : 'generic';
  const color = /^#[0-9A-Fa-f]{6}$/.test(b.color ?? '') ? b.color! : '#FF9500';
  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(b.remind_time ?? '') ? b.remind_time! : '20:00';
  const remind = b.remind === false ? 0 : 1, insist = b.insist === false ? 0 : 1;

  if (id) {
    const r = await env.DB.prepare(
      'UPDATE challenges SET name = ?, icon = ?, color = ?, remind = ?, remind_time = ?, insist = ? WHERE id = ? AND user_id = ?',
    ).bind(name, icon, color, remind, time, insist, id, user.id).run();
    if (!r.meta.changes) return err(404, 'Desafio não encontrado');
    return json({ id });
  }
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM challenges WHERE user_id = ?').bind(user.id).first<{ n: number }>();
  if (n && n.n >= MAX_CHALLENGES) return err(400, `Dá para ter até ${MAX_CHALLENGES} desafios`);
  id = randomId(12);
  await env.DB.prepare(
    `INSERT INTO challenges (id, user_id, name, icon, color, remind, remind_time, insist, created_on, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, user.id, name, icon, color, remind, time, insist, localDay(user.tz), Date.now()).run();
  return json({ id });
}

async function setDone({ env, exec }: Ctx, user: User, id: string, done: boolean): Promise<Response> {
  const ch = await env.DB.prepare('SELECT id FROM challenges WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!ch) return err(404, 'Desafio não encontrado');
  const today = localDay(user.tz);
  if (done) {
    const r = await env.DB.prepare('INSERT OR IGNORE INTO completions (challenge_id, user_id, day, created_at) VALUES (?, ?, ?, ?)')
      .bind(id, user.id, today, Date.now()).run();
    if (r.meta.changes) exec.waitUntil(notifyPassed(env, user));
  } else {
    await env.DB.prepare('DELETE FROM completions WHERE challenge_id = ? AND day = ?').bind(id, today).run();
  }
  return json({ day: today });
}

/* ---------- amigos e ranking ---------- */

interface Board { id: string; name: string; color: string; week: number; streak: number; doneToday: number; total: number }

/** Pontos da semana (cada desafio feito num dia vale 1) e maior ofensiva ativa, no fuso de cada um. */
async function boards(env: Env, people: { id: string; name: string; color: string; tz: string }[]): Promise<Board[]> {
  return Promise.all(people.map(async p => {
    const today = localDay(p.tz);
    const [chs, comps] = await env.DB.batch([
      env.DB.prepare('SELECT id FROM challenges WHERE user_id = ?').bind(p.id),
      env.DB.prepare('SELECT challenge_id, day FROM completions WHERE user_id = ? AND day >= ?').bind(p.id, addDays(today, -HISTORY_DAYS)),
    ]);
    const rows = comps.results as { challenge_id: string; day: string }[];
    const ws = weekStart(today);
    const per = new Map<string, Set<string>>();
    for (const r of rows) (per.get(r.challenge_id) ?? per.set(r.challenge_id, new Set()).get(r.challenge_id)!).add(r.day);
    const ids = (chs.results as { id: string }[]).map(c => c.id);
    return {
      id: p.id, name: p.name, color: p.color,
      week: rows.filter(r => r.day >= ws && r.day <= today).length,
      streak: Math.max(0, ...ids.map(i => streak(per.get(i) ?? new Set(), today))),
      doneToday: ids.filter(i => per.get(i)?.has(today)).length,
      total: ids.length,
    };
  }));
}

async function friendList(env: Env, userId: string) {
  const { results } = await env.DB.prepare(
    'SELECT u.id, u.name, u.color, u.tz FROM friendships f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ?',
  ).bind(userId).all<{ id: string; name: string; color: string; tz: string }>();
  return results;
}

/** Só os pontos da semana: uma contagem por pessoa, sem ler o histórico inteiro. */
async function weekScores(env: Env, people: { id: string; tz: string }[]): Promise<Map<string, number>> {
  const rows = await env.DB.batch(people.map(p => {
    const today = localDay(p.tz);
    return env.DB.prepare('SELECT COUNT(*) AS n FROM completions WHERE user_id = ? AND day >= ? AND day <= ?').bind(p.id, weekStart(today), today);
  }));
  return new Map(people.map((p, i) => [p.id, (rows[i].results[0] as { n: number }).n]));
}

/** Quem eu acabei de passar no ranking da semana recebe um aviso (uma vez por semana por pessoa). */
async function notifyPassed(env: Env, user: User): Promise<void> {
  const friends = await friendList(env, user.id);
  if (!friends.length) return;
  const after = await weekScores(env, [user, ...friends]);
  // Acabou de ganhar 1 ponto: antes eram mineAfter - 1.
  const mineAfter = after.get(user.id) ?? 0, mineBefore = mineAfter - 1;
  const ws = weekStart(localDay(user.tz));
  for (const [fid, score] of after) {
    if (fid === user.id || !(mineBefore <= score && mineAfter > score)) continue;
    if (!await claim(env, fid, ws, `passed:${user.id}`)) continue;
    const f = await env.DB.prepare('SELECT tone FROM users WHERE id = ?').bind(fid).first<{ tone: string }>();
    await pushToUser(env, fid, {
      title: `${user.name.split(' ')[0]} passou você`,
      body: f?.tone === 'gentil' ? 'No ranking da semana. Bora junto?' : 'No ranking da semana. Vai deixar barato?',
      url: '/amigos', tag: 'passed',
    });
  }
}

async function friends(env: Env, user: User): Promise<Response> {
  const list = await friendList(env, user.id);
  const today = localDay(user.tz);
  const nudged = new Set((await env.DB.prepare("SELECT slot FROM sent_log WHERE user_id = ? AND day = ? AND slot LIKE 'nudge:%'")
    .bind(user.id, today).all<{ slot: string }>()).results.map(r => r.slot.slice(6)));
  const all = await boards(env, [user, ...list]);
  return json({
    weekStart: weekStart(today),
    inviteCode: user.invite_code,
    people: all.map(b => ({ ...b, me: b.id === user.id, nudged: nudged.has(b.id) })),
  });
}

async function nudge({ env }: Ctx, user: User, friendId: string): Promise<Response> {
  const f = await env.DB.prepare(
    'SELECT u.tone FROM friendships f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ? AND f.friend_id = ?',
  ).bind(user.id, friendId).first<{ tone: string }>();
  if (!f) return err(404, 'Amigo não encontrado');
  // O registro fica no dia de quem cutuca, para o botão virar "Cutucado".
  if (!await claim(env, user.id, localDay(user.tz), `nudge:${friendId}`)) return json({ ok: true, already: true });
  await pushToUser(env, friendId, {
    title: `${user.name.split(' ')[0]} te cutucou`,
    body: f.tone === 'gentil' ? 'Ainda dá tempo de fazer os desafios de hoje.' : 'Você ainda não fez os desafios de hoje. Vai deixar a chama apagar?',
    url: '/', tag: `nudge-${user.id}`,
  });
  return json({ ok: true });
}

async function acceptInvite({ env, req }: Ctx, user: User): Promise<Response> {
  const code = ((await body<{ code: string }>(req)).code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const inv = await env.DB.prepare('SELECT id, name FROM users WHERE invite_code = ?').bind(code).first<{ id: string; name: string }>();
  if (!inv) return err(404, 'Convite não encontrado');
  if (inv.id === user.id) return json({ ok: true, self: true });
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)').bind(user.id, inv.id, now),
    env.DB.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)').bind(inv.id, user.id, now),
  ]);
  await pushToUser(env, inv.id, {
    title: `${user.name.split(' ')[0]} aceitou seu desafio`,
    body: 'Agora vocês estão no mesmo ranking da semana.',
    url: '/amigos', tag: 'friend',
  });
  return json({ ok: true, name: inv.name });
}
