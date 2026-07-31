import { ensureGameSchema } from "../../../../db/runtime";
import { getTeacherRoom } from "../../../access";

const allowedStates = new Set(["waiting", "active", "paused", "ended"]);

export async function POST(request: Request) {
  try {
    const roomCode = await getTeacherRoom(request);
    if (!roomCode) return Response.json({ error: "선생님 로그인이 필요합니다." }, { status: 401 });

    const payload = (await request.json()) as { state?: string };
    const state = payload.state ?? "";
    if (!allowedStates.has(state)) {
      return Response.json({ error: "올바르지 않은 수업 상태입니다." }, { status: 400 });
    }

    const db = await ensureGameSchema();
    const previous = await db.prepare(`
      SELECT state FROM classroom_controls WHERE room_code = ? LIMIT 1
    `).bind(roomCode).first<{ state: string }>();

    await db.batch([
      db.prepare(`
        INSERT INTO classroom_controls (room_code, state, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(room_code) DO UPDATE SET
          state = excluded.state,
          updated_at = CURRENT_TIMESTAMP
      `).bind(roomCode, state),
      db.prepare(`
        INSERT INTO audit_logs (actor_email, action, target_type, target_id, before_value, after_value)
        VALUES (?, 'classroom_control', 'room', ?, ?, ?)
      `).bind(`teacher:${roomCode}`, roomCode, previous?.state ?? null, state),
    ]);

    return Response.json({ roomCode, state, updatedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "학생 화면을 제어하지 못했습니다." },
      { status: 500 },
    );
  }
}
