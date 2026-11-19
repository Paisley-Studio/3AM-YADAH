import { db, fs, loadAuth, loadStorage } from './fb.js';
import { CONTENT, EVENTS, GALLERY } from './defaults.js';

const { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, getCountFromServer, Timestamp, writeBatch } = fs;
const A = await loadAuth();
const S = await loadStorage();

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const set = (o, p, v) => { const ks = p.split('.'); let x = o; ks.slice(0, -1).forEach((k) => { x[k] = x[k] && typeof x[k] === 'object' ? x[k] : {}; x = x[k]; }); x[ks.at(-1)] = v; };
const merge = (a, b) => { const out = { ...a }; for (const k in b || {}) out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k]; return out; };
const toDate = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);
const when = (ts) => { const d = toDate(ts); return d ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
const ago = (ts) => { const d = toDate(ts); if (!d) return ''; const s = (Date.now() - d) / 1000; if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`; if (s < 604800) return `${Math.floor(s / 86400)} d ago`; return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
const initials = (n = '') => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0] || '').join('') || '?';
const ytId = (u = '') => (u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
const view = $('#view');

const I = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', 'chevron-left': '<path d="m15 18-6-6 6-6"/>', 'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  phone2: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>', monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  video: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>', pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"/><path d="M20 17v5H6.5a2.5 2.5 0 0 1 0-5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>', eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6A13 13 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20"/>',
};
const icon = (n) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
const paintIcons = (root = document) => $$('i[data-i]', root).forEach((el) => { el.outerHTML = icon(el.dataset.i); });
const badge = (text, tone = '') => `<span class="badge ${tone ? `tone-${tone}` : ''}">${esc(text)}</span>`;
const empty = (ic, title, text = '') => `<div class="empty"><div class="empty-icon">${icon(ic)}</div><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}</div>`;
const card = ({ title, ic, actions = '', body, flush }) => `<section class="card ${flush ? 'card-flush' : ''}"><div class="card-head"><h3>${icon(ic)}${esc(title)}</h3><div class="row">${actions}</div></div><div class="card-body">${body}</div></section>`;
const pageHead = (ic, title, lede, actions = '') => `<div class="page-head"><div><h1><span class="page-icon">${icon(ic)}</span>${esc(title)}</h1>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div><div class="row">${actions}</div></div>`;
const statTile = ({ label, value, ic, hint = '', go, tone = '' }) => `<${go ? `button data-go="${go}"` : 'div'} class="stat ${tone ? `tone-${tone}` : ''}"><span class="stat-label">${icon(ic)}${esc(label)}</span><span class="stat-value">${value}</span>${hint ? `<span class="stat-hint">${esc(hint)}</span>` : ''}</${go ? 'button' : 'div'}>`;
const skeleton = (n = 4) => `<div class="stats">${Array.from({ length: n }, () => '<div class="stat"><div class="sk h"></div><div class="sk w60"></div></div>').join('')}</div>`;

function toast(msg, bad) {
  const t = document.createElement('div'); t.className = `toast ${bad ? 'bad' : ''}`;
  t.innerHTML = `<span class="ti">${icon(bad ? 'x' : 'check')}</span><span>${esc(msg)}</span>`;
  $('#toasts').append(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, 2800);
}
function modal({ ic = 'pen', title, lede = '', body, foot = '', wide }) {
  const box = $('#modalBox'); box.className = `modal ${wide ? 'wide' : ''}`;
  box.innerHTML = `<div class="modal-head"><span class="page-icon soft">${icon(ic)}</span><div class="grow"><h2>${esc(title)}</h2>${lede ? `<div class="lede">${esc(lede)}</div>` : ''}</div><button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}`;
  $('#modal').hidden = false; return box;
}
const closeModal = () => { $('#modal').hidden = true; };
$('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target.id === 'modal') closeModal(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
async function busy(btn, fn) { btn.classList.add('is-busy'); btn.disabled = true; try { await fn(); } catch (e) { console.error(e); toast(e.message || 'Something went wrong', true); } btn.classList.remove('is-busy'); btn.disabled = false; }
const confirmDo = (title, text, label, fn) => {
  const m = modal({ ic: 'trash', title, body: `<p>${esc(text)}</p>`, foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-ok>${icon('trash')}<span>${esc(label)}</span></button>` });
  $('[data-ok]', m).onclick = (e) => busy(e.currentTarget, async () => { await fn(); closeModal(); });
};

