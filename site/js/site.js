import { CONTENT, EVENTS, GALLERY, ART } from './defaults.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const merge = (a, b) => { const out = { ...a }; for (const k in b || {}) out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k]; return out; };

let C = CONTENT, events = EVENTS, gallery = GALLERY, notices = [];
let fb = null;

/* ---------- content binding ---------- */
function bind() {
  $$('[data-c]').forEach((el) => { el.textContent = get(C, el.dataset.c) ?? ''; });
  $$('[data-src]').forEach((el) => { const v = get(C, el.dataset.src); if (v) el.src = v; });
  $$('[data-href]').forEach((el) => { el.href = get(C, el.dataset.href) || '#'; });
  $$('[data-mail]').forEach((el) => { const v = get(C, el.dataset.mail); el.textContent = v; el.href = `mailto:${v}`; });
  $$('[data-tel]').forEach((el) => { const v = get(C, el.dataset.tel) || ''; el.textContent = v; el.href = `tel:${v.replace(/\s/g, '')}`; });
  $('#noticeHero').hidden = !C.notice?.on;
  const t = (Array.isArray(C.ticker) ? C.ticker : String(C.ticker || '').split('\n')).filter(Boolean);
  $('#ticker').innerHTML = [...t, ...t, ...t, ...t].map((x) => `<span>${esc(x)}</span>`).join('');
  $('#pillars').innerHTML = String(C.constitution.pillars || '').split('\n').filter(Boolean).map((line, i) => {
    const [h, p] = line.split('|');
    return `<div class="pillar reveal d${i + 1}"><div class="num">${['i', 'ii', 'iii', 'iv', 'v'][i] || i + 1}</div><h3>${esc(h)}</h3><p>${esc(p || '')}</p></div>`;
  }).join('');
  $('#toc').innerHTML = String(C.constitution.toc || '').split('\n').filter(Boolean).map((x) => `<div>${esc(x)}</div>`).join('');
  const s = C.contact; const soc = [['WA', s.social || s.whatsapp], ['FB', s.facebook], ['IG', s.instagram], ['YT', s.youtube], ['TT', s.tiktok]].filter(([, u]) => u);
  $('#socials').innerHTML = soc.map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${k}</a>`).join('');
  observe();
}

/* ---------- notices ---------- */
function renderNotices() {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  $('#noticeGrid').innerHTML = notices.map((n) => `<article class="ncard ${n.pinned ? 'pin' : ''} reveal"><time>${esc(fmt(n.date))}</time><h4>${esc(n.title)}</h4><p>${esc(n.body)}</p></article>`).join('');
  observe();
}

/* ---------- events ---------- */
let evFilter = 'upcoming';
function renderEvents() {
  const list = events.filter((e) => (evFilter === 'upcoming' ? e.status !== 'completed' : e.status === 'completed'));
  $('#eventsGrid').innerHTML = list.length ? list.map((e) => {
    const d = e.date ? new Date(e.date) : null;
    return `<article class="ev reveal">
      <div class="ev-img">${e.image ? `<img src="${esc(e.image)}" alt="${esc(e.title)}" loading="lazy">` : ''}
        ${d ? `<div class="ev-date"><b>${d.getDate()}</b><small>${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}</small></div>` : ''}
        <span class="ev-status ${e.status !== 'completed' ? 'up' : ''}">${e.status === 'completed' ? 'Completed' : 'Upcoming'}</span></div>
      <div class="ev-body"><div class="tags">${String(e.tags || '').split(',').filter((x) => x.trim()).map((x) => `<span>${esc(x.trim())}</span>`).join('')}</div>
        <h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
        <div class="ev-meta">${e.time ? `<span>🕘 ${esc(e.time)}</span>` : ''}${e.location ? `<span>📍 ${esc(e.location)}</span>` : ''}${e.stat ? `<b>${esc(e.stat)}</b>` : ''}</div>
        ${e.link ? `<a class="btn btn-red sm" href="${esc(e.link)}" target="_blank" rel="noopener">${e.status === 'completed' ? 'View more' : 'Register / RSVP'}</a>` : ''}</div></article>`;
  }).join('') : `<div class="empty">${evFilter === 'upcoming' ? 'No upcoming events right now. Join the WhatsApp group to hear first when we announce the next gathering.' : 'No past events yet.'}</div>`;
  observe();
}
$('#evTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; evFilter = b.dataset.f; $$('#evTabs button').forEach((x) => x.classList.toggle('on', x === b)); renderEvents(); });

/* ---------- gallery ---------- */
let album = 'All', shown = 16, view = [];
const ytId = (u = '') => (u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
function renderGallery() {
  const names = [...new Set(gallery.map((g) => g.album || 'Other'))];
  const count = (n) => gallery.filter((g) => (g.album || 'Other') === n).length;
  $('#albums').innerHTML = ['All', ...names].map((n) => `<button class="${n === album ? 'on' : ''}" data-a="${esc(n)}">${esc(n)}<small>${n === 'All' ? gallery.length : count(n)}</small></button>`).join('');
  view = album === 'All' ? gallery : gallery.filter((g) => (g.album || 'Other') === album);
  $('#masonry').innerHTML = view.slice(0, shown).map((g, i) => {
    const yt = g.type === 'video' && ytId(g.url);
    const media = g.type === 'video' ? (yt ? `<img src="https://img.youtube.com/vi/${yt}/hqdefault.jpg" alt="" loading="lazy">` : `<video src="${esc(g.url)}" muted preload="metadata"></video>`) + '<span class="play">▶</span>' : `<img src="${esc(g.url)}" alt="${esc(g.caption || g.album || '')}" loading="lazy">`;
    return `<figure class="tile" data-i="${i}" style="animation-delay:${(i % 8) * 60}ms">${media}${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`;
  }).join('');
  $('#moreBtn').hidden = view.length <= shown;
}
$('#albums').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; album = b.dataset.a; shown = 16; renderGallery(); });
$('#moreBtn').addEventListener('click', () => { shown += 16; renderGallery(); });
$('#artTrack').innerHTML = [...ART, ...ART].map((u) => `<img src="${u}" alt="" loading="lazy">`).join('');

/* lightbox */
let lbi = 0;
const lb = $('#lightbox');
function openLb(i) {
  lbi = (i + view.length) % view.length; const g = view[lbi]; const yt = g.type === 'video' && ytId(g.url);
  $('#lbMedia').innerHTML = g.type === 'video' ? (yt ? `<iframe src="https://www.youtube.com/embed/${yt}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>` : `<video src="${esc(g.url)}" controls autoplay></video>`) : `<img src="${esc(g.url)}" alt="">`;
  $('#lbCap').textContent = [g.album, g.caption].filter(Boolean).join(' · ');
  lb.hidden = false; document.body.style.overflow = 'hidden';
}
const closeLb = () => { lb.hidden = true; $('#lbMedia').innerHTML = ''; document.body.style.overflow = ''; };
$('#masonry').addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (t) openLb(+t.dataset.i); });
lb.addEventListener('click', (e) => { if (e.target.matches('.lb-x') || e.target === lb) closeLb(); if (e.target.matches('.lb-prev')) openLb(lbi - 1); if (e.target.matches('.lb-next')) openLb(lbi + 1); });
addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') openLb(lbi - 1); if (e.key === 'ArrowRight') openLb(lbi + 1); });

