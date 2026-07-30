const express = require("express");
const cors = require("cors");

// Idempotent: upserts demo partners, only seeds history the first time
// (feeds table empty check). Safe to run on every boot, including
// every Render restart/redeploy.
require("./seed");

const partnersRoute = require("./routes/partners");
const feedsRoute = require("./routes/feeds");
const analyticsRoute = require("./routes/analytics");
const eventsRoute = require("./routes/events");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/partners", partnersRoute);
app.use("/api/feeds", feedsRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/events", eventsRoute);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Partner Ingestion Console API listening on http://localhost:${PORT}`);
});
