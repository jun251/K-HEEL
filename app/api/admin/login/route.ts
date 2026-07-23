import { env } from "cloudflare:workers";
import { ensureGameSchema } from "../../../../db/runtime";
import { hashSecret } from "../../../access";

function configuredPassword() {
  return (env as unknown as Record<string, unknown>).ADMIN_PASSWORD;
}

export async function POST(request: Request) {
  try {
    const db = await ensureGameSchema();
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
    const clientKey = await hashSecret(ip.split(",")[0].trim());
    const attempt = await db.prepare(`
      SELECT failed_count AS failedCount, window_started_at AS windowStartedAt, locked_until AS lockedUntil
      FROM admin_login_attempts WHERE client_key = ? LIMIT 1
    `).bind(clientKey).first<{ failedCount: number; windowStartedAt: string; lockedUntil: string | null }>();

    if (attempt?.lockedUntil && new Date(attempt.lockedUntil).getTime() > Date.now()) {
      return Response.json({ error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요." }, { status: 429 });
    }

    const payload = (await request.json()) as { password?: string };
    const supplied = payload.password ?? "";
    const expected = configuredPassword();
    if (typeof expected !== "string" || expected.length < 8) {
      return Response.json({ error: "관리자 비밀번호가 아직 설정되지 않았습니다." }, { status: 503 });
    }

    const [suppliedHash, expectedHash] = await Promise.all([hashSecret(supplied), hashSecret(expected)]);
    if (suppliedHash !== expectedHash) {
      const withinWindow = attempt
        && Date.now() - new Date(attempt.windowStartedAt).getTime() < 15 * 60 * 1000;
      const failedCount = withinWindow ? attempt.failedCount + 1 : 1;
      const lockedUntil = failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      await db.prepare(`
        INSERT INTO admin_login_attempts (client_key, failed_count, window_started_at, locked_until)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(client_key) DO UPDATE SET
          failed_count = excluded.failed_count,
          window_started_at = CASE WHEN ? THEN admin_login_attempts.window_started_at ELSE CURRENT_TIMESTAMP END,
          locked_until = excluded.locked_until
      `).bind(clientKey, failedCount, lockedUntil, withinWindow ? 1 : 0).run();
      return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await hashSecret(`${token}|${expected}`);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await db.batch([
      db.prepare("DELETE FROM admin_login_attempts WHERE client_key = ?").bind(clientKey),
      db.prepare("DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP"),
      db.prepare("INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)").bind(tokenHash, expiresAt),
    ]);

    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return Response.json(
      { authenticated: true },
      {
        headers: {
          "Set-Cookie": `kheel_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`,
        },
      },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "관리자 로그인을 처리하지 못했습니다." },
      { status: 500 },
    );
  }
}
