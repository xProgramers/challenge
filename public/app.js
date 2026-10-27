// Challenge: app de desafio pessoal. Telas e animações vindas do protótipo aprovado (v0.4).

/* chama em três camadas: base vermelho-laranja, meio âmbar, núcleo claro */
const FLAME_PATHS =
  '<g class="fl">'+
  '<path class="l1" d="M50 4C56 18 66 28 74 40 77 34 77 28 75 22 88 34 90 54 86 76 82 100 68 116 50 116 30 116 14 100 14 76 14 58 24 46 32 36 33 46 37 52 43 55 39 38 42 20 50 4Z"/>'+
  '<path class="l2" d="M50 38C56 52 72 62 72 84 72 102 62 113 50 113 38 113 28 102 28 86 28 74 36 66 40 58 42 66 45 70 49 71 46 60 46 49 50 38Z"/>'+
  '<path class="l3" d="M50 68C54 78 62 85 62 95 62 104 57 110 50 110 43 110 38 104 38 96 38 89 43 84 46 79 47 83 48 85 50 86 49 80 49 74 50 68Z"/>'+
  '</g>';
const flame = cls => '<svg class="flame '+(cls||'')+'" viewBox="0 0 100 120" aria-hidden="true">'+FLAME_PATHS+'</svg>';
const seal = s => '<span class="seal" style="--s:'+s+'px">'+flame('white')+'</span>';

/* bonequinhos: grade 32, traço 2.3, cabeça cheia, chão em tom suave */
const ic = d => '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
const head = (x,y) => '<circle cx="'+x+'" cy="'+y+'" r="2.7" fill="currentColor" stroke="none"/>';
const ground = (a,b,y) => '<path d="M'+a+' '+y+'H'+b+'" opacity=".35"/>';
const ICONS = {
  pushup:{label:'Flexões', svg:ic(head(6.6,13.4)+'<path d="M9.8 15.3 26.4 20.6l1.4 2.4"/><path d="M11.4 15.9v7.1"/>'+ground(3.5,29.5,24.6))},
  squat:{label:'Agachamento', svg:ic(head(13.2,6)+'<path d="M13 9.3 10.2 17l8 1.6-2 7.6h3.6"/><path d="M12.4 11.8h9"/>'+ground(6,27,27.8))},
  run:{label:'Corrida', svg:ic(head(19.6,5.6)+'<path d="M18.4 9 14.8 16.6l5 2.6-1.8 6.4"/><path d="M14.8 16.6 11.6 21 6.8 22"/><path d="M17.6 11l3.4 2.6 3.2-2.4"/><path d="M17.6 11 13.8 12l-2.4 3.2"/><path d="M3 12.5h4M2.2 16.5h3" opacity=".4"/>')},
  gym:{label:'Academia', svg:ic(head(16,11.6)+'<path d="M5 6.4h22"/><path d="M6.8 3.6v5.6M25.2 3.6v5.6" stroke-width="3.2"/><path d="M11 6.6l1.2 5.2 3.8 3.2 3.8-3.2L21 6.6"/><path d="M16 15v7.4l-3.6 6.2M16 22.4l3.6 6.2"/>')},
  generic:{label:'Livre', svg:ic(head(16,6.4)+'<path d="M16 9.8v9.4l-3.8 7.6M16 19.2l3.8 7.6"/><path d="M9.6 4.8 16 12.6l6.4-7.8"/><path d="M6 9.5l-1.5-1M26 9.5l1.5-1M5.2 14H3.4M26.8 14h1.8" opacity=".45"/>')},
  book:{label:'Leitura', svg:ic('<path d="M4.5 8.5c4-1.6 8-1.3 11.5 1.2 3.5-2.5 7.5-2.8 11.5-1.2v16c-4-1.4-8-1.1-11.5 1.3-3.5-2.4-7.5-2.7-11.5-1.3z"/><path d="M16 9.7v16"/><path d="M8 13c1.6-.4 3.2-.3 4.8.4M8 17c1.6-.4 3.2-.3 4.8.4M19.2 13.4c1.6-.7 3.2-.8 4.8-.4" opacity=".45"/>')},
  water:{label:'Água', svg:ic('<path d="M16 4.5s8.5 8.6 8.5 15a8.5 8.5 0 0 1-17 0c0-6.4 8.5-15 8.5-15z"/><path d="M11.8 19.8a4.4 4.4 0 0 0 3.6 4.3" opacity=".5"/>')},
  mind:{label:'Meditar', svg:ic(head(16,6.6)+'<path d="M16 10v8.2"/><path d="M16 12.6l-4.4 3.6-1.6 4.2M16 12.6l4.4 3.6 1.6 4.2"/><path d="M6.4 23.4c3-2.4 6.2-3 9.6-3s6.6.6 9.6 3"/>'+ground(7,25,26.6))}
};
const COLORS = ['#FF9500','#FF3B30','#FF2D55','#AF52DE','#5856D6','#007AFF','#30B0C7','#34C759'];
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>';
const CROWN = '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>';

const WD = ['D','S','T','Q','Q','S','S'];
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const WDLONG = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dias = n => n===1?'dia':'dias';
const first = name => String(name).split(' ')[0];
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
document.querySelectorAll('[data-flame]').forEach(el => { el.outerHTML = flame(el.dataset.flame).replace('<svg', el.id ? '<svg id="'+el.id.replace('box','')+'"' : '<svg'); });

