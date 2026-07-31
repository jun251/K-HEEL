import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("student entry only asks for the assigned code", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /<label>학생 코드<input/);
  assert.match(page, /body:\s*JSON\.stringify\(\{\s*code:\s*studentCode\s*\}\)/);
  assert.doesNotMatch(page, /<label>닉네임<input/);
  assert.doesNotMatch(page, /<legend>나의 학년군<\/legend>/);
});

test("join API resolves identity and grade from the student code", async () => {
  const route = await readFile(new URL("../app/api/join/route.ts", import.meta.url), "utf8");

  assert.match(route, /FROM student_access_codes/);
  assert.match(route, /student_name AS nickname/);
  assert.match(route, /grade_band AS gradeBand/);
  assert.match(route, /room_code AS roomCode/);
  assert.doesNotMatch(route, /payload\.nickname/);
  assert.doesNotMatch(route, /payload\.gradeBand/);
});

test("teacher dashboard controls every student screen and shows presence", async () => {
  const [teacherPage, controlRoute, studentStatusRoute] = await Promise.all([
    readFile(new URL("../app/teacher/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/teacher/control/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/classroom/status/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(teacherPage, /게임 시작·재개/);
  assert.match(teacherPage, /일시정지/);
  assert.match(teacherPage, /현재 접속/);
  assert.match(controlRoute, /classroom_controls/);
  assert.match(studentStatusRoute, /student_presence/);
});

test("student game opens without teacher approval and still follows pause or end controls", async () => {
  const gamePage = await readFile(new URL("../app/game/page.tsx", import.meta.url), "utf8");

  assert.match(gamePage, /\/api\/classroom\/status/);
  assert.match(gamePage, /state === "paused" \|\| state === "ended"/);
  assert.doesNotMatch(gamePage, /classroomState !== "active"/);
  assert.match(gamePage, /ClassroomOverlay/);
});

test("Netlify functions never import the Cloudflare runtime", async () => {
  const platform = await readFile(new URL("../db/platform.ts", import.meta.url), "utf8");

  assert.match(platform, /AWS_LAMBDA_FUNCTION_NAME/);
  assert.match(platform, /LAMBDA_TASK_ROOT/);
});

test("top navigation links to the education materials page before games", async () => {
  const [home, materials] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/materials/page.tsx", import.meta.url), "utf8"),
  ]);

  const materialsLink = home.indexOf('href="/materials">교육 자료');
  const gamesLink = home.indexOf('href="#grades">게임 둘러보기');
  assert.ok(materialsLink >= 0 && materialsLink < gamesLink);
  assert.match(materials, /경제교육/);
  assert.match(materials, /자료실/);
});
