import { ensureGameSchema } from "../../../db/runtime";

const gradeBands = new Set(["1-2", "3-4", "5-6"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { roomCode?: string; nickname?: string; gradeBand?: string };
    const roomCode = payload.roomCode?.trim() ?? "";
    const nickname = payload.nickname?.trim().replace(/[<>]/g, "") ?? "";
    const gradeBand = payload.gradeBand ?? "";
    if (!/^\d{4,6}$/.test(roomCode)) return Response.json({ error: "입장코드는 숫자 4~6자리여야 합니다." }, { status: 400 });
    if (nickname.length < 2 || nickname.length > 10) return Response.json({ error: "닉네임은 2~10글자로 입력해 주세요." }, { status: 400 });
    if (!gradeBands.has(gradeBand)) return Response.json({ error: "학년군을 선택해 주세요." }, { status: 400 });

    const db = await ensureGameSchema();
    const token = crypto.randomUUID();
    await db.prepare("INSERT OR IGNORE INTO rooms (code) VALUES (?)").bind(roomCode).run();
    await db.prepare("INSERT INTO players (room_code, nickname, grade_band, session_token) VALUES (?, ?, ?, ?)").bind(roomCode, nickname, gradeBand, token).run();
    return Response.json({ token, roomCode, nickname, gradeBand }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "입장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