/* ---------- datas (dias como AAAA-MM-DD, "hoje" vem do servidor no fuso da pessoa) ---------- */
const parse = d => { const [y,m,dd] = d.split('-').map(Number); return new Date(y, m-1, dd); };
const fmt = dt => dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
const addDays = (d, n) => { const x = parse(d); x.setDate(x.getDate()+n); return fmt(x); };
const dayAgo = n => addDays(S.today, -n);
const has = (c, i) => c.days.has(dayAgo(i));
function streakOf(c){ let i = has(c,0)?0:1, n=0; while(has(c,i)){n++;i++} return n; }
function bestOf(c){ let best=0, run=0, prev=null; [...c.days].sort().forEach(d => { run = prev && addDays(prev,1)===d ? run+1 : 1; best=Math.max(best,run); prev=d; }); return best; }
function timeLeft(){ const n=new Date(), m=(23-n.getHours())*60+(60-n.getMinutes()); return Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'min'; }

/* ---------- API ---------- */
async function api(path, opts={}){
  const r = await fetch('/api'+path, {
    method: opts.method || 'GET',
    headers: {'content-type':'application/json', 'x-tz': tz},
    body: opts.body ? JSON.stringify(opts.body) : (opts.method && opts.method!=='GET' ? '{}' : undefined),
    credentials: 'same-origin',
  });
  const data = await r.json().catch(() => ({}));
  if(!r.ok){ const e = new Error(data.error || 'Sem conexão. Tente de novo.'); e.status = r.status; throw e; }
  return data;
}
function toast(msg){
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.role = 'status'; t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), 3200);
}

/* ---------- estado ---------- */
const S = { today: null, user: null, challenges: [], friends: null, config: null };
const byId = id => S.challenges.find(c => c.id === id);
async function loadState(){
  const d = await api('/state');
  S.today = d.today; S.user = d.user;
  S.challenges = d.challenges.map(c => ({...c, days: new Set(c.days)}));
  applyTheme(S.user.theme);
}

/* ---------- navegação (rotas reais, o botão voltar do Android funciona) ---------- */
const ROUTES = [
  [/^\/$/, 'today'], [/^\/amigos$/, 'friends'], [/^\/novo$/, 'create'],
  [/^\/desafio\/([\w-]+)$/, 'detail'], [/^\/desafio\/([\w-]+)\/editar$/, 'create'], [/^\/ajustes$/, 'settings'],
];
const order = ['login','today','friends','settings','create','detail'];
let cur = null, param = null;
function route(path){
  for(const [re, name] of ROUTES){ const m = path.match(re); if(m) return [name, m[1] || null]; }
  return ['today', null];
}
function navigate(path, dir, replace){
  if(path !== location.pathname) history[replace?'replaceState':'pushState']({depth:(history.state?.depth||0)+(replace?0:1)}, '', path);
  render(dir);
}
function back(){
  if((history.state?.depth||0) > 0) history.back(); else navigate('/', 'back', true);
}
addEventListener('popstate', () => { closeOverlays(); render('back'); });

function show(name, dir){
  $$('.screen').forEach(s => { s.hidden = true; s.classList.remove('enter','back','up','fade'); });
  const el = $('#s-'+name); el.hidden = false;
  const anim = dir || (name==='create' ? 'up' : (cur && order.indexOf(name) < order.indexOf(cur) ? 'back' : 'enter'));
  if(cur !== null && cur !== name && !reduce){ void el.offsetWidth; el.classList.add(anim); }
  scrollTo(0,0);
  const tabbed = name==='today' || name==='friends';
  $('#tabbar').hidden = !tabbed;
  $$('#tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab===name));
  cur = name;
}
function render(dir){
  if(!S.user){ renderLogin(); show('login', dir); return; }
  let [name, p] = route(location.pathname);
  param = p;
  if(name==='detail' && !byId(p)){ navigate('/', 'fade', true); return; }
  if(name==='create' && p && !byId(p)){ navigate('/', 'fade', true); return; }
  ({today:renderToday, friends:renderFriends, create:resetCreate, detail:renderDetail, settings:renderSettings})[name]();
  show(name, dir);
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if(g){ e.preventDefault(); navigate(g.dataset.go, g.dataset.dir); return; }
  const b = e.target.closest('[data-back]'); if(b){ e.preventDefault(); back(); }
});
// linhas com role=button respondem a Enter e espaço
document.addEventListener('keydown', e => {
  const b = e.target.closest && e.target.closest('.row.link[role=button]');
  if(b && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); b.click(); }
});

