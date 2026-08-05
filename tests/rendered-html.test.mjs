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
  const [gamePage, scoresRoute] = await Promise.all([
    readFile(new URL("../app/game/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/scores/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(gamePage, /\/api\/classroom\/status/);
  assert.match(gamePage, /state === "paused" \|\| state === "ended"/);
  assert.doesNotMatch(gamePage, /classroomState !== "active"/);
  assert.match(gamePage, /ClassroomOverlay/);
  assert.match(scoresRoute, /control\?\.state === "paused" \|\| control\?\.state === "ended"/);
  assert.doesNotMatch(scoresRoute, /control\?\.state !== "active"/);
});

test("Netlify functions never import the Cloudflare runtime", async () => {
  const platform = await readFile(new URL("../db/platform.ts", import.meta.url), "utf8");

  assert.match(platform, /AWS_LAMBDA_FUNCTION_NAME/);
  assert.match(platform, /LAMBDA_TASK_ROOT/);
});

test("top navigation links to the education materials page before games", async () => {
  const [home, materials, library, route] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/materials/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/materials/MaterialsLibrary.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/materials/route.ts", import.meta.url), "utf8"),
  ]);

  const materialsLink = home.indexOf('href="/materials">교육 자료');
  const gamesLink = home.indexOf('href="#grades">게임 둘러보기');
  assert.ok(materialsLink >= 0 && materialsLink < gamesLink);
  assert.match(materials, /경제교육/);
  assert.match(materials, /자료실/);
  assert.match(library, /1·2학년 자료/);
  assert.match(library, /3·4학년 자료/);
  assert.match(library, /5·6학년 자료/);
  assert.match(library, /관리자 자료 올리기/);
  assert.match(route, /requireAdminApi/);
  assert.match(route, /MAX_FILE_SIZE/);
});

test("grade 3-4 game is the rational consumer challenge with five menus", async () => {
  const [game, scores] = await Promise.all([
    readFile(new URL("../app/GradeGame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/scores/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(game, /합리적 소비왕 챌린지/);
  assert.match(game, /STARTING_BUDGET = 15_000/);
  assert.match(game, /구수한 된장찌개/);
  assert.match(game, /김치볶음밥/);
  assert.match(game, /채소카레/);
  assert.match(game, /김치전/);
  assert.match(game, /과일요거트/);
  assert.match(game, /name: "재래된장"[\s\S]*?price: 5000, score: 9/);
  assert.match(game, /name: "국내산 김치"[\s\S]*?price: 4000, score: 9/);
  assert.match(game, /name: "못난이 감자"[\s\S]*?price: 1000, score: 8/);
  assert.match(game, /name: "우리밀"[\s\S]*?price: 3000, score: 9/);
  assert.match(game, /name: "못난이 사과"[\s\S]*?price: 1500, score: 9/);
  assert.match(game, /Math\.floor\(remaining \/ 1000\)/);
  assert.match(game, /최고의 가성비상/);
  assert.match(game, /친환경 소비상/);
  assert.match(game, /건강 소비상/);
  assert.match(game, /지역 경제 지킴이상/);
  assert.match(game, /Math\.random\(\) \* candidates\.length/);
  assert.match(game, /menus\.filter\(\(menu\) => !completedMenuIds\.includes\(menu\.id\)\)/);
  assert.match(game, /선택하면 자동으로 다음 재료로 넘어갑니다/);
  assert.match(game, /setIngredientIndex\(\(current\) => current \+ 1\)/);
  assert.match(game, /메뉴를 자동으로 배정하고 있어요/);
  assert.match(game, /← 이전 재료/);
  assert.match(game, /summary\.spent - currentChoicePrice \+ choice\.price/);
  assert.doesNotMatch(game, /랜덤 메뉴 받기/);
  assert.doesNotMatch(game, /만들고 싶은 메뉴를 골라 보세요/);
  assert.match(game, /menuImages\[selectedMenu\.id\]/);
  assert.match(game, /choiceImages\[choice\.name\]/);
  assert.match(game, /className="choice-card-image"/);
  assert.match(scores, /remaining_budget DESC/);
});

test("education materials open as responsive PPT-based web lessons", async () => {
  const [library, lessonData, lessonViewer] = await Promise.all([
    readFile(new URL("../app/materials/MaterialsLibrary.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/materials/lesson/lesson-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/materials/lesson/ResponsiveLesson.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(library, /PPT 기반 웹 학습/);
  assert.match(library, /\/materials\/lesson\/\$\{section\.gradeBand\}/);
  assert.match(lessonData, /"1-2"[\s\S]*?slideCount: 23/);
  assert.match(lessonData, /slideSources: \[1, 2,/);
  assert.match(lessonData, /"3-4"[\s\S]*?slideCount: 29/);
  assert.match(lessonData, /"5-6"[\s\S]*?slideCount: 39/);
  assert.match(lessonViewer, /ArrowLeft/);
  assert.match(lessonViewer, /ArrowRight/);
  assert.match(lessonViewer, /전체 페이지/);
  assert.match(lessonViewer, /lesson-thumbnails/);
  assert.match(lessonViewer, /requestFullscreen/);
  assert.match(lessonViewer, /sourceSlide === 4/);
  assert.match(lessonViewer, /토끼가 가장 먼저 필요한 것을 골라보세요/);
  assert.match(lessonViewer, /정답: 물! 목마름을 해결해 주기 때문이에요/);
  assert.match(lessonViewer, /17: \{ answer: "X"/);
  assert.match(lessonViewer, /18: \{ answer: "O"/);
  assert.match(lessonViewer, /19: \{ answer: "O"/);
  assert.match(lessonViewer, /20: \{ answer: "X"/);
  assert.match(lessonViewer, /땡! 다시 골라보세요/);
});
