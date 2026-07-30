const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/analytics/failing-fields?days=7
router.get("/failing-fields", (req, res) => {
  const days = Number(req.query.days || 7);
  const rows = db
    .prepare(
      `SELECT vr.field AS field, COUNT(*) AS count
       FROM validation_results vr
       JOIN feeds f ON f.id = vr.feed_id
       WHERE vr.status = 'fail'
         AND f.submitted_at > datetime('now', ?)
       GROUP BY vr.field
       ORDER BY count DESC
       LIMIT 5`
    )
    .all(`-${days} days`);
  res.json({ days, rows, sql: FAILING_FIELDS_SQL(days) });
});

// GET /api/analytics/summary
router.get("/summary", (req, res) => {
  const totals = db
    .prepare(
      `SELECT status, COUNT(*) AS count FROM validation_results GROUP BY status`
    )
    .all();
  const feedCount = db.prepare("SELECT COUNT(*) AS n FROM feeds").get().n;
  res.json({ totals, feedCount });
});

function FAILING_FIELDS_SQL(days) {
  return `SELECT field, COUNT(*) AS failures
FROM validation_results
WHERE status = 'fail'
  AND submitted_at > now() - interval '${days} days'
GROUP BY field
ORDER BY failures DESC
LIMIT 5;`;
}

module.exports = router;
