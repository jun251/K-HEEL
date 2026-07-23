import { ensureGameSchema } from "../../../../db/runtime";
import { hashSecret } from "../../../access";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { code?: string };
    const code = payload.code?.trim().toUpperCase() ?? "";
    if (!/^[A-Z0-9-]{6,16}$/.test(code)) {
      return Response.json({ error: "선생님 코드를 확인해 주세요." }, { status: 400 });
    }

    const db = await ensureGameSchema();
    const codeHash = await hashSecret(code);
    const access = await db.prepare(
      "SELECT room_code AS roomCode FROM teacher_access WHERE code_hash = ? LIMIT 1",
    ).bind(codeHash).first<{ roomCode: string }>();
    if (!access) return Response.json({ error: "유효하지 않은 선생님 코드입니다." }, { status: 401 });

    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await hashSecret(token);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await db.batch([
      db.prepare("DELETE FROM teacher_sessions WHERE expires_at <= CURRENT_TIMESTAMP"),
      db.prepare("INSERT INTO teacher_sessions (token_hash, room_code, expires_at) VALUES (?, ?, ?)")
        .bind(tokenHash, access.roomCode, expiresAt),
    ]);

    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return Response.json(
      { roomCode: access.roomCode },
      {
        headers: {
          "Set-Cookie": `kheel_teacher=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`,
        },
      },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "로그인할 수 없습니다." },
      { status: 500 },
    );
  }
}
