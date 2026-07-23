import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("rooms_code_unique").on(table.code)]);

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomCode: text("room_code").notNull(),
  nickname: text("nickname").notNull(),
  gradeBand: text("grade_band").notNull(),
  sessionToken: text("session_token").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("players_token_unique").on(table.sessionToken), index("players_room_idx").on(table.roomCode)]);

export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull(),
  roomCode: text("room_code").notNull(),
  gradeBand: text("grade_band").notNull(),
  gameId: text("game_id").notNull(),
  score: integer("score").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("scores_room_idx").on(table.roomCode), index("scores_player_idx").on(table.playerId)]);

export const admins = sqliteTable("admins", {
  email: text("email").primaryKey(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const teacherAccess = sqliteTable("teacher_access", {
  roomCode: text("room_code").primaryKey(),
  codeHash: text("code_hash").notNull(),
  codeHint: text("code_hint").notNull(),
  createdBy: text("created_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const teacherSessions = sqliteTable("teacher_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  roomCode: text("room_code").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teacher_sessions_room_idx").on(table.roomCode)]);

export const adminSessions = sqliteTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminLoginAttempts = sqliteTable("admin_login_attempts", {
  clientKey: text("client_key").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  windowStartedAt: text("window_started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lockedUntil: text("locked_until"),
});

export const playerProgress = sqliteTable("player_progress", {
  playerId: integer("player_id").primaryKey(),
  roomCode: text("room_code").notNull(),
  gameId: text("game_id").notNull(),
  status: text("status").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("player_progress_room_idx").on(table.roomCode)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  beforeValue: text("before_value"),
  afterValue: text("after_value"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("audit_logs_target_idx").on(table.targetType, table.targetId)]);