/* ---------- tema ---------- */
function applyTheme(t){
  try { t ? localStorage.setItem('theme', t) : localStorage.removeItem('theme'); } catch(e){}
  t ? document.documentElement.setAttribute('data-theme', t) : document.documentElement.removeAttribute('data-theme');
  const dark = isDark();
  $('#themebtn').innerHTML = dark
    ? '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="3" fill="currentColor"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3"/></svg>'
    : '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.6 10.1A6 6 0 0 1 5.9 2.4a6 6 0 1 0 7.7 7.7z"/></svg>';
  $$('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', b.dataset.themeSet === (t || 'auto')));
}
const isDark = () => { const t = document.documentElement.getAttribute('data-theme'); return t ? t==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
async function setTheme(t){
  S.user.theme = t; applyTheme(t);
  api('/me', {method:'PATCH', body:{theme:t}}).catch(() => {});
}
$('#themebtn').addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark'));
$$('[data-theme-set]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.themeSet==='auto' ? null : b.dataset.themeSet)));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.user && applyTheme(S.user.theme));

/* ---------- entrar ---------- */
let loginMode = 'new';
function setLoginMode(m){
  loginMode = m;
  $$('[data-seg]').forEach(x => x.setAttribute('aria-pressed', x.dataset.seg===m));
  $('#namerow').hidden = m!=='new';
  $('#loginbtn').textContent = m==='new' ? 'Criar conta' : 'Entrar';
  $('#f-pass').autocomplete = m==='new' ? 'new-password' : 'current-password';
  $('#loginerr').textContent = '';
}
$$('[data-seg]').forEach(b => b.addEventListener('click', () => setLoginMode(b.dataset.seg)));
let gsiLoaded = false;
function renderLogin(){
  const pend = pendingInvite();
  if(pend) api('/invite/'+pend).then(d => { $('#loginlede').textContent = first(d.name)+' te desafiou. Entre para aceitar.'; }).catch(() => {});
  if(new URLSearchParams(location.search).get('erro')==='login') $('#loginerr').textContent = 'Não deu para entrar com o Google. Tente de novo.';
  const cid = S.config?.googleClientId;
  $('#gbtn').hidden = $('#gor').hidden = !cid;
  if(cid && !gsiLoaded){
    gsiLoaded = true;
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => {
      google.accounts.id.initialize({ client_id: cid, ux_mode: 'redirect', login_uri: location.origin+'/api/auth/google' });
      google.accounts.id.renderButton($('#gbtn'), { theme: isDark() ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(360, innerWidth-48), locale: 'pt-BR' });
    };
    document.head.append(s);
  }
}
$('#loginform').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#loginbtn'); btn.disabled = true; $('#loginerr').textContent = '';
  try {
    const body = { email: $('#f-email').value, password: $('#f-pass').value };
    if(loginMode==='new') body.name = $('#f-name').value;
    await api(loginMode==='new' ? '/auth/signup' : '/auth/login', {method:'POST', body});
    await afterLogin();
  } catch(err){ $('#loginerr').textContent = err.message; }
  finally { btn.disabled = false; }
});
async function afterLogin(){
  await loadState();
  if(location.search) history.replaceState(history.state, '', location.pathname);
  const accepted = await acceptPendingInvite();
  navigate(accepted ? '/amigos' : (location.pathname==='/' ? '/' : location.pathname), 'fade', true);
  setupPush(false);
}

/* ---------- convite ---------- */
function pendingInvite(){ try { return localStorage.getItem('convite'); } catch(e){ return null; } }
async function acceptPendingInvite(){
  const code = pendingInvite(); if(!code) return false;
  try { localStorage.removeItem('convite'); } catch(e){}
  try {
    const r = await api('/invite/accept', {method:'POST', body:{code}});
    if(r.self) return false;
    S.user.friends++; S.friends = null;
    toast('Você e '+first(r.name)+' agora estão no mesmo ranking');
    return true;
  } catch(err){ toast(err.message); return false; }
}

/* ---------- hoje ---------- */
function weekDots(c){ let s=''; for(let i=6;i>=0;i--) s += '<i class="'+(has(c,i)?'on ':'')+(i===0?'today':'')+'"></i>'; return s; }
function card(c){
  const on = has(c,0), s = streakOf(c), icon = ICONS[c.icon] || ICONS.generic;
  return '<div class="card'+(on?' isdone':'')+'" role="button" tabindex="0" data-id="'+c.id+'" style="--c:'+c.color+'">'+
    '<div class="tile" style="--c:'+c.color+'">'+icon.svg+'</div>'+
    '<div class="card-main"><div class="card-title">'+esc(c.name)+'</div>'+
    '<div class="card-sub">'+flame(on?'':'ash')+'<b>'+s+'</b> '+dias(s)+(on?'':' · falta hoje')+'</div>'+
    '<div class="week">'+weekDots(c)+'</div></div>'+
    '<button class="check'+(on?' on':'')+'" style="--c:'+c.color+'" data-check="'+c.id+'" aria-pressed="'+on+'" aria-label="Concluir '+esc(c.name)+' hoje">'+CHECK+'</button></div>';
}
function renderToday(){
  const t = parse(S.today);
  $('#todaydate').textContent = WDLONG[t.getDay()]+', '+t.getDate()+' de '+MONTHS[t.getMonth()];
  $('#meavatar').textContent = (S.user.name[0]||'?').toUpperCase();
  $('#meavatar').style.setProperty('--av', S.user.color);
  const all = S.challenges, pend = all.filter(c=>!has(c,0)), done = all.filter(c=>has(c,0));
  $('#ringsum').hidden = $('#todayhint').hidden = !all.length;
  $('#sumtext').textContent = done.length+' de '+all.length+' feitos hoje';
  $('#sumsub').textContent = pend.length ? 'Faltam '+timeLeft()+' para fechar o dia' : 'Dia fechado. Até amanhã!';
  $('#sumring').style.strokeDashoffset = 113.1*(1-(all.length? done.length/all.length : 0));
  $('#lists').innerHTML = !all.length
    ? '<div class="empty"><div class="brandflame">'+flame('ash')+'</div><h3>Qual é o seu desafio?</h3><p>Flexões, corrida, leitura… Escolha um e faça todo dia. Sem contar quantas, só se fez.</p><button class="btn" data-go="/novo">Criar meu primeiro desafio</button></div>'
    : (pend.length ? '<div class="grp">Falta hoje</div><div class="list">'+pend.map(card).join('')+'</div>' : '')+
      (done.length ? '<div class="grp">Feito</div><div class="list">'+done.map(card).join('')+'</div>' : '');
  renderBanner();
}
$('#lists').addEventListener('click', e => {
  const chk = e.target.closest('[data-check]');
  if(chk){ e.stopPropagation(); const c = byId(chk.dataset.check);
    if(has(c,0)) undoDone(c);
    else { const r = chk.getBoundingClientRect(); chk.classList.add('on','bump'); markDone(c, r, '/'); }
    return; }
  const cd = e.target.closest('.card'); if(cd) navigate('/desafio/'+cd.dataset.id);
});
$('#lists').addEventListener('keydown', e => { if((e.key==='Enter'||e.key===' ') && e.target.classList.contains('card')){ e.preventDefault(); navigate('/desafio/'+e.target.dataset.id); }});

