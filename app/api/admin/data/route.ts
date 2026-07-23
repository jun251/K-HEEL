import { ensureGameSchema } from "../../../../db/runtime";
import { requireAdminApi } from "../../../access";

const allowedStatuses = new Set(["waiting", "in_progress", "completed"]);

export async function GET() {
  try {
    const user = await requireAdminApi();
    if (!user) return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    const db = await ensureGameSchema();

    const [rooms, students] = await Promise.all([
      db.prepare(`
        SELECT r.code,
          COUNT(DISTINCT p.id) AS studentCount,
          ta.code_hint AS teacherCodeHint,
          ta.updated_at AS teacherCodeUpdatedAt
        FROM rooms r
        LEFT JOIN players p ON p.room_code = r.code
        LEFT JOIN teacher_access ta ON ta.room_code = r.code
        GROUP BY r.code, ta.code_hint, ta.updated_at
        ORDER BY r.created_at DESC
      `).all<{
        code: string;
        studentCount: number;
        teacherCodeHint: string | null;
        teacherCodeUpdatedAt: string | null;
      }>(),
      db.prepare(`
        SELECT
          p.id AS playerId,
          p.nickname,
          p.room_code AS roomCode,
          p.grade_band AS gradeBand,
          p.created_at AS joinedAt,
          COALESCE(pp.status,
            CASE WHEN EXISTS (SELECT 1 FROM scores sx WHERE sx.player_id = p.id)
              THEN 'completed' ELSE 'waiting' END
          ) AS status,
          pp.updated_at AS updatedAt,
          (SELECT score FROM scores s WHERE s.player_id = p.id ORDER BY s.id DESC LIMIT 1) AS score
        FROM players p
        LEFT JOIN player_progress pp ON pp.player_id = p.id
        ORDER BY p.id DESC
        LIMIT 300
      `).all<{
        playerId: number;
        nickname: string;
        roomCode: string;
        gradeBand: string;
        joinedAt: string;
        status: string;
        updatedAt: string | null;
        score: number | null;
      }>(),
    ]);

    return Response.json({ admin: user.displayName, rooms: rooms.results, students: students.results });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "관리자 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdminApi();
    if (!user) return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    const payload = (await request.json()) as { playerId?: number; score?: number | null; status?: string };
    const playerId = Number(payload.playerId);
    if (!Number.isInteger(playerId) || playerId < 1) {
      return Response.json({ error: "학생 정보가 올바르지 않습니다." }, { status: 400 });
    }
    if (payload.status && !allowedStatuses.has(payload.status)) {
      return Response.json({ error: "상태 값이 올바르지 않습니다." }, { status: 400 });
    }

    const db = await ensureGameSchema();
    const player = await db.prepare(
      "SELECT id, room_code AS roomCode, grade_band AS gradeBand FROM players WHERE id = ? LIMIT 1",
    ).bind(playerId).first<{ id: number; roomCode: string; gradeBand: string }>();
    if (!player) return Response.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });

    const before = await db.prepare(`
      SELECT
        COALESCE((SELECT status FROM player_progress WHERE player_id = ?), 'waiting') AS status,
        (SELECT score FROM scores WHERE player_id = ? ORDER BY id DESC LIMIT 1) AS score
    `).bind(playerId, playerId).first<{ status: string; score: number | null }>();

    if (payload.score !== undefined && payload.score !== null) {
      const score = Math.max(0, Math.min(100, Math.round(Number(payload.score))));
      if (!Number.isFinite(score)) return Response.json({ error: "점수를 확인해 주세요." }, { status: 400 });
      const latest = await db.prepare("SELECT id FROM scores WHERE player_id = ? ORDER BY id DESC LIMIT 1")
        .bind(playerId)
        .first<{ id: number }>();
      if (latest) {
        await db.prepare("UPDATE scores SET score = ? WHERE id = ?").bind(score, latest.id).run();
      } else {
        await db.prepare(
          "INSERT INTO scores (player_id, room_code, grade_band, game_id, score) VALUES (?, ?, ?, ?, ?)",
        ).bind(playerId, player.roomCode, player.gradeBand, `game-${player.gradeBand}`, score).run();
      }
    }

    if (payload.status) {
      await db.prepare(`
        INSERT INTO player_progress (player_id, room_code, game_id, status, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(player_id) DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
      `).bind(playerId, player.roomCode, `game-${player.gradeBand}`, payload.status).run();
    }

    const after = {
      status: payload.status ?? before?.status ?? "waiting",
      score: payload.score ?? before?.score ?? null,
    };
    await db.prepare(`
      INSERT INTO audit_logs (actor_email, action, target_type, target_id, before_value, after_value)
      VALUES (?, 'student_update', 'player', ?, ?, ?)
    `).bind(user.email, String(playerId), JSON.stringify(before ?? null), JSON.stringify(after)).run();

    return Response.json({ saved: true, ...after });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "학생 정보를 수정하지 못했습니다." },
      { status: 500 },
    );
  }
}
