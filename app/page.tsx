"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import GradeGame, { GameOutcome } from "./GradeGame";

type GradeBand = "1-2" | "3-4" | "5-6";
type Player = { token: string; nickname: string; roomCode: string; gradeBand: GradeBand };
type Result = { rank: number; nickname: string; gradeBand: GradeBand; score: number; remainingBudget?: number };

const gradeInfo: Record<GradeBand, { label: string; title: string; copy: string; color: string }> = {
  "1-2": { label: "1·2학년", title: "꼭 필요할까?", copy: "필요한 것과 갖고 싶은 것을 구별해요.", color: "lime" },
  "3-4": { label: "3·4학년", title: "합리적 소비왕 챌린지", copy: "15,000원 안에서 가격·품질·건강·환경을 함께 살펴요.", color: "yellow" },
  "5-6": { label: "5·6학년", title: "금융마블", copy: "32칸을 이동하며 수입·지출·저축·투자를 체험해요.", color: "blue" },
};

const demoResults: Result[] = [
  { rank: 1, nickname: "알뜰토끼", gradeBand: "3-4", score: 100 },
  { rank: 2, nickname: "저축왕", gradeBand: "5-6", score: 90 },
  { rank: 3, nickname: "동전탐험대", gradeBand: "1-2", score: 80 },
];

