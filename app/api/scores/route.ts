import { ensureGameSchema } from "../../../db/runtime";

export async function GET(request: Request) {
  try {
    const roomCode = new URL(request.url).searchParams.get("roomCode")?.trim() ?? "";
    if (!/^\d{4,6}$/.test(roomCode)) return Response.json({ results: [] });
    const db = await ensureGameSchema();
    const query = await db.prepare(`SELECT nickname, grade_band AS gradeBand, score, remaining_budget AS remainingBudget
      FROM (
        SELECT p.nickname, s.grade_band, s.score, s.remaining_budget,
          ROW_NUMBER() OVER (
            PARTITION BY s.player_id
            ORDER BY s.score DESC, s.remaining_budget DESC, s.id DESC
          ) AS player_rank
        FROM scores s JOIN players p ON p.id = s.player_id
        WHERE s.room_code = ?
      ) ranked
      WHERE player_rank = 1
      ORDER BY score DESC, remaining_budget DESC, nickname ASC LIMIT 20`).bind(roomCode).all<{
        nickname: string;
        gradeBand: string;
        score: number;
        remainingBudget: number;
      }>();
    const results = query.results.map(
      (item: { nickname: string; gradeBand: string; score: number; remainingBudget: number }, index: number) => ({
        ...item,
        rank: index + 1,
      }),
    );
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "결과를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      token?: string;
      roomCode?: string;
      gradeBand?: string;
      gameId?: string;
      score?: number;
      remainingBudget?: number;
    };
    const score = Math.max(0, Math.min(100, Math.round(Number(payload.score))));
    const remainingBudget = Math.max(0, Math.min(15000, Math.round(Number(payload.remainingBudget ?? 0))));
    if (!payload.token || !payload.roomCode || !payload.gameId || !Number.isFinite(score)) return Response.json({ error: "점수 정보가 올바르지 않습니다." }, { status: 400 });
    const db = await ensureGameSchema();
    const player = await db.prepare("SELECT id, room_code AS roomCode, grade_band AS gradeBand FROM players WHERE session_token = ? LIMIT 1").bind(payload.token).first<{ id: number; roomCode: string; gradeBand: string }>();
    if (!player || player.roomCode !== payload.roomCode) return Response.json({ error: "다시 입장해 주세요." }, { status: 401 });
    const control = await db.prepare(
      "SELECT state FROM classroom_controls WHERE room_code = ? LIMIT 1",
    ).bind(player.roomCode).first<{ state: string }>();
    if (control?.state === "paused" || control?.state === "ended") {
      return Response.json({ error: "선생님이 수업을 다시 시작하면 결과를 저장할 수 있어요." }, { status: 409 });
    }
    await db.batch([
      db.prepare("INSERT INTO scores (player_id, room_code, grade_band, game_id, score, remaining_budget) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(player.id, player.roomCode, player.gradeBand, payload.gameId, score, player.gradeBand === "3-4" ? remainingBudget : 0),
      db.prepare(`
        INSERT INTO player_progress (player_id, room_code, game_id, status, updated_at)
        VALUES (?, ?, ?, 'completed', CURRENT_TIMESTAMP)
        ON CONFLICT(player_id) DO UPDATE SET
          room_code = excluded.room_code,
          game_id = excluded.game_id,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      `).bind(player.id, player.roomCode, payload.gameId),
    ]);
    return Response.json({ saved: true, score }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "점수를 저장하지 못했습니다." }, { status: 500 });
  }
}
