# 3AM Yadah Encounter: website + admin

Plain HTML, CSS and JS on **Firebase** (Hosting, Firestore, Auth, Storage). No build step, no Cloudflare.

| Page | What it does |
|---|---|
| `/` | Public site. Content comes from Firestore and falls back to built-in defaults (`site/js/defaults.js`). |
| `/admin` | Console: visitors, registrations, prayer requests, messages, subscribers (CSV export), events, notices, gallery uploads, all site text/images/constitution, settings. |
| `/setup` | Creates the first admin, then locks itself. Admin › Settings can reopen it (with a one-time code) to add another admin. |

## One-time Firebase console steps
1. **Authentication** › Sign-in method › enable **Email/Password**.
2. **Firestore Database** › Create database (production mode).
3. **Storage** › Get started.
4. Authentication › Settings › Authorized domains › add `3amyadahencounter.com` (and `www.`).

## Deploy
```
firebase login
firebase deploy --only hosting,firestore,storage
```
Then open `/setup`, create the admin, sign in at `/admin`, and in **Settings** click **Load default content** to load the events and gallery so you can edit them.
Connect the domain under Hosting › Add custom domain.
