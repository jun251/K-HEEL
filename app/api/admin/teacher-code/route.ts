import { ensureGameSchema } from "../../../../db/runtime";
import { hashSecret, requireAdminApi } from "../../../access";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createTeacherCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `T-${body.slice(0, 4)}-${body.slice(4)}`;
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminApi();
    if (!user) return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    const payload = (await request.json()) as { roomCode?: string };
    const roomCode = payload.roomCode?.trim() ?? "";
    if (!/^\d{4,6}$/.test(roomCode)) {
      return Response.json({ error: "수업 코드는 숫자 4~6자리여야 합니다." }, { status: 400 });
    }

    const db = await ensureGameSchema();
    const code = createTeacherCode();
    const codeHash = await hashSecret(code);
    const hint = `${code.slice(0, 4)}••••`;
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO rooms (code) VALUES (?)").bind(roomCode),
      db.prepare(`
        INSERT INTO teacher_access (room_code, code_hash, code_hint, created_by, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(room_code) DO UPDATE SET
          code_hash = excluded.code_hash,
          code_hint = excluded.code_hint,
          created_by = excluded.created_by,
          updated_at = CURRENT_TIMESTAMP
      `).bind(roomCode, codeHash, hint, user.email),
      db.prepare(`
        INSERT INTO audit_logs (actor_email, action, target_type, target_id, after_value)
        VALUES (?, 'teacher_code_issued', 'room', ?, ?)
      `).bind(user.email, roomCode, JSON.stringify({ hint })),
    ]);

    return Response.json({ roomCode, code });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "선생님 코드를 만들지 못했습니다." },
      { status: 500 },
    );
  }
}
