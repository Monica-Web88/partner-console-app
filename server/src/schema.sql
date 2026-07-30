CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channels INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted'
);

CREATE TABLE IF NOT EXISTS feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  filename TEXT,
  schema_version TEXT DEFAULT 'v3.2',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS validation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER NOT NULL REFERENCES feeds(id),
  field TEXT NOT NULL,
  type TEXT,
  value TEXT,
  status TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail')),
  note TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id TEXT REFERENCES partners(id),
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'pass',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_results_feed ON validation_results(feed_id);
CREATE INDEX IF NOT EXISTS idx_feeds_partner ON feeds(partner_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
