"use client";

import { useState } from "react";
import type { GradeGameProps } from "./types";

const options = [
  { name: "바로 오늘 쓰기", value: 20 },
  { name: "절반 저축하기", value: 30 },
  { name: "목표를 정해 저축하기", value: 50 },
];

export function GradeFiveSixGame({ onFinish, disabled }: GradeGameProps) {
  const [choice, setChoice] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const score = choice === null ? 0 : options[choice].value + 50;

  if (done) {
    return <GameComplete score={Math.round(score)} onFinish={onFinish} disabled={disabled} />;
  }

  return (
    <div className="mission">
      <div className="mission-question"><b>용돈 10,000원이 생겼어요. 어떻게 할까요?</b></div>
      <div className="choice-grid">
        {options.map((option, index) => (
          <button key={option.name} className={choice === index ? "selected" : ""} onClick={() => setChoice(index)}>
            <span>{choice === index ? "✓" : "+"}</span>
            <strong>{option.name}</strong>
          </button>
        ))}
      </div>
      <button className="primary-button finish" disabled={choice === null} onClick={() => setDone(true)}>선택 완료하기 →</button>
    </div>
  );
}

function GameComplete({ score, onFinish, disabled }: { score: number; onFinish: (score: number) => void; disabled: boolean }) {
  return (
    <div className="game-complete">
      <span>🎉</span>
      <h3>미션 완료!</h3>
      <strong>{score}점</strong>
      <p>{score >= 90 ? "경제 선택 달인! 계획과 필요를 모두 잘 생각했어요." : "좋은 시작이에요! 다음에는 예산과 미래도 함께 생각해 봐요."}</p>
      <button className="primary-button" disabled={disabled} onClick={() => onFinish(score)}>결과판에 기록하기</button>
    </div>
  );
}