export default function Home() {
  const [studentCode, setStudentCode] = useState("");
  const [player] = useState<Player | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [resultRoom, setResultRoom] = useState("2407");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [teacherLoginOpen, setTeacherLoginOpen] = useState(false);
  const [teacherCode, setTeacherCode] = useState("");
  const [teacherStatus, setTeacherStatus] = useState("");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const adminClickCount = useRef(0);
  const adminClickTimer = useRef<number | null>(null);

  const loadResults = useCallback(async (code: string) => {
    try {
      const response = await fetch(`/api/scores?roomCode=${encodeURIComponent(code)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("결과를 불러오지 못했습니다.");
      const data = (await response.json()) as { results: Result[] };
      setResults(data.results);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => { void loadResults(resultRoom); }, [loadResults, resultRoom]);

  useEffect(() => {
    const receiveGameResult = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as { type?: string; roomCode?: string };
      if (message.type !== "kheel-score-saved" || !message.roomCode) return;
      setResultRoom(message.roomCode);
      void loadResults(message.roomCode);
      setStatus("게임 결과가 결과판에 반영됐어요.");
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("message", receiveGameResult);
    return () => window.removeEventListener("message", receiveGameResult);
  }, [loadResults]);

  const joinRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[A-Z0-9-]{4,20}$/.test(studentCode)) return setStatus("학생 코드를 정확히 입력해 주세요.");
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: studentCode }),
      });
      const data = (await response.json()) as Player & { error?: string };
      if (!response.ok) throw new Error(data.error || "입장할 수 없습니다.");
      setResultRoom(data.roomCode);
      window.localStorage.setItem(`kheel-player-${data.token}`, JSON.stringify(data));

      const gameUrl = new URL("/game", window.location.origin);
      gameUrl.searchParams.set("session", data.token);
      const gameWindow = window.open(
        gameUrl.toString(),
        "kheel-game",
        "popup,width=980,height=760,menubar=no,toolbar=no,location=no,status=no",
      );

      if (gameWindow) {
        gameWindow.focus();
        setStatus(`${data.nickname}님을 확인했어요. ${gradeInfo[data.gradeBand].label} 게임을 열었습니다.`);
      } else {
        setStatus("팝업이 차단됐어요. 브라우저에서 팝업 허용 후 다시 입장해 주세요.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogoClick = () => {
    adminClickCount.current += 1;
    if (adminClickTimer.current) window.clearTimeout(adminClickTimer.current);
    adminClickTimer.current = window.setTimeout(() => {
      adminClickCount.current = 0;
    }, 1500);
    if (adminClickCount.current < 3) return;
    adminClickCount.current = 0;
    setAdminStatus("");
    setAdminLoginOpen(true);
  };

  const loginAdmin = async (event: FormEvent) => {
    event.preventDefault();
    const adminWindow = window.open(
      "about:blank",
      "kheel-admin",
      "popup,width=1280,height=860,menubar=no,toolbar=no,location=no,status=no",
    );
    setLoading(true);
    setAdminStatus("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "관리자 로그인을 할 수 없습니다.");
      setAdminLoginOpen(false);
      setAdminPassword("");
      if (adminWindow) {
        adminWindow.location.href = "/admin";
        adminWindow.focus();
      } else {
        setAdminStatus("팝업이 차단됐습니다. 팝업을 허용한 뒤 다시 로그인해 주세요.");
      }
    } catch (error) {
      adminWindow?.close();
      setAdminStatus(error instanceof Error ? error.message : "관리자 로그인을 할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loginTeacher = async (event: FormEvent) => {
    event.preventDefault();
    const teacherWindow = window.open(
      "about:blank",
      "kheel-teacher",
      "popup,width=1280,height=860,menubar=no,toolbar=no,location=no,status=no",
    );
    setLoading(true);
    setTeacherStatus("");
    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: teacherCode }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "선생님 로그인을 할 수 없습니다.");
      setTeacherLoginOpen(false);
      setTeacherCode("");
      if (teacherWindow) {
        teacherWindow.location.href = "/teacher";
        teacherWindow.focus();
      } else {
        setTeacherStatus("팝업이 차단됐습니다. 팝업을 허용한 뒤 다시 로그인해 주세요.");
      }
    } catch (error) {
      teacherWindow?.close();
      setTeacherStatus(error instanceof Error ? error.message : "선생님 로그인을 할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const finishGame = async ({ score, remainingBudget }: GameOutcome) => {
    if (!player) return;
    setLoading(true);
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, score, remainingBudget, gameId: `game-${player.gradeBand}` }),
      });
      if (!response.ok) throw new Error("점수 저장에 실패했습니다.");
      await loadResults(player.roomCode);
      setStatus(`${player.nickname}님의 ${score}점이 결과판에 기록됐어요!`);
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "점수를 저장하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const shownResults = results.length ? results : demoResults;
  const average = useMemo(() => Math.round(shownResults.reduce((sum, item) => sum + item.score, 0) / shownResults.length), [shownResults]);

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <button className="brand-secret" type="button" onClick={handleAdminLogoClick} aria-label="머니놀이터 로고"><span>₩</span></button>
          <a href="#top">머니놀이터</a>
        </div>
        <nav><a className="materials-nav-link" href="/materials">교육 자료</a><a href="#grades">게임 둘러보기</a><a href="#results">우리 방 결과</a><button className="teacher-login-link" onClick={() => setTeacherLoginOpen(true)}>선생님 로그인</button></nav>
      </header>

      {teacherLoginOpen && (
        <div className="login-modal-backdrop" role="presentation" onMouseDown={() => setTeacherLoginOpen(false)}>
          <form className="login-modal" onSubmit={loginTeacher} role="dialog" aria-modal="true" aria-labelledby="teacher-login-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setTeacherLoginOpen(false)} aria-label="닫기">×</button>
            <span className="modal-icon">✎</span>
            <p className="eyebrow">TEACHER LOGIN</p>
            <h2 id="teacher-login-title">선생님 현황판 열기</h2>
            <p>관리자에게 받은 선생님 코드를 입력하면 학생들의 게임 진행 상황이 별도 창으로 열립니다.</p>
            <label>선생님 코드
              <input
                autoFocus
                value={teacherCode}
                onChange={(event) => setTeacherCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16))}
                placeholder="T-ABCD-1234"
                autoComplete="off"
              />
            </label>
            <button className="primary-button" disabled={loading}>{loading ? "확인 중…" : "학생 현황 열기 →"}</button>
            {teacherStatus && <p className="form-status" role="status">{teacherStatus}</p>}
          </form>
        </div>
      )}

      {adminLoginOpen && (
        <div className="login-modal-backdrop" role="presentation" onMouseDown={() => setAdminLoginOpen(false)}>
          <form className="login-modal admin-login-modal" onSubmit={loginAdmin} role="dialog" aria-modal="true" aria-labelledby="admin-login-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setAdminLoginOpen(false)} aria-label="닫기">×</button>
            <span className="modal-icon">⚙</span>
            <p className="eyebrow">ADMIN LOGIN</p>
            <h2 id="admin-login-title">관리자 페이지 로그인</h2>
            <p>관리자 비밀번호를 입력하면 수업과 학생 결과를 관리하는 별도 창이 열립니다.</p>
            <label>관리자 비밀번호
              <input
                autoFocus
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value.slice(0, 80))}
                placeholder="비밀번호 입력"
                autoComplete="current-password"
              />
            </label>
            <button className="primary-button" disabled={loading || !adminPassword}>{loading ? "확인 중…" : "관리자 페이지 열기 →"}</button>
            {adminStatus && <p className="form-status" role="status">{adminStatus}</p>}
          </form>
        </div>
      )}

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">놀이로 배우는 어린이 경제교육</p>
          <h1>돈을 쓰는 선택이<br/><em>즐거운 게임</em>이 된다!</h1>
          <p className="hero-description">학년에 꼭 맞는 경제 미션을 해결하고, 우리 반 친구들과 함께 경제 감각을 키워요.</p>
          <div className="hero-points"><span>✓ 회원가입 없이</span><span>✓ 휴대폰으로 바로</span><span>✓ 결과는 한눈에</span></div>
        </div>

        <form className="join-card" onSubmit={joinRoom}>
          <div className="card-label">지금 바로 참여하기</div>
          <label>학생 코드<input value={studentCode} onChange={(e) => setStudentCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20))} placeholder="선생님이 알려준 코드" autoComplete="off" aria-describedby="code-help" /></label>
          <small id="code-help">코드를 입력하면 이름과 학년을 자동으로 확인해요.</small>
          <button className="primary-button" disabled={loading}>{loading ? "잠시만요…" : "게임방 입장하기 →"}</button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      </section>

      <section className="section" id="grades">
        <div className="section-heading"><div><p className="eyebrow">학년별 맞춤 미션</p><h2>내 학년에 딱 맞는 경제 게임</h2></div><p>쉬운 선택부터 미래 계획까지,<br/>한 단계씩 경제 근육을 키워요.</p></div>
        <div className="grade-grid">{(Object.keys(gradeInfo) as GradeBand[]).map((band, index) => <article className={`grade-card ${gradeInfo[band].color}`} key={band}><div className="grade-number">0{index + 1}</div><span className="grade-tag">{gradeInfo[band].label}</span><div className="game-icon" aria-hidden="true">{band === "1-2" ? "🛒" : band === "3-4" ? "🧺" : "🎲"}</div><h3>{gradeInfo[band].title}</h3><p>{gradeInfo[band].copy}</p><button onClick={() => { document.querySelector<HTMLInputElement>('.join-card input')?.focus(); }}>학생 코드 입력하기 <span>→</span></button></article>)}</div>
      </section>

      {player && <section className="game-section" id="game"><div className="game-shell"><div className="game-heading"><span>{gradeInfo[player.gradeBand].label} 미션</span><h2>{player.nickname}님, 준비됐나요?</h2><p>정답보다 더 중요한 건 왜 그렇게 선택했는지 생각하는 거예요.</p></div><GradeGame band={player.gradeBand} onFinish={finishGame} disabled={loading} /></div></section>}

      <section className="results-section" id="results">
        <div className="results-intro"><p className="eyebrow">우리 방 경제 리포트</p><h2>함께 쌓은<br/>오늘의 경제 감각</h2><p>입장코드가 같은 친구들의 최고 점수를 모았어요. 실명 대신 닉네임만 표시됩니다.</p><label>결과를 볼 입장코드<div className="result-search"><input value={resultRoom} onChange={(e) => setResultRoom(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric"/><button onClick={() => void loadResults(resultRoom)}>조회</button></div></label></div>
        <div className="scoreboard"><div className="score-summary"><div><strong>{results.length || shownResults.length}</strong><span>참여 어린이</span></div><div><strong>{average}</strong><span>평균 점수</span></div><div><strong>{resultRoom}</strong><span>입장코드</span></div></div>{!results.length && <p className="demo-notice">아직 저장된 결과가 없어 예시 결과를 보여드려요.</p>}<ol>{shownResults.map((item, index) => <li key={`${item.nickname}-${index}`}><span className={`rank rank-${index + 1}`}>{index + 1}</span><div><strong>{item.nickname}</strong><small>{gradeInfo[item.gradeBand].label}{item.gradeBand === "3-4" && item.remainingBudget !== undefined ? ` · 남은 돈 ${item.remainingBudget.toLocaleString()}원` : ""}</small></div><b>{item.score}<small>점</small></b></li>)}</ol></div>
      </section>

      <footer><div className="brand"><span>₩</span> 머니놀이터</div><p>선택하고, 도전하고, 함께 배우는 어린이 경제교육</p><small>학생의 실명과 연락처는 수집하지 않습니다.</small></footer>
    </main>
  );
}
