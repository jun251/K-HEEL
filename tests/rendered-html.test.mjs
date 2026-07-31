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
