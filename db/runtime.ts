import { isNetlifyRuntime } from "./platform";

export interface GamePreparedStatement {
  bind(...values: unknown[]): GamePreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface GameDatabase {
  prepare(query: string): GamePreparedStatement;
  batch(statements: GamePreparedStatement[]): Promise<unknown>;
}

async function getD1(): Promise<GameDatabase | null> {
  if (isNetlifyRuntime()) return null;

  const moduleName = "cloudflare:workers";
  const { env } = (await import(moduleName)) as {
    env: Record<string, unknown>;
  };
  const candidate = env.DB;
  if (
    candidate &&
    typeof candidate === "object" &&
    "prepare" in candidate &&
    "batch" in candidate
  ) {
    return candidate as GameDatabase;
  }
  return null;
}

export async function ensureGameSchema() {
  const db = await getD1();
  if (!db) {
    const { getNetlifyDatabase } = await import("./netlify-runtime");
    return getNetlifyDatabase();
  }

  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, room_code TEXT NOT NULL, nickname TEXT NOT NULL, grade_band TEXT NOT NULL, session_token TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS players_room_idx ON players(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS student_access_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, code_hash TEXT NOT NULL UNIQUE, code_hint TEXT NOT NULL, student_name TEXT NOT NULL, grade_band TEXT NOT NULL, room_code TEXT NOT NULL, player_id INTEGER, is_active INTEGER NOT NULL DEFAULT 1, created_by TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS student_access_codes_room_idx ON student_access_codes(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, player_id INTEGER NOT NULL, room_code TEXT NOT NULL, grade_band TEXT NOT NULL, game_id TEXT NOT NULL, score INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS scores_room_idx ON scores(room_code)"),
    db.prepare("CREATE INDEX IF NOT EXISTS scores_player_idx ON scores(player_id)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admins (email TEXT PRIMARY KEY, display_name TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS teacher_access (room_code TEXT PRIMARY KEY, code_hash TEXT NOT NULL, code_hint TEXT NOT NULL, created_by TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS teacher_sessions (token_hash TEXT PRIMARY KEY, room_code TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS teacher_sessions_room_idx ON teacher_sessions(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admin_login_attempts (client_key TEXT PRIMARY KEY, failed_count INTEGER NOT NULL DEFAULT 0, window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, locked_until TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS player_progress (player_id INTEGER PRIMARY KEY, room_code TEXT NOT NULL, game_id TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS player_progress_room_idx ON player_progress(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS classroom_controls (room_code TEXT PRIMARY KEY, state TEXT NOT NULL DEFAULT 'waiting', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS student_presence (player_id INTEGER PRIMARY KEY, room_code TEXT NOT NULL, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS student_presence_room_idx ON student_presence(room_code)"),
    db.prepare("CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_email TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, before_value TEXT, after_value TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs(target_type, target_id)"),
  ]);
  return db;
}
