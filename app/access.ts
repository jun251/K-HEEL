import { ensureGameSchema } from "../db/runtime";
import { headers } from "next/headers";

export async function hashSecret(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validateAdminToken(token: string | null) {
  if (!token) return null;
  const db = await ensureGameSchema();
  const tokenHash = await hashSecret(token);
  const session = await db.prepare(
    "SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
  ).bind(tokenHash).first<{ tokenHash: string }>();
  return session ? { email: "password-admin", displayName: "관리자" } : null;
}

export async function requireAdminApi(request: Request) {
  return validateAdminToken(readCookie(request, "kheel_admin"));
}

export async function requireAdminPage() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? "";
  return validateAdminToken(readCookieHeader(cookieHeader, "kheel_admin"));
}

export function readCookie(request: Request, name: string) {
  return readCookieHeader(request.headers.get("cookie") ?? "", name);
}

function readCookieHeader(cookies: string, name: string) {
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