async function markDone(c, rect, backTo){
  const today = S.today;
  c.days.add(today);
  ignite(c, rect, backTo);
  try { await api('/challenges/'+c.id+'/done', {method:'POST'}); S.friends = null; }
  catch(err){ c.days.delete(today); toast('Não salvou: '+err.message); if(cur==='today') renderToday(); }
}
async function undoDone(c){
  c.days.delete(S.today); renderToday();
  try { await api('/challenges/'+c.id+'/done', {method:'DELETE'}); S.friends = null; }
  catch(err){ c.days.add(S.today); renderToday(); toast(err.message); }
}

/* ---------- avisos e instalação ---------- */
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if(cur==='today') renderBanner(); if(cur==='settings') renderSettings(); });
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const dismissed = k => { try { return localStorage.getItem('hide-'+k) === '1'; } catch(e){ return false; } };
function renderBanner(){
  const b = $('#banner');
  if(S.challenges.length && pushSupported() && Notification.permission==='default' && !dismissed('push')){
    b.innerHTML = '<div class="banner">'+seal(36)+'<div><b>Ligue os avisos</b><span>Eu te lembro antes da chama apagar.</span></div><button class="act" id="bannerpush">Ligar</button><button class="x" data-hide="push" aria-label="Agora não">×</button></div>';
  } else if(installEvt && !dismissed('install')){
    b.innerHTML = '<div class="banner">'+seal(36)+'<div><b>Instale o Challenge</b><span>Fica na tela inicial, como um app.</span></div><button class="act" id="bannerinstall">Instalar</button><button class="x" data-hide="install" aria-label="Agora não">×</button></div>';
  } else b.innerHTML = '';
}
$('#banner').addEventListener('click', async e => {
  const h = e.target.closest('[data-hide]');
  if(h){ try { localStorage.setItem('hide-'+h.dataset.hide, '1'); } catch(err){} renderBanner(); return; }
  if(e.target.closest('#bannerpush')){ await setupPush(true); renderBanner(); }
  if(e.target.closest('#bannerinstall')) install();
});
async function install(){
  if(!installEvt) return;
  installEvt.prompt(); await installEvt.userChoice; installEvt = null;
  if(cur==='today') renderBanner(); if(cur==='settings') renderSettings();
}

const b64ToBytes = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((s.length+3)%4)), c => c.charCodeAt(0));
/** ask=true pede permissão; ask=false só renova a inscrição se a permissão já existe. */
async function setupPush(ask){
  if(!pushSupported()) return false;
  if(ask && Notification.permission==='default') await Notification.requestPermission();
  if(Notification.permission!=='granted'){ if(ask && Notification.permission==='denied') toast('Os avisos estão bloqueados nas configurações do navegador.'); return false; }
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(S.config.vapidPublicKey) });
    await api('/push/subscribe', {method:'POST', body: sub.toJSON()});
    try { localStorage.removeItem('push-off'); } catch(e){}
    return true;
  } catch(err){ console.warn(err); if(ask) toast('Não deu para ligar os avisos.'); return false; }
}
async function disablePush(){
  const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
  if(sub){ await api('/push/unsubscribe', {method:'POST', body:{endpoint: sub.endpoint}}).catch(()=>{}); await sub.unsubscribe(); }
  try { localStorage.setItem('push-off', '1'); } catch(e){}
}
async function pushOn(){
  if(!pushSupported() || Notification.permission!=='granted') return false;
  const reg = await navigator.serviceWorker.ready;
  return !!(await reg.pushManager.getSubscription());
}

/* ---------- novo / editar desafio ---------- */
let draft;
function resetCreate(){
  const c = param ? byId(param) : null;
  draft = c ? {icon:c.icon, color:c.color} : {icon:'pushup', color:COLORS[0]};
  $('#createttl').textContent = c ? 'Editar desafio' : 'Novo desafio';
  $('#createbtn').textContent = c ? 'Salvar' : 'Criar';
  $('#cname').value = c ? c.name : '';
  $('#ctime').value = c ? c.remind_time : '20:00';
  setSwitch('#remind', c ? c.remind : true); setSwitch('#insist', c ? c.insist : true);
  $('#deletepanel').hidden = !c;
  markTone();
  drawCreate();
}
function setSwitch(id, on){ $(id).setAttribute('aria-checked', on); if(id==='#remind') $('#timerow').hidden = !on; if(id==='#insist') $('#tonerow').hidden = !on; }
function drawCreate(bump){
  const t = $('#pvtile'); t.style.setProperty('--c', draft.color); t.innerHTML = ICONS[draft.icon].svg;
  if(bump){ t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); }
  $('#cname').placeholder = ICONS[draft.icon].label;
  $('#iconpick').innerHTML = Object.entries(ICONS).map(([k,v]) =>
    '<button data-icon="'+k+'" aria-pressed="'+(k===draft.icon)+'" style="--sel:'+draft.color+'"><span>'+v.svg+'</span><span>'+v.label+'</span></button>').join('');
  $('#colorpick').innerHTML = COLORS.map(c => '<button data-color="'+c+'" style="--c:'+c+'" aria-pressed="'+(c===draft.color)+'" aria-label="Cor '+c+'"></button>').join('');
}
$('#iconpick').addEventListener('click', e => { const b = e.target.closest('[data-icon]'); if(b){ draft.icon=b.dataset.icon; drawCreate(true); }});
$('#colorpick').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if(b){ draft.color=b.dataset.color; drawCreate(true); }});
['#remind','#insist'].forEach(id => $(id).addEventListener('click', e => setSwitch(id, e.currentTarget.getAttribute('aria-checked')!=='true')));
function markTone(){ $$('[data-tone]').forEach(x => x.setAttribute('aria-pressed', x.dataset.tone===S.user.tone)); }
document.addEventListener('click', e => { const b = e.target.closest('[data-tone]'); if(!b) return;
  S.user.tone = b.dataset.tone; markTone(); api('/me', {method:'PATCH', body:{tone:S.user.tone}}).catch(err => toast(err.message)); });
