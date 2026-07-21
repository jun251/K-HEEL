import { ensureGameSchema } from "../../../db/runtime";

export async function GET(request: Request) {
  try {
    const roomCode = new URL(request.url).searchParams.get("roomCode")?.trim() ?? "";
    if (!/^\d{4,6}$/.test(roomCode)) return Response.json({ results: [] });
    const db = await ensureGameSchema();
    const query = await db.prepare(`SELECT p.nickname, s.grade_band AS gradeBand, MAX(s.score) AS score
      FROM scores s JOIN players p ON p.id = s.player_id
      WHERE s.room_code = ? GROUP BY s.player_id, p.nickname, s.grade_band
      ORDER BY score DESC, p.nickname ASC LIMIT 20`).bind(roomCode).all<{ nickname: string; gradeBand: string; score: number }>();
    const results = query.results.map((item, index) => ({ ...item, rank: index + 1 }));
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "결과를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { token?: string; roomCode?: string; gradeBand?: string; gameId?: string; score?: number };
    const score = Math.max(0, Math.min(100, Math.round(Number(payload.score))));
    if (!payload.token || !payload.roomCode || !payload.gameId || !Number.isFinite(score)) return Response.json({ error: "점수 정보가 올바르지 않습니다." }, { status: 400 });
    const db = await ensureGameSchema();
    const player = await db.prepare("SELECT id, room_code AS roomCode, grade_band AS gradeBand FROM players WHERE session_token = ? LIMIT 1").bind(payload.token).first<{ id: number; roomCode: string; gradeBand: string }>();
    if (!player || player.roomCode !== payload.roomCode) return Response.json({ error: "다시 입장해 주세요." }, { status: 401 });
    await db.prepare("INSERT INTO scores (player_id, room_code, grade_band, game_id, score) VALUES (?, ?, ?, ?, ?)").bind(player.id, player.roomCode, player.gradeBand, payload.gameId, score).run();
    return Response.json({ saved: true, score }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "점수를 저장하지 못했습니다." }, { status: 500 });
  }
}
