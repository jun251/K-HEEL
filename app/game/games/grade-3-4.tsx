"use client";

import { useState } from "react";
import type { GradeGameProps } from "./types";

const options = [
  { name: "공책", price: 2000 },
  { name: "간식", price: 3000 },
  { name: "학용품", price: 4000 },
  { name: "음료", price: 5000 },
  { name: "저축", price: 1000 },
];

export function GradeThreeFourGame({ onFinish, disabled }: GradeGameProps) {
  const [choices, setChoices] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const selectedTotal = choices.reduce((sum, idx) => sum + options[idx].price, 0);
  const score = selectedTotal <= 10000 && choices.length >= 3 ? 100 : Math.max(20, 100 - Math.abs(selectedTotal - 10000) / 100);
  const toggle = (index: number) => {
    setChoices((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  };

  if (done) {
    return <GameComplete score={Math.round(score)} onFinish={onFinish} disabled={disabled} />;
  }

  return (
    <div className="mission">
      <div className="mission-question">
        <b>10,000원 안에서 3개 이상 골라 보세요</b>
        <span className={selectedTotal > 10000 ? "over" : ""}>{selectedTotal.toLocaleString()}원 / 10,000원</span>
      </div>
      <div className="choice-grid">
        {options.map((option, index) => (
          <button key={option.name} className={choices.includes(index) ? "selected" : ""} onClick={() => toggle(index)}>
            <span>{choices.includes(index) ? "✓" : "+"}</span>
            <strong>{option.name}</strong>
            <small>{option.price.toLocaleString()}원</small>
          </button>
        ))}
      </div>
      <button className="primary-button finish" disabled={!choices.length} onClick={() => setDone(true)}>선택 완료하기 →</button>
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
