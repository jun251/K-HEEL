"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { GameOutcome } from "./GradeGame";
import TrafficQrScanner from "./TrafficQrScanner";

type Signal = "green" | "yellow" | "red";
type TrafficCard = {
  situation: string;
  signal: Signal;
  explanation: string;
};

const signals: Record<Signal, { label: string; meaning: string; colorName: string }> = {
  green: { label: "꼭 필요한 소비", meaning: "생활하거나 건강을 지키는 데 꼭 필요한 소비예요.", colorName: "초록" },
  yellow: { label: "한 번 더 생각할 소비", meaning: "지금 꼭 사야 하는지, 돈은 충분한지 생각해 봐요.", colorName: "노랑" },
  red: { label: "필요하지 않은 충동 소비", meaning: "필요하지 않은데 순간적으로 사고 싶어 한 소비예요.", colorName: "빨강" },
};

const trafficCards: TrafficCard[] = [
  { situation: "배가 안 고픈데 친구가 먹길래 나도 간식을 샀어요", signal: "red", explanation: "배가 고프지 않은데 친구를 따라 산 간식은 필요하지 않은 충동 소비예요." },
  { situation: "비가 오는데 우산이 없어서 우산을 샀어요", signal: "green", explanation: "비를 맞지 않도록 몸을 보호하는 우산은 지금 꼭 필요한 소비예요." },
  { situation: "용돈을 조금만 더 모으면 갖고 싶은 걸 살 수 있어요", signal: "yellow", explanation: "바로 사기보다 정말 필요한지, 돈을 더 모아도 괜찮은지 한 번 더 생각해요." },
  { situation: "저녁에 먹을 밥 재료가 없어서 장을 봤어요", signal: "green", explanation: "가족이 먹을 식사를 준비하는 재료는 생활에 꼭 필요한 소비예요." },
  { situation: "친구 필통이 예뻐 보여서 나도 사고 싶어졌어요", signal: "yellow", explanation: "지금 쓰는 필통이 있는지 살펴보고, 정말 필요한지 한 번 더 생각해요." },
  { situation: "용돈을 다 쓰면 이번 달엔 더 못 사는데 갖고 싶은 장난감을 봤어요", signal: "yellow", explanation: "용돈을 모두 쓰기 전에 꼭 필요한 지출이 남았는지 한 번 더 생각해야 해요." },
  { situation: "이미 많은 스티커인데 예뻐서 또 샀어요", signal: "red", explanation: "이미 충분히 있는데 예쁘다는 마음만으로 또 산 것은 충동 소비예요." },
  { situation: "생일 선물로 받고 싶은 게 있는데 조금 비싸요", signal: "yellow", explanation: "가격이 비싸다면 꼭 원하는지, 더 알맞은 선택은 없는지 한 번 더 생각해요." },
  { situation: "계산대 앞에 놓인 사탕을 그냥 집었어요", signal: "red", explanation: "계획하지 않았는데 눈에 보여 바로 집은 것은 충동 소비예요." },
  { situation: "다음 주에 필요할 것 같아서 미리 사둘지 고민돼요", signal: "yellow", explanation: "정말 필요해질지와 집에 이미 있는지 확인한 뒤 결정해요." },
  { situation: "필요 없는데 광고에서 봐서 그냥 사고 싶어졌어요", signal: "red", explanation: "필요하지 않은데 광고를 보고 갑자기 사고 싶은 것은 충동 소비예요." },
  { situation: "신발이 다 헤져서 구멍이 나서 새 신발을 샀어요", signal: "green", explanation: "신을 수 있는 신발이 필요하므로 새 신발은 꼭 필요한 소비예요." },
  { situation: "색깔만 다른 같은 장난감이 집에 있는데 또 샀어요", signal: "red", explanation: "같은 장난감이 이미 있는데 또 산 것은 필요하지 않은 충동 소비예요." },
  { situation: "비슷한 색 옷이 이미 있는데 다른 색이 예뻐서 사고 싶어요", signal: "yellow", explanation: "비슷한 옷이 있다면 새 옷이 정말 필요한지 한 번 더 생각해요." },
  { situation: "연필이 많이 남았는데 새로 나온 거라 또 샀어요", signal: "red", explanation: "쓸 연필이 많이 있는데 새 제품이라는 이유로 또 산 것은 충동 소비예요." },
  { situation: "날씨가 추워졌는데 따뜻한 옷이 없어서 외투를 샀어요", signal: "green", explanation: "추운 날 몸을 따뜻하게 지켜 줄 외투는 꼭 필요한 소비예요." },
  { situation: "공책을 다 써서 새 공책을 샀어요", signal: "green", explanation: "공부에 사용할 공책을 다 썼으므로 새 공책은 꼭 필요한 소비예요." },
  { situation: "용돈을 다 썼는데 부모님 카드로 사달라고 졸랐어요", signal: "red", explanation: "돈이 없는데도 계획 없이 사 달라고 조르는 것은 충동 소비예요." },
  { situation: "학교 준비물인 색연필이 다 닳아서 새로 샀어요", signal: "green", explanation: "학교에서 사용할 준비물이 다 닳았으므로 꼭 필요한 소비예요." },
  { situation: "이가 아파서 치과에 가서 치료를 받았어요", signal: "green", explanation: "아픈 이를 치료해 건강을 지키는 것은 꼭 필요한 소비예요." },
];