$('#createbtn').addEventListener('click', async () => {
  const editing = param ? byId(param) : null;
  const body = {
    name: $('#cname').value.trim() || ICONS[draft.icon].label, icon: draft.icon, color: draft.color,
    remind: $('#remind').getAttribute('aria-checked')==='true', remind_time: $('#ctime').value || '20:00',
    insist: $('#insist').getAttribute('aria-checked')==='true',
  };
  const btn = $('#createbtn'); btn.disabled = true;
  try {
    if(editing){
      await api('/challenges/'+editing.id, {method:'PATCH', body});
      Object.assign(editing, body);
      back();
    } else {
      const r = await api('/challenges', {method:'POST', body});
      S.challenges.unshift({id:r.id, ...body, created_on:S.today, days:new Set()});
      navigate('/desafio/'+r.id, 'enter', true);
      // primeiro desafio criado: bom momento para pedir os avisos
      if((body.remind || body.insist) && pushSupported() && Notification.permission==='default') setupPush(true);
    }
  } catch(err){ toast(err.message); }
  finally { btn.disabled = false; }
});
$('#deletebtn').addEventListener('click', () => {
  const c = byId(param);
  sheet('Apagar “'+c.name+'” e toda a ofensiva? Não dá para desfazer.', [['Apagar desafio', 'danger', async () => {
    try { await api('/challenges/'+c.id, {method:'DELETE'}); S.challenges = S.challenges.filter(x => x!==c); S.friends = null; navigate('/', 'back', true); }
    catch(err){ toast(err.message); }
  }]]);
});

/* folha de ações no rodapé */
function sheet(text, actions){
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grp2">'+(text?'<p>'+esc(text)+'</p>':'')+
    actions.map((a,i) => '<button data-i="'+i+'" class="'+(a[1]||'')+'">'+esc(a[0])+'</button>').join('')+
    '</div><div class="grp2"><button class="cancel">Cancelar</button></div></div>';
  const close = () => bg.remove();
  bg.addEventListener('click', e => {
    if(e.target===bg || e.target.closest('.cancel')) return close();
    const b = e.target.closest('[data-i]'); if(b){ close(); actions[+b.dataset.i][2](); }
  });
  document.body.append(bg); bg.querySelector('button').focus();
}
function closeOverlays(){ $$('.sheet-bg').forEach(x => x.remove()); }

/* ---------- ofensiva ---------- */
function calendar(c){
  const t = parse(S.today), y=t.getFullYear(), m=t.getMonth(), firstDay=new Date(y,m,1), n=new Date(y,m+1,0).getDate();
  let g = WD.map(d=>'<div class="wd">'+d+'</div>').join('');
  for(let i=0;i<firstDay.getDay();i++) g+='<div></div>';
  for(let d=1; d<=n; d++){
    const ds = fmt(new Date(y,m,d));
    let cls = 'd'; if(ds>S.today) cls+=' future'; else if(c.days.has(ds)) cls+=' done'; if(ds===S.today) cls+=' today';
    g += '<div><span class="'+cls+'">'+d+'</span></div>';
  }
  return g;
}
function renderDetail(){
  const c = byId(param), on = has(c,0), s = streakOf(c), t = parse(S.today);
  const startDay = [c.created_on, ...c.days].sort()[0];
  const since = Math.round((t - parse(startDay))/864e5)+1;
  const pill = on ? '<div class="pill">'+seal(24)+'Feito hoje</div>'
    : (s===0 ? '<div class="pill"><span class="dot"></span>Comece hoje <span>· o 1º dia é o mais difícil</span></div>'
             : '<div class="pill"><span class="dot"></span>Falta hoje <span>· '+timeLeft()+' até a meia-noite</span></div>');
  $('#detail').innerHTML =
    '<div class="dhead"><div class="tile" style="--c:'+c.color+'">'+(ICONS[c.icon]||ICONS.generic).svg+'</div><h3>'+esc(c.name)+'</h3></div>'+
    '<div class="hero"><div class="big">'+s+'</div><div class="bigsub">'+dias(s)+' de ofensiva</div>'+pill+'</div>'+
    '<div class="stats"><div><b>'+bestOf(c)+'</b><span>Recorde</span></div><div><b>'+c.days.size+'</b><span>Dias feitos</span></div><div><b>'+Math.min(100, Math.round(c.days.size/Math.max(1,since)*100))+'%</b><span>Constância</span></div></div>'+
    '<div class="cal" style="--c:'+c.color+'"><h4>'+MONTHS[t.getMonth()][0].toUpperCase()+MONTHS[t.getMonth()].slice(1)+'<span>'+t.getFullYear()+'</span></h4><div class="grid">'+calendar(c)+'</div></div>'+
    '<div class="holdzone"><button class="hold'+(on?' done':'')+'" id="hold" style="--c:'+c.color+'">'+
      '<span>'+(on? seal(22)+'Feito hoje' : 'Segure para concluir hoje')+'</span></button>'+
      '<div class="holdhint">'+(on?'Volte amanhã para manter a chama acesa.':'Segure por 1 segundo. Sem contar quantas, só se fez.')+'</div></div>';
  bindHold(c);
}
function bindHold(c){
  const b = $('#hold'); if(has(c,0)) return;
  let t0=0, raf=0, active=false;
  const tick = t => { const p = Math.min(1,(t-t0)/900); b.style.setProperty('--p',p);
    if(p>=1){ active=false; b.classList.remove('holding'); if(navigator.vibrate) navigator.vibrate(30); markDone(c, b.getBoundingClientRect(), '/desafio/'+c.id); } else raf=requestAnimationFrame(tick); };
  const start = e => { if(active) return; if(e.type==='keydown' && (e.repeat || (e.key!==' ' && e.key!=='Enter'))) return; e.preventDefault(); active=true; b.classList.add('holding'); t0=performance.now(); raf=requestAnimationFrame(tick); };
  const stop = () => { if(!active) return; active=false; cancelAnimationFrame(raf); b.classList.remove('holding'); b.style.setProperty('--p',0); };
  b.addEventListener('pointerdown', start); b.addEventListener('keydown', start);
  ['pointerup','pointerleave','pointercancel','keyup','blur'].forEach(ev => b.addEventListener(ev, stop));
  b.addEventListener('contextmenu', e => e.preventDefault());
}
$('#moremenu').addEventListener('click', () => {
  const c = byId(param);
  sheet(null, [
    ['Editar desafio', '', () => navigate('/desafio/'+c.id+'/editar')],
    ...(has(c,0) ? [['Desmarcar hoje', '', async () => { await undoDone(c); renderDetail(); }]] : []),
  ]);
});

