"use client";

import { DragEvent, useEffect, useState } from "react";

type Props = {
  sourceSlide: number;
  token?: string;
  onUnitPriceReveal?: (revealed: boolean) => void;
};

const surveyChoices = [
  { value: "lightning", label: "1. 번개형", description: "갖고 싶은 것을 바로 산다" },
  { value: "half", label: "2. 반반형", description: "반은 쓰고 반은 모은다" },
  { value: "turtle", label: "3. 거북이형", description: "먼저 모으고 천천히 생각한다" },
] as const;

const budgetAmounts = ["2,000원", "1,500원", "1,000원", "500원"];
const budgetSlots = ["저축", "필요", "즐거움", "나눔"];

const goldenBellQuestions = [
  { question: "더 저렴한 주스의 용량은?", choices: ["1,000mL", "500mL"], answer: "1,000mL" },
  { question: "이자가 이자에 더해지는 계산 방식은?", choices: ["복리", "단리"], answer: "복리" },
  { question: "매달 조금씩 돈을 모으는 저축 상품은?", choices: ["예금", "적금"], answer: "적금" },
  { question: "같은 일을 더 빨리 끝낸 기간은?", choices: ["3일", "5일"], answer: "3일" },
] as const;

export default function Grade34Activities({ sourceSlide, token, onUnitPriceReveal }: Props) {
  const [surveyChoice, setSurveyChoice] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("");
  const [budgetPlan, setBudgetPlan] = useState<Record<string, string>>({});
  const [priceFeedback, setPriceFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [goldenIndex, setGoldenIndex] = useState(0);
  const [goldenFeedback, setGoldenFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  useEffect(() => {
    setSurveyChoice("");
    setSelectedAmount("");
    setBudgetPlan({});
    setPriceFeedback(null);
    setGoldenIndex(0);
    setGoldenFeedback(null);
    onUnitPriceReveal?.(false);
  }, [sourceSlide, onUnitPriceReveal]);

  async function chooseSurvey(answer: string) {
    setSurveyChoice(answer);
    if (!token) return;
    setSending(true);
    try {
      const response = await fetch("/api/classroom/lesson-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sourceSlide, answer }),
      });
      if (!response.ok) throw new Error("응답 저장 실패");
    } catch {
      setSurveyChoice("");
    } finally {
      setSending(false);
    }
  }

  function placeAmount(slot: string, amount = selectedAmount) {
    if (!amount) return;
    setBudgetPlan((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) if (next[key] === amount) delete next[key];
      next[slot] = amount;
      return next;
    });
    setSelectedAmount("");
  }

  function dropAmount(event: DragEvent<HTMLButtonElement>, slot: string) {
    event.preventDefault();
    placeAmount(slot, event.dataTransfer.getData("text/plain"));
  }

  function choosePrice(answer: "A" | "B") {
    const correct = answer === "B";
    setPriceFeedback(correct
      ? { correct: true, message: "정답! A는 100mL당 400원, B는 100mL당 300원이에요." }
      : { correct: false, message: "땡! 다시 선택해 보세요." });
    onUnitPriceReveal?.(correct);
  }

  function chooseGolden(answer: string) {
    const correct = answer === goldenBellQuestions[goldenIndex].answer;
    setGoldenFeedback(correct
      ? { correct: true, message: "정답이에요!" }
      : { correct: false, message: "땡! 다시 선택해 보세요." });
  }

  if (sourceSlide === 3) {
    return (
      <section className="lesson-interaction-panel grade34-activity" aria-label="소비 성향 선택">
        <h3>나는 어떤 소비 유형일까요?</h3>
        <p>가장 나와 비슷한 유형 하나를 선택해 주세요.</p>
        <div className="grade34-survey-choices">
          {surveyChoices.map((choice) => (
            <button key={choice.value} type="button" disabled={sending} className={surveyChoice === choice.value ? "selected" : ""} onClick={() => chooseSurvey(choice.value)}>
              <strong>{choice.label}</strong><span>{choice.description}</span>
            </button>
          ))}
        </div>
        {surveyChoice && <p className="lesson-feedback correct">선택이 저장됐어요.</p>}
      </section>
    );
  }

  if (sourceSlide === 8) {
    return (
      <section className="lesson-interaction-panel grade34-activity" aria-label="예산 끌어넣기">
        <h3>용돈 예산을 직접 나눠 보세요</h3>
        <p>금액을 끌어 넣거나, 금액을 누른 뒤 넣을 곳을 선택하세요.</p>
        <div className="budget-amounts">
          {budgetAmounts.map((amount) => (
            <button key={amount} type="button" draggable className={selectedAmount === amount ? "selected" : ""}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", amount)} onClick={() => setSelectedAmount(amount)}>{amount}</button>
          ))}
        </div>
        <div className="budget-drop-grid">
          {budgetSlots.map((slot) => (
            <button key={slot} type="button" className={budgetPlan[slot] ? "filled" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropAmount(event, slot)} onClick={() => placeAmount(slot)}>
              <span>{slot}</span><strong>{budgetPlan[slot] || "여기에 넣기"}</strong>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (sourceSlide === 9) {
    return (
      <section className="lesson-interaction-panel grade34-activity" aria-label="단위 가격 퀴즈">
        <h3>어느 주스가 더 저렴할까요?</h3>
        <p>100mL당 가격을 생각해서 골라 보세요.</p>
        <div className="grade34-binary-choices">
          <button type="button" onClick={() => choosePrice("A")}>A. 500mL에 2,000원</button>
          <button type="button" onClick={() => choosePrice("B")}>B. 1,000mL에 3,000원</button>
        </div>
        {priceFeedback && <p className={`lesson-feedback ${priceFeedback.correct ? "correct" : "wrong"}`}>{priceFeedback.message}</p>}
      </section>
    );
  }

  if (sourceSlide === 26) {
    const quiz = goldenBellQuestions[goldenIndex];
    return (
      <section className="lesson-interaction-panel grade34-activity" aria-label="도전 경제 골든벨">
        <p className="lesson-quiz-progress">문제 {goldenIndex + 1} / {goldenBellQuestions.length}</p>
        <h3>{quiz.question}</h3>
        <div className="grade34-binary-choices">
          {quiz.choices.map((choice) => <button key={choice} type="button" onClick={() => chooseGolden(choice)}>{choice}</button>)}
        </div>
        {goldenFeedback && <p className={`lesson-feedback ${goldenFeedback.correct ? "correct" : "wrong"}`}>{goldenFeedback.message}</p>}
        {goldenFeedback?.correct && goldenIndex < goldenBellQuestions.length - 1 && (
          <button type="button" className="lesson-next-question" onClick={() => { setGoldenIndex((value) => value + 1); setGoldenFeedback(null); }}>다음 문제</button>
        )}
        {goldenFeedback?.correct && goldenIndex === goldenBellQuestions.length - 1 && <p className="lesson-feedback correct">모든 문제를 풀었어요!</p>}
      </section>
    );
  }

  return null;
}
