"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type GradeBand = "1-2" | "3-4" | "5-6";
type Player = { token: string; nickname: string; roomCode: string; gradeBand: GradeBand };
type Result = { rank: number; nickname: string; gradeBand: GradeBand; score: number };

const gradeInfo: Record<GradeBand, { label: string; title: string; copy: string; color: string }> = {
  "1-2": { label: "1·2학년", title: "꼭 필요할까?", copy: "필요한 것과 갖고 싶은 것을 구별해요.", color: "lime" },
  "3-4": { label: "3·4학년", title: "만원 장보기", copy: "예산 안에서 똑똑하게 선택해요.", color: "yellow" },
  "5-6": { label: "5·6학년", title: "미래 통장", copy: "오늘의 선택이 내일을 어떻게 바꾸는지 알아봐요.", color: "blue" },
};

const demoResults: Result[] = [
  { rank: 1, nickname: "알뜰토끼", gradeBand: "3-4", score: 100 },
  { rank: 2, nickname: "저축왕", gradeBand: "5-6", score: 90 },
  { rank: 3, nickname: "동전탐험대", gradeBand: "1-2", score: 80 },
];

export default function Home() {
  const [roomCode, setRoomCode] = useState("2407");
  const [nickname, setNickname] = useState("");
  const [gradeBand, setGradeBand] = useState<GradeBand>("1-2");
  const [player, setPlayer] = useState<Player | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [resultRoom, setResultRoom] = useState("2407");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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

  const joinRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(roomCode)) return setStatus("입장코드는 숫자 4~6자리로 입력해 주세요.");
    if (nickname.trim().length < 2) return setStatus("닉네임을 두 글자 이상 입력해 주세요.");
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, nickname, gradeBand }),
      });
      const data = (await response.json()) as Player & { error?: string };
      if (!response.ok) throw new Error(data.error || "입장할 수 없습니다.");
      setPlayer(data);
      setResultRoom(roomCode);
      document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const finishGame = async (score: number) => {
    if (!player) return;
    setLoading(true);
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, score, gameId: `game-${player.gradeBand}` }),
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
        <a className="brand" href="#top" aria-label="머니놀이터 홈"><span>₩</span> 머니놀이터</a>
        <nav><a href="#grades">게임 둘러보기</a><a href="#results">우리 방 결과</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">놀이로 배우는 어린이 경제교육</p>
          <h1>돈을 쓰는 선택이<br/><em>즐거운 게임</em>이 된다!</h1>
          <p className="hero-description">학년에 꼭 맞는 경제 미션을 해결하고, 우리 반 친구들과 함께 경제 감각을 키워요.</p>
          <div className="hero-points"><span>✓ 회원가입 없이</span><span>✓ 휴대폰으로 바로</span><span>✓ 결과는 한눈에</span></div>
        </div>

        <form className="join-card" onSubmit={joinRoom}>
          <div className="card-label">지금 바로 참여하기</div>
          <label>입장코드<input value={roomCode} onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" aria-describedby="code-help" /></label>
          <small id="code-help">선생님이 알려준 숫자 코드를 입력하세요.</small>
          <label>닉네임<input value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 10))} placeholder="예: 알뜰토끼" /></label>
          <fieldset><legend>나의 학년군</legend><div className="grade-pills">{(Object.keys(gradeInfo) as GradeBand[]).map((band) => <button className={gradeBand === band ? "active" : ""} type="button" key={band} onClick={() => setGradeBand(band)}>{gradeInfo[band].label}</button>)}</div></fieldset>
          <button className="primary-button" disabled={loading}>{loading ? "잠시만요…" : "게임방 입장하기 →"}</button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      </section>

      <section className="section" id="grades">
        <div className="section-heading"><div><p className="eyebrow">학년별 맞춤 미션</p><h2>내 학년에 딱 맞는 경제 게임</h2></div><p>쉬운 선택부터 미래 계획까지,<br/>한 단계씩 경제 근육을 키워요.</p></div>
        <div className="grade-grid">{(Object.keys(gradeInfo) as GradeBand[]).map((band, index) => <article className={`grade-card ${gradeInfo[band].color}`} key={band}><div className="grade-number">0{index + 1}</div><span className="grade-tag">{gradeInfo[band].label}</span><div className="game-icon" aria-hidden="true">{band === "1-2" ? "🛒" : band === "3-4" ? "🧺" : "🌱"}</div><h3>{gradeInfo[band].title}</h3><p>{gradeInfo[band].copy}</p><button onClick={() => { setGradeBand(band); document.querySelector<HTMLInputElement>('.join-card input')?.focus(); }}>이 게임 시작하기 <span>→</span></button></article>)}</div>
      </section>

      {player && <section className="game-section" id="game"><div className="game-shell"><div className="game-heading"><span>{gradeInfo[player.gradeBand].label} 미션</span><h2>{player.nickname}님, 준비됐나요?</h2><p>정답보다 더 중요한 건 왜 그렇게 선택했는지 생각하는 거예요.</p></div><GradeGame band={player.gradeBand} onFinish={finishGame} disabled={loading} /></div></section>}

      <section className="results-section" id="results">
        <div className="results-intro"><p className="eyebrow">우리 방 경제 리포트</p><h2>함께 쌓은<br/>오늘의 경제 감각</h2><p>입장코드가 같은 친구들의 최고 점수를 모았어요. 실명 대신 닉네임만 표시됩니다.</p><label>결과를 볼 입장코드<div className="result-search"><input value={resultRoom} onChange={(e) => setResultRoom(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric"/><button onClick={() => void loadResults(resultRoom)}>조회</button></div></label></div>
        <div className="scoreboard"><div className="score-summary"><div><strong>{results.length || shownResults.length}</strong><span>참여 어린이</span></div><div><strong>{average}</strong><span>평균 점수</span></div><div><strong>{resultRoom}</strong><span>입장코드</span></div></div>{!results.length && <p className="demo-notice">아직 저장된 결과가 없어 예시 결과를 보여드려요.</p>}<ol>{shownResults.map((item, index) => <li key={`${item.nickname}-${index}`}><span className={`rank rank-${index + 1}`}>{index + 1}</span><div><strong>{item.nickname}</strong><small>{gradeInfo[item.gradeBand].label}</small></div><b>{item.score}<small>점</small></b></li>)}</ol></div>
      </section>

      <footer><div className="brand"><span>₩</span> 머니놀이터</div><p>선택하고, 도전하고, 함께 배우는 어린이 경제교육</p><small>학생의 실명과 연락처는 수집하지 않습니다.</small></footer>
    </main>
  );
}