/* ---------- uploads (resized to WebP in the browser) ---------- */
async function shrink(file, max = 1800) {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/webp', .82));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' }) : file;
  } catch { return file; }
}
async function upload(file, folder, onProgress) {
  const f = await shrink(file);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${f.name.replace(/[^\w.-]/g, '_')}`;
  const ref = S.ref(S.storage, path);
  const task = S.uploadBytesResumable(ref, f, { contentType: f.type });
  await new Promise((res, rej) => task.on('state_changed', (s) => onProgress?.(s.bytesTransferred / s.totalBytes), rej, res));
  return { url: await S.getDownloadURL(ref), path };
}
const removeFile = (path) => (path ? S.deleteObject(S.ref(S.storage, path)).catch(() => {}) : null);

/* ---------- form builder ---------- */
// [key, label, type, opts]  opts: { span, hint, placeholder, options }
function field([k, label, type = 'text', o = {}], val) {
  const v = val ?? '', span = o.span ? `span-${o.span}` : '';
  const hint = o.hint ? `<span class="hint">${esc(o.hint)}</span>` : '';
  const ph = o.placeholder ? `placeholder="${esc(o.placeholder)}"` : '';
  if (type === 'title') return `<div class="fieldset-title">${esc(label)}</div>`;
  if (type === 'bool') return `<div class="field ${span}"><label class="check"><input type="checkbox" name="${k}" ${v ? 'checked' : ''}> ${esc(label)}</label>${hint}</div>`;
  if (type === 'seg') return `<div class="field ${span}"><label>${esc(label)}</label><div class="seg" data-seg="${k}">${o.options.map(([val2, lab]) => `<button type="button" data-v="${val2}" class="${val2 === v ? 'active' : ''}">${esc(lab)}</button>`).join('')}</div><input type="hidden" name="${k}" value="${esc(v)}">${hint}</div>`;
  if (type === 'textarea' || type === 'lines') return `<div class="field ${span}"><label>${esc(label)}</label><textarea class="textarea" name="${k}" rows="${o.rows || 4}" ${ph}>${esc(Array.isArray(v) ? v.join('\n') : v)}</textarea>${hint}</div>`;
  if (type === 'image') return `<div class="field ${span}"><label>${esc(label)}</label><div class="img-field"><div class="prev">${v ? `<img src="${esc(v)}" alt="">` : icon('image')}</div><div class="grow"><input class="input" type="text" name="${k}" value="${esc(v)}" placeholder="Paste a link or upload / drop an image"><div class="row"><button type="button" class="btn btn-sm" data-pick>${icon('upload')}<span>Upload</span></button>${hint}</div></div><input type="file" accept="image/*" hidden data-up></div></div>`;
  return `<div class="field ${span}"><label>${esc(label)}</label><input class="input" type="${type}" name="${k}" value="${esc(v)}" ${ph}>${hint}</div>`;
}
const formHtml = (fields, data = {}) => `<div class="form-grid">${fields.map((f) => field(f, get(data, f[0]))).join('')}</div>`;
function wireForm(root, folder) {
  root.addEventListener('click', (e) => {
    const sb = e.target.closest('[data-seg] button'); if (sb) { const seg = sb.parentElement; $$('button', seg).forEach((b) => b.classList.toggle('active', b === sb)); seg.nextElementSibling.value = sb.dataset.v; }
    if (e.target.closest('[data-pick]')) e.target.closest('.img-field').querySelector('[data-up]').click();
  });
  const send = (box, file) => {
    const btn = $('[data-pick]', box);
    busy(btn, async () => { const { url } = await upload(file, folder); $('input[type=text]', box).value = url; $('.prev', box).innerHTML = `<img src="${url}" alt="">`; toast('Image uploaded. Remember to save.'); });
  };
  root.addEventListener('change', (e) => { if (e.target.matches('[data-up]') && e.target.files[0]) send(e.target.closest('.img-field'), e.target.files[0]); });
  root.addEventListener('input', (e) => { if (e.target.closest('.img-field') && e.target.type === 'text') $('.prev', e.target.closest('.img-field')).innerHTML = e.target.value ? `<img src="${esc(e.target.value)}" alt="">` : icon('image'); });
  $$('.img-field', root).forEach((box) => {
    box.ondragover = (e) => { e.preventDefault(); box.classList.add('over'); };
    box.ondragleave = () => box.classList.remove('over');
    box.ondrop = (e) => { e.preventDefault(); box.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) send(box, f); };
  });
}
function readFields(root, fields) {
  const out = {};
  for (const [k, , type] of fields) {
    if (type === 'title') continue;
    const el = root.querySelector(`[name="${k}"]`); if (!el) continue;
    set(out, k, type === 'bool' ? el.checked : type === 'lines' ? el.value.split('\n').map((x) => x.trim()).filter(Boolean) : type === 'number' ? Number(el.value || 0) : el.value.trim());
  }
  return out;
}

/* ---------- shell ---------- */
const NAV = [
  ['Dashboard', [['overview', 'Overview', 'dashboard'], ['visits', 'Visitors', 'chart']]],
  ['People', [['registrations', 'Registrations', 'users'], ['prayers', 'Prayer requests', 'heart'], ['messages', 'Messages', 'mail'], ['subscribers', 'Subscribers', 'send']]],
  ['Website', [['events', 'Events', 'calendar'], ['notices', 'Notices', 'megaphone'], ['gallery', 'Gallery', 'image'], ['content', 'Site content', 'pen']]],
  ['System', [['settings', 'Settings', 'sliders']]],
];
const TITLES = Object.fromEntries(NAV.flatMap(([, l]) => l.map(([k, t]) => [k, t])));
$('#menu').innerHTML = NAV.map(([g, l]) => `<div class="side-group">${g}</div>${l.map(([k, t, ic]) => `<button class="side-link" data-v="${k}">${icon(ic)}<span>${t}</span><b class="count" data-badge="${k}"></b></button>`).join('')}`).join('');
paintIcons();
const shell = $('#app');
$('#menu').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) go(b.dataset.v); });
$('#burger').onclick = () => shell.classList.toggle('nav-open');
shell.addEventListener('click', (e) => { if (e.target === shell) shell.classList.remove('nav-open'); });
$('#collapse').onclick = () => { shell.classList.toggle('collapsed'); try { localStorage.setItem('nav-collapsed', shell.classList.contains('collapsed') ? 1 : ''); } catch {} };
try { if (localStorage.getItem('nav-collapsed')) shell.classList.add('collapsed'); } catch {}
$('#userBtn').onclick = (e) => { e.stopPropagation(); $('#userMenu').hidden = !$('#userMenu').hidden; };
document.addEventListener('click', () => { $('#userMenu').hidden = true; });
document.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
const tick = () => { $('#clock').textContent = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' EAT'; };
tick(); setInterval(tick, 30000);

const VIEWS = {};
let current = '';
function go(v) {
  if (!VIEWS[v]) v = 'overview';
  current = v; history.replaceState(null, '', `#${v}`);
  $('#crumb').textContent = TITLES[v];
  $$('#menu .side-link').forEach((b) => b.classList.toggle('active', b.dataset.v === v));
  shell.classList.remove('nav-open');
  view.innerHTML = skeleton(4);
  VIEWS[v]().catch((e) => { console.error(e); view.innerHTML = card({ title: 'Could not load', ic: 'info', body: empty('info', 'Something went wrong', e.message) }); });
}
async function badges() {
  for (const c of ['registrations', 'prayers', 'messages']) {
    const n = (await getCountFromServer(query(collection(db, c), where('status', '==', 'new'))).catch(() => null))?.data().count || 0;
    $(`[data-badge=${c}]`).textContent = n || '';
  }
}

/* ---------- auth ---------- */
let me = null;
A.onAuthStateChanged(A.auth, async (user) => {
  $('#loading').classList.add('done');
  if (!user) { $('#gate').hidden = false; shell.hidden = true; return; }
  const adm = await getDoc(doc(db, 'admins', user.uid)).catch(() => null);
  if (!adm?.exists()) { await A.signOut(A.auth); $('#loginNote').className = 'note bad'; $('#loginNote').textContent = 'This account is not an administrator.'; return; }
  me = { uid: user.uid, email: user.email, ...adm.data() };
  $('#meName').textContent = me.name || user.email.split('@')[0]; $('#meEmail').textContent = user.email; $('#avatar').textContent = initials(me.name || user.email);
  $('#gate').hidden = true; shell.hidden = false;
  go(location.hash.slice(1) || 'overview'); badges();
});
$('#loginForm').addEventListener('submit', (e) => {
  e.preventDefault(); const f = e.target; const note = $('#loginNote');
  busy($('button[type=submit]', f), async () => {
    try { await A.signInWithEmailAndPassword(A.auth, f.email.value.trim(), f.password.value); note.textContent = ''; }
    catch { note.className = 'note bad'; note.textContent = 'Wrong email or password.'; }
  });
});
$('#forgot').onclick = async () => {
  const email = $('#loginForm').email.value.trim(); const note = $('#loginNote');
  if (!email) { note.className = 'note bad'; note.textContent = 'Type your email first.'; return; }
  try { await A.sendPasswordResetEmail(A.auth, email); note.className = 'note ok'; note.textContent = 'Reset link sent. Check your inbox.'; } catch (e) { note.className = 'note bad'; note.textContent = e.message; }
};
$('#logout').onclick = () => A.signOut(A.auth);