/* ---------- UI: nav, reveal, counters, tabs, copy ---------- */
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 20), { passive: true });
$('#burger').addEventListener('click', () => nav.classList.toggle('open'));
$$('#links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

// VHR-style: ease in when entering the viewport, ease back out when leaving it.
const io = new IntersectionObserver((ents) => ents.forEach((en) => en.target.classList.toggle('in', en.isIntersecting)), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
const seen = new WeakSet();
function observe() { $$('.reveal,.reveal-left,.reveal-right,.reveal-scale,.reveal-rotate').forEach((el) => { if (!seen.has(el)) { seen.add(el); io.observe(el); } }); }
const cio = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (!en.isIntersecting) return; const el = en.target, to = +el.dataset.count, t0 = performance.now();
  const step = (t) => { const p = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(to * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step); cio.unobserve(el);
}));
$$('[data-count]').forEach((el) => cio.observe(el));

const sio = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) $$('#links a').forEach((a) => a.classList.toggle('on', a.hash === `#${en.target.id}`)); }), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach((s) => sio.observe(s));

function joinTab(t) { $$('#joinTabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); $('#regForm').hidden = t !== 'register'; $('#prayForm').hidden = t !== 'prayer'; }
$('#joinTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) joinTab(b.dataset.t); });
$$('[data-tab]').forEach((a) => a.addEventListener('click', () => joinTab(a.dataset.tab)));

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  try { await navigator.clipboard.writeText(get(C, b.dataset.copy)); b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1500); } catch {}
});
$('#yr').textContent = new Date().getFullYear();

