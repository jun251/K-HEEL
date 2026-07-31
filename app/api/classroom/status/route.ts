import { ensureGameSchema } from "../../../../db/runtime";

type ClassroomState = "waiting" | "active" | "paused" | "ended";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return Response.json({ error: "학생 인증이 필요합니다." }, { status: 401 });

    const db = await ensureGameSchema();
    const player = await db.prepare(`
      SELECT id, room_code AS roomCode
      FROM players
      WHERE session_token = ?
      LIMIT 1
    `).bind(token).first<{ id: number; roomCode: string }>();
    if (!player) return Response.json({ error: "다시 입장해 주세요." }, { status: 401 });

    await db.batch([
      db.prepare(`
        INSERT INTO classroom_controls (room_code, state)
        VALUES (?, 'waiting')
        ON CONFLICT(room_code) DO NOTHING
      `).bind(player.roomCode),
      db.prepare(`
        INSERT INTO student_presence (player_id, room_code, last_seen_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(player_id) DO UPDATE SET
          room_code = excluded.room_code,
          last_seen_at = CURRENT_TIMESTAMP
      `).bind(player.id, player.roomCode),
    ]);

    const control = await db.prepare(`
      SELECT state, updated_at AS updatedAt
      FROM classroom_controls
      WHERE room_code = ?
      LIMIT 1
    `).bind(player.roomCode).first<{ state: ClassroomState; updatedAt: string }>();

    return Response.json({
      state: control?.state ?? "waiting",
      updatedAt: control?.updatedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "수업 상태를 확인하지 못했습니다." },
      { status: 500 },
    );
  }
}