export default function TrafficLightGame({ onFinish, disabled }: { onFinish: (outcome: GameOutcome) => void; disabled: boolean }) {
  const [phase, setPhase] = useState<"rules" | "playing" | "complete">("rules");
  const [cardIndex, setCardIndex] = useState(0);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [hadWrongChoice, setHadWrongChoice] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);

  const card = trafficCards[cardIndex];
  const score = firstTryCorrect * 5;

  const choose = useCallback((signal: Signal) => {
    if (disabled || feedback?.correct) return;
    setSelected(signal);
    if (signal === card.signal) {
      if (!hadWrongChoice) setFirstTryCorrect((current) => current + 1);
      setFeedback({ correct: true, message: card.explanation });
    } else {
      setHadWrongChoice(true);
      setFeedback({ correct: false, message: "이 신호는 상황과 조금 달라요. 상황을 다시 읽고 골라보세요." });
    }
  }, [card.explanation, card.signal, disabled, feedback?.correct, hadWrongChoice]);

  function nextCard() {
    if (cardIndex === trafficCards.length - 1) {
      setPhase("complete");
      return;
    }
    setCardIndex((current) => current + 1);
    setSelected(null);
    setFeedback(null);
    setHadWrongChoice(false);
  }

  if (phase === "rules") {
    return (
      <section className="traffic-game traffic-rules" aria-labelledby="traffic-game-title">
        <div className="traffic-rules-copy">
          <span>1·2학년 경제 게임</span>
          <h3 id="traffic-game-title">신호등 소비 게임</h3>
          <p>상황을 읽고 어떤 소비인지 알맞은 신호를 골라보세요.</p>
        </div>
        <div className="traffic-rule-lights">
          {(Object.keys(signals) as Signal[]).map((signal) => (
            <article className={signal} key={signal}>
              <i aria-hidden="true" />
              <div><strong>{signals[signal].colorName} · {signals[signal].label}</strong><p>{signals[signal].meaning}</p></div>
            </article>
          ))}
        </div>
        <ol className="traffic-howto">
          <li><b>1</b>상황을 천천히 읽어요.</li>
          <li><b>2</b>초록·노랑·빨강 QR카드 중 하나를 찍어요.</li>
          <li><b>3</b>정답 이유를 읽고 다음 카드로 가요.</li>
        </ol>
        <div className="traffic-rule-actions">
          <button className="primary-button traffic-start" type="button" disabled={disabled} onClick={() => setPhase("playing")}>게임 시작하기 →</button>
          <Link className="traffic-qr-link" href="/traffic-qr" target="_blank">초록·노랑·빨강 QR카드 열기</Link>
        </div>
      </section>
    );
  }

  if (phase === "complete") {
    return (
      <section className="traffic-game traffic-complete">
        <div className="traffic-complete-lights" aria-hidden="true"><i /><i /><i /></div>
        <span>20개 상황 완료</span>
        <h3>신호등 소비 탐험 성공!</h3>
        <strong>{score}점</strong>
        <p>{score >= 80 ? "소비 신호를 아주 잘 구별했어요!" : "필요한 소비인지 한 번 더 생각하는 습관이 생겼어요!"}</p>
        <button className="primary-button" type="button" disabled={disabled} onClick={() => onFinish({ score, remainingBudget: 0 })}>결과판에 기록하기</button>
      </section>
    );
  }

  return (
    <section className="traffic-game traffic-card-game" aria-label={`신호등 소비 게임 카드 ${cardIndex + 1}`}>
      <header className="traffic-game-header">
        <div><span>신호등 소비 게임</span><strong>카드 {cardIndex + 1} / {trafficCards.length}</strong></div>
        <div className="traffic-game-progress" aria-hidden="true"><i style={{ width: `${((cardIndex + 1) / trafficCards.length) * 100}%` }} /></div>
        <small>첫 선택 점수 {score}점</small>
      </header>

      <div className="traffic-card-layout">
        <div className="traffic-card-image">
          <Image src={`/game-images/traffic-light/card-${String(cardIndex + 1).padStart(2, "0")}.jpeg`} alt="" fill sizes="(max-width: 720px) 100vw, 42vw" priority={cardIndex === 0} />
        </div>
        <article className="traffic-card-question">
          <span>상황을 읽어봐요</span>
          <h3>{card.situation}</h3>
          <p>어떤 신호인지 생각하고 해당 QR카드를 카메라에 비춰보세요.</p>
          <TrafficQrScanner scanKey={cardIndex} disabled={disabled || Boolean(feedback?.correct)} onSignal={choose} />
          <details className="traffic-touch-fallback">
            <summary>카메라를 사용할 수 없나요?</summary>
            <div className="traffic-signal-choices" role="group" aria-label="화면에서 소비 신호 선택">
            {(Object.keys(signals) as Signal[]).map((signal) => (
              <button key={signal} type="button" className={`${signal} ${selected === signal ? "selected" : ""}`} aria-pressed={selected === signal} disabled={disabled || Boolean(feedback?.correct)} onClick={() => choose(signal)}>
                <i aria-hidden="true" /><strong>{signals[signal].colorName}</strong><small>{signals[signal].label}</small>
              </button>
            ))}
            </div>
          </details>
        </article>
      </div>

      {feedback && (
        <div className={`traffic-feedback ${feedback.correct ? "correct" : "wrong"}`} role="status">
          <div><strong>{feedback.correct ? `${signals[card.signal].colorName} 신호가 맞아요!` : "한 번 더 생각해 볼까요?"}</strong><p>{feedback.message}</p></div>
          {feedback.correct && <button type="button" onClick={nextCard}>{cardIndex === trafficCards.length - 1 ? "결과 보기" : "다음 카드"} →</button>}
        </div>
      )}
    </section>
  );
}
