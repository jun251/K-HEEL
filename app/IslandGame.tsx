"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { GameOutcome } from "./GradeGame";

type IslandItem = { name: string; image: string };
type Phase = "rules" | "flash" | "question" | "complete";

const FLASH_TIME_MS = 200;

const islandItems: IslandItem[] = [
  "생수병", "성냥", "손전등", "담요", "텐트", "냄비", "종이컵", "우산", "나침반", "보조배터리",
  "과자", "빵", "라면", "사탕", "초코파이", "젤리", "아이스크림", "휴대전화", "게임기", "무선 이어폰",
  "스마트워치", "게임 상품권", "강아지 인형", "아이돌 앨범", "아이돌 굿즈", "로봇 장난감", "키보드 키캡", "말랑이 공", "토끼 캐릭터 인형", "카드 게임",
  "슬라임", "분홍 캐릭터 인형", "쿠로미 가방", "응원봉", "축구공", "킥보드", "물총", "색종이", "팽이", "공책",
].map((name, index) => ({ name, image: `/game-images/island/item-${String(index + 1).padStart(2, "0")}.jpg` }));

function choicesFor(index: number) {
  const indexes = [index, (index + 9) % islandItems.length, (index + 19) % islandItems.length, (index + 29) % islandItems.length];
  const choices = indexes.map((itemIndex) => islandItems[itemIndex]);
  const shift = (index * 3) % choices.length;
  return [...choices.slice(shift), ...choices.slice(0, shift)];
}

export default function IslandGame({ onFinish, disabled }: { onFinish: (outcome: GameOutcome) => void; disabled: boolean }) {
  const [phase, setPhase] = useState<Phase>("rules");
  const [itemIndex, setItemIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const item = islandItems[itemIndex];
  const choices = useMemo(() => choicesFor(itemIndex), [itemIndex]);
  const isCorrect = selected === item.name;

  useEffect(() => {
    islandItems.forEach((entry) => {
      const image = new window.Image();
      image.src = entry.image;
    });
  }, []);

  useEffect(() => {
    if (phase !== "flash") return;
    const timer = window.setTimeout(() => setPhase("question"), FLASH_TIME_MS);
    return () => window.clearTimeout(timer);
  }, [itemIndex, phase]);

  function startGame() {
    setItemIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setPhase("flash");
  }

  function choose(name: string) {
    if (disabled || selected) return;
    setSelected(name);
    if (name === item.name) setCorrectCount((count) => count + 1);
  }

  function nextItem() {
    if (itemIndex === islandItems.length - 1) {
      setPhase("complete");
      return;
    }
    setItemIndex((index) => index + 1);
    setSelected(null);
    setPhase("flash");
  }

  if (phase === "rules") {
    return (
      <section className="island-game island-rules" aria-labelledby="island-game-title">
        <div className="island-rules-visual" aria-hidden="true"><span>🏝️</span><i /><i /><i /></div>
        <div className="island-rules-copy">
          <span>1·2학년 무인도 게임 · 첫 번째 미션</span>
          <h3 id="island-game-title">번쩍! 물건 맞히기</h3>
          <p>무인도에 가져갈 물건을 고르기 전, 짧게 나타나는 물건을 빠르게 기억해요.</p>
          <ol>
            <li><b>1</b>사진이 <strong>0.2초</strong> 동안 나타나요.</li>
            <li><b>2</b>사라진 사진 속 물건을 기억해요.</li>
            <li><b>3</b>보기 4개 중 정답을 골라요.</li>
          </ol>
          <button className="primary-button" type="button" disabled={disabled} onClick={startGame}>첫 번째 물건 보기 →</button>
        </div>
      </section>
    );
  }

  if (phase === "complete") {
    const score = correctCount * 5;
    return (
      <section className="island-game island-complete">
        <span aria-hidden="true">🏝️</span>
        <small>물건 40개 기억 완료</small>
        <h3>무인도 첫 번째 미션 성공!</h3>
        <strong>{score}점</strong>
        <p>{correctCount}개의 물건을 정확히 기억했어요.</p>
        <button className="primary-button" type="button" disabled={disabled} onClick={() => onFinish({ score, remainingBudget: 0 })}>결과판에 기록하기</button>
      </section>
    );
  }

  return (
    <section className={`island-game island-round ${phase}`} aria-label={`무인도 물건 맞히기 ${itemIndex + 1}번`}>
      <header>
        <div><span>무인도 게임</span><strong>{itemIndex + 1} / {islandItems.length}</strong></div>
        <div className="island-progress" aria-hidden="true"><i style={{ width: `${((itemIndex + 1) / islandItems.length) * 100}%` }} /></div>
        <small>{correctCount * 5}점</small>
      </header>

      {phase === "flash" ? (
        <div className="island-flash-card">
          <Image src={item.image} alt="잠깐 나타나는 물건" fill sizes="(max-width: 800px) 92vw, 800px" priority={itemIndex < 2} />
        </div>
      ) : (
        <div className="island-question-card">
          <span className="island-question-mark" aria-hidden="true">?</span>
          <h3>방금 어떤 물건이었을까요?</h3>
          <p>{selected ? "정답을 확인하고 다음 물건으로 넘어가세요." : "기억나는 물건 하나를 골라보세요."}</p>
          <div className="island-choices" role="group" aria-label="방금 본 물건 선택">
            {choices.map((choice) => (
              <button
                key={choice.name}
                type="button"
                disabled={disabled || Boolean(selected)}
                className={selected ? (choice.name === item.name ? "correct" : choice.name === selected ? "wrong" : "") : ""}
                onClick={() => choose(choice.name)}
              >
                {choice.name}
              </button>
            ))}
          </div>
          {selected && (
            <div className={`island-answer ${isCorrect ? "correct" : "wrong"}`} role="status">
              <div><strong>{isCorrect ? "정답이에요!" : "아쉬워요!"}</strong><p>사진 속 물건은 <b>{item.name}</b>이었어요.</p></div>
              <button type="button" onClick={nextItem}>{itemIndex === islandItems.length - 1 ? "결과 보기" : "다음 물건"} →</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