function GradeGame({ band, onFinish, disabled }: { band: GradeBand; onFinish: (score: number) => void; disabled: boolean }) {
  const [choices, setChoices] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const options = band === "1-2"
    ? [{ name: "아플 때 먹는 약", value: 20 }, { name: "새로 나온 장난감", value: 0 }, { name: "학교에 갈 버스비", value: 20 }, { name: "유행하는 스티커", value: 0 }, { name: "점심 식사", value: 20 }]
    : band === "3-4"
      ? [{ name: "공책", price: 2000 }, { name: "간식", price: 3000 }, { name: "학용품", price: 4000 }, { name: "키링", price: 5000 }, { name: "저축", price: 1000 }]
      : [{ name: "전부 오늘 쓰기", value: 20 }, { name: "절반 저축하기", value: 30 }, { name: "목표를 정해 저축하기", value: 50 }];
  const selectedTotal = band === "3-4" ? choices.reduce((sum, idx) => sum + (options[idx] as { price: number }).price, 0) : 0;
  const score = band === "1-2" ? choices.reduce((sum, idx) => sum + (options[idx] as { value: number }).value, 40) : band === "3-4" ? (selectedTotal <= 10000 && choices.length >= 3 ? 100 : Math.max(20, 100 - Math.abs(selectedTotal - 10000) / 100)) : choices.length ? (options[choices[0]] as { value: number }).value + 50 : 0;
  const toggle = (index: number) => setChoices((current) => band === "5-6" ? [index] : current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);

  if (done) return <div className="game-complete"><span>🎉</span><h3>미션 완료!</h3><strong>{Math.round(score)}점</strong><p>{score >= 90 ? "경제 선택 달인! 계획과 필요를 모두 잘 생각했어요." : "좋은 시작이에요! 다음에는 예산과 미래도 함께 생각해 봐요."}</p><button className="primary-button" disabled={disabled} onClick={() => onFinish(Math.round(score))}>결과판에 기록하기</button></div>;

  return <div className="mission"><div className="mission-question"><b>{band === "1-2" ? "꼭 필요한 것만 골라 보세요" : band === "3-4" ? "10,000원 안에서 3개 이상 골라 보세요" : "용돈 10,000원이 생겼어요. 어떻게 할까요?"}</b>{band === "3-4" && <span className={selectedTotal > 10000 ? "over" : ""}>{selectedTotal.toLocaleString()}원 / 10,000원</span>}</div><div className="choice-grid">{options.map((option, index) => <button key={option.name} className={choices.includes(index) ? "selected" : ""} onClick={() => toggle(index)}><span>{choices.includes(index) ? "✓" : "+"}</span><strong>{option.name}</strong>{"price" in option && <small>{option.price.toLocaleString()}원</small>}</button>)}</div><button className="primary-button finish" disabled={!choices.length} onClick={() => setDone(true)}>선택 완료하기 →</button></div>;
}
