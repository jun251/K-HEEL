import { ensureGameSchema } from "../../../../db/runtime";
import { getTeacherRoom } from "../../../access";

export async function GET(request: Request) {
  try {
    const roomCode = await getTeacherRoom(request);
    if (!roomCode) return Response.json({ error: "선생님 로그인이 필요합니다." }, { status: 401 });

    const db = await ensureGameSchema();
    await db.prepare(`
      INSERT INTO classroom_controls (room_code, state)
      VALUES (?, 'waiting')
      ON CONFLICT(room_code) DO NOTHING
    `).bind(roomCode).run();

    const control = await db.prepare(`
      SELECT state, updated_at AS updatedAt
      FROM classroom_controls
      WHERE room_code = ?
      LIMIT 1
    `).bind(roomCode).first<{ state: string; updatedAt: string }>();

    const lesson = await db.prepare(`
      SELECT grade_band AS gradeBand, page, source_slide AS sourceSlide, active, updated_at AS updatedAt
      FROM lesson_controls
      WHERE room_code = ?
      LIMIT 1
    `).bind(roomCode).first<{
      gradeBand: string;
      page: number;
      sourceSlide: number;
      active: number | boolean;
      updatedAt: string;
    }>();

    const query = await db.prepare(`
      SELECT
        p.id AS playerId,
        p.nickname,
        p.grade_band AS gradeBand,
        COALESCE(pp.status,
          CASE WHEN EXISTS (SELECT 1 FROM scores sx WHERE sx.player_id = p.id)
            THEN 'completed' ELSE 'waiting' END
        ) AS status,
        pp.updated_at AS updatedAt,
        sp.last_seen_at AS lastSeenAt,
        CASE
          WHEN sp.last_seen_at >= datetime('now', '-15 seconds') THEN 1
          ELSE 0
        END AS online,
        (SELECT score FROM scores s WHERE s.player_id = p.id ORDER BY s.id DESC LIMIT 1) AS score
      FROM players p
      LEFT JOIN player_progress pp ON pp.player_id = p.id
      LEFT JOIN student_presence sp ON sp.player_id = p.id
      WHERE p.room_code = ?
      ORDER BY COALESCE(pp.updated_at, p.created_at) DESC
      LIMIT 200
    `).bind(roomCode).all<{
      playerId: number;
      nickname: string;
      gradeBand: string;
      status: string;
      updatedAt: string | null;
      lastSeenAt: string | null;
      online: number;
      score: number | null;
    }>();

    const responseQuery = lesson?.active ? await db.prepare(`
      SELECT player_id AS playerId, answer, is_correct AS isCorrect, updated_at AS updatedAt
      FROM lesson_responses
      WHERE room_code = ? AND grade_band = ? AND source_slide = ?
    `).bind(roomCode, lesson.gradeBand, lesson.sourceSlide).all<{
      playerId: number;
      answer: string;
      isCorrect: number | boolean;
      updatedAt: string;
    }>() : { results: [] };

    const responseByPlayer = new Map(responseQuery.results.map((response) => [Number(response.playerId), response]));

    return Response.json({
      roomCode,
      control: {
        state: control?.state ?? "waiting",
        updatedAt: control?.updatedAt ?? null,
      },
      lesson: lesson ? {
        gradeBand: lesson.gradeBand,
        page: Number(lesson.page),
        sourceSlide: Number(lesson.sourceSlide),
        active: Boolean(lesson.active),
        updatedAt: lesson.updatedAt,
      } : { gradeBand: "1-2", page: 1, sourceSlide: 1, active: false, updatedAt: null },
      updatedAt: new Date().toISOString(),
      students: query.results.map((student) => {
        const lessonResponse = responseByPlayer.get(Number(student.playerId));
        return {
          ...student,
          online: Boolean(student.online),
          lessonResponse: lessonResponse ? {
            answer: lessonResponse.answer,
            correct: Boolean(lessonResponse.isCorrect),
            updatedAt: lessonResponse.updatedAt,
          } : null,
        };
      }),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "현황을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
