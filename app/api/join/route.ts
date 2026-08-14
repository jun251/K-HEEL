import { ensureGameSchema } from "../../../db/runtime";
import { hashSecret } from "../../access";

const gradeBands = new Set(["1-2", "3-4", "5-6"]);
const testCodes = {
  TEST12: "1-2",
  TEST34: "3-4",
  TEST56: "5-6",
} as const;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { code?: string };
    const code = payload.code?.trim().toUpperCase() ?? "";
    if (!/^[A-Z0-9-]{4,20}$/.test(code)) {
      return Response.json({ error: "학생 코드를 정확히 입력해 주세요." }, { status: 400 });
    }

    const testGrade = testCodes[code as keyof typeof testCodes];
    if (testGrade) {
      return Response.json({
        token: `demo-${testGrade}-${crypto.randomUUID()}`,
        roomCode: "DEMO",
        nickname: "테스트 플레이어",
        gradeBand: testGrade,
        demo: true,
      });
    }

    const db = await ensureGameSchema();
    const codeHash = await hashSecret(code);
    const access = await db.prepare(`
      SELECT
        sac.id,
        sac.student_name AS nickname,
        sac.grade_band AS gradeBand,
        sac.room_code AS roomCode,
        p.id AS playerId
      FROM student_access_codes sac
      LEFT JOIN players p ON p.id = sac.player_id
      WHERE sac.code_hash = ? AND sac.is_active = 1
      LIMIT 1
    `).bind(codeHash).first<{
      id: number;
      nickname: string;
      gradeBand: string;
      roomCode: string;
      playerId: number | null;
    }>();

    if (!access || !gradeBands.has(access.gradeBand)) {
      return Response.json({ error: "등록되지 않았거나 사용할 수 없는 학생 코드예요." }, { status: 404 });
    }

    const token = crypto.randomUUID();
    await db.prepare("INSERT OR IGNORE INTO rooms (code) VALUES (?)").bind(access.roomCode).run();

    if (access.playerId) {
      await db.prepare(`
        UPDATE players
        SET room_code = ?, nickname = ?, grade_band = ?, session_token = ?
        WHERE id = ?
      `).bind(access.roomCode, access.nickname, access.gradeBand, token, access.playerId).run();
    } else {
      const player = await db.prepare(`
        INSERT INTO players (room_code, nickname, grade_band, session_token)
        VALUES (?, ?, ?, ?)
        RETURNING id
      `).bind(access.roomCode, access.nickname, access.gradeBand, token).first<{ id: number }>();
      if (!player) throw new Error("학생 정보를 만들지 못했습니다.");
      await db.prepare(`
        UPDATE student_access_codes
        SET player_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(player.id, access.id).run();
    }

    return Response.json({
      token,
      roomCode: access.roomCode,
      nickname: access.nickname,
      gradeBand: access.gradeBand,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "입장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
