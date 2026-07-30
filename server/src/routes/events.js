const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/events/recent?limit=20
router.get("/recent", (req, res) => {
  const limit = Number(req.query.limit || 20);
  const rows = db
    .prepare(
      `SELECT e.*, p.name AS partner_name
       FROM events e
       JOIN partners p ON p.id = e.partner_id
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT ?`
    )
    .all(limit);
  res.json(rows);
});

module.exports = router;
