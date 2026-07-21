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
