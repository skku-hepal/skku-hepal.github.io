# Korea–Japan High-Energy Astrophysics Workshop — website

Public site for the Korea–Japan collaboration workshop hosted by HEPAL, Sungkyunkwan University.
Served by GitHub Pages at <https://skku-hepal.github.io/>.

Plain HTML/CSS/JS, no build step. Edit the files and push to `main`.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The whole site (hero, about, dates, program, participants, venue, registration, organizers) |
| `assets/css/style.css` | Styles |
| `assets/js/config.js` | **The only file you normally need to edit**: registration link, participant sheet |
| `assets/js/participants.js` | Fetches the participant CSV and renders the searchable table |
| `data/participants.csv` | Sample list used when no Google Sheet is configured (and for local preview) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Participant list from Google Sheets (no API key)

The participant table is loaded in the browser from a Google Sheet exported as CSV.
Nothing is secret, so no API key is needed and nothing can leak. The trade-off is that
the sheet you point at is public, so **never point it at the raw form-response sheet**.

Recommended setup:

1. Create a Google Form for registration with three questions: **Name**, **Institute**,
   **Email address**. Put this in the form description so respondents know what is public:

   > Only your name and institute will be shown in the public participant list on the
   > workshop website. Your email address is kept private and used only by the
   > organizers to contact you about the workshop.

   Link its responses to a spreadsheet (`Form Responses 1`). Keep this spreadsheet
   private; it is the only place the email addresses live.
2. Create a **second** spreadsheet, add a tab named `Public`, and in cell `A1` put
   a formula that pulls only the public columns, for example:

   ```
   =QUERY(IMPORTRANGE("<RESPONSES_SPREADSHEET_ID>", "Form Responses 1!A:D"),
          "select Col2, Col3 where Col2 is not null", 1)
   ```

   (Column A is the timestamp, B name, C institute, D email; only B and C are pulled.)
   The header row should read `Name`, `Institute` (`Affiliation` is accepted too).
   Accept the IMPORTRANGE access prompt once.
3. Share the second spreadsheet as **Anyone with the link → Viewer**.
4. Copy its id from the URL (`https://docs.google.com/spreadsheets/d/<ID>/edit`) into
   `assets/js/config.js`:

   ```js
   sheetId: "<ID>",
   sheetName: "Public",
   ```

The current public sheet is **KJ-HEA 2026 Participants (Public)** in the organiser's Google
Drive; its id is already in `config.js`. Only the `Name` and `Institute` columns are
rendered; any other column in the sheet is ignored by the page. If the sheet cannot be read (not shared yet,
Google outage), the page silently falls back to `data/participants.csv`.

That is it. The page requests
`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Public`
on every load, so new registrations appear within a minute or so.

Alternative: *File → Share → Publish to web → CSV* and paste the link into `csvUrl`.

### Why not the Sheets API?

A static site cannot hide anything: any API key placed in JavaScript is visible to
every visitor. Referrer restrictions reduce the risk but do not remove it. The CSV
export of a view-only sheet gives the same data with nothing to protect.

## Registration link

Set `registrationUrl` in `assets/js/config.js` to the Google Form URL. Until it is
set, the button reads "Registration opens soon".

## Local preview

```bash
python3 -m http.server 8765
```

then open <http://127.0.0.1:8765/>. (Opening `index.html` directly from the file
system blocks the CSV fetch; use a server.)

## GitHub Pages

This repository is the organisation site (`<org>.github.io`), so GitHub Pages serves
the root of `main`. Check **Settings → Pages → Build and deployment**: Source
*Deploy from a branch*, Branch `main` / `/ (root)`.
