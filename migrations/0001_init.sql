CREATE TABLE IF NOT EXISTS feedback_metrics (
  id TEXT PRIMARY KEY,
  total INTEGER NOT NULL,
  critical INTEGER NOT NULL,
  resolved INTEGER NOT NULL,
  avg_response_time TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
