// ---------------------------------------------------------------------------
// Site configuration. Edit this file only; no build step is needed.
// ---------------------------------------------------------------------------
window.SITE_CONFIG = {
  // Registration form (Google Form) shown on the "Register" button.
  registrationUrl: "",

  participants: {
    // Where the participant list comes from.
    //
    // Option A (recommended): a Google Sheet shared as "Anyone with the link
    // can view". No API key is needed; the browser downloads the sheet as CSV.
    // Keep the raw form-response sheet PRIVATE and publish a second sheet that
    // only contains public columns (see README.md).
    sheetId: "1-mcn4A3cWiYuOm4Le8zH7Tbd8nQH09HGSGG643r6Jyg", // the long id in https://docs.google.com/spreadsheets/d/<ID>/edit
    sheetName: "",        // tab name inside that spreadsheet; empty = first tab

    // Option B: any CSV URL (e.g. a "Publish to web" CSV link). Overrides sheetId.
    csvUrl: "",

    // Fallback used when neither of the above is set (and for local preview).
    fallbackUrl: "data/participants.csv",

    // Columns to display, matched case-insensitively against the sheet header.
    // Anything not listed here (Email, Timestamp, ...) is never rendered.
    // Header aliases: "Institute" also matches "Affiliation";
    // "Presentation title" also matches "Talk title" or "Title".
    columns: ["Name", "Institute", "Presentation title"],

    // Column used for alphabetical default sort.
    sortBy: "Name",
  },
};
