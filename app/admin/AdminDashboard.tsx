"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Room = {
  code: string;
  studentCount: number;
  teacherCodeHint: string | null;
  teacherCodeUpdatedAt: string | null;
};

type Student = {
  playerId: number;
  nickname: string;
  roomCode: string;
  gradeBand: string;
  joinedAt: string;
  status: "waiting" | "in_progress" | "completed";
  updatedAt: string | null;
  score: number | null;
};

const statusLabels = {
  waiting: "대기",
  in_progress: "진행 중",
  completed: "완료",
};

export default function AdminDashboard({ displayName }: { displayName: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [roomFilter, setRoomFilter] = useState("all");
  const [newRoomCode, setNewRoomCode] = useState("");
  const [issuedCode, setIssuedCode] = useState<{ roomCode: string; code: string } | null>(null);
  const [status, setStatus] = useState("관리 정보를 불러오는 중입니다.");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/data", { cache: "no-store" });
      const data = (await response.json()) as {
        rooms?: Room[];
        students?: Student[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "관리 정보를 불러오지 못했습니다.");
      setRooms(data.rooms ?? []);
      setStudents(data.students ?? []);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "관리 정보를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleStudents = useMemo(
    () => students.filter((student) => roomFilter === "all" || student.roomCode === roomFilter),
    [roomFilter, students],
  );
  const completedCount = visibleStudents.filter((student) => student.status === "completed").length;
  const average = Math.round(
    visibleStudents.reduce((sum, student) => sum + (student.score ?? 0), 0)
      / Math.max(1, visibleStudents.filter((student) => student.score !== null).length),
  );

  const issueTeacherCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(newRoomCode)) {
      setStatus("수업 코드는 숫자 4~6자리로 입력해 주세요.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/teacher-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: newRoomCode }),
      });
      const data = (await response.json()) as { roomCode?: string; code?: string; error?: string };
      if (!response.ok || !data.roomCode || !data.code) {
        throw new Error(data.error || "선생님 코드를 만들지 못했습니다.");
      }
      setIssuedCode({ roomCode: data.roomCode, code: data.code });
      setRoomFilter(data.roomCode);
      setNewRoomCode("");
      setStatus("새 선생님 코드가 발급되었습니다. 지금 복사해 전달해 주세요.");
      await loadData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "선생님 코드를 만들지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async (
    playerId: number,
    changes: { status?: Student["status"]; score?: number },
  ) => {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...changes }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "학생 정보를 수정하지 못했습니다.");
      setStatus("학생 정보가 저장되었습니다.");
      await loadData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "학생 정보를 수정하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="portal-main admin-portal">
      <header className="portal-header">
        <div className="portal-brand"><span>₩</span><div><b>머니놀이터</b><small>관리자 센터</small></div></div>
        <div className="portal-user"><span>{displayName}</span><button onClick={() => window.close()}>창 닫기</button></div>
      </header>

      <section className="portal-hero">
        <div>
          <span className="portal-badge">ADMIN CONTROL ROOM</span>
          <h1>수업과 학생 결과를<br/>한곳에서 관리해요</h1>
          <p>수업 코드를 선택하면 참여 현황을 확인하고, 학생별 진행 상태와 점수를 바로 수정할 수 있습니다.</p>
        </div>
        <form className="code-issuer" onSubmit={issueTeacherCode}>
          <label>수업 코드
            <input
              value={newRoomCode}
              onChange={(event) => setNewRoomCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="예: 2407"
              inputMode="numeric"
            />
          </label>
          <button disabled={loading}>선생님 코드 발급</button>
          <small>기존 수업에 다시 발급하면 이전 선생님 코드는 즉시 사용할 수 없게 됩니다.</small>
        </form>
      </section>

      {issuedCode && (
        <section className="issued-code" role="status">
          <div><small>{issuedCode.roomCode} 수업 선생님 코드</small><strong>{issuedCode.code}</strong></div>
          <button onClick={() => void navigator.clipboard.writeText(issuedCode.code)}>코드 복사</button>
        </section>
      )}

      <section className="portal-controls">
        <label>수업 선택
          <select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)}>
            <option value="all">전체 수업</option>
            {rooms.map((room) => (
              <option value={room.code} key={room.code}>
                {room.code} · {room.studentCount}명
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => void loadData()}>새로고침</button>
      </section>

      <section className="portal-stats">
        <article><span>참여 학생</span><strong>{visibleStudents.length}</strong><small>명</small></article>
        <article><span>게임 완료</span><strong>{completedCount}</strong><small>명</small></article>
        <article><span>평균 점수</span><strong>{average}</strong><small>점</small></article>
      </section>

      <section className="portal-table-card">
        <div className="portal-table-title">
          <div><span className="portal-badge">STUDENT STATUS</span><h2>학생 현황 및 결과 수정</h2></div>
          <p>{status || `${visibleStudents.length}명의 최신 상태입니다.`}</p>
        </div>
        <div className="portal-table-wrap">
          <table>
            <thead><tr><th>학생</th><th>수업</th><th>학년군</th><th>상태</th><th>점수</th><th>저장</th></tr></thead>
            <tbody>
              {visibleStudents.map((student) => (
                <StudentEditor
                  key={student.playerId}
                  student={student}
                  disabled={loading}
                  onSave={updateStudent}
                />
              ))}
              {!visibleStudents.length && (
                <tr><td colSpan={6} className="empty-cell">아직 참여한 학생이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StudentEditor({
  student,
  disabled,
  onSave,
}: {
  student: Student;
  disabled: boolean;
  onSave: (playerId: number, changes: { status: Student["status"]; score: number }) => void;
}) {
  const [studentStatus, setStudentStatus] = useState(student.status);
  const [score, setScore] = useState(String(student.score ?? 0));

  useEffect(() => {
    setStudentStatus(student.status);
    setScore(String(student.score ?? 0));
  }, [student]);

  return (
    <tr>
      <td><strong>{student.nickname}</strong></td>
      <td>{student.roomCode}</td>
      <td>{student.gradeBand.replace("-", "·")}학년</td>
      <td>
        <select value={studentStatus} onChange={(event) => setStudentStatus(event.target.value as Student["status"])}>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </td>
      <td><input className="score-input" value={score} onChange={(event) => setScore(event.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" /></td>
      <td><button className="table-save" disabled={disabled} onClick={() => onSave(student.playerId, { status: studentStatus, score: Number(score) })}>저장</button></td>
    </tr>
  );
}
