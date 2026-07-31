"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/status", { cache: "no-store" });
      const data = (await response.json()) as {
        roomCode?: string;
        control?: { state?: ClassroomState };
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