/* ---------- ignição: a chama nasce no botão e sobe até o centro ---------- */
let timers = [];
const at = (ms,f) => timers.push(setTimeout(f, reduce?0:ms));
function ignite(c, rect, backTo){
  timers.forEach(clearTimeout); timers=[];
  if(reduce){ celebrate(c, backTo); return; }
  const sx = rect.left + rect.width/2, sy = rect.top + rect.height/2;
  // mesmo ponto da chama da comemoração
  const tx = innerWidth/2, ty = parseFloat(getComputedStyle($('#s-party')).paddingTop) + 30 + 85;
  const ig = $('#ignite'), f = $('#igf');
  ig.hidden = false; ig.classList.remove('go','burst');
  f.style.transition = 'none'; f.style.left = (sx-60)+'px'; f.style.top = (sy-120)+'px'; f.style.transform = 'scale(.35)';
  void f.offsetWidth;
  embers(f, sx, sy);
  requestAnimationFrame(() => {
    ig.classList.add('go');
    f.style.transition = 'left .8s cubic-bezier(.25,.9,.3,1), top .8s cubic-bezier(.3,.8,.25,1), transform .8s cubic-bezier(.3,1.35,.5,1)';
    f.style.left = (tx-60)+'px'; f.style.top = (ty-75)+'px'; f.style.transform = 'scale(1)';
  });
  at(780, () => ig.classList.add('burst'));
  at(1250, () => celebrate(c, backTo, true));
  at(1700, () => { ig.hidden = true; });
}
function embers(f, sx, sy){
  const cv = $('#embers'), W = innerWidth, H = innerHeight, dpr = devicePixelRatio||1;
  cv.width = W*dpr; cv.height = H*dpr; const x = cv.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0);
  const cols = ['#FFE07A','#FFB13B','#FF7A1A','#FF4D24'];
  const ps = [];
  for(let i=0;i<34;i++){ const a = Math.random()*Math.PI*2, v = 2+Math.random()*4; ps.push({x:sx,y:sy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,r:1+Math.random()*2.2,life:40+Math.random()*25,age:0,c:cols[i%4],w:0}); }
  const t0 = performance.now();
  (function frame(t){
    const el = t-t0, fr = f.getBoundingClientRect();
    if(el < 1300) for(let k=0;k<3;k++) ps.push({x:fr.left+fr.width*(.3+Math.random()*.4), y:fr.top+fr.height*.82, vx:(Math.random()-.5)*1.2, vy:-1.6-Math.random()*2.6, r:.8+Math.random()*2, life:45+Math.random()*45, age:0, c:cols[Math.random()*4|0], w:Math.random()*6});
    x.clearRect(0,0,W,H);
    for(let i=ps.length-1;i>=0;i--){ const p=ps[i]; p.age++; if(p.age>p.life){ps.splice(i,1);continue}
      p.vy -= .02; p.x += p.vx + Math.sin((p.age+p.w*10)/7)*.4; p.y += p.vy; p.vx *= .97;
      const a = 1 - p.age/p.life;
      x.globalAlpha = a; x.shadowBlur = 8; x.shadowColor = p.c; x.fillStyle = p.c;
      x.beginPath(); x.arc(p.x,p.y,p.r*(.6+a*.4),0,Math.PI*2); x.fill(); }
    if((el < 2000 || ps.length) && !$('#ignite').hidden) requestAnimationFrame(frame); else x.clearRect(0,0,W,H);
  })(t0);
}