/* ---------- data helpers ---------- */
const count = async (c, ...q) => (await getCountFromServer(q.length ? query(collection(db, c), ...q) : collection(db, c))).data().count;
const since = (days) => Timestamp.fromDate(new Date(Date.now() - days * 864e5));
const visitsSince = async (days) => (await getDocs(query(collection(db, 'visits'), where('ts', '>=', since(days)), orderBy('ts', 'desc')))).docs.map((d) => d.data());
const latest = async (c, n = 6) => (await getDocs(query(collection(db, c), orderBy('createdAt', 'desc')))).docs.slice(0, n).map((d) => ({ id: d.id, ...d.data() }));
function chart(visits, days) {
  const m = {}; visits.forEach((v) => { m[v.day] = (m[v.day] || 0) + 1; });
  const arr = Array.from({ length: days }, (_, i) => { const d = new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10); return [d, m[d] || 0]; });
  const max = Math.max(1, ...arr.map((x) => x[1]));
  return `<div class="chart">${arr.map(([d, n], i) => `<div class="chart-col"><i class="chart-bar" style="height:${(n / max) * 100}%;animation-delay:${i * 18}ms" data-v="${n} on ${d.slice(8)}/${d.slice(5, 7)}"></i><small>${days > 14 && i % 3 ? '' : `${d.slice(8)}/${d.slice(5, 7)}`}</small></div>`).join('')}</div>`;
}
const hbars = (rows) => { const max = Math.max(1, ...rows.map((r) => r[1])); return rows.map(([k, n]) => `<div class="hbar"><span class="truncate">${esc(k)}</span><i style="width:${(n / max) * 100}%"></i><b>${n}</b></div>`).join(''); };

