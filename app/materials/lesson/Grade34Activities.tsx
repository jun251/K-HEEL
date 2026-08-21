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
  { question: "더 저렴한 주스의 용량은?", choices: ["1,000mL", "500mL"], answer: "1,000mL", explanation: "1,000mL 주스는 100mL당 300원, 500mL 주스는 100mL당 400원이라 더 저렴해요." },
  { question: "이자가 이자에 더해지는 계산 방식은?", choices: ["복리", "단리"], answer: "복리", explanation: "복리는 원금뿐 아니라 이미 붙은 이자에도 다시 이자가 붙는 계산 방식이에요." },
  { question: "매달 조금씩 돈을 모으는 저축 상품은?", choices: ["예금", "적금"], answer: "적금", explanation: "적금은 정해진 기간 동안 매달 일정한 돈을 차곡차곡 모으는 상품이에요." },
  { question: "같은 일을 더 빨리 끝낸 기간은?", choices: ["3일", "5일"], answer: "3일", explanation: "같은 일을 끝냈다면 3일이 5일보다 기간이 짧아 더 빨리 끝낸 것이에요." },
] as const;

export function Grade34GoldenBellSlide({ readOnly = false }: { readOnly?: boolean }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const quiz = goldenBellQuestions[questionIndex];
  const completed = feedback?.correct && questionIndex === goldenBellQuestions.length - 1;

  function choose(choice: string) {
    if (readOnly || feedback?.correct) return;
    setSelectedChoice(choice);
    setFeedback(choice === quiz.answer
      ? { correct: true, message: quiz.explanation }
      : { correct: false, message: "선택한 답은 정답이 아니에요. 다시 생각해 보세요." });
  }

  function nextQuestion() {
    setQuestionIndex((current) => current + 1);
    setSelectedChoice("");
    setFeedback(null);
  }

  return (
    <section className="grade34-golden-slide" aria-label="도전 경제 골든벨">
      <header>
        <div>
          <span>도전! 경제 골든벨</span>
          <strong>문제 {questionIndex + 1} / {goldenBellQuestions.length}</strong>
        </div>
        <div className="grade34-golden-progress" aria-hidden="true">
          {goldenBellQuestions.map((_, index) => <i key={index} className={index < questionIndex ? "done" : index === questionIndex ? "active" : ""} />)}
        </div>
      </header>

      <div className="grade34-golden-question">
        <small>Q{questionIndex + 1}</small>
        <h2>{quiz.question}</h2>
      </div>

      <div className="grade34-golden-choices" role="group" aria-label="정답 선택">
        {quiz.choices.map((choice, index) => (
          <button
            key={choice}
            type="button"
            className={selectedChoice === choice ? "selected" : ""}
            aria-pressed={selectedChoice === choice}
            disabled={readOnly || Boolean(feedback?.correct)}
            onClick={() => choose(choice)}
          >
            <b>{index + 1}</b><strong>{choice}</strong>
          </button>
        ))}
      </div>

      <div className={`grade34-golden-result ${feedback ? (feedback.correct ? "correct" : "wrong") : "waiting"}`} role="status">
        {completed ? (
          <><strong>골든벨 성공!</strong><p>네 문제를 모두 풀었어요. 경제 개념을 아주 잘 이해했어요!</p></>
        ) : feedback ? (
          <><strong>{feedback.correct ? `정답은 ${quiz.answer}!` : "땡! 다시 선택해 보세요"}</strong><p>{feedback.message}</p></>
        ) : (
          <><strong>{readOnly ? "학생들이 문제를 풀고 있어요" : "두 보기 중 하나를 골라보세요"}</strong><p>정답은 선택한 뒤에만 확인할 수 있어요.</p></>
        )}
        {feedback?.correct && !completed && <button type="button" onClick={nextQuestion}>다음 문제 <span aria-hidden="true">→</span></button>}
      </div>
    </section>
  );
}

export function Grade34UnitPriceSlide({ revealed }: { revealed: boolean }) {
  const products = [
    { label: "A", volume: "500mL", price: "2,000원", unitPrice: "400원", tone: "mint" },
    { label: "B", volume: "1,000mL", price: "3,000원", unitPrice: "300원", tone: "yellow" },
  ] as const;

  return (
    <section className="unit-price-slide" aria-label="100밀리리터당 가격 비교">
      <header>
        <span>단위 가격 비교</span>
        <h2>어느 음료가 더 저렴할까요?</h2>
        <p>양이 다를 때는 같은 양을 기준으로 비교해요.</p>
      </header>
      <div className="unit-price-products">
        {products.map((product) => (
          <article className={`unit-price-product ${product.tone}`} key={product.label}>
            <b>{product.label}</b>
            <div className="unit-price-bottle" aria-hidden="true"><i /></div>
            <dl>
              <div><dt>용량</dt><dd>{product.volume}</dd></div>
              <div><dt>가격</dt><dd>{product.price}</dd></div>
            </dl>
            <div className={`unit-price-result ${revealed ? "revealed" : "hidden"}`}>
              <span>100mL당</span>
              <strong>{revealed ? product.unitPrice : "?원"}</strong>
            </div>
          </article>
        ))}
      </div>
      <footer className={revealed ? "revealed" : ""}>
        {revealed ? <><strong>정답은 B!</strong><span>100mL당 300원으로 A보다 100원 더 저렴해요.</span></> : <><strong>먼저 예상해 보세요</strong><span>아래에서 A 또는 B를 선택하면 단위 가격이 공개돼요.</span></>}
      </footer>
    </section>
  );
}

export default function Grade34Activities({ sourceSlide, token, onUnitPriceReveal }: Props) {
  const [surveyChoice, setSurveyChoice] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("");
  const [budgetPlan, setBudgetPlan] = useState<Record<string, string>>({});
  const [priceFeedback, setPriceFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  useEffect(() => {
    setSurveyChoice("");
    setSelectedAmount("");
    setBudgetPlan({});
    setPriceFeedback(null);
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

  return null;
}
