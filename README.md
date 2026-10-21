# BQ Pen Tracker

Throwing-week schedule and pitch-by-pitch bullpen tracker for Baseball Queensland U16/U18 pitchers.
It's an installable web app (PWA): open it on a phone, add it to the home screen, and it runs full-screen and works offline at the field.

## How it works

- `index.html`: the whole app.
- `sw.js`: caches the app so it opens with no signal. Bump `VERSION` in it whenever you change a file, so phones pick up the update.
- `manifest.webmanifest` and `icons/`: home-screen name and icon.
- `vendor/supabase-2.117.3.js`: Supabase client (MIT, see `vendor/supabase-LICENSE`).

Pens sync through the Supabase project `bq-pen-tracker` (ap-southeast-2). Each pen is saved on the phone first and uploads when there's a connection, so nothing is lost without signal.

Coaches sign in with email and password. Only signed-in coaches whose email is on the coach list can read or write pens. Anyone can create an account, but they see nothing until their email is added.

## How emails and passwords are protected

- Passwords go straight to Supabase over HTTPS and are stored only as bcrypt hashes. Nobody, including the admin, can read them.
- The app never saves a password on the phone, and clears the password box as soon as it's sent.
- The accounts table isn't reachable from the app. The coach list is locked so each coach can only see their own row, so no one can pull a list of emails.
- Pens store the athlete's name and an anonymous user id, not coach emails.
- Sign-in, sign-up and password reset show the same message whether or not an account exists, so the form can't be used to find out which emails are registered.
- Passwords must be at least 10 characters. Forgotten passwords are reset by an emailed link.
- A coach only gets access after confirming their email, enforced in the database itself (`supabase/migrations/`).

## Supabase settings (one-time)

1. Authentication → Sign In / Providers → Email: keep it on with **Confirm email** on, and set the minimum password length to 10.
2. Authentication → URL Configuration: set **Site URL** to the app's hosted URL and add it under **Redirect URLs**, so confirmation and reset links open the app.
3. Emails use Supabase's built-in sender for now. It only delivers to members of the Supabase team and only a few an hour, so confirmation and reset emails won't reach players or other coaches yet. Until an email sender is set up, create their accounts yourself: Authentication → Users → **Add user** → **Create new user**, enter their email and a temporary password, tick **Auto Confirm User**, and give them the password privately.

## Staying awake on the free plan

Free Supabase projects pause after about a week with little use. `.github/workflows/keepalive.yml` sends one harmless request a day (it calls `public.keepalive()`, which reads no data) so that doesn't happen. You can run it by hand from the repo's **Actions** tab → *Keep Supabase awake* → **Run workflow**. GitHub turns off scheduled jobs in a repo with no activity for 60 days; if that happens, re-enable it from the same page.

## Player accounts

Players can sign in to log their own before/after arm check-ins and see their own pens (read-only). They never see other players, coaches or emails.

1. A coach opens Bullpens → **Player accounts**, enters the player's name (exactly as used for their pens) and email, and taps **Link player**.
2. The player opens the app, taps **Create account** with that email, confirms it from the email, and signs in. (Until an email sender is set up, create the account for them instead; see Supabase settings above.)

Removing a player there cuts off their access straight away.

Coaches see every player's scores in **Team arm check-ins** at the top of the Throwing week tab (this week or last week). Scores of 4 or lower, or a drop of 3 or more, are flagged in red and listed under "to follow up".

## Adding a coach

In the Supabase dashboard → SQL editor:

```sql
insert into public.coaches (email) values ('coach@example.com');
```

The coach then signs out and back in on the app.

You can see who has signed in under Supabase → Authentication → Users.

## Hosting

The app is plain static files, so any static host works. With GitHub Pages:

1. The repo must be public (Pages on a private repo needs a paid GitHub plan). The Supabase key in `index.html` is a publishable key, which is meant to be public; access is enforced by row-level security.
2. Settings → Pages → Build and deployment → Deploy from a branch → `main`, `/ (root)`.
3. Finish the Supabase settings above using the Pages URL.

## Install on a phone

- iPhone: open the link in Safari → Share → Add to Home Screen.
- Android: open in Chrome → menu → Install app.
