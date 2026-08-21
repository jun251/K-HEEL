"use client";

import { useState } from "react";
import type { GameOutcome } from "./GradeGame";
import IslandGame from "./IslandGame";
import TrafficLightGame from "./TrafficLightGame";

type Grade12Game = "traffic" | "island";

export default function Grade12GameMenu({ onFinish, disabled }: { onFinish: (outcome: GameOutcome) => void; disabled: boolean }) {
  const [game, setGame] = useState<Grade12Game | null>(null);

  if (game) {
    return (
      <div className="grade12-selected-game">
        <button className="grade12-back" type="button" disabled={disabled} onClick={() => setGame(null)}>← 다른 게임 고르기</button>
        {game === "traffic" ? <TrafficLightGame onFinish={onFinish} disabled={disabled} /> : <IslandGame onFinish={onFinish} disabled={disabled} />}
      </div>
    );
  }

  return (
    <section className="grade12-game-menu" aria-labelledby="grade12-game-menu-title">
      <header><span>1·2학년 경제 게임</span><h3 id="grade12-game-menu-title">어떤 게임을 해볼까요?</h3><p>게임을 하나 골라 시작해요. 무인도 게임에는 새로운 미션이 계속 추가될 예정이에요.</p></header>
      <div className="grade12-game-options">
        <button className="traffic" type="button" disabled={disabled} onClick={() => setGame("traffic")}>
          <i aria-hidden="true">🚦</i><small>소비 구별 미션</small><strong>신호등 소비 게임</strong><span>필요한 소비, 생각할 소비, 충동 소비를 구별해요.</span><b>게임 선택 →</b>
        </button>
        <button className="island" type="button" disabled={disabled} onClick={() => setGame("island")}>
          <i aria-hidden="true">🏝️</i><small>새로운 게임</small><strong>무인도 게임</strong><span>0.2초 동안 나타난 물건을 빠르게 기억해요.</span><b>게임 선택 →</b>
        </button>
      </div>
    </section>
  );
}
