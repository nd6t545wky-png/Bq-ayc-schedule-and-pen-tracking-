# Notes for changes to this app

- The app is the single file `index.html` (plus `sw.js`, `manifest.webmanifest`). Bump `VERSION` in `sw.js` whenever a shell file changes so phones pick up the new version.
- Database changes go in `supabase/migrations/` and are applied to Supabase project `icczlruovqfhqllnkohh`.
- **Live spreadsheets:** whenever data the app saves changes (new fields, new kinds of records, renamed fields), update `public.sheet_group()` with a new migration so the Google Sheets stay in step: add the new tab, or the field to a tab's `cols` with a readable label. Unknown fields already appear as extra columns, but give them proper labels and order. Pens, games and hitting games carry a `summary` object computed in the app (`penSummary`, `gameSummary`, `hitSummary`); keep those in step with what the app shows. `docs/sheets-sync.gs` is generic and shouldn't need changing.
- Never expose email addresses: they aren't granted on `coaches` or `players`, and the app shows names only.
- Coaches only see athletes in their age groups (`coach_sees`, `coach_age_ok`); the owner sees everything.
