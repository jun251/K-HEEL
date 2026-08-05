import { ensureGameSchema } from "../../../../db/runtime";
import { getTeacherRoom } from "../../../access";
import { getLessonSourceSlide, isLessonGrade, lessons } from "../../../materials/lesson/lesson-data";

export async function POST(request: Request) {
  try {
    const roomCode = await getTeacherRoom(request);
    if (!roomCode) return Response.json({ error: "선생님 로그인이 필요합니다." }, { status: 401 });

    const payload = (await request.json()) as { gradeBand?: string; page?: number; active?: boolean };
    if (!payload.gradeBand || !isLessonGrade(payload.gradeBand)) {
      return Response.json({ error: "올바른 학년군을 선택해 주세요." }, { status: 400 });
    }

    const page = Math.trunc(Number(payload.page ?? 1));
    if (page < 1 || page > lessons[payload.gradeBand].slideCount) {
      return Response.json({ error: "올바른 교육자료 페이지가 아닙니다." }, { status: 400 });
    }

    const active = payload.active === true;
    const sourceSlide = getLessonSourceSlide(payload.gradeBand, page);
    const db = await ensureGameSchema();
    await db.batch([
      db.prepare(`
        INSERT INTO lesson_controls (room_code, grade_band, page, source_slide, active, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(room_code) DO UPDATE SET
          grade_band = excluded.grade_band,
          page = excluded.page,
          source_slide = excluded.source_slide,
          active = excluded.active,
          updated_at = CURRENT_TIMESTAMP
      `).bind(roomCode, payload.gradeBand, page, sourceSlide, active ? 1 : 0),
      ...(active ? [db.prepare(`
        INSERT INTO classroom_controls (room_code, state, updated_at)
        VALUES (?, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT(room_code) DO UPDATE SET state = 'active', updated_at = CURRENT_TIMESTAMP
      `).bind(roomCode)] : []),
      db.prepare(`
        INSERT INTO audit_logs (actor_email, action, target_type, target_id, after_value)
        VALUES (?, 'lesson_control', 'room', ?, ?)
      `).bind(`teacher:${roomCode}`, roomCode, JSON.stringify({ gradeBand: payload.gradeBand, page, sourceSlide, active })),
    ]);

    return Response.json({ roomCode, gradeBand: payload.gradeBand, page, sourceSlide, active, updatedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "교육자료 화면을 제어하지 못했습니다." },
      { status: 500 },
    );
  }
}

