CREATE TABLE IF NOT EXISTS student_access_codes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  code_hint TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  room_code TEXT NOT NULL,
  player_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS student_access_codes_room_idx
  ON student_access_codes(room_code);

CREATE TABLE IF NOT EXISTS classroom_controls (
  room_code TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'waiting',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_presence (
  player_id INTEGER PRIMARY KEY,
  room_code TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS student_presence_room_idx
  ON student_presence(room_code);
