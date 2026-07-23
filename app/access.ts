import { ensureGameSchema } from "../db/runtime";
import { getChatGPTUser } from "./chatgpt-auth";

export async function hashSecret(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  if (!user) return null;

  const db = await ensureGameSchema();
  const count = await db.prepare("SELECT COUNT(*) AS count FROM admins").first<{ count: number }>();
  if (!count?.count) {
    await db.prepare("INSERT OR IGNORE INTO admins (email, display_name) VALUES (?, ?)")
      .bind(user.email.toLowerCase(), user.displayName)
      .run();
  }

  const admin = await db.prepare("SELECT email FROM admins WHERE email = ? LIMIT 1")
    .bind(user.email.toLowerCase())
    .first<{ email: string }>();
  return admin ? user : null;
}

export function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  const prefix = `${name}=`;
  for (const part of cookies.split(";")) {
    const value = part.trim();
    if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
  }
  return null;
}

export async function getTeacherRoom(request: Request) {
  const token = readCookie(request, "kheel_teacher");
  if (!token) return null;
  const db = await ensureGameSchema();
  const tokenHash = await hashSecret(token);
  const session = await db.prepare(
    "SELECT room_code AS roomCode FROM teacher_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
  ).bind(tokenHash).first<{ roomCode: string }>();
  return session?.roomCode ?? null;
}