/* ---------- comemoração ---------- */
function celebrate(c, backTo, preLit){
  const s = streakOf(c), p = $('#s-party'), pf = $('#pflame');
  p.hidden = false; p.classList.remove('lit','rolled','fadein');
  pf.classList.toggle('ash', !preLit);
  $('#rollold').textContent = Math.max(0,s-1); $('#rollnew').textContent = s;
  $('#ctitle').textContent = s===1 ? 'dia de ofensiva!' : 'dias de ofensiva!';
  $('#csub').textContent = s===1 ? 'Primeiro dia de '+c.name+' feito. Agora é não deixar a chama apagar.' : 'Você fez '+c.name+' hoje. Volte amanhã para manter a chama acesa.';
  let w=''; for(let i=6;i>=0;i--){ const d=parse(dayAgo(i)); w+='<div>'+WD[d.getDay()]+'<i class="'+(has(c,i)?'on ':'')+(i===0?'today':'')+'">'+CHECK+'</i></div>'; }
  $('#cweek').innerHTML = w;
  if(preLit){ void p.offsetWidth; p.classList.add('fadein','lit'); }
  else at(250, () => { p.classList.add('lit'); pf.classList.remove('ash'); });
  const base = preLit ? 0 : 400;
  at(base+250, () => { p.classList.add('rolled'); if(!reduce) confetti(c.color); });
  [...p.querySelectorAll('.cweek i')].forEach((el,i) => at(base+500+i*90, () => el.classList.add('show')));
  $('#cont').focus({preventScroll:true});
}
$('#cont').addEventListener('click', () => { $('#s-party').hidden = true; render('up'); });

function confetti(color){
  const cv = $('#confetti'), r = cv.getBoundingClientRect(), dpr = devicePixelRatio||1;
  cv.width = r.width*dpr; cv.height = r.height*dpr; const x = cv.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0);
  const cols = [color,'#FFC145','#FF7A1A','#FF3B30','#34C759','#007AFF','#AF52DE'];
  const ps = Array.from({length:110}, () => ({x:r.width/2, y:r.height*.3, vx:(Math.random()-.5)*9, vy:-Math.random()*9-3, w:5+Math.random()*5, h:8+Math.random()*6, a:Math.random()*6, va:(Math.random()-.5)*.3, c:cols[Math.random()*cols.length|0]}));
  const t0 = performance.now();
  (function frame(t){
    const el = t-t0; x.clearRect(0,0,r.width,r.height);
    ps.forEach(p => { p.vy += .22; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      x.save(); x.globalAlpha = Math.max(0,1-el/2600); x.translate(p.x,p.y); x.rotate(p.a); x.fillStyle=p.c; x.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.a))); x.restore(); });
    if(el<2600 && !$('#s-party').hidden) requestAnimationFrame(frame); else x.clearRect(0,0,r.width,r.height);
  })(t0);
}

/* ---------- amigos ---------- */
let rankBy = 'week';
async function renderFriends(){
  if(S.friends) drawFriends();
  else $('#friendsbody').innerHTML = '';
  try { S.friends = await api('/friends'); if(cur==='friends' || !$('#s-friends').hidden) drawFriends(); }
  catch(err){ toast(err.message); }
}
function drawFriends(){
  const F = S.friends, ws = parse(F.weekStart), we = new Date(ws); we.setDate(we.getDate()+6);
  $('#weeklabel').textContent = 'Semana de '+ws.getDate()+'/'+(ws.getMonth()+1)+' a '+we.getDate()+'/'+(we.getMonth()+1);
  $('#invitecode').textContent = F.inviteCode.slice(0,3)+'·'+F.inviteCode.slice(3);
  const alone = F.people.length===1;
  if(alone){
    $('#invite').hidden = false;
    $('#friendsbody').innerHTML = '<div class="empty"><div class="brandflame">'+flame('flicker')+'</div><h3>Desafie seus amigos</h3><p>Mande seu link. Quem entrar fica no ranking da semana com você, e um vê a chama do outro.</p></div>';
    return;
  }
  const all = [...F.people].sort((a,b) => b[rankBy]-a[rankBy] || (a.me?-1:b.me?1:0));
  const me = all.find(p => p.me), pos = all.indexOf(me)+1, unit = rankBy==='week' ? 'feitos' : 'dias';
  const ahead = all[pos-2];
  const leader = pos===1
    ? '<span class="pos">1º</span><div>Você lidera.<br><span>'+(rankBy==='week'?'Mantenha até domingo para levar a coroa.':'Ninguém tem uma chama maior que a sua.')+'</span></div>'
    : '<span class="pos">'+pos+'º</span><div>Faltam '+(ahead[rankBy]-me[rankBy]+1)+' para passar '+esc(first(ahead.name))+'.<br><span>'+(rankBy==='week'?'Cada desafio feito no dia vale 1.':'Conta a maior ofensiva ativa de cada um.')+'</span></div>';
  $('#friendsbody').innerHTML =
    '<div class="seg" role="group" aria-label="Ranking por"><button aria-pressed="'+(rankBy==='week')+'" data-rank="week">Esta semana</button><button aria-pressed="'+(rankBy==='streak')+'" data-rank="streak">Maior ofensiva</button></div>'+
    '<div class="leader">'+leader+'</div>'+
    '<div class="ranks">'+all.map((p,i) => {
      const done = p.total>0 && p.doneToday>=p.total;
      return '<div class="rk'+(p.me?' me':'')+'" data-friend="'+(p.me?'':p.id)+'"><span class="n">'+(i+1)+'</span>'+
        '<span class="avatar" style="--av:'+p.color+'">'+esc((p.name[0]||'?').toUpperCase())+'</span>'+(i===0 && p[rankBy]>0?CROWN:'')+
        '<span class="who"><b>'+(p.me?'Você':esc(first(p.name)))+'</b><span>'+flame(done?'':'ash')+(p.me ? p.doneToday+'/'+p.total+' hoje' : (done?'fez hoje':'não fez hoje'))+'</span></span>'+
        (!p.me && !done ? '<button class="nudge" data-nudge="'+p.id+'"'+(p.nudged?' disabled>Cutucado':'>Cutucar')+'</button>' : '')+
        '<span class="score"><b>'+p[rankBy]+'</b><span>'+unit+'</span></span></div>';
    }).join('')+'</div>';
}
$('#friendsbody').addEventListener('click', async e => {
  const r = e.target.closest('[data-rank]');
  if(r){ rankBy = r.dataset.rank; drawFriends(); return; }
  const n = e.target.closest('[data-nudge]');
  if(n){ n.disabled = true; n.textContent = 'Cutucado'; n.classList.add('bump');
    try { await api('/friends/'+n.dataset.nudge+'/nudge', {method:'POST'}); const p = S.friends.people.find(x => x.id===n.dataset.nudge); if(p) p.nudged = true; }
    catch(err){ toast(err.message); n.disabled = false; n.textContent = 'Cutucar'; }
    return; }
  const f = e.target.closest('[data-friend]');
  if(f && f.dataset.friend){
    const p = S.friends.people.find(x => x.id===f.dataset.friend);
    sheet(first(p.name)+' tem '+p.streak+' '+dias(p.streak)+' de ofensiva', [['Remover dos amigos', 'danger', async () => {
      try { await api('/friends/'+p.id, {method:'DELETE'}); S.friends.people = S.friends.people.filter(x => x!==p); S.user.friends--; drawFriends(); }
      catch(err){ toast(err.message); }
    }]]);
  }
});
$('#addfriend').addEventListener('click', () => { const v = $('#invite'); v.hidden = !v.hidden; if(!v.hidden) v.scrollIntoView({behavior:reduce?'auto':'smooth', block:'center'}); });
$('#sharebtn').addEventListener('click', async () => {
  const url = location.origin+'/i/'+S.friends.inviteCode;
  const text = first(S.user.name)+' te desafiou no Challenge. Bora ver quem mantém a chama acesa?';
  try {
    if(navigator.share) await navigator.share({title:'Challenge', text, url});
    else { await navigator.clipboard.writeText(text+' '+url); toast('Link copiado. Cole no WhatsApp.'); }
  } catch(err){ if(err.name!=='AbortError') toast('Seu link: '+url); }
});

