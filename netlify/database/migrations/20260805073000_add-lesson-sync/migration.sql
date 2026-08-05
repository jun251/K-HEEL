CREATE TABLE IF NOT EXISTS lesson_controls (
  room_code TEXT PRIMARY KEY,
  grade_band TEXT NOT NULL DEFAULT '1-2',
  page INTEGER NOT NULL DEFAULT 1,
  source_slide INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_responses (
  player_id INTEGER NOT NULL,
  room_code TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  source_slide INTEGER NOT NULL,
  answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, source_slide)
);

CREATE INDEX IF NOT EXISTS lesson_responses_room_slide_idx
  ON lesson_responses(room_code, grade_band, source_slide);
