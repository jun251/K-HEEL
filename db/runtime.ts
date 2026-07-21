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
  ]);
  return db;
}
