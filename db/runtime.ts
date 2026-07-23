import { env } from "cloudflare:workers";

export function getD1() {
  if (!env.DB) throw new Error("결과 저장소가 아직 연결되지 않았습니다.");
  return env.DB;
}

export async function ensureGameSchema() {
  const db = getD1();
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, room_code TEXT NOT NULL, nickname TEXT NOT NULL, grade_band TEXT NOT NULL, session_token TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS players_room_idx ON players(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, player_id INTEGER NOT NULL, room_code TEXT NOT NULL, grade_band TEXT NOT NULL, game_id TEXT NOT NULL, score INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS scores_room_idx ON scores(room_code)"),
    db.prepare("CREATE INDEX IF NOT EXISTS scores_player_idx ON scores(player_id)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admins (email TEXT PRIMARY KEY, display_name TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS teacher_access (room_code TEXT PRIMARY KEY, code_hash TEXT NOT NULL, code_hint TEXT NOT NULL, created_by TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS teacher_sessions (token_hash TEXT PRIMARY KEY, room_code TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS teacher_sessions_room_idx ON teacher_sessions(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS player_progress (player_id INTEGER PRIMARY KEY, room_code TEXT NOT NULL, game_id TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS player_progress_room_idx ON player_progress(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_email TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, before_value TEXT, after_value TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs(target_type, target_id)"),
  ]);
  return db;
}
