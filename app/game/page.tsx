"use client";

import { useEffect, useState } from "react";

type GradeBand = "1-2" | "3-4" | "5-6";
type Player = { token: string; nickname: string; roomCode: string; gradeBand: GradeBand };

const gradeInfo: Record<GradeBand, { label: string; title: string }> = {
  "1-2": { label: "1·2학년", title: "꼭 필요할까?" },
  "3-4": { label: "3·4학년", title: "만원 장보기" },
  "5-6": { label: "5·6학년", title: "미래 통장" },
};

export default function GameWindow() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [status, setStatus] = useState("게임 정보를 불러오는 중이에요.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = new URLSearchParams(window.location.search).get("session");
    if (!session) {
      setStatus("입장 정보가 없어요. 원래 화면에서 다시 입장해 주세요.");
      return;
    }

    const storedPlayer = window.localStorage.getItem(`kheel-player-${session}`);
    if (!storedPlayer) {
      setStatus("입장 정보가 만료됐어요. 원래 화면에서 다시 입장해 주세요.");
      return;
    }

    try {
      const parsed = JSON.parse(storedPlayer) as Player;
      setPlayer(parsed);
      setStatus("");
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: parsed.token,
          gameId: `game-${parsed.gradeBand}`,
          status: "in_progress",
        }),
      });
    } catch {
      setStatus("입장 정보를 읽지 못했어요. 원래 화면에서 다시 입장해 주세요.");
    }
  }, []);

  const finishGame = async (score: number) => {
    if (!player) return;
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, score, gameId: `game-${player.gradeBand}` }),
      });

      if (!response.ok) throw new Error("점수 저장에 실패했습니다.");
      window.opener?.postMessage({ type: "kheel-score-saved", roomCode: player.roomCode }, window.location.origin);
      setStatus(`${player.nickname}님의 ${score}점이 결과판에 기록됐어요.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "점수를 저장하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="game-window-main">
      <header className="game-window-top">
        <div className="brand"><span>₩</span> 머니놀이터</div>
        <button type="button" onClick={() => window.close()}>창 닫기</button>
      </header>

      <section className="game-shell game-window-shell">
        {player ? (
          <>
            <div className="game-heading">
              <span>{gradeInfo[player.gradeBand].label} 미션</span>
              <h2>{player.nickname}님, {gradeInfo[player.gradeBand].title}</h2>
              <p>정답보다 더 중요한 건 왜 그렇게 선택했는지 생각하는 거예요.</p>
            </div>
            <GradeGame band={player.gradeBand} onFinish={finishGame} disabled={loading} />
          </>
        ) : (
          <div className="game-window-message">
            <h2>다시 입장해 주세요</h2>
            <p>{status}</p>
          </div>
        )}
        {status && player && <p className="game-window-status" role="status">{status}</p>}
      </section>
    </main>
  );
}

function GradeGame({ band, onFinish, disabled }: { band: GradeBand; onFinish: (score: number) => void; disabled: boolean }) {
  const [choices, setChoices] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const options = band === "1-2"
    ? [{ name: "아플 때 먹는 약", value: 20 }, { name: "새로 나온 장난감", value: 0 }, { name: "학교 갈 버스비", value: 20 }, { name: "유행하는 스티커", value: 0 }, { name: "점심 식사", value: 20 }]
    : band === "3-4"
      ? [{ name: "공책", price: 2000 }, { name: "간식", price: 3000 }, { name: "학용품", price: 4000 }, { name: "음료", price: 5000 }, { name: "저축", price: 1000 }]
      : [{ name: "바로 오늘 쓰기", value: 20 }, { name: "절반 저축하기", value: 30 }, { name: "목표를 정해 저축하기", value: 50 }];
  const selectedTotal = band === "3-4" ? choices.reduce((sum, idx) => sum + (options[idx] as { price: number }).price, 0) : 0;
  const score = band === "1-2" ? choices.reduce((sum, idx) => sum + (options[idx] as { value: number }).value, 40) : band === "3-4" ? (selectedTotal <= 10000 && choices.length >= 3 ? 100 : Math.max(20, 100 - Math.abs(selectedTotal - 10000) / 100)) : choices.length ? (options[choices[0]] as { value: number }).value + 50 : 0;
  const toggle = (index: number) => setChoices((current) => band === "5-6" ? [index] : current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);

  if (done) return <div className="game-complete"><span>🎉</span><h3>미션 완료!</h3><strong>{Math.round(score)}점</strong><p>{score >= 90 ? "경제 선택 달인! 계획과 필요를 모두 잘 생각했어요." : "좋은 시작이에요! 다음에는 예산과 미래도 함께 생각해 봐요."}</p><button className="primary-button" disabled={disabled} onClick={() => onFinish(Math.round(score))}>결과판에 기록하기</button></div>;

  return <div className="mission"><div className="mission-question"><b>{band === "1-2" ? "꼭 필요한 것만 골라 보세요" : band === "3-4" ? "10,000원 안에서 3개 이상 골라 보세요" : "용돈 10,000원이 생겼어요. 어떻게 할까요?"}</b>{band === "3-4" && <span className={selectedTotal > 10000 ? "over" : ""}>{selectedTotal.toLocaleString()}원 / 10,000원</span>}</div><div className="choice-grid">{options.map((option, index) => <button key={option.name} className={choices.includes(index) ? "selected" : ""} onClick={() => toggle(index)}><span>{choices.includes(index) ? "✓" : "+"}</span><strong>{option.name}</strong>{"price" in option && <small>{option.price.toLocaleString()}원</small>}</button>)}</div><button className="primary-button finish" disabled={!choices.length} onClick={() => setDone(true)}>선택 완료하기 →</button></div>;
}
