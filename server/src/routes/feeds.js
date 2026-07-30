const express = require("express");
const db = require("../db");
const { validateFeed } = require("../validators/feedValidator");

const router = express.Router();

// POST /api/feeds/validate  { partnerId, filename, xml, checkUrls? }
router.post("/validate", async (req, res) => {
  const { partnerId, filename, xml, checkUrls } = req.body;
  if (!partnerId || !xml) {
    return res.status(400).json({ error: "partnerId and xml are required" });
  }

  const partner = db.prepare("SELECT * FROM partners WHERE id = ?").get(partnerId);
  if (!partner) return res.status(404).json({ error: `unknown partner: ${partnerId}` });

  const { results, parseError } = await validateFeed(xml, { checkUrls: !!checkUrls });

  if (parseError) {
    db.prepare("INSERT INTO events (partner_id, message, level) VALUES (?, ?, 'fail')").run(
      partnerId,
      `feed rejected — ${parseError}`
    );
    return res.status(422).json({ error: parseError });
  }

  const insertFeed = db.prepare(
    "INSERT INTO feeds (partner_id, filename) VALUES (?, ?)"
  );
  const feedInfo = insertFeed.run(partnerId, filename || "uploaded-feed.xml");
  const feedId = feedInfo.lastInsertRowid;

  const insertResult = db.prepare(
    "INSERT INTO validation_results (feed_id, field, type, value, status, note) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertMany = db.transaction((rows) => {
    for (const r of rows) insertResult.run(feedId, r.field, r.type, r.value, r.status, r.note);
  });
  insertMany(results);

  const failCount = results.filter((r) => r.status === "fail").length;
  const level = failCount > 0 ? "fail" : results.some((r) => r.status === "warn") ? "warn" : "pass";
  const summary =
    failCount > 0
      ? `feed #${feedId} flagged — ${failCount} blocking error${failCount > 1 ? "s" : ""}`
      : `feed #${feedId} validated — 0 blocking errors`;
  db.prepare("INSERT INTO events (partner_id, message, level) VALUES (?, ?, ?)").run(partnerId, summary, level);

  res.json({ feedId, partnerId, results });
});

// GET /api/feeds/:partnerId/latest
router.get("/:partnerId/latest", (req, res) => {
  const feed = db
    .prepare("SELECT * FROM feeds WHERE partner_id = ? ORDER BY submitted_at DESC, id DESC LIMIT 1")
    .get(req.params.partnerId);
  if (!feed) return res.json({ feed: null, results: [] });

  const results = db.prepare("SELECT * FROM validation_results WHERE feed_id = ?").all(feed.id);
  res.json({ feed, results });
});

module.exports = router;
