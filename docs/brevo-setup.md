# Sending sign-up emails with Brevo

Supabase sends two emails for the app: **confirm your account** (when someone creates an account) and **reset your password**. Its built-in sender only reaches the Supabase team, so to let players and coaches sign up on their own, connect a free Brevo account. It takes about 15 minutes and you only do it once.

Brevo's free plan sends up to 300 emails a day, which is far more than the team needs.

## Before you start: pick the "from" address

Use an email inbox the team controls, such as a team Gmail (e.g. `bqpentracker@gmail.com`). Make a new one if you don't want to use your personal email. You'll need to open one verification email sent to it.

Without your own website domain, Brevo can't send as a Gmail address directly. It sends from a Brevo address on your behalf, so the email shows your name ("BQ Pen Tracker") with a Brevo address underneath. That's normal. These emails are more likely to land in **junk**, so tell people to check there the first time. If you get a domain later, verifying it in Brevo fixes this.

## 1. Create the Brevo account

1. Go to <https://www.brevo.com> → **Sign up free**.
2. Fill in the sign-up questions; any answers are fine. Choose the **Free** plan, which needs no card.

## 2. Add the sender

1. In Brevo, open the menu with your name (top right) → **Senders, Domains & Dedicated IPs** → **Senders** → **Add sender**.
2. From name: `BQ Pen Tracker`. From email: the inbox you picked above.
3. Open the verification email Brevo sends to that inbox and confirm it.

## 3. Get the SMTP login and key

1. Same menu → **SMTP & API** → **SMTP** tab.
2. Note the **SMTP server** (`smtp-relay.brevo.com`), **Port** (`587`) and **Login** shown on that page. The login looks like an email address; use exactly what's shown.
3. Click **Generate a new SMTP key**, name it `Supabase`, and copy the key. It's only shown once.

Keep the key private. It only goes into Supabase in the next step. Don't put it in the app, the repo or a chat.

## 4. Connect it to Supabase

Open <https://supabase.com/dashboard/project/icczlruovqfhqllnkohh/auth/smtp>, turn on **Enable custom SMTP**, and fill in:

| Field | Value |
|---|---|
| Sender email | the inbox you verified in step 2 |
| Sender name | `BQ Pen Tracker` |
| Host | `smtp-relay.brevo.com` |
| Port number | `587` |
| Minimum interval between emails | leave as is |
| Username | the **Login** from step 3 |
| Password | the **SMTP key** from step 3 |

Click **Save**.

## 5. The other Supabase settings (if not done yet)

1. **Confirm email on, 10-character passwords:** <https://supabase.com/dashboard/project/icczlruovqfhqllnkohh/auth/providers> → **Email** → turn on **Confirm email**, set the minimum password length to `10`, and save.
2. **Links open the app:** <https://supabase.com/dashboard/project/icczlruovqfhqllnkohh/auth/url-configuration>
   - Site URL: `https://nd6t545wky-png.github.io/Bq-ayc-schedule-and-pen-tracking-/`
   - Redirect URLs → **Add URL**: the same address
3. **Sign-up day:** Supabase allows 30 auth emails an hour once custom SMTP is on. If the whole squad signs up at once and someone is told to wait, raise it at <https://supabase.com/dashboard/project/icczlruovqfhqllnkohh/auth/rate-limits> (e.g. to 100).

Optional: make the email look friendlier at <https://supabase.com/dashboard/project/icczlruovqfhqllnkohh/auth/templates>. Under **Confirm signup**, set the subject to `Confirm your BQ Pen Tracker account`. Keep `{{ .ConfirmationURL }}` in the body; that's the link.

## 6. Test it

1. Open the app on your phone, go to Bullpens, enter an email you can check (a different one from your own account) and a 10+ character password, and tap **Create account**.
2. An email from **BQ Pen Tracker** should arrive within a minute. Check junk too. Open the link, then come back and **Sign in**.
3. The app shows **Join your team**. Enter the player code from **Team codes**.
4. Also try **Forgot password?** to check reset emails arrive.

## If an email doesn't arrive

- **Check junk/spam first.** It's the most common cause without a domain.
- **Brevo → Transactional → Logs** shows each email: *Delivered*, *Deferred* or *Blocked*, with the reason.
- **Supabase → Logs → Auth logs** shows whether Supabase handed the email to Brevo. A login or SMTP error there usually means the username or key was copied wrong. Generate a new key and paste it again.
- Brevo sometimes reviews new accounts before allowing sending. If the logs say the account isn't activated, follow Brevo's prompt (usually a short form) and wait for approval.
