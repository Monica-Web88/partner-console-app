# Partner Ingestion Console

**[Live demo →](https://partner-console-app.vercel.app/)**

Click Try a clean sample and Try a broken sample buttons.

A working simulation of the tool a TV Partner Engineer builds internally: ingest a media
partner's content feed, validate it field-by-field against a real schema, track it through
an onboarding pipeline, and surface which fields break most often so the ops team knows
what to fix first. Built to be run and clicked through, not just described.

> Built while preparing for a Partner Engineering role — the feature set maps directly to
> partner onboarding, feed validation, and cross-team tooling workflows.

## Why this exists

Partner-facing engineering roles need three things 
: parsing and validating a real external data format (XML), turning validation
history into a SQL-backed answer to "what's breaking," and tracking a partner through a
multi-stage operational pipeline. This project does all three, end to end, with a live
backend.

## What it actually does

- **Validates real XML feeds** against a declarative rule set — required fields, ISO-8601
  date format, enum checks, URL format, integer coercion with a warn path — see
  [`server/src/validators/feedValidator.js`](server/src/validators/feedValidator.js).
- **Persists every validation run to SQLite**, so a history builds up the more you use it —
  nothing is mocked or reset on refresh.
- **Answers "what's failing most" with a real SQL query**, not a hardcoded array — see
  [`GET /api/analytics/failing-fields`](server/src/routes/analytics.js).
- **Tracks each partner through a pipeline** (Submitted → Validating → QA Review → Live)
  and logs an event on every change, which drives the live activity ticker.
- **Optional live URL reachability checks** on stream/caption links, using Node's built-in
  `fetch` with a timeout — the kind of check a real ingestion pipeline runs before
  promoting a feed to Live.
- Ships with sample feeds — clean and error-laden — so the validation logic is visible in
  under a minute without needing your own test data.

## Tech stack

**Frontend:** React, Vite · **Backend:** Node.js, Express · **Database:** SQLite
(better-sqlite3) · **Parsing:** fast-xml-parser · **Charts:** Recharts
**Deployed:** Vercel (frontend) + Render (backend)

## Try it live

**[partner-console-app.vercel.app](https://partner-console-app.vercel.app/)**

1. Pick a partner from the dropdown.
2. Click **"Try a clean sample"** or **"Try a broken sample"** to see live field-level
   validation, or upload your own XML feed.
3. Watch the results table, the "top failing fields" chart, and the activity ticker update
   in real time — all backed by an actual SQLite database, not local component state.

*(Backend is on Render's free tier, which sleeps after inactivity — the first request may
take ~30 seconds to wake it up.)*

## Run it locally

Requires Node 18+.

```bash
# 1. Start the API — auto-seeds demo partners + history on first boot
cd server
npm install
npm start          # http://localhost:4000

# 2. In a second terminal, start the frontend
cd client
npm install
npm run dev         # http://localhost:5173
```

Open `http://localhost:5173`, pick a partner, and either try a sample or upload your own
XML feed shaped like:

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

## Project structure

```
server/
  src/
    index.js               — Express app + route mounting, auto-seed on boot
    db.js                  — SQLite connection + schema bootstrap
    schema.sql              — partners / feeds / validation_results / events
    seed.js                 — demo partners + synthetic validation history
    validators/
      feedValidator.js      — XML parsing + declarative field rule engine
    routes/
      partners.js, feeds.js, analytics.js, events.js
client/
  src/
    App.jsx                 — dashboard UI, wired to the live API
    api.js                   — fetch wrapper (env-configurable API base)
sample-data/
  sample-feed-valid.xml, sample-feed-valid-2.xml, sample-feed-valid-3.xml
  sample-feed-errors.xml, sample-feed-errors-2.xml, sample-feed-errors-3.xml
```

## Deployment

Frontend deployed on **Vercel**, backend on **Render** as a standalone Express API.
The client reads the backend URL from a build-time env var (`VITE_API_URL`), so the
same codebase runs against `localhost:4000` in dev and the deployed Render URL in
production with no code changes.
