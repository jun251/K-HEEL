"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Student = {
  playerId: number;
  nickname: string;
  gradeBand: string;
  status: "waiting" | "in_progress" | "completed";
  updatedAt: string | null;
  score: number | null;
};

const statusLabels = {
  waiting: "입장 완료",
  in_progress: "게임 진행 중",
  completed: "미션 완료",
};

export default function TeacherDashboard() {
  const [roomCode, setRoomCode] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [message, setMessage] = useState("학생 현황을 불러오는 중입니다.");
  const [authorized, setAuthorized] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/status", { cache: "no-store" });
      const data = (await response.json()) as {
        roomCode?: string;
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
      setStudents(data.students ?? []);
      setUpdatedAt(data.updatedAt ?? "");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "현황을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 5000);
    return () => window.clearInterval(timer);
  }, [loadStatus]);

  const completed = students.filter((student) => student.status === "completed").length;
  const progressing = students.filter((student) => student.status === "in_progress").length;
  const scored = students.filter((student) => student.score !== null);
  const average = Math.round(scored.reduce((sum, student) => sum + (student.score ?? 0), 0) / Math.max(1, scored.length));
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
        <div className="portal-brand"><span>₩</span><div><b>머니놀이터</b><small>선생님 현황판</small></div></div>
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
            <div><span className="portal-badge">LIVE CLASSROOM</span><h1>우리 반 경제 미션 현황</h1><p>학생들이 게임을 시작하거나 완료하면 이 화면이 자동으로 갱신됩니다.</p></div>
            <div className="live-indicator"><i /> LIVE<small>{updatedAt ? new Date(updatedAt).toLocaleTimeString("ko-KR") : "연결 중"}</small></div>
          </section>

          <section className="portal-stats">
            <article><span>참여 학생</span><strong>{students.length}</strong><small>명</small></article>
            <article><span>진행 중</span><strong>{progressing}</strong><small>명</small></article>
            <article><span>완료</span><strong>{completed}</strong><small>명</small></article>
            <article><span>평균 점수</span><strong>{average}</strong><small>점</small></article>
          </section>

          {message && <p className="portal-message">{message}</p>}

          <section className="grade-status-grid">
            {Object.entries(grouped).map(([band, gradeStudents]) => (
              <article className="grade-status-card" key={band}>
                <header><div><small>GRADE</small><h2>{band.replace("-", "·")}학년</h2></div><strong>{gradeStudents.length}<small>명</small></strong></header>
                <ul>
                  {gradeStudents.map((student) => (
                    <li key={student.playerId}>
                      <div className={`student-dot ${student.status}`} />
                      <div><strong>{student.nickname}</strong><small>{statusLabels[student.status]}</small></div>
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