/* ---------- ajustes ---------- */
async function renderSettings(){
  const u = S.user;
  $('#setavatar').textContent = (u.name[0]||'?').toUpperCase(); $('#setavatar').style.setProperty('--av', u.color);
  $('#setname').textContent = u.name; $('#setemail').textContent = u.email || '';
  if(document.activeElement !== $('#nameinput')) $('#nameinput').value = u.name;
  applyTheme(u.theme); markTone();
  $('#installpanel').hidden = !installEvt;
  const t = $('#pushtoggle'), st = $('#pushstatus');
  if(!pushSupported()){ t.disabled = true; st.textContent = 'Este navegador não recebe avisos.'; return; }
  const on = await pushOn();
  t.setAttribute('aria-checked', on);
  st.textContent = Notification.permission==='denied' ? 'Bloqueados nas configurações do navegador.' : (on ? 'Lembrete no horário de cada desafio.' : 'Desligados neste celular.');
}
$('#pushtoggle').addEventListener('click', async e => {
  const t = e.currentTarget; t.disabled = true;
  if(t.getAttribute('aria-checked')==='true') await disablePush(); else await setupPush(true);
  t.disabled = false; renderSettings();
});
$('#testpush').addEventListener('click', async () => {
  try { const r = await api('/push/test', {method:'POST'}); toast(r.sent ? 'Aviso enviado. Olhe a barra de notificações.' : 'Ligue os avisos neste celular primeiro.'); }
  catch(err){ toast(err.message); }
});
async function saveName(){
  const v = $('#nameinput').value.trim();
  if(!v || v===S.user.name) { $('#nameinput').value = S.user.name; return; }
  try { await api('/me', {method:'PATCH', body:{name:v}}); S.user.name = v; renderSettings(); } catch(err){ toast(err.message); }
}
$('#nameinput').addEventListener('blur', saveName);
$('#nameinput').addEventListener('keydown', e => { if(e.key==='Enter') e.target.blur(); });
$('#installbtn').addEventListener('click', install);
$('#logout').addEventListener('click', () => sheet(null, [['Sair da conta', 'danger', async () => {
  try { await disablePush(); } catch(e){}
  await api('/auth/logout', {method:'POST'}).catch(() => {});
  try { localStorage.removeItem('push-off'); } catch(e){}
  S.user = null; S.challenges = []; S.friends = null;
  history.replaceState({depth:0}, '', '/'); render('fade');
}]]));

/* ---------- início ---------- */
async function boot(){
  const q = new URLSearchParams(location.search);
  if(q.get('convite')){ try { localStorage.setItem('convite', q.get('convite')); } catch(e){} history.replaceState({depth:0}, '', location.pathname); }
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  try { S.config = await api('/config'); } catch(e){}
  try {
    await loadState();
    if(await acceptPendingInvite()) history.replaceState({depth:0}, '', '/amigos');
  } catch(err){
    if(err.status !== 401){ $('#s-loading').innerHTML = '<div class="empty"><h3>Sem conexão</h3><p>Confira a internet e tente de novo.</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div>'; return; }
  }
  if(!history.state) history.replaceState({depth:0}, '', location.pathname + location.search);
  render();
  let off = false; try { off = localStorage.getItem('push-off')==='1'; } catch(e){}
  if(S.user && !off) setupPush(false);
}
// Ao voltar para o app (ex.: virou o dia), atualiza.
document.addEventListener('visibilitychange', async () => {
  if(document.hidden || !S.user || !$('#s-party').hidden || !$('#ignite').hidden) return;
  try { await loadState(); S.friends = null; if(['today','detail','friends'].includes(cur)) render('fade'); } catch(e){}
});
// Toque numa notificação com o app aberto
navigator.serviceWorker?.addEventListener('message', e => { if(e.data?.type==='open' && e.data.url) navigate(e.data.url, 'fade'); });
boot();
