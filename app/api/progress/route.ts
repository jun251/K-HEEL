import { ensureGameSchema } from "../../../db/runtime";

const allowedStatuses = new Set(["in_progress", "completed"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { token?: string; gameId?: string; status?: string };
    if (!payload.token || !payload.gameId || !payload.status || !allowedStatuses.has(payload.status)) {
      return Response.json({ error: "진행 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const db = await ensureGameSchema();
    const player = await db.prepare(
      "SELECT id, room_code AS roomCode FROM players WHERE session_token = ? LIMIT 1",
    ).bind(payload.token).first<{ id: number; roomCode: string }>();
    if (!player) return Response.json({ error: "다시 입장해 주세요." }, { status: 401 });

    await db.prepare(`
      INSERT INTO player_progress (player_id, room_code, game_id, status, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(player_id) DO UPDATE SET
        room_code = excluded.room_code,
        game_id = excluded.game_id,
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `).bind(player.id, player.roomCode, payload.gameId, payload.status).run();
    return Response.json({ saved: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "진행 정보를 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
