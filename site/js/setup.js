import { db, fs, loadAuth } from './fb.js';
const { doc, getDoc, writeBatch, setDoc, serverTimestamp } = fs;
const A = await loadAuth();
const $ = (s) => document.querySelector(s);
const form = $('#setupForm'), state = $('#state'), note = $('#note');
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

let firstRun = false;
try {
  const st = await getDoc(doc(db, 'config', 'status'));
  firstRun = !st.exists();
  if (!firstRun && !st.data().open) { state.className = 'note bad'; state.textContent = 'Setup is locked. An administrator must open it from Admin › Settings.'; }
  else {
    state.className = 'note ok'; state.textContent = firstRun ? 'No administrator yet. This account becomes the first admin.' : 'Setup is open. You need the setup code.';
    $('#fields').hidden = false; $('#codeWrap').hidden = firstRun;
  }
} catch (e) { state.className = 'note bad'; state.textContent = 'Could not reach Firebase: ' + e.message; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form)); const btn = form.querySelector('button');
  if (!v.name || !v.email || (v.password || '').length < 8 || (!firstRun && !v.code)) { note.className = 'note bad'; note.textContent = 'Fill in every field (password 8+ characters).'; return; }
  btn.disabled = true; note.className = 'note'; note.textContent = 'Creating…';
  let created = null;
  try {
    let cred;
    try { cred = await A.createUserWithEmailAndPassword(A.auth, v.email.trim(), v.password); created = cred.user; }
    catch (err) { if (err.code === 'auth/email-already-in-use') cred = await A.signInWithEmailAndPassword(A.auth, v.email.trim(), v.password); else throw err; }
    const uid = cred.user.uid, admin = { name: v.name.trim(), email: v.email.trim(), createdAt: serverTimestamp() };
    if (firstRun) {
      const b = writeBatch(db);
      b.set(doc(db, 'admins', uid), admin);
      b.set(doc(db, 'config', 'setup'), { open: false, code: newCode() });
      b.set(doc(db, 'config', 'status'), { done: true, open: false });
      await b.commit();
    } else {
      await setDoc(doc(db, 'admins', uid), { ...admin, code: v.code.trim().toUpperCase() });
      // lock setup again right away
      const s = await getDoc(doc(db, 'config', 'setup'));
      await setDoc(doc(db, 'config', 'setup'), { ...s.data(), open: false });
      await setDoc(doc(db, 'config', 'status'), { done: true, open: false });
    }
    note.className = 'note ok'; note.textContent = 'Done! Opening the console…';
    setTimeout(() => (location.href = '/admin'), 1000);
  } catch (err) {
    console.error(err);
    if (created) await created.delete().catch(() => {});
    else await A.signOut(A.auth).catch(() => {});
    note.className = 'note bad';
    note.textContent = /permission/i.test(err.message) ? 'Not allowed. The setup code is wrong or setup is locked.' : err.message;
    btn.disabled = false;
  }
});
