const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const partners = db.prepare("SELECT * FROM partners ORDER BY name").all();
  res.json(partners);
});

router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const allowed = ["submitted", "validating", "qa", "live"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
  }
  db.prepare("UPDATE partners SET status = ? WHERE id = ?").run(status, req.params.id);
  db.prepare("INSERT INTO events (partner_id, message, level) VALUES (?, ?, 'pass')").run(
    req.params.id,
    `moved to stage: ${status}`
  );
  res.json({ ok: true });
});

module.exports = router;
