"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLessonSourceSlide, lessons, type LessonGrade } from "../materials/lesson/lesson-data";

type ClassroomState = "waiting" | "active" | "paused" | "ended";

type Student = {
  playerId: number;
  nickname: string;
  gradeBand: string;
  status: "waiting" | "in_progress" | "completed";
  updatedAt: string | null;
  lastSeenAt: string | null;
  online: boolean;
  score: number | null;
  lessonResponse: { answer: string; correct: boolean; updatedAt: string } | null;
};

type LessonControl = {
  gradeBand: LessonGrade;
  page: number;
  sourceSlide: number;
  active: boolean;
  phase: "waiting" | "active" | "completed";
  updatedAt?: string | null;
};

const statusLabels = {
  waiting: "입장 완료",
  in_progress: "게임 진행 중",
  completed: "미션 완료",
};

export default function TeacherDashboard() {
  const [roomCode, setRoomCode] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [controlState, setControlState] = useState<ClassroomState>("waiting");
  const [updatedAt, setUpdatedAt] = useState("");
  const [message, setMessage] = useState("학생 현황을 불러오는 중입니다.");
  const [authorized, setAuthorized] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);
  const [lessonControl, setLessonControl] = useState<LessonControl>({
    gradeBand: "1-2", page: 1, sourceSlide: 1, active: false, phase: "waiting",
  });
  const [lessonLoading, setLessonLoading] = useState(false);
  const presentationWindow = useRef<Window | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/status", { cache: "no-store" });
      const data = (await response.json()) as {
        roomCode?: string;
        control?: { state?: ClassroomState };
        lesson?: LessonControl;
        students?: Student[];
        updatedAt?: string;
        error?: string;
      };
      if (response.status === 401) {
        setAuthorized(false);
        setMessage("선생님 로그인 시간이 만료되었습니다. 머니놀이터에서 다시 로그인해 주세요.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "현황을 불러오지 못했습니다.");
      setAuthorized(true);
      setRoomCode(data.roomCode ?? "");
      setControlState(data.control?.state ?? "waiting");
      if (data.lesson) setLessonControl(data.lesson);
      setStudents(data.students ?? []);
      setUpdatedAt(data.updatedAt ?? "");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "현황을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 3000);
    return () => window.clearInterval(timer);
  }, [loadStatus]);

  const changeControl = async (state: ClassroomState) => {
    setControlLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      const data = (await response.json()) as { state?: ClassroomState; error?: string };
      if (!response.ok || !data.state) throw new Error(data.error || "학생 화면을 제어하지 못했습니다.");
      setControlState(data.state);
      const stateLabel = { waiting: "대기", active: "게임 진행", paused: "게임 일시정지", ended: "수업 종료" }[data.state];
      setMessage(`${stateLabel} 상태로 변경했습니다.`);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "학생 화면을 제어하지 못했습니다.");
    } finally {
      setControlLoading(false);
    }
  };

  const changeLesson = useCallback(async (next: Partial<LessonControl> & { completed?: boolean }) => {
    const gradeBand = next.gradeBand ?? lessonControl.gradeBand;
    const page = Math.min(lessons[gradeBand].slideCount, Math.max(1, next.page ?? lessonControl.page));
    const active = next.active ?? lessonControl.active;
    setLessonLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeBand, page, active, completed: next.completed === true }),
      });
      const data = (await response.json()) as LessonControl & { error?: string };
      if (!response.ok) throw new Error(data.error || "교육자료 화면을 제어하지 못했습니다.");
      setLessonControl(data);
      presentationWindow.current?.postMessage({
        type: "kheel-lesson-sync",
        gradeBand: data.gradeBand,
        page: data.page,
      }, window.location.origin);
      setMessage(active
        ? `${gradeBand.replace("-", "·")}학년 학생 화면을 ${page}쪽으로 맞췄습니다.`
        : "학생 화면의 교육자료 수업을 종료했습니다.");
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "교육자료 화면을 제어하지 못했습니다.");
    } finally {
      setLessonLoading(false);
    }
  }, [lessonControl, loadStatus]);

  useEffect(() => {
    function handlePresentationMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; gradeBand?: string; page?: number };
      if (data.type !== "kheel-lesson-page" || data.gradeBand !== lessonControl.gradeBand || !Number.isFinite(data.page)) return;
      void changeLesson({ active: true, phase: "active", page: Number(data.page) });
    }

    window.addEventListener("message", handlePresentationMessage);
    return () => window.removeEventListener("message", handlePresentationMessage);
  }, [changeLesson, lessonControl.gradeBand]);

  const startLesson = () => {
    const presentationUrl = `/materials/lesson/${lessonControl.gradeBand}?present=1&page=1`;
    const openedWindow = window.open(presentationUrl, "kheel-lesson-presenter");
    presentationWindow.current = openedWindow;
    if (!openedWindow) {
      setMessage("새 창이 차단되었습니다. 브라우저의 팝업을 허용하거나 '큰 화면 열기'를 눌러 주세요.");
    }
    void changeLesson({ active: true, phase: "active", page: 1 });
  };

  const completed = students.filter((student) => student.status === "completed").length;
  const progressing = students.filter((student) => student.status === "in_progress").length;
  const online = students.filter((student) => student.online).length;
  const grouped = useMemo(
    () => ({
      "1-2": students.filter((student) => student.gradeBand === "1-2"),
      "3-4": students.filter((student) => student.gradeBand === "3-4"),
      "5-6": students.filter((student) => student.gradeBand === "5-6"),
    }),
    [students],
  );
  const lessonStudents = students.filter((student) => student.gradeBand === lessonControl.gradeBand);
  const lessonResponses = lessonStudents.filter((student) => student.lessonResponse);
  const correctResponses = lessonResponses.filter((student) => student.lessonResponse?.correct).length;
  const isQuizPage = lessonControl.gradeBand === "1-2" && [4, 17, 18, 19, 20].includes(Number(lessonControl.sourceSlide));
  const isSurveyPage = lessonControl.gradeBand === "3-4" && Number(lessonControl.sourceSlide) === 3;
  const surveyChoices = [
    { value: "lightning", label: "1. 번개형" },
    { value: "half", label: "2. 반반형" },
    { value: "turtle", label: "3. 거북이형" },
  ];

  return (
    <main className="portal-main teacher-portal">
      <header className="portal-header">
        <div className="portal-brand"><span>₩</span><div><b>머니놀이터</b><small>선생님 수업 제어실</small></div></div>
        <div className="portal-user"><span>{roomCode ? `수업 ${roomCode}` : "선생님 전용"}</span><button onClick={() => window.close()}>창 닫기</button></div>
      </header>

      {!authorized ? (
        <section className="portal-card portal-empty">
          <span className="portal-badge">SESSION EXPIRED</span>
          <h1>다시 로그인해 주세요</h1>
          <p>{message}</p>
          <button className="portal-link" onClick={() => window.close()}>창 닫기</button>
        </section>
      ) : (
        <>
          <section className="teacher-title">
            <div><span className="portal-badge">LIVE CLASSROOM</span><h1>학생 화면 제어와<br />실시간 수업 현황</h1><p>학생 화면을 한 번에 시작하거나 멈추고, 접속과 미션 진행 상태를 자동으로 확인하세요.</p></div>
            <div className="live-indicator"><i /> LIVE<small>{updatedAt ? new Date(updatedAt).toLocaleTimeString("ko-KR") : "연결 중"}</small></div>
          </section>

          <section className={`teacher-lesson-panel ${lessonControl.active ? "active" : ""}`}>
            <ol className="teacher-flow-steps" aria-label="수업 진행 단계">
              <li className={lessonControl.phase === "completed" ? "done" : "active"}><b>1</b><span>경제교육</span></li>
              <li className={lessonControl.phase === "completed" && controlState !== "ended" ? "active" : controlState === "ended" ? "done" : ""}><b>2</b><span>게임</span></li>
              <li className={controlState === "ended" ? "active" : ""}><b>3</b><span>수업 종료</span></li>
            </ol>

            <div className="teacher-lesson-heading">
              <div>
                <span className="portal-badge">CLASS FLOW</span>
                <h2>경제교육부터 게임까지 한 번에 진행</h2>
                <p>교육자료를 먼저 함께 보고, 교육 종료 후 같은 화면에서 게임을 시작하고 제어합니다.</p>
              </div>
              <label>
                진행할 학년
                <select
                  value={lessonControl.gradeBand}
                  disabled={lessonControl.active || (lessonControl.phase === "completed" && controlState !== "ended") || lessonLoading}
                  onChange={(event) => {
                    const gradeBand = event.target.value as LessonGrade;
                    setLessonControl({ gradeBand, page: 1, sourceSlide: getLessonSourceSlide(gradeBand, 1), active: false, phase: "waiting" });
                  }}
                >
                  <option value="1-2">1·2학년</option>
                  <option value="3-4">3·4학년</option>
                  <option value="5-6">5·6학년</option>
                </select>
              </label>
            </div>

            <div className="teacher-lesson-controller">
              <div className="teacher-lesson-page">
                <small>{lessonControl.active ? "학생 화면 동기화 중" : lessonControl.phase === "completed" ? (controlState === "ended" ? "전체 수업 종료" : "학생 게임 진행 단계") : "경제교육부터 시작해 주세요"}</small>
                {lessonControl.phase === "completed" ? <strong>{controlState === "ended" ? "종료" : "게임"}</strong> : <strong>{lessonControl.page}<span> / {lessons[lessonControl.gradeBand].slideCount}쪽</span></strong>}
              </div>
              <div className="teacher-lesson-actions">
                {lessonControl.active ? (
                  <>
                    <button disabled={lessonLoading || lessonControl.page === 1} onClick={() => void changeLesson({ page: lessonControl.page - 1 })}>← 이전</button>
                    <button onClick={() => {
                      presentationWindow.current = window.open(
                        `/materials/lesson/${lessonControl.gradeBand}?present=1&page=${lessonControl.page}`,
                        "kheel-lesson-presenter",
                      );
                    }}>큰 화면 열기</button>
                    <button disabled={lessonLoading || lessonControl.page === lessons[lessonControl.gradeBand].slideCount} onClick={() => void changeLesson({ page: lessonControl.page + 1 })}>다음 →</button>
                    <button className="stop" disabled={lessonLoading} onClick={() => void changeLesson({ active: false, completed: true, phase: "completed" })}>교육 종료 · 게임 시작</button>
                  </>
                ) : lessonControl.phase === "completed" ? (
                  <>
                    {controlState === "paused" ? (
                      <button className="start" disabled={controlLoading} onClick={() => void changeControl("active")}>게임 재개</button>
                    ) : controlState !== "ended" ? (
                      <button disabled={controlLoading} onClick={() => void changeControl("paused")}>게임 일시정지</button>
                    ) : null}
                    {controlState !== "ended" && <button className="stop" disabled={controlLoading} onClick={() => void changeControl("ended")}>전체 수업 종료</button>}
                    {controlState === "ended" && <button className="start" disabled={lessonLoading} onClick={startLesson}>새 경제교육 시작</button>}
                  </>
                ) : (
                  <button className="start" disabled={lessonLoading} onClick={startLesson}>
                    {lessonLoading ? "연결 중…" : "경제교육 시작"}
                  </button>
                )}
              </div>
            </div>

            {lessonControl.active && (
              <div className="teacher-lesson-preview" data-testid="teacher-lesson-preview">
                <div className="teacher-lesson-preview-bar">
                  <span><i /> 학생 화면과 같은 페이지</span>
                  <strong>{lessonControl.gradeBand.replace("-", "·")}학년 · {lessonControl.page}쪽</strong>
                </div>
                <div className="teacher-lesson-preview-stage">
                  <img
                    src={`/lesson-slides/grade-${lessonControl.gradeBand}/slide-${lessonControl.sourceSlide}.png`}
                    alt={`${lessonControl.gradeBand.replace("-", "·")}학년 교육자료 ${lessonControl.page}페이지`}
                  />
                  {lessonControl.gradeBand === "1-2" && lessonControl.sourceSlide === 4 && <span className="lesson-answer-mask rabbit" aria-hidden="true" />}
                  {lessonControl.gradeBand === "1-2" && [17, 18, 19, 20].includes(lessonControl.sourceSlide) && <span className="lesson-answer-mask ox" aria-hidden="true" />}
                  {lessonControl.gradeBand === "3-4" && lessonControl.sourceSlide === 9 && (
                    <>
                      <span className="lesson-answer-mask grade34-unit-a" aria-hidden="true" />
                      <span className="lesson-answer-mask grade34-unit-b" aria-hidden="true" />
                      <span className="lesson-answer-mask grade34-unit-answer" aria-hidden="true" />
                    </>
                  )}
                  {lessonControl.gradeBand === "3-4" && lessonControl.sourceSlide === 26 && (
                    <>{[1, 2, 3, 4].map((number) => <span key={number} className={`lesson-answer-mask grade34-golden-answer answer-${number}`} aria-hidden="true" />)}</>
                  )}
                </div>
              </div>
            )}

            <div className="teacher-lesson-status">
              <article><span>대상 학생</span><strong>{lessonStudents.length}<small>명</small></strong></article>
              <article><span>현재 접속</span><strong>{lessonStudents.filter((student) => student.online).length}<small>명</small></strong></article>
              <article><span>{isSurveyPage ? "성향 선택" : isQuizPage ? "퀴즈 참여" : "현재 페이지"}</span><strong>{isSurveyPage || isQuizPage ? lessonResponses.length : lessonControl.page}<small>{isSurveyPage || isQuizPage ? "명" : "쪽"}</small></strong></article>
              <article><span>{isSurveyPage ? "응답률" : isQuizPage ? "정답 학생" : "동기화"}</span><strong>{isSurveyPage ? `${lessonStudents.length ? Math.round((lessonResponses.length / lessonStudents.length) * 100) : 0}%` : isQuizPage ? correctResponses : (lessonControl.active ? "ON" : "OFF")}</strong></article>
            </div>

            {lessonControl.active && isSurveyPage && (
              <div className="teacher-survey-results">
                <div className="teacher-survey-heading">
                  <h3>소비 성향 선택 비율</h3>
                  <span>{lessonResponses.length}명 응답</span>
                </div>
                {surveyChoices.map((choice) => {
                  const count = lessonResponses.filter((student) => student.lessonResponse?.answer === choice.value).length;
                  const ratio = lessonResponses.length ? Math.round((count / lessonResponses.length) * 100) : 0;
                  return (
                    <div className="teacher-survey-row" key={choice.value}>
                      <strong>{choice.label}</strong>
                      <div><span style={{ width: `${ratio}%` }} /></div>
                      <b>{ratio}% <small>({count}명)</small></b>
                    </div>
                  );
                })}
              </div>
            )}

            {lessonControl.active && isQuizPage && (
              <div className="teacher-response-list">
                <h3>퀴즈 참여 현황</h3>
                <ul>
                  {lessonStudents.map((student) => (
                    <li key={student.playerId}>
                      <span className={student.lessonResponse ? (student.lessonResponse.correct ? "correct" : "wrong") : "waiting"} />
                      <strong>{student.nickname}</strong>
                      <small>{student.lessonResponse ? `${student.lessonResponse.answer} 선택 · ${student.lessonResponse.correct ? "정답" : "다시 선택 중"}` : "아직 선택하지 않음"}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="portal-stats teacher-stats">
            <article><span>등록 학생</span><strong>{students.length}</strong><small>명</small></article>
            <article><span>현재 접속</span><strong>{online}</strong><small>명</small></article>
            <article><span>진행 중</span><strong>{progressing}</strong><small>명</small></article>
            <article><span>완료</span><strong>{completed}</strong><small>명</small></article>
          </section>

          {message && <p className="portal-message" role="status">{message}</p>}

          <section className="grade-status-grid">
            {Object.entries(grouped).map(([band, gradeStudents]) => (
              <article className="grade-status-card" key={band}>
                <header><div><small>GRADE</small><h2>{band.replace("-", "·")}학년</h2></div><strong>{gradeStudents.length}<small>명</small></strong></header>
                <ul>
                  {gradeStudents.map((student) => (
                    <li key={student.playerId}>
                      <div className={`student-dot ${student.status} ${student.online ? "online" : "offline"}`} />
                      <div>
                        <strong>{student.nickname}</strong>
                        <small>{student.online ? "접속 중" : "접속 안 함"} · {statusLabels[student.status]}</small>
                      </div>
                      <b>{student.score === null ? "—" : `${student.score}점`}</b>
                    </li>
                  ))}
                  {!gradeStudents.length && <li className="empty-students">아직 참여한 학생이 없습니다.</li>}
                </ul>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
