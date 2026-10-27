import type { Env } from './auth.ts';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Página do link de convite (/i/CODIGO): tem prévia bonita no WhatsApp e o botão "Aceitar desafio". */
export async function invitePage(env: Env, url: URL): Promise<Response> {
  const code = url.pathname.split('/')[2]?.toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
  const inv = await env.DB.prepare('SELECT name FROM users WHERE invite_code = ?').bind(code).first<{ name: string }>();
  const first = inv ? esc(inv.name.split(' ')[0]) : '';
  const title = inv ? `${first} te desafiou no Challenge` : 'Challenge';
  const desc = 'Um desafio. Todo dia. Sem falhar. Entre no ranking da semana e veja quem mantém a chama acesa.';
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${url.origin}/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="${url.origin}/i/${code}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F2F2F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#26272B" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/icons/icon-192.png">
<link rel="stylesheet" href="/app.css">
</head><body class="invite-page">
<main class="invite-land">
  <div class="brandflame"><svg class="flame flicker" viewBox="0 0 100 120" aria-hidden="true"><g class="fl"><path class="l1" d="M50 4C56 18 66 28 74 40 77 34 77 28 75 22 88 34 90 54 86 76 82 100 68 116 50 116 30 116 14 100 14 76 14 58 24 46 32 36 33 46 37 52 43 55 39 38 42 20 50 4Z"/><path class="l2" d="M50 38C56 52 72 62 72 84 72 102 62 113 50 113 38 113 28 102 28 86 28 74 36 66 40 58 42 66 45 70 49 71 46 60 46 49 50 38Z"/><path class="l3" d="M50 68C54 78 62 85 62 95 62 104 57 110 50 110 43 110 38 104 38 96 38 89 43 84 46 79 47 83 48 85 50 86 49 80 49 74 50 68Z"/></g></svg></div>
  ${inv
    ? `<h1>${first} te desafiou</h1><p>Entre no Challenge e vocês ficam no mesmo ranking da semana. Quem fizer mais desafios até domingo leva a coroa.</p>
       <a class="btn primary" href="/?convite=${code}">Aceitar desafio</a>`
    : `<h1>Convite não encontrado</h1><p>Confira o link com quem te mandou. Você ainda pode entrar e criar seus desafios.</p>
       <a class="btn primary" href="/">Abrir o Challenge</a>`}
</main>
${FLAME_DEFS}
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

const FLAME_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="gF1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9A3D"/><stop offset=".6" stop-color="#FF5A24"/><stop offset="1" stop-color="#F0322A"/></linearGradient>
<linearGradient id="gF2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC24A"/><stop offset="1" stop-color="#FF8A1F"/></linearGradient>
<linearGradient id="gF3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6CC"/><stop offset="1" stop-color="#FFD966"/></linearGradient>
</defs></svg>`;
