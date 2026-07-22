"use client";

import { useEffect, useState } from "react";
import { getGradeGame, gradeGameMeta } from "./games";
import type { Player } from "./games/types";

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

  const meta = player ? gradeGameMeta[player.gradeBand] : null;
  const ActiveGame = player ? getGradeGame(player.gradeBand) : null;

  return (
    <main className="game-window-main">
      <header className="game-window-top">
        <div className="brand"><span>₩</span> 머니놀이터</div>
        <button type="button" onClick={() => window.close()}>창 닫기</button>
      </header>

      <section className="game-shell game-window-shell">
        {player && meta && ActiveGame ? (
          <>
            <div className="game-heading">
              <span>{meta.label} 미션</span>
              <h2>{player.nickname}님, {meta.title}</h2>
              <p>{meta.description}</p>
            </div>
            <ActiveGame onFinish={finishGame} disabled={loading} />
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
