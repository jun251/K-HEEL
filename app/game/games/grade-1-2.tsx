"use client";

import { useState } from "react";
import type { GradeGameProps } from "./types";

const options = [
  { name: "아플 때 먹는 약", value: 20 },
  { name: "새로 나온 장난감", value: 0 },
  { name: "학교 갈 버스비", value: 20 },
  { name: "유행하는 스티커", value: 0 },
  { name: "점심 식사", value: 20 },
];

export function GradeOneTwoGame({ onFinish, disabled }: GradeGameProps) {
  const [choices, setChoices] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const score = choices.reduce((sum, idx) => sum + options[idx].value, 40);
  const toggle = (index: number) => {
    setChoices((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  };

  if (done) {
    return <GameComplete score={Math.round(score)} onFinish={onFinish} disabled={disabled} />;
  }

  return (
    <div className="mission">
      <div className="mission-question"><b>꼭 필요한 것만 골라 보세요</b></div>
      <div className="choice-grid">
        {options.map((option, index) => (
          <button key={option.name} className={choices.includes(index) ? "selected" : ""} onClick={() => toggle(index)}>
            <span>{choices.includes(index) ? "✓" : "+"}</span>
            <strong>{option.name}</strong>
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
