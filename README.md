# Partner Ingestion Console

A working demo of a TV-partner content ingestion & validation tool — the kind of
internal tooling a Partner Engineer builds to get media companies' feeds onboarded,
validated, and live. Built to be genuinely runnable, not just a mockup.

**Stack:** React + Vite (frontend) · Express + better-sqlite3 (API) · real XML
parsing and field validation · SQL aggregation for analytics.

## What it actually does

- **Validates real XML feeds** against a declarative rule set (required fields,
  ISO-8601 dates, enums, URL format, integer coercion) — see
  `server/src/validators/feedValidator.js`.
- **Persists every validation run** to SQLite so history accumulates as you use it.
- **Answers "what's failing most" with a real SQL query**, not a hardcoded array —
  see `GET /api/analytics/failing-fields` in `server/src/routes/analytics.js`.
- **Tracks partner pipeline stage** (Submitted → Validating → QA → Live) and logs
  an event every time something changes, which feeds the live activity ticker.
- Ships with two sample feeds (`sample-data/`) — one clean, one full of the kind
  of errors a partner-ops team actually sees.

## Run it locally

You'll need Node 18+ (for the built-in `fetch` used in optional URL reachability
checks).

```bash
# 1. Start the API (seeds demo partners + 7 days of history on first run)
cd server
npm install
npm run seed     # only needed once
npm run dev       # http://localhost:4000

# 2. In a second terminal, start the frontend
cd client
npm install
npm run dev       # http://localhost:5173
```

Open http://localhost:5173. Pick a partner from the dropdown, then either:
- click **"Try a clean sample"** / **"Try a broken sample"**, or
- click **"Upload XML feed"** and pick one of the files in `sample-data/`, or
  any XML file of your own shaped like:

```xml
<program>
  <channelId>...</channelId>
  <airDate>2026-08-04T20:00:00Z</airDate>
  <programTitle>...</programTitle>
  <ratingSystem>TV-14</ratingSystem>
  <closedCaptionUrl>https://...</closedCaptionUrl>
  <durationSeconds>3600</durationSeconds>
  <contentAdvisory>...</contentAdvisory>
  <streamUri>https://...</streamUri>
</program>
```

Every validation run updates the results table, the "top failing fields" chart,
and the live activity ticker at the bottom — all backed by the same SQLite file
(`server/data/console.db`).

## Project structure

```
server/
  src/
    index.js              — Express app + route mounting
    db.js                 — SQLite connection + schema bootstrap
    schema.sql             — partners / feeds / validation_results / events
    seed.js                — demo partners + 7 days of synthetic history
    validators/
      feedValidator.js     — the actual XML parsing + field rule engine
    routes/
      partners.js, feeds.js, analytics.js, events.js
client/
  src/
    App.jsx                — dashboard UI, wired to the live API
    api.js                  — thin fetch wrapper
sample-data/
  sample-feed-valid.xml
  sample-feed-errors.xml
```




