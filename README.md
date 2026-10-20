# BQ Pen Tracker

Throwing-week schedule and pitch-by-pitch bullpen tracker for Baseball Queensland U16/U18 pitchers.
It's an installable web app (PWA): open it on a phone, add it to the home screen, and it runs full-screen and works offline at the field.

## How it works

- `index.html`: the whole app.
- `sw.js`: caches the app so it opens with no signal. Bump `VERSION` in it whenever you change a file, so phones pick up the update.
- `manifest.webmanifest` and `icons/`: home-screen name and icon.
- `vendor/supabase-2.117.3.js`: Supabase client (MIT, see `vendor/supabase-LICENSE`).

Pens sync through the Supabase project `bq-pen-tracker` (ap-southeast-2). Each pen is saved on the phone first and uploads when there's a connection, so nothing is lost without signal.

Only signed-in coaches on the coach list can read or write pens. Anyone can create an account, but they see nothing until their email is added.

## Adding a coach

In the Supabase dashboard → SQL editor:

```sql
insert into public.coaches (email) values ('coach@example.com');
```

The coach then signs out and back in on the app.

## Hosting

The app is plain static files, so any static host works. With GitHub Pages:

1. The repo must be public (Pages on a private repo needs a paid GitHub plan). The Supabase key in `index.html` is a publishable key, which is meant to be public; access is enforced by row-level security.
2. Settings → Pages → Build and deployment → Deploy from a branch → `main`, `/ (root)`.
3. In Supabase → Authentication → URL Configuration, set **Site URL** to the Pages URL (e.g. `https://<user>.github.io/<repo>/`) so account-confirmation emails link back to the app.

## Install on a phone

- iPhone: open the link in Safari → Share → Add to Home Screen.
- Android: open in Chrome → menu → Install app.
