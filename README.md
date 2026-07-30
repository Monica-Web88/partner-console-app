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

## Deploying (Render backend + Vercel frontend)

1. Push this project to a GitHub repo (see steps below).
2. Deploy `server/` to Render as a Web Service — root directory `server`,
   build command `npm install`, start command `npm start`. The server
   auto-seeds demo data on boot.
3. Deploy `client/` to Vercel — root directory `client`, framework preset
   Vite. Set the env var `VITE_API_URL` to your Render URL.
4. Note: Render's free tier disk is **ephemeral** — the SQLite file resets
   on every redeploy/restart. Fine for a portfolio demo; add a persistent
   disk (paid tier) if you want data to survive restarts.

Full step-by-step walkthrough is in the conversation this project came from —
see below for the condensed version.

## Extending it (good next steps for a portfolio version)

- Swap the field-reachability check (`checkReachable` in `feedValidator.js`) to
  actually hit `streamUri` — it's wired up but off by default (`checkUrls: false`)
  to keep demo runs fast and deterministic.
- Add a `PATCH /api/feeds/:id/override` route so a human can approve a field that
  failed automated validation — the real "QA Review" stage would use this.
- Deploy `server/` to Render/Railway and `client/` to Vercel; point the client's
  `vite.config.js` proxy at the deployed API URL instead of localhost.

## Deploying / putting this on your resume

Push this to a public GitHub repo, deploy it (Render + Vercel is the fastest free
path), and use a real, current metric from your own testing — e.g. "built a feed
validation engine catching 8 field-level error types across required/enum/date/URL
checks, backed by SQL-driven failure analytics." Don't reuse the placeholder counts
in the seed data as a resume claim — they're illustrative, not a real result.
