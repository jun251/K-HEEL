import { ensureGameSchema } from "../../../../db/runtime";

const correctAnswers: Record<number, string> = {
  4: "water",
  17: "X",
  18: "O",
  19: "O",
  20: "X",
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { token?: string; sourceSlide?: number; answer?: string };
    const token = payload.token?.trim() ?? "";
    const sourceSlide = Math.trunc(Number(payload.sourceSlide));
    const answer = payload.answer?.trim() ?? "";
    if (!token || !answer || !correctAnswers[sourceSlide]) {
      return Response.json({ error: "응답 정보를 확인해 주세요." }, { status: 400 });
    }

    const db = await ensureGameSchema();
    const player = await db.prepare(`
      SELECT id, room_code AS roomCode, grade_band AS gradeBand
      FROM players WHERE session_token = ? LIMIT 1
    `).bind(token).first<{ id: number; roomCode: string; gradeBand: string }>();
    if (!player) return Response.json({ error: "다시 입장해 주세요." }, { status: 401 });

    const control = await db.prepare(`
      SELECT grade_band AS gradeBand, source_slide AS sourceSlide, active
      FROM lesson_controls WHERE room_code = ? LIMIT 1
    `).bind(player.roomCode).first<{ gradeBand: string; sourceSlide: number; active: number | boolean }>();
    if (!control || Number(control.active) !== 1 || control.gradeBand !== player.gradeBand || Number(control.sourceSlide) !== sourceSlide) {
      return Response.json({ error: "현재 진행 중인 문제가 아닙니다." }, { status: 409 });
    }

    const isCorrect = correctAnswers[sourceSlide] === answer;
    await db.prepare(`
      INSERT INTO lesson_responses (player_id, room_code, grade_band, source_slide, answer, is_correct, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(player_id, source_slide) DO UPDATE SET
        answer = excluded.answer,
        is_correct = excluded.is_correct,
        updated_at = CURRENT_TIMESTAMP
    `).bind(player.id, player.roomCode, player.gradeBand, sourceSlide, answer, isCorrect ? 1 : 0).run();

    return Response.json({ sourceSlide, answer, correct: isCorrect, updatedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "응답을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
