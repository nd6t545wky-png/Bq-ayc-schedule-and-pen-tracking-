# BQ Pen Tracker

Throwing-week schedule and pitch-by-pitch bullpen tracker for Baseball Queensland U16/U18 pitchers.
It's an installable web app (PWA): open it on a phone, add it to the home screen, and it runs full-screen and works offline at the field.

## How it works

- `index.html`: the whole app.
- `sw.js`: caches the app so it opens with no signal. Bump `VERSION` in it whenever you change a file, so phones pick up the update.
- `manifest.webmanifest` and `icons/`: home-screen name and icon.
- `vendor/supabase-2.117.3.js`: Supabase client (MIT, see `vendor/supabase-LICENSE`).

Pens sync through the Supabase project `bq-pen-tracker` (ap-southeast-2). Each pen is saved on the phone first and uploads when there's a connection, so nothing is lost without signal.

Coaches sign in with Google, so the app never sees or stores a password. Only signed-in coaches whose Google email is on the coach list can read or write pens. Anyone can sign in, but they see nothing until their email is added.

## Turning on Google sign-in (one-time)

1. Google Cloud Console → APIs & Services → OAuth consent screen: set it up as **External**, app name "BQ Pen Tracker", and publish it.
2. Credentials → Create credentials → OAuth client ID → **Web application**.
   - Authorized JavaScript origins: the app's hosted URL origin (e.g. `https://<user>.github.io`).
   - Authorized redirect URI: `https://icczlruovqfhqllnkohh.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Sign In / Providers → **Google**: enable it and paste the client ID and client secret.
4. Supabase → Authentication → Sign In / Providers → **Email**: turn it off, so password accounts can't be created.
5. Supabase → Authentication → URL Configuration: set **Site URL** to the app's hosted URL and add it under **Redirect URLs**.

## Adding a coach

In the Supabase dashboard → SQL editor, with the coach's Google email:

```sql
insert into public.coaches (email) values ('coach@example.com');
```

The coach then signs out and back in on the app.

You can see who has signed in under Supabase → Authentication → Users.

## Hosting

The app is plain static files, so any static host works. With GitHub Pages:

1. The repo must be public (Pages on a private repo needs a paid GitHub plan). The Supabase key in `index.html` is a publishable key, which is meant to be public; access is enforced by row-level security.
2. Settings → Pages → Build and deployment → Deploy from a branch → `main`, `/ (root)`.
3. Finish the Google sign-in steps above using the Pages URL.

## Install on a phone

- iPhone: open the link in Safari → Share → Add to Home Screen.
- Android: open in Chrome → menu → Install app.