/* ---------- forms -> Firestore ---------- */
$$('form[data-col]').forEach((form) => form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const note = $('.form-note', form), btn = $('button[type=submit]', form);
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = String(v).trim(); });
  $$('input[type=checkbox]', form).forEach((c) => { data[c.name] = c.checked; });
  if (form.id === 'prayForm' && data.anonymous) data.name = data.name || 'Anonymous';
  btn.disabled = true; note.className = 'form-note'; note.textContent = 'Sending…';
  try {
    if (!fb) throw new Error('offline');
    await fb.fs.addDoc(fb.fs.collection(fb.db, form.dataset.col), { ...data, createdAt: fb.fs.serverTimestamp(), status: 'new' });
    form.reset(); note.classList.add('ok');
    note.textContent = { registrations: 'Welcome to the family! We will reach out to you shortly.', prayers: 'Received. Our prayer team is standing with you. 🙏', messages: 'Thank you! We will respond within 24 hours.', subscribers: 'Subscribed. God bless you!' }[form.dataset.col];
    if (form.id === 'regForm' && data.whatsapp && C.contact.whatsapp) setTimeout(() => window.open(C.contact.whatsapp, '_blank'), 900);
  } catch (err) { note.classList.add('bad'); note.textContent = 'Could not send right now. Please try again, or reach us on WhatsApp.'; }
  btn.disabled = false;
}));

/* ---------- boot ---------- */
bind(); renderNotices(); renderEvents(); renderGallery();

(async () => {
  try {
    fb = await import('./fb.js');
    const { fs, db } = fb;
    fb.loadAnalytics();
    // visitor log (one per browser session)
    try {
      if (!sessionStorage.getItem('v')) {
        sessionStorage.setItem('v', 1);
        const now = new Date();
        fs.addDoc(fs.collection(db, 'visits'), { ts: fs.serverTimestamp(), day: now.toISOString().slice(0, 10), ref: (document.referrer || 'direct').slice(0, 200), path: location.pathname.slice(0, 100), device: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop' }).catch(() => {});
      }
    } catch {}
    const [cDoc, evSnap, nSnap, gSnap] = await Promise.all([
      fs.getDoc(fs.doc(db, 'site', 'content')),
      fs.getDocs(fs.collection(db, 'events')),
      fs.getDocs(fs.collection(db, 'notices')),
      fs.getDocs(fs.collection(db, 'gallery')),
    ]);
    if (cDoc.exists()) { C = merge(CONTENT, cDoc.data()); bind(); }
    if (!evSnap.empty) { events = evSnap.docs.map((d) => d.data()).sort((a, b) => (b.date || '').localeCompare(a.date || '')); if (events.some((e) => e.status !== 'completed')) { evFilter = 'upcoming'; } else { evFilter = 'completed'; $$('#evTabs button').forEach((x) => x.classList.toggle('on', x.dataset.f === 'completed')); } renderEvents(); }
    else if (!events.some((e) => e.status !== 'completed')) { evFilter = 'completed'; $$('#evTabs button').forEach((x) => x.classList.toggle('on', x.dataset.f === 'completed')); renderEvents(); }
    notices = nSnap.docs.map((d) => d.data()).filter((n) => n.active !== false).sort((a, b) => (b.pinned - a.pinned) || String(b.date || '').localeCompare(String(a.date || '')));
    renderNotices();
    if (!gSnap.empty) { gallery = gSnap.docs.map((d) => d.data()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); renderGallery(); }
  } catch (e) { console.warn('Firebase unavailable, showing default content.', e); if (!events.some((x) => x.status !== 'completed')) { evFilter = 'completed'; $$('#evTabs button').forEach((x) => x.classList.toggle('on', x.dataset.f === 'completed')); renderEvents(); } }
})();