/* ---------- overview ---------- */
VIEWS.overview = async () => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  const greet = h < 5 ? 'Up for the 3AM watch' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const [reg, pr, msg, sub, all, v14, nReg, nPr, nMsg, evSnap, regs, prays] = await Promise.all([
    count('registrations'), count('prayers'), count('messages'), count('subscribers'), count('visits'), visitsSince(14),
    count('registrations', where('status', '==', 'new')), count('prayers', where('status', '==', 'new')), count('messages', where('status', '==', 'new')),
    getDocs(collection(db, 'events')), latest('registrations'), latest('prayers'),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = evSnap.docs.map((d) => d.data()).filter((e) => e.status !== 'completed').sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const todo = [[nPr, 'heart', 'new prayer requests to pray over', 'prayers'], [nReg, 'users', 'new registrations to welcome', 'registrations'], [nMsg, 'mail', 'unread messages', 'messages'], [upcoming.length ? 0 : 1, 'calendar', 'no upcoming event is published', 'events']].filter(([n]) => n);
  view.innerHTML = `
    <div class="welcome"><div><h2>${greet}, ${esc((me.name || '').split(' ')[0] || 'admin')}</h2><p>3AM Yadah Encounter · ministry console</p></div>
      <div class="row"><button class="btn btn-lg" data-quick="events">${icon('calendar')}<span>New event</span></button><button class="btn btn-lg" data-quick="notices">${icon('megaphone')}<span>Post a notice</span></button><button class="btn btn-lg" data-go="gallery">${icon('upload')}<span>Upload photos</span></button></div></div>
    <div class="stats">
      ${statTile({ label: 'Visitors today', value: v14.filter((v) => v.day === today).length, ic: 'eye', hint: `${v14.length} in the last 14 days`, go: 'visits', tone: 'brand' })}
      ${statTile({ label: 'All-time visits', value: all, ic: 'globe', hint: 'one per browser session', go: 'visits' })}
      ${statTile({ label: 'Registrations', value: reg, ic: 'users', hint: `${nReg} new`, go: 'registrations' })}
      ${statTile({ label: 'Prayer requests', value: pr, ic: 'heart', hint: `${nPr} new`, go: 'prayers' })}
      ${statTile({ label: 'Messages', value: msg, ic: 'mail', hint: `${nMsg} unread`, go: 'messages' })}
      ${statTile({ label: 'Subscribers', value: sub, ic: 'send', hint: 'newsletter', go: 'subscribers' })}
    </div>
    <div class="grid-side">
      <div class="stack">
        ${card({ title: 'Needs your attention', ic: 'bell', flush: true, body: todo.length ? todo.map(([n, ic, l, v]) => `<button class="list-item" data-go="${v}"><span class="page-icon soft">${icon(ic)}</span><span class="grow">${v === 'events' ? '' : `<b>${n}</b> `}${esc(l)}</span><span class="chev">${icon('chevron-right')}</span></button>`).join('') : empty('sparkles', 'All caught up', 'Nothing is waiting for you.') })}
        ${card({ title: 'Visitors, last 14 days', ic: 'chart', actions: '<button class="btn btn-sm" data-go="visits">Details</button>', body: chart(v14, 14) })}
        ${card({ title: 'Upcoming events', ic: 'calendar', flush: true, actions: '<button class="btn btn-sm" data-go="events">Manage</button>', body: upcoming.length ? upcoming.slice(0, 4).map((e) => { const d = e.date ? new Date(e.date) : null; return `<div class="list-item"><div class="appt-date"><b>${d ? d.getDate() : '–'}</b><small>${d ? d.toLocaleString('en', { month: 'short' }) : 'TBA'}</small></div><div class="grow truncate"><b>${esc(e.title)}</b><br><small class="muted">${esc([e.time, e.location].filter(Boolean).join(' · '))}</small></div>${badge('Upcoming', 'ok')}</div>`; }).join('') : empty('calendar', 'No upcoming events', 'Create one so visitors know when to gather.') })}
      </div>
      <div class="stack">
        ${card({ title: 'Latest registrations', ic: 'users', flush: true, actions: '<button class="btn btn-sm" data-go="registrations">All</button>', body: regs.length ? regs.map((r) => `<div class="list-item"><span class="avatar">${esc(initials(`${r.firstName} ${r.lastName}`))}</span><div class="grow truncate"><b>${esc(r.firstName)} ${esc(r.lastName)}</b><br><small class="muted">${esc(r.location || r.phone || '')} · ${ago(r.createdAt)}</small></div>${r.status === 'new' ? badge('New', 'bad') : ''}</div>`).join('') : empty('users', 'No registrations yet') })}
        ${card({ title: 'Latest prayer requests', ic: 'heart', flush: true, actions: '<button class="btn btn-sm" data-go="prayers">All</button>', body: prays.length ? prays.map((r) => `<div class="list-item"><span class="avatar">${r.anonymous ? '🙏' : esc(initials(r.name))}</span><div class="grow truncate"><b>${esc(r.anonymous ? 'Anonymous' : r.name)}</b><br><small class="muted">${esc((r.request || '').slice(0, 70))}</small></div><small class="muted">${ago(r.createdAt)}</small></div>`).join('') : empty('heart', 'No prayer requests yet') })}
      </div>
    </div>`;
  $$('[data-quick]', view).forEach((b) => (b.onclick = () => { go(b.dataset.quick); setTimeout(() => $('#addBtn')?.click(), 400); }));
};

/* ---------- visitors ---------- */
VIEWS.visits = async () => {
  const v = await visitsSince(30);
  const tally = (key) => Object.entries(v.reduce((m, x) => { const k = key(x); m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const host = (r) => { try { return r === 'direct' ? 'Direct / WhatsApp app' : new URL(r).hostname.replace('www.', ''); } catch { return r || 'unknown'; } };
  const dev = Object.fromEntries(tally((x) => x.device || 'unknown'));
  const today = new Date().toISOString().slice(0, 10);
  view.innerHTML = `${pageHead('chart', 'Visitors', 'Each browser session is counted once. Full analytics also live in the Firebase console.', '<button class="btn btn-danger btn-sm" id="purge">' + icon('trash') + '<span>Clear visits older than 90 days</span></button>')}
    <div class="stats">
      ${statTile({ label: 'Today', value: v.filter((x) => x.day === today).length, ic: 'eye', tone: 'brand' })}
      ${statTile({ label: 'Last 7 days', value: v.filter((x) => toDate(x.ts) > Date.now() - 7 * 864e5).length, ic: 'calendar' })}
      ${statTile({ label: 'Last 30 days', value: v.length, ic: 'chart' })}
      ${statTile({ label: 'On phones', value: dev.mobile || 0, ic: 'phone2', hint: v.length ? `${Math.round(((dev.mobile || 0) / v.length) * 100)}% of visits` : '' })}
      ${statTile({ label: 'On computers', value: dev.desktop || 0, ic: 'monitor' })}
    </div>
    ${card({ title: 'Daily visits, last 30 days', ic: 'chart', body: chart(v, 30) })}
    <div class="grid-2" style="margin-top:16px">
      ${card({ title: 'Where visitors come from', ic: 'globe', body: v.length ? hbars(tally((x) => host(x.ref)).slice(0, 10)) : empty('globe', 'No visits yet') })}
      ${card({ title: 'Recent visits', ic: 'clock', flush: true, body: v.length ? v.slice(0, 10).map((x) => `<div class="list-item"><span class="page-icon soft">${icon(x.device === 'mobile' ? 'phone2' : 'monitor')}</span><div class="grow truncate"><b>${esc(host(x.ref))}</b><br><small class="muted">${when(x.ts)}</small></div><small class="muted">${ago(x.ts)}</small></div>`).join('') : empty('clock', 'No visits yet') })}
    </div>`;
  $('#purge').onclick = (e) => busy(e.currentTarget, async () => {
    const old = await getDocs(query(collection(db, 'visits'), where('ts', '<', since(90))));
    for (let i = 0; i < old.docs.length; i += 400) { const b = writeBatch(db); old.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref)); await b.commit(); }
    toast(`Removed ${old.size} old visits`);
  });
};

/* ---------- inboxes ---------- */
const phoneLink = (p) => `https://wa.me/${String(p).replace(/\D/g, '').replace(/^0/, '254')}`;
const INBOX = {
  registrations: {
    ic: 'users', lede: 'People who registered on the website. Welcome them and add them to the WhatsApp group.',
    name: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim(), sub: (r) => r.email,
    cols: [['Phone', (r) => esc(r.phone)], ['Denomination', (r) => esc(r.denomination || '–')], ['Location', (r) => esc(r.location || '–')], ['WhatsApp', (r) => (r.whatsapp ? badge('Add to group', 'warn') : badge('No', ''))]],
    detail: [['Email', 'email'], ['Phone', 'phone'], ['Denomination', 'denomination'], ['Location', 'location']], csv: ['firstName', 'lastName', 'email', 'phone', 'denomination', 'location', 'whatsapp'],
  },
  prayers: {
    ic: 'heart', lede: 'Prayer requests sent from the website. Handle with care; some asked to stay anonymous.',
    name: (r) => (r.anonymous ? 'Anonymous' : r.name), sub: (r) => (r.anonymous ? `(${r.name})` : r.email),
    cols: [['Request', (r) => `<div class="clip">${esc(r.request)}</div>`], ['Share', (r) => (r.anonymous ? badge('Anonymous', 'info') : badge('Named', ''))]],
    detail: [['Name', 'name'], ['Email', 'email'], ['Phone', 'phone']], body: 'request', csv: ['name', 'email', 'phone', 'anonymous', 'request'],
  },
  messages: {
    ic: 'mail', lede: 'Messages from the contact form.',
    name: (r) => r.name, sub: (r) => r.email,
    cols: [['Type', (r) => badge(r.type || 'Other', 'info')], ['Message', (r) => `<div class="clip"><b>${esc(r.subject || '')}</b> ${esc(r.message)}</div>`]],
    detail: [['Email', 'email'], ['Type', 'type'], ['Subject', 'subject']], body: 'message', csv: ['name', 'email', 'type', 'subject', 'message'],
  },
  subscribers: { ic: 'send', lede: 'Newsletter sign-ups from the footer.', name: (r) => r.email, sub: () => 'Newsletter', cols: [], detail: [['Email', 'email']], csv: ['email'] },
};
for (const c of Object.keys(INBOX)) VIEWS[c] = () => inbox(c);
async function inbox(c) {
  const cfg = INBOX[c];
  let rows = (await getDocs(query(collection(db, c), orderBy('createdAt', 'desc')))).docs.map((d) => ({ id: d.id, ...d.data() }));
  let tab = 'all', term = '';
  const hasStatus = c !== 'subscribers';
  view.innerHTML = `${pageHead(cfg.ic, TITLES[c], cfg.lede, `<button class="btn btn-deep" id="csv">${icon('download')}<span>Export CSV</span></button>`)}
    <section class="card card-flush">
      ${hasStatus ? '<div class="tabs" id="tabs" style="margin:0;padding:0 8px"></div>' : ''}
      <div class="toolbar"><label class="search">${icon('search')}<input class="input" id="q" placeholder="Search name, email, text…"></label><span class="grow"></span><span class="muted" id="cnt"></span></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>From</th>${cfg.cols.map(([h]) => `<th>${h}</th>`).join('')}<th>Received</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>`;
  const draw = () => {
    if (hasStatus) { const n = (s) => rows.filter((r) => (s === 'all' ? true : s === 'new' ? r.status === 'new' : r.status !== 'new')).length; $('#tabs').innerHTML = [['all', 'All'], ['new', 'New'], ['read', 'Handled']].map(([k, l]) => `<button class="tab ${tab === k ? 'active' : ''}" data-t="${k}">${l}<span class="count">${n(k)}</span></button>`).join(''); }
    const list = rows.filter((r) => (tab === 'all' || (tab === 'new' ? r.status === 'new' : r.status !== 'new')) && (!term || JSON.stringify(r).toLowerCase().includes(term)));
    $('#cnt').textContent = `${list.length} of ${rows.length}`;
    $('#rows').innerHTML = list.length ? list.map((r) => `<tr class="${r.status === 'new' ? 'unread' : ''}" data-id="${r.id}">
      <td><div class="person"><span class="avatar">${esc(initials(cfg.name(r)))}</span><div><b>${esc(cfg.name(r))}</b><small>${esc(cfg.sub(r) || '')}</small></div></div></td>
      ${cfg.cols.map(([, f]) => `<td>${f(r)}</td>`).join('')}
      <td style="white-space:nowrap"><small class="muted">${ago(r.createdAt)}</small></td>
      <td><div class="acts">${hasStatus && r.status === 'new' ? `<button class="icon-btn" data-read title="Mark handled">${icon('check')}</button>` : ''}<button class="icon-btn bad" data-del title="Delete">${icon('trash')}</button></div></td></tr>`).join('')
      : `<tr><td colspan="9">${empty(cfg.ic, term ? 'No matches' : 'Nothing here yet', term ? 'Try another search.' : '')}</td></tr>`;
  };
  draw();
  $('#tabs')?.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; draw(); } });
  $('#q').oninput = (e) => { term = e.target.value.toLowerCase(); draw(); };
  $('#csv').onclick = () => {
    const lines = [['date', ...cfg.csv].join(','), ...rows.map((r) => [when(r.createdAt), ...cfg.csv.map((k) => r[k] ?? '')].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); a.download = `${c}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  const markRead = async (r) => { await updateDoc(doc(db, c, r.id), { status: 'read' }); r.status = 'read'; draw(); badges(); };
  const del = (r) => confirmDo('Delete entry', `Delete this entry from ${cfg.name(r)} permanently?`, 'Delete', async () => { await deleteDoc(doc(db, c, r.id)); rows = rows.filter((x) => x !== r); draw(); badges(); toast('Deleted'); });
  $('#rows').onclick = (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return; const r = rows.find((x) => x.id === tr.dataset.id);
    if (e.target.closest('[data-read]')) return markRead(r);
    if (e.target.closest('[data-del]')) return del(r);
    const m = modal({ ic: cfg.ic, title: cfg.name(r), lede: `Received ${when(r.createdAt)}`, wide: true,
      body: `<dl class="detail">${cfg.detail.map(([l, k]) => `<dt>${l}</dt><dd>${esc(r[k] || '–')}</dd>`).join('')}${c === 'registrations' ? `<dt>WhatsApp group</dt><dd>${r.whatsapp ? 'Wants to be added' : 'No'}</dd>` : ''}${c === 'prayers' ? `<dt>Sharing</dt><dd>${r.anonymous ? 'Share anonymously with the prayer team' : 'Can be shared by name'}</dd>` : ''}</dl>${cfg.body ? `<div class="quote">${esc(r[cfg.body])}</div>` : ''}`,
      foot: `<button class="btn btn-danger left" data-x="del">${icon('trash')}<span>Delete</span></button>${r.email ? `<a class="btn" href="mailto:${esc(r.email)}">${icon('mail')}<span>Email</span></a>` : ''}${r.phone ? `<a class="btn" target="_blank" href="${phoneLink(r.phone)}">${icon('chat')}<span>WhatsApp</span></a><a class="btn" href="tel:${esc(r.phone)}">${icon('phone')}<span>Call</span></a>` : ''}${hasStatus && r.status === 'new' ? `<button class="btn btn-primary" data-x="read">${icon('check')}<span>Mark handled</span></button>` : ''}` });
    $('[data-x=del]', m).onclick = () => del(r);
    const rb = $('[data-x=read]', m); if (rb) rb.onclick = () => busy(rb, async () => { await markRead(r); closeModal(); toast('Marked as handled'); });
  };
}

/* ---------- events & notices ---------- */
const EV_FIELDS = [
  ['title', 'Event title', 'text', { span: 8, placeholder: 'e.g. Naivasha Worship Night Vigil' }], ['status', 'Status', 'seg', { span: 4, options: [['upcoming', 'Upcoming'], ['completed', 'Completed']] }],
  ['date', 'Date', 'date', { span: 4 }], ['time', 'Time', 'text', { span: 4, placeholder: '9:00 PM – 5:00 AM' }], ['location', 'Venue', 'text', { span: 4, placeholder: 'Naivasha' }],
  ['description', 'Description', 'textarea', { rows: 3, placeholder: 'What happens at this event?' }],
  ['tags', 'Tags', 'text', { span: 6, placeholder: 'Worship, Kesha', hint: 'Separate with commas' }], ['stat', 'Highlight', 'text', { span: 6, placeholder: '250+ attendees' }],
  ['link', 'Button link (RSVP, poster, photos…)', 'url', { placeholder: 'https://' }],
  ['image', 'Poster / cover image', 'image', { hint: 'Drag an image onto the box, or upload.' }],
];
const NO_FIELDS = [
  ['title', 'Title', 'text', { span: 8, placeholder: 'e.g. No prayers this Friday' }], ['date', 'Date', 'date', { span: 4 }],
  ['body', 'Notice', 'textarea', { rows: 5 }],
  ['pinned', 'Pin to the top of the notice board', 'bool', { span: 6 }], ['active', 'Published on the website', 'bool', { span: 6 }],
];
function manager(col, { fields, ic, lede, singular, tabsOf, row, folder, defaults }) {
  VIEWS[col] = async () => {
    const items = (await getDocs(collection(db, col))).docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    let tab = tabsOf[0][0];
    view.innerHTML = `${pageHead(ic, TITLES[col], lede, `<button class="btn btn-primary" id="addBtn">${icon('plus')}<span>New ${singular}</span></button>`)}
      <section class="card card-flush"><div class="tabs" id="tabs" style="margin:0;padding:0 8px"></div><div id="list"></div></section>`;
    const draw = () => {
      $('#tabs').innerHTML = tabsOf.map(([k, l, f]) => `<button class="tab ${tab === k ? 'active' : ''}" data-t="${k}">${l}<span class="count">${items.filter(f).length}</span></button>`).join('');
      const list = items.filter(tabsOf.find(([k]) => k === tab)[2]);
      $('#list').innerHTML = list.length ? list.map((it) => `<div class="list-item" data-id="${it.id}">${row(it)}<div class="acts"><button class="btn btn-sm" data-edit>${icon('pen')}<span>Edit</span></button><button class="icon-btn bad" data-del title="Delete">${icon('trash')}</button></div></div>`).join('') : empty(ic, `No ${col} here`, `Click “New ${singular}” to add one.`);
    };
    draw();
    $('#tabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; draw(); } };
    const open = (it) => {
      const isNew = !it; it = it || { ...defaults };
      const m = modal({ ic, title: isNew ? `New ${singular}` : `Edit ${singular}`, lede: isNew ? 'It goes live on the website as soon as you save.' : `Last saved ${when(it.updatedAt || it.createdAt) || '–'}`, wide: true,
        body: `<form id="mf">${formHtml(fields, it)}</form>`, foot: `${isNew ? '' : `<button class="btn btn-danger left" data-x="del">${icon('trash')}<span>Delete</span></button>`}<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-x="save">${icon('check')}<span>${isNew ? `Publish ${singular}` : 'Save changes'}</span></button>` });
      wireForm(m, folder);
      const save = (btn) => busy(btn, async () => {
        const data = readFields(m, fields);
        if (!data.title) { toast('Add a title first', true); return; }
        data.updatedAt = serverTimestamp();
        if (isNew) await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() }); else await updateDoc(doc(db, col, it.id), data);
        closeModal(); toast(isNew ? 'Published. Live on the website.' : 'Saved'); VIEWS[col]();
      });
      $('[data-x=save]', m).onclick = (e) => save(e.currentTarget);
      $('#mf', m).onsubmit = (e) => { e.preventDefault(); save($('[data-x=save]', m)); };
      const d = $('[data-x=del]', m); if (d) d.onclick = () => remove(it);
    };
    const remove = (it) => confirmDo(`Delete ${singular}`, `Delete “${it.title}”? It disappears from the website immediately.`, 'Delete', async () => { await deleteDoc(doc(db, col, it.id)); toast('Deleted'); VIEWS[col](); });
    $('#addBtn').onclick = () => open();
    $('#list').onclick = (e) => {
      const el = e.target.closest('[data-id]'); if (!el) return; const it = items.find((x) => x.id === el.dataset.id);
      if (e.target.closest('[data-del]')) remove(it); else open(it);
    };
  };
}
manager('events', {
  fields: EV_FIELDS, ic: 'calendar', singular: 'event', folder: 'events', defaults: { status: 'upcoming' },
  lede: 'Upcoming events show first on the website; completed ones move to “Past events”.',
  tabsOf: [['upcoming', 'Upcoming', (e) => e.status !== 'completed'], ['completed', 'Past', (e) => e.status === 'completed'], ['all', 'All', () => true]],
  row: (e) => { const d = e.date ? new Date(e.date) : null; return `<div class="appt-date"><b>${d ? d.getDate() : '–'}</b><small>${d ? d.toLocaleString('en', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2) : 'TBA'}</small></div>${e.image ? `<img class="thumb" src="${esc(e.image)}" alt="">` : ''}<div class="grow truncate"><b>${esc(e.title)}</b><br><small class="muted">${esc([e.time, e.location, e.stat].filter(Boolean).join(' · '))}</small></div>${e.status === 'completed' ? badge('Completed') : badge('Upcoming', 'ok')}`; },
});
manager('notices', {
  fields: NO_FIELDS, ic: 'megaphone', singular: 'notice', folder: 'notices', defaults: { active: true, date: new Date().toISOString().slice(0, 10) },
  lede: 'Notices appear on the notice board right under the hero. Pinned ones stay on top.',
  tabsOf: [['live', 'Published', (n) => n.active !== false], ['hidden', 'Hidden', (n) => n.active === false], ['all', 'All', () => true]],
  row: (n) => `<span class="page-icon soft">${icon(n.pinned ? 'star' : 'megaphone')}</span><div class="grow truncate"><b>${esc(n.title)}</b><br><small class="muted">${esc(n.date || '')} · ${esc((n.body || '').slice(0, 90))}</small></div>${n.pinned ? badge('Pinned', 'warn') : ''}${n.active === false ? badge('Hidden') : badge('Live', 'ok')}`,
});

/* ---------- gallery ---------- */
VIEWS.gallery = async () => {
  let items = (await getDocs(collection(db, 'gallery'))).docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const albums = () => [...new Set(items.map((i) => i.album || 'Other'))];
  let filter = 'All';
  const sel = new Set();
  view.innerHTML = `${pageHead('image', 'Gallery', 'Photos and videos grouped into albums. The website shows them as a masonry wall with a lightbox.')}
    <div class="grid-side">
      ${card({ title: 'Upload photos & videos', ic: 'upload', body: `<div class="form-grid">
        <div class="field span-6"><label>Album</label><input class="input" id="gAlbum" list="albumList" placeholder="e.g. Naivasha Worship Night" value="${esc(albums()[0] || '')}"><datalist id="albumList">${albums().map((a) => `<option value="${esc(a)}">`).join('')}</datalist></div>
        <div class="field span-6"><label>Caption <span class="muted">(optional, for this batch)</span></label><input class="input" id="gCap"></div>
        <div class="field"><div class="drop" id="drop"><div class="empty-icon">${icon('image')}</div><b>Drag &amp; drop photos or videos here</b><p class="muted"><button class="link" id="pick">or browse your files</button> · photos are resized automatically, videos up to 25 MB</p><input type="file" id="gFiles" multiple accept="image/*,video/*" hidden><div class="progress" hidden><i></i></div><p class="note" id="upNote"></p></div></div></div>` })}
      ${card({ title: 'Add a video link', ic: 'video', body: `<div class="form-grid"><div class="field"><label>YouTube or video URL</label><input class="input" id="gVid" placeholder="https://youtu.be/…"></div><div class="field"><button class="btn btn-deep" id="addVid">${icon('plus')}<span>Add to album</span></button><span class="hint">Uses the album and caption on the left.</span></div></div>` })}
    </div>
    <section class="card card-flush" style="margin-top:16px"><div class="tabs" id="tabs" style="margin:0;padding:0 8px"></div>
      <div class="toolbar"><span class="muted grow" id="gCount"></span><button class="btn btn-sm" id="selAll">${icon('check')}<span>Select all</span></button><button class="btn btn-sm btn-danger" id="delSel">${icon('trash')}<span>Delete selected</span></button></div>
      <div class="media-grid" id="gal"></div></section>`;
  const draw = () => {
    $('#tabs').innerHTML = ['All', ...albums()].map((a) => `<button class="tab ${a === filter ? 'active' : ''}" data-a="${esc(a)}">${esc(a)}<span class="count">${a === 'All' ? items.length : items.filter((i) => (i.album || 'Other') === a).length}</span></button>`).join('');
    const list = filter === 'All' ? items : items.filter((i) => (i.album || 'Other') === filter);
    $('#gCount').textContent = `${list.length} items${sel.size ? ` · ${sel.size} selected` : ''}`;
    $('#gal').innerHTML = list.length ? list.map((g) => { const yt = g.type === 'video' && ytId(g.url); return `<div class="media-item ${sel.has(g.id) ? 'sel' : ''}" data-id="${g.id}"><div class="mthumb">${g.type === 'video' && !yt ? `<video src="${esc(g.url)}" muted preload="metadata"></video>` : `<img src="${esc(yt ? `https://img.youtube.com/vi/${yt}/mqdefault.jpg` : g.url)}" loading="lazy" alt="">`}${g.type === 'video' ? `<span class="vid">${badge('Video', 'brand')}</span>` : ''}</div>
      <input type="checkbox" class="pick" ${sel.has(g.id) ? 'checked' : ''}><div class="tools"><button data-edit title="Edit">${icon('pen')}</button><button data-del title="Delete">${icon('trash')}</button></div><div class="meta"><span class="truncate">${esc(g.caption || g.album || '')}</span></div></div>`; }).join('') : `<div style="grid-column:1/-1">${empty('image', 'No items yet', 'Upload above, or load the default gallery from Settings.')}</div>`;
  };
  draw();
  $('#tabs').onclick = (e) => { const b = e.target.closest('[data-a]'); if (b) { filter = b.dataset.a; draw(); } };
  const doUpload = async (files) => {
    if (!files.length) return;
    const album = $('#gAlbum').value.trim() || 'Other', caption = $('#gCap').value.trim();
    const bar = $('.progress', view), note = $('#upNote'); bar.hidden = false; let done = 0;
    for (const f of files) {
      note.className = 'note'; note.textContent = `Uploading ${done + 1} of ${files.length}…`;
      try {
        const { url, path } = await upload(f, 'gallery', (p) => { $('i', bar).style.width = `${((done + p) / files.length) * 100}%`; });
        await addDoc(collection(db, 'gallery'), { url, path, album, caption, type: f.type.startsWith('video') ? 'video' : 'image', order: 0, createdAt: serverTimestamp() });
      } catch (e) { toast(`${f.name}: ${e.message}`, true); }
      done++;
    }
    toast(`${done} uploaded to ${album}`); VIEWS.gallery();
  };
  $('#pick').onclick = () => $('#gFiles').click();
  $('#gFiles').onchange = (e) => doUpload([...e.target.files]);
  const drop = $('#drop');
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); doUpload([...e.dataTransfer.files]); };
  $('#addVid').onclick = (e) => busy(e.currentTarget, async () => {
    const url = $('#gVid').value.trim(); if (!url) { toast('Paste a link first', true); return; }
    await addDoc(collection(db, 'gallery'), { url, album: $('#gAlbum').value.trim() || 'Videos', caption: $('#gCap').value.trim(), type: 'video', order: 0, createdAt: serverTimestamp() });
    toast('Video added'); VIEWS.gallery();
  });
  $('#selAll').onclick = () => { (filter === 'All' ? items : items.filter((i) => (i.album || 'Other') === filter)).forEach((i) => sel.add(i.id)); draw(); };
  $('#delSel').onclick = () => {
    if (!sel.size) { toast('Select items first', true); return; }
    confirmDo('Delete items', `Delete ${sel.size} item(s) from the gallery? Uploaded files are removed too.`, `Delete ${sel.size}`, async () => {
      for (const id of sel) { const it = items.find((x) => x.id === id); await deleteDoc(doc(db, 'gallery', id)); removeFile(it?.path); }
      items = items.filter((x) => !sel.has(x.id)); sel.clear(); draw(); toast('Deleted');
    });
  };
  $('#gal').onclick = (e) => {
    const el = e.target.closest('.media-item'); if (!el) return; const it = items.find((x) => x.id === el.dataset.id);
    if (e.target.matches('.pick')) { e.target.checked ? sel.add(it.id) : sel.delete(it.id); draw(); return; }
    if (e.target.closest('[data-del]')) return confirmDo('Delete item', 'Delete this item from the gallery?', 'Delete', async () => { await deleteDoc(doc(db, 'gallery', it.id)); removeFile(it.path); items = items.filter((x) => x !== it); draw(); toast('Deleted'); });
    if (e.target.closest('[data-edit]') || e.target.closest('.mthumb')) {
      const F = [['album', 'Album', 'text', { span: 6 }], ['caption', 'Caption', 'text', { span: 6 }], ['order', 'Display order', 'number', { span: 4, hint: 'Lower shows first' }], ['url', 'File / link URL', 'text', { span: 8 }]];
      const m = modal({ ic: 'image', title: 'Edit gallery item', lede: it.album, wide: true, body: `${it.type !== 'video' ? `<img src="${esc(it.url)}" alt="" style="max-height:260px;margin:0 auto 16px;border-radius:8px">` : ''}${formHtml(F, it)}`, foot: `<button class="btn btn-danger left" data-x="del">${icon('trash')}<span>Delete</span></button><button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-x="save">${icon('check')}<span>Save</span></button>` });
      $('[data-x=save]', m).onclick = (ev) => busy(ev.currentTarget, async () => { const d = readFields(m, F); await updateDoc(doc(db, 'gallery', it.id), d); Object.assign(it, d); closeModal(); draw(); toast('Saved'); });
      $('[data-x=del]', m).onclick = () => confirmDo('Delete item', 'Delete this item from the gallery?', 'Delete', async () => { await deleteDoc(doc(db, 'gallery', it.id)); removeFile(it.path); items = items.filter((x) => x !== it); draw(); toast('Deleted'); });
    }
  };
};

/* ---------- site content ---------- */
const SECTIONS = [
  ['hero', 'Hero', 'sparkles', 'The first thing visitors see.', [['hero.eyebrow', 'Small heading', 'text', { span: 6 }], ['hero.title', 'Headline', 'text', { span: 6 }], ['hero.accent', 'Headline accent', 'text', { span: 6, hint: 'Shown in red italics' }], ['hero.text', 'Intro text', 'textarea', { rows: 3 }], ['', 'Images', 'title'], ['hero.img1', 'Large arch', 'image'], ['hero.img2', 'Top circle', 'image', { span: 6 }], ['hero.img3', 'Bottom circle', 'image', { span: 6 }]]],
  ['notice', 'Notice banner', 'megaphone', 'The red banner under the ticker.', [['notice.on', 'Show the banner on the website', 'bool'], ['notice.title', 'Title'], ['notice.text', 'Text', 'textarea', { rows: 4 }]]],
  ['ticker', 'Scrolling ticker', 'type', 'The dark strip that scrolls under the hero.', [['ticker', 'Phrases', 'lines', { rows: 8, hint: 'One phrase per line' }]]],
  ['about', 'About', 'info', 'Who we are, mission, vision and values.', [['about.title', 'Heading'], ['about.text', 'Paragraph 1', 'textarea', { rows: 3 }], ['about.text2', 'Paragraph 2', 'textarea', { rows: 3 }], ['about.signature', 'Signature line', 'text', { span: 6 }], ['about.motto', 'Motto', 'text', { span: 6 }], ['about.mission', 'Mission', 'text', { span: 6 }], ['about.vision', 'Vision', 'text', { span: 6 }], ['about.values', 'Values'], ['', 'Card images', 'title'], ['about.img1', 'Mission card', 'image'], ['about.img2', 'Vision card', 'image'], ['about.img3', 'Values card', 'image']]],
  ['prayer', 'Prayer & fasting', 'heart', 'When and where we pray.', [['prayer.days', 'Prayer days', 'text', { span: 6 }], ['prayer.time', 'Prayer time', 'text', { span: 6 }], ['prayer.platform', 'Where we meet'], ['prayer.fastWeekly', 'Weekly fast', 'text', { span: 6 }], ['prayer.fastMonthly', 'Monthly fast', 'text', { span: 6 }]]],
  ['giving', 'Giving', 'gift', 'Bank and M-Pesa details shown in “Support the ministry”.', [['giving.note', 'Ways to give'], ['', 'Bank', 'title'], ['giving.bank', 'Bank', 'text', { span: 6 }], ['giving.accountName', 'Account name', 'text', { span: 6 }], ['giving.accountNo', 'Account number', 'text', { span: 6 }], ['giving.branchNote', 'Account note', 'text', { span: 6 }], ['', 'M-Pesa', 'title'], ['giving.paybill', 'PayBill number', 'text', { span: 6 }], ['giving.mpesaAcc', 'Account number', 'text', { span: 6 }]]],
  ['contact', 'Contact & socials', 'phone', 'Contact details, WhatsApp groups and social links.', [['contact.email', 'Email', 'email', { span: 6 }], ['contact.address', 'Address', 'text', { span: 6 }], ['contact.phone1', 'Phone 1', 'text', { span: 6 }], ['contact.phone2', 'Phone 2', 'text', { span: 6 }], ['', 'WhatsApp', 'title'], ['contact.whatsapp', 'Prayer group link', 'url', { span: 6 }], ['contact.social', 'Community link', 'url', { span: 6 }], ['', 'Social media', 'title'], ['contact.facebook', 'Facebook', 'url', { span: 6 }], ['contact.instagram', 'Instagram', 'url', { span: 6 }], ['contact.youtube', 'YouTube', 'url', { span: 6 }], ['contact.tiktok', 'TikTok', 'url', { span: 6 }]]],
  ['constitution', 'Constitution', 'book', 'The constitution section, its articles and pillars.', [['constitution.summary', 'Summary', 'textarea', { rows: 3 }], ['constitution.founded', 'Founded', 'text', { span: 6 }], ['constitution.founder', 'Founder', 'text', { span: 6 }], ['constitution.articles', 'Articles', 'text', { span: 4 }], ['constitution.pages', 'Pages', 'text', { span: 4 }], ['constitution.year', 'Year established', 'text', { span: 4 }], ['constitution.pdf', 'Full constitution link (PDF / Drive)', 'url'], ['constitution.toc', 'Articles list', 'textarea', { rows: 9, hint: 'One article per line' }], ['constitution.pillars', 'Pillars', 'textarea', { rows: 4, hint: 'One per line as Title|Description' }]]],
];
VIEWS.content = async () => {
  const d = await getDoc(doc(db, 'site', 'content'));
  let C = merge(CONTENT, d.exists() ? d.data() : {});
  let cur = SECTIONS[0][0];
  view.innerHTML = `${pageHead('pen', 'Site content', d.exists() ? 'Edit any section and save. Changes go live immediately.' : 'The website is showing built-in default content. Saving here makes it yours.', `<a class="btn" href="/" target="_blank">${icon('eye')}<span>Preview site</span></a>`)}
    <div class="editor"><nav class="card ed-nav" id="edNav">${SECTIONS.map(([k, t, ic]) => `<button data-s="${k}">${icon(ic)}${esc(t)}</button>`).join('')}</nav><div id="edBody"></div></div>`;
  const draw = () => {
    const [k, t, ic, lede, fields] = SECTIONS.find((s) => s[0] === cur);
    $$('#edNav button').forEach((b) => b.classList.toggle('active', b.dataset.s === k));
    $('#edBody').innerHTML = `<section class="card"><div class="card-head"><h3>${icon(ic)}${esc(t)}</h3><span class="muted" style="font-size:.8rem">${esc(lede)}</span></div><div class="card-body"><form id="cf">${formHtml(fields, C)}</form></div><div class="modal-foot"><button class="btn" id="reset">Undo changes</button><button class="btn btn-primary" id="save">${icon('check')}<span>Save ${esc(t.toLowerCase())}</span></button></div></section>`;
    const body = $('#edBody'); wireForm(body, 'site');
    $('#reset').onclick = draw;
    $('#save').onclick = (e) => busy(e.currentTarget, async () => { C = merge(C, readFields(body, fields)); await setDoc(doc(db, 'site', 'content'), C); toast(`${t} saved. Live on the website.`); });
  };
  draw();
  $('#edNav').onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { cur = b.dataset.s; draw(); } };
};

/* ---------- settings ---------- */
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
VIEWS.settings = async () => {
  const [setup, admins] = await Promise.all([getDoc(doc(db, 'config', 'setup')), getDocs(collection(db, 'admins'))]);
  const s = setup.exists() ? setup.data() : { open: false, code: '' };
  view.innerHTML = `${pageHead('sliders', 'Settings', 'Administrators, the setup page and your account.')}
    <div class="grid-2">
      <div class="stack">
        ${card({ title: 'Setup page', ic: 'shield', actions: `<a class="btn btn-sm" href="/setup" target="_blank">${icon('external')}<span>/setup</span></a>`, body: `
          <div class="toggle"><div><b>Allow a new administrator to register</b><p class="muted" style="font-size:.82rem">Keep this off. Turn it on only while adding someone; it switches itself off once they finish.</p></div><label class="switch"><input type="checkbox" id="setupOpen" ${s.open ? 'checked' : ''}><span></span></label></div>
          <div class="row-between" style="margin-top:14px"><span>Setup code <code id="code">${esc(s.code || '–')}</code></span><button class="btn btn-sm" id="regen">${icon('key')}<span>New code</span></button></div>
          <p class="muted" style="font-size:.8rem;margin-top:8px">Share the code privately with the new admin together with the /setup link.</p>` })}
        ${card({ title: 'Your account', ic: 'key', body: `<div class="list-item" style="padding:0 0 12px"><span class="avatar">${esc(initials(me.name || me.email))}</span><div class="grow truncate"><b>${esc(me.name || '')}</b><br><small class="muted">${esc(me.email)}</small></div>${badge('Administrator', 'brand')}</div><button class="btn" id="resetPw">${icon('mail')}<span>Email me a password reset link</span></button>` })}
      </div>
      <div class="stack">
        ${card({ title: 'Administrators', ic: 'users', flush: true, actions: badge(`${admins.size}`, 'info'), body: admins.docs.map((a) => `<div class="list-item" data-id="${a.id}"><span class="avatar">${esc(initials(a.data().name || a.data().email))}</span><div class="grow truncate"><b>${esc(a.data().name || '')}</b><br><small class="muted">${esc(a.data().email)}</small></div>${a.id === me.uid ? badge('You', 'ok') : `<button class="icon-btn bad" data-rm title="Remove">${icon('trash')}</button>`}</div>`).join('') })}
        ${card({ title: 'Default content', ic: 'database', body: `<p class="muted" style="font-size:.85rem;margin-bottom:12px">Loads the ministry's original events, the photo gallery and the site text into the database so you can edit or delete them. It skips anything that already exists.</p><button class="btn btn-deep" id="seed">${icon('database')}<span>Load default content</span></button>` })}
      </div>
    </div>`;
  const saveSetup = async (patch) => { Object.assign(s, patch); await setDoc(doc(db, 'config', 'setup'), s); await setDoc(doc(db, 'config', 'status'), { done: true, open: s.open }); };
  $('#setupOpen').onchange = async (e) => { await saveSetup({ open: e.target.checked, code: s.code || newCode() }); $('#code').textContent = s.code; toast(e.target.checked ? 'Setup page is open' : 'Setup page is locked'); };
  $('#regen').onclick = (e) => busy(e.currentTarget, async () => { await saveSetup({ code: newCode() }); $('#code').textContent = s.code; toast('New code generated'); });
  $('#resetPw').onclick = (e) => busy(e.currentTarget, async () => { await A.sendPasswordResetEmail(A.auth, me.email); toast('Reset link sent to your email'); });
  $('.grid-2', view).addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]'); if (!b) return; const li = b.closest('[data-id]');
    confirmDo('Remove administrator', 'They will lose access to this console immediately.', 'Remove', async () => { await deleteDoc(doc(db, 'admins', li.dataset.id)); li.remove(); toast('Removed'); });
  });
  $('#seed').onclick = (e) => busy(e.currentTarget, async () => {
    const [ev, gl, ct] = await Promise.all([getDocs(collection(db, 'events')), getDocs(collection(db, 'gallery')), getDoc(doc(db, 'site', 'content'))]);
    if (!ct.exists()) await setDoc(doc(db, 'site', 'content'), CONTENT);
    if (ev.empty) for (const x of EVENTS) await addDoc(collection(db, 'events'), { ...x, createdAt: serverTimestamp() });
    if (gl.empty) { const b = writeBatch(db); GALLERY.forEach((g, i) => b.set(doc(collection(db, 'gallery')), { ...g, order: i, createdAt: serverTimestamp() })); await b.commit(); }
    toast('Default content loaded');
  });
};
