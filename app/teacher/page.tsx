"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  updatedAt?: string | null;
};

const statusLabels = {
  waiting: "입장 완료",
  in_progress: "게임 진행 중",
  completed: "미션 완료",
};

const controlInfo: Record<ClassroomState, { label: string; title: string; copy: string }> = {
  waiting: { label: "대기 중", title: "학생 화면이 대기 상태예요", copy: "학생 이름과 학년을 확인한 뒤 게임 시작을 눌러 주세요." },
  active: { label: "수업 진행 중", title: "학생들이 게임을 진행하고 있어요", copy: "필요할 때 전체 화면을 잠시 멈추거나 수업을 종료할 수 있어요." },
  paused: { label: "일시정지", title: "모든 학생 화면을 멈췄어요", copy: "학생들의 선택은 유지됩니다. 준비되면 다시 시작해 주세요." },
  ended: { label: "수업 종료", title: "학생 화면에 종료 안내가 표시돼요", copy: "새 활동을 시작하려면 대기 화면 또는 게임 시작을 선택해 주세요." },
};

const controls: Array<{ state: ClassroomState; label: string }> = [
  { state: "waiting", label: "대기 화면" },
  { state: "active", label: "게임 시작·재개" },
  { state: "paused", label: "일시정지" },
  { state: "ended", label: "수업 종료" },
];

export default function TeacherDashboard() {
  const [roomCode, setRoomCode] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [controlState, setControlState] = useState<ClassroomState>("waiting");
  const [updatedAt, setUpdatedAt] = useState("");
  const [message, setMessage] = useState("학생 현황을 불러오는 중입니다.");
  const [authorized, setAuthorized] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);
  const [lessonControl, setLessonControl] = useState<LessonControl>({
    gradeBand: "1-2", page: 1, sourceSlide: 1, active: false,
  });
  const [lessonLoading, setLessonLoading] = useState(false);

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
      setMessage(`${controlInfo[data.state].label} 상태로 변경했습니다.`);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "학생 화면을 제어하지 못했습니다.");
    } finally {
      setControlLoading(false);
    }
  };

  const changeLesson = async (next: Partial<LessonControl>) => {
    const gradeBand = next.gradeBand ?? lessonControl.gradeBand;
    const page = Math.min(lessons[gradeBand].slideCount, Math.max(1, next.page ?? lessonControl.page));
    const active = next.active ?? lessonControl.active;
    setLessonLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeBand, page, active }),
      });
      const data = (await response.json()) as LessonControl & { error?: string };
      if (!response.ok) throw new Error(data.error || "교육자료 화면을 제어하지 못했습니다.");
      setLessonControl(data);
      setMessage(active
        ? `${gradeBand.replace("-", "·")}학년 학생 화면을 ${page}쪽으로 맞췄습니다.`
        : "학생 화면의 교육자료 수업을 종료했습니다.");
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "교육자료 화면을 제어하지 못했습니다.");
    } finally {
      setLessonLoading(false);
    }
  };

  const startLesson = () => {
    const presentationUrl = `/materials/lesson/${lessonControl.gradeBand}?present=1&page=1`;
    const presentationWindow = window.open(presentationUrl, "kheel-lesson-presenter");
    if (!presentationWindow) {
      setMessage("새 창이 차단되었습니다. 브라우저의 팝업을 허용하거나 '큰 화면 열기'를 눌러 주세요.");
    }
    void changeLesson({ active: true, page: 1 });
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
  const isQuizPage = [4, 17, 18, 19, 20].includes(Number(lessonControl.sourceSlide));

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

          <section className={`classroom-control-panel ${controlState}`}>
            <div className="control-summary">
              <span className="control-state">{controlInfo[controlState].label}</span>
              <h2>{controlInfo[controlState].title}</h2>
              <p>{controlInfo[controlState].copy}</p>
            </div>
            <div className="control-actions" aria-label="학생 화면 제어">
              {controls.map((control) => (
                <button
                  key={control.state}
                  className={controlState === control.state ? "active" : ""}
                  disabled={controlLoading}
                  aria-pressed={controlState === control.state}
                  onClick={() => void changeControl(control.state)}
                >
                  {control.label}
                </button>
              ))}
            </div>
          </section>

          <section className={`teacher-lesson-panel ${lessonControl.active ? "active" : ""}`}>
            <div className="teacher-lesson-heading">
              <div>
                <span className="portal-badge">SYNCED LESSON</span>
                <h2>교육자료 함께 보기</h2>
                <p>선생님이 넘긴 페이지가 같은 학년 학생들의 모바일 화면에도 자동으로 표시됩니다.</p>
              </div>
              <label>
                진행할 학년
                <select
                  value={lessonControl.gradeBand}
                  disabled={lessonControl.active || lessonLoading}
                  onChange={(event) => {
                    const gradeBand = event.target.value as LessonGrade;
                    setLessonControl({ gradeBand, page: 1, sourceSlide: getLessonSourceSlide(gradeBand, 1), active: false });
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
                <small>{lessonControl.active ? "학생 화면 동기화 중" : "수업을 시작해 주세요"}</small>
                <strong>{lessonControl.page}<span> / {lessons[lessonControl.gradeBand].slideCount}쪽</span></strong>
              </div>
              <div className="teacher-lesson-actions">
                {lessonControl.active ? (
                  <>
                    <button disabled={lessonLoading || lessonControl.page === 1} onClick={() => void changeLesson({ page: lessonControl.page - 1 })}>← 이전</button>
                    <a
                      href={`/materials/lesson/${lessonControl.gradeBand}?present=1&page=${lessonControl.page}`}
                      target="_blank"
                      rel="noreferrer"
                    >큰 화면 열기</a>
                    <button disabled={lessonLoading || lessonControl.page === lessons[lessonControl.gradeBand].slideCount} onClick={() => void changeLesson({ page: lessonControl.page + 1 })}>다음 →</button>
                    <button className="stop" disabled={lessonLoading} onClick={() => void changeLesson({ active: false })}>자료 수업 종료</button>
                  </>
                ) : (
                  <button className="start" disabled={lessonLoading} onClick={startLesson}>
                    {lessonLoading ? "연결 중…" : "자료 수업 시작"}
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
                </div>
              </div>
            )}

            <div className="teacher-lesson-status">
              <article><span>대상 학생</span><strong>{lessonStudents.length}<small>명</small></strong></article>
              <article><span>현재 접속</span><strong>{lessonStudents.filter((student) => student.online).length}<small>명</small></strong></article>
              <article><span>{isQuizPage ? "퀴즈 참여" : "현재 페이지"}</span><strong>{isQuizPage ? lessonResponses.length : lessonControl.page}<small>{isQuizPage ? "명" : "쪽"}</small></strong></article>
              <article><span>{isQuizPage ? "정답 학생" : "동기화"}</span><strong>{isQuizPage ? correctResponses : (lessonControl.active ? "ON" : "OFF")}</strong></article>
            </div>

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
