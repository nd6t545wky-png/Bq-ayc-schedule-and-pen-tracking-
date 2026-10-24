# Live Google Sheets

One Google Sheet per age group (U16, U18, AYWC, AWC). Each one has these tabs:

| Tab | What's in it |
|---|---|
| **Players** | Name, type, throws, pitch mix, join date |
| **Season** | Season totals per player (pens, pitching, hitting, last arm check) |
| **Arm check-ins** | Every arm check-in |
| **Bullpens** | Every pen |
| **Pitches** | Every pitch |
| **Games** | Every game |
| **Hitting games** | Every hitting game |
| **At-bats** | Every at-bat |

Players are in alphabetical order, newest entries first within each player. The sheets update every 5 minutes. New players, new data and any new fields the app adds show up on their own. No email addresses are ever included.

You set this up once, in about 10 minutes, on a computer.

## 1. Make the control sheet

1. Go to <https://sheets.new> (signed in to the Google account that should own the sheets).
2. Name it `BQ Weekly – sync`. This one only holds the script and a Status tab.
3. **Extensions → Apps Script**. Delete what's there, paste everything from [sheets-sync.gs](sheets-sync.gs), and click **Save** (the disk icon).
4. Close the Apps Script tab and reload the sheet. A **BQ sync** menu appears at the top.

## 2. Get an export key

1. In the app, sign in as the owner, then go to **Bullpens → Coaches → Live spreadsheets → Make export key** (tap twice).
2. Copy the key. It's only shown once. Making a new key later stops the old one working.

## 3. Connect

1. In the control sheet: **BQ sync → 1. Set export key**, paste, OK.
   - The first time, Google asks you to allow the script. Choose your account, then **Advanced → Go to (unsafe)**. It's your own script. Allow it.
2. **BQ sync → 2. Start live sync**.
3. The **Status** tab now lists a link for each age group's spreadsheet. They're in your Google Drive as `BQ Weekly – U16` and so on.

## Sharing with coaches

Share an age group's spreadsheet the usual way (**Share** button), as **Viewer**, with that group's coaches. Don't share the control sheet: its script holds the export key.

## Good to know

- **Refresh now** (BQ sync menu) updates straight away and rewrites every tab.
- **Stop live sync** pauses the updates. The data stays.
- Editing cells in the age-group sheets is pointless: the next update replaces them. Build your own charts or notes in a separate tab. Tabs you add yourself are left alone.
- **If the Status tab says "Key not accepted"**: make a new key in the app, then **BQ sync → 1. Set export key** again.
