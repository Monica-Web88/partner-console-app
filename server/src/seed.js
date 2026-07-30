const db = require("./db");

const partners = [
  { id: "acme", name: "Acme Media Networks", channels: 12, status: "validating" },
  { id: "harbor", name: "Harbor Sports Group", channels: 4, status: "live" },
  { id: "westline", name: "Westline Broadcasting", channels: 7, status: "qa" },
];

const insertPartner = db.prepare(
  "INSERT OR IGNORE INTO partners (id, name, channels, status) VALUES (@id, @name, @channels, @status)"
);
partners.forEach((p) => insertPartner.run(p));

// Only seed history once
const feedCount = db.prepare("SELECT COUNT(*) AS n FROM feeds").get().n;
if (feedCount === 0) {
  const insertFeed = db.prepare(
    "INSERT INTO feeds (partner_id, filename, submitted_at) VALUES (?, ?, datetime('now', ?))"
  );
  const insertResult = db.prepare(
    "INSERT INTO validation_results (feed_id, field, type, value, status, note) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertEvent = db.prepare(
    "INSERT INTO events (partner_id, message, level, created_at) VALUES (?, ?, ?, datetime('now', ?))"
  );

  // Synthetic 7-day history so /api/analytics/failing-fields has real signal
  const fieldFailures = [
    ["ratingSystem", 18],
    ["streamUri", 14],
    ["closedCaptionUrl", 9],
    ["durationSeconds", 6],
    ["genreTag", 4],
  ];

  const seedTx = db.transaction(() => {
    let dayOffset = 6;
    for (const [field, count] of fieldFailures) {
      for (let i = 0; i < count; i++) {
        const partner = partners[i % partners.length];
        const offsetStr = `-${dayOffset} days`;
        const feedId = insertFeed.run(partner.id, `historical-${field}-${i}.xml`, offsetStr).lastInsertRowid;
        insertResult.run(feedId, field, "field", "—", "fail", "seeded historical failure");
        dayOffset = dayOffset > 0 ? dayOffset - 1 : 6;
      }
    }

    insertEvent.run("acme", "feed #4021 validated — 0 blocking errors", "pass", "-2 hours");
    insertEvent.run("westline", "flagged: missing <ratingSystem> on 18 items", "fail", "-5 hours");
    insertEvent.run("harbor", "channel HRB-04 promoted to Live", "pass", "-1 days");
    insertEvent.run("acme", "streamUri unreachable — retry scheduled", "warn", "-30 minutes");
    insertEvent.run("westline", "QA review started by ops-team", "warn", "-3 hours");
  });
  seedTx();

  console.log("Seeded partners, historical feeds, and events.");
} else {
  console.log("Feeds already present — skipping history seed (partners upserted).");
}
