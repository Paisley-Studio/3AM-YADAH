// Firebase connection (project am-yadah-encounter). Web config keys are public identifiers;
// access is controlled by firestore.rules and storage.rules.
const V = '13.4.0';
const base = `https://www.gstatic.com/firebasejs/${V}`;
export const firebaseConfig = {
  apiKey: "AIzaSyD_Lazrwl5t_e1yOqk_JL9BUQW6gQd7QZ4",
  authDomain: "am-yadah-encounter.firebaseapp.com",
  projectId: "am-yadah-encounter",
  storageBucket: "am-yadah-encounter.firebasestorage.app",
  messagingSenderId: "416734717722",
  appId: "1:416734717722:web:83b3110cc5b3ad21426ea3",
  measurementId: "G-D2VGCJMMVH"
};
const { initializeApp } = await import(`${base}/firebase-app.js`);
export const fs = await import(`${base}/firebase-firestore.js`);
export const app = initializeApp(firebaseConfig);
export const db = fs.getFirestore(app);
export const loadAuth = async () => { const m = await import(`${base}/firebase-auth.js`); return { ...m, auth: m.getAuth(app) }; };
export const loadStorage = async () => { const m = await import(`${base}/firebase-storage.js`); return { ...m, storage: m.getStorage(app) }; };
export const loadAnalytics = async () => { try { const m = await import(`${base}/firebase-analytics.js`); if (await m.isSupported()) m.getAnalytics(app); } catch {} };
