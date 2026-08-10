"use client";

import { DragEvent, useEffect, useState } from "react";

type Feedback = { correct: boolean; message: string } | null;

const bankingItems = [
  { id: "deposit", label: "입금", sentence: "용돈 50,000원을 통장에 넣어요", description: "돈이 은행 계좌로 들어감" },
  { id: "withdraw", label: "출금", sentence: "문구점에서 쓸 돈 2,000원을 찾아요", description: "돈이 계좌에서 밖으로 나옴" },
  { id: "transfer", label: "송금", sentence: "친구에게 2,000원을 보내줘요", description: "내 계좌에서 친구 계좌로 옮겨감" },
] as const;

const safetyQuestions = [
  { question: "친구니까 내 통장 비밀번호를 알려줘도 된다.", answer: "X" },
  { question: "은행 직원에게는 비밀번호를 알려줘도 된다.", answer: "X" },
  { question: "모르는 문자의 링크는 바로 누르지 않는다.", answer: "O" },
  { question: "모르는 사람이 돈을 보내달라 하면 보내준다.", answer: "X" },
] as const;

const priceQuestions = [
  { question: "사과를 사고 싶은 학생이 늘어납니다.", answer: "가격이 올라간다" },
  { question: "비가 많이 와서 가게에서 팔 수 있는 사과의 양이 줄어듭니다.", answer: "가격이 올라간다" },
  { question: "농장에서 사과 수확을 많이 해서 팔 수 있는 사과의 양이 늘어납니다.", answer: "가격이 내려간다" },
] as const;

const consumptionQuestions = [
  { question: "물건을 사기 전에 정말 필요한지 생각하는 것은 합리적 소비이다.", answer: "O" },
  { question: "친구가 가지고 있다는 이유만으로 바로 구입하는 것은 계획 소비이다.", answer: "X" },
  { question: "할인하는 물건은 필요하지 않아도 무조건 사는 것이 좋다.", answer: "X" },
] as const;

export function Grade56InvestmentChoice({ readOnly = false, onCorrect }: { readOnly?: boolean; onCorrect?: () => void }) {
  const [view, setView] = useState<"choices" | "retry" | "result">("choices");

  if (view === "result") {
    return (
      <div className="grade56-investment-result">
        <img src="/lesson-slides/grade-5-6/slide-25.png" alt="투자 선택 결과" />
      </div>
    );
  }

  if (view === "retry") {
    return (
      <section className="grade56-investment-retry" aria-live="polite">
        <span aria-hidden="true">!</span>
        <h2>이건 투자가 아니라 소비예요!</h2>
        <p>먹거나 사용하면 사라지는 물건을 사는 것은 소비예요.<br />다시 선택해 보아요.</p>
        <button type="button" onClick={() => setView("choices")}>다시 선택하기</button>
      </section>
    );
  }

  return (
    <section className="grade56-investment-choice" aria-label="소비와 투자 선택">
      <header><strong>어느 쪽이 투자일까요?</strong><span>두 상황을 비교하고 하나를 선택하세요.</span></header>
      <div>
        <button type="button" disabled={readOnly} onClick={() => setView("retry")}>
          <img src="/lesson-slides/grade-5-6/slide-23.png" alt="선택 1 편의점에서 과자와 음료수 사 먹기" />
          <b>선택 1</b>
        </button>
        <button type="button" disabled={readOnly} onClick={() => { if (onCorrect) onCorrect(); else setView("result"); }}>
          <img src="/lesson-slides/grade-5-6/slide-24.png" alt="선택 2 희귀 포켓몬 카드 구입하기" />
          <b>선택 2</b>
        </button>
      </div>
    </section>
  );
}

function SequentialQuiz({
  title,
  questions,
  choices,
}: {
  title: string;
  questions: readonly { question: string; answer: string }[];
  choices: readonly string[];
}) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const question = questions[index];

  function choose(answer: string) {
    const correct = answer === question.answer;
    setFeedback(correct ? { correct: true, message: "정답이에요!" } : { correct: false, message: "땡! 다시 선택해 보세요." });
  }

  return (
    <section className="lesson-interaction-panel grade56-quiz" aria-label={title}>
      <p className="lesson-quiz-progress">문제 {index + 1} / {questions.length}</p>
      <h3>{question.question}</h3>
      <div className={`grade56-quiz-choices ${choices.length === 2 && choices[0].length === 1 ? "ox" : ""}`}>
        {choices.map((choice) => <button type="button" key={choice} onClick={() => choose(choice)}>{choice}</button>)}
      </div>
      {feedback && <p className={`lesson-feedback ${feedback.correct ? "correct" : "wrong"}`}>{feedback.message}</p>}
      {feedback?.correct && index < questions.length - 1 && (
        <button type="button" className="lesson-next-question" onClick={() => { setIndex((value) => value + 1); setFeedback(null); }}>다음 문제</button>
      )}
      {feedback?.correct && index === questions.length - 1 && <p className="lesson-feedback correct">모든 문제를 풀었어요!</p>}
    </section>
  );
}

export default function Grade56Activities({ sourceSlide }: { sourceSlide: number }) {
  const [bankingPlan, setBankingPlan] = useState<Record<string, string>>({});
  const [selectedBanking, setSelectedBanking] = useState("");
  const [bankingFeedback, setBankingFeedback] = useState("");

  useEffect(() => {
    setBankingPlan({});
    setSelectedBanking("");
    setBankingFeedback("");
  }, [sourceSlide]);

  function placeBanking(targetId: string, answer = selectedBanking) {
    if (!answer) return;
    if (targetId !== answer) {
      setBankingFeedback("땡! 문장의 돈이 어떻게 움직이는지 다시 생각해 보세요.");
      return;
    }
    setBankingPlan((current) => ({ ...current, [targetId]: answer }));
    setSelectedBanking("");
    setBankingFeedback("");
  }

  function dropBanking(event: DragEvent<HTMLButtonElement>, targetId: string) {
    event.preventDefault();
    placeBanking(targetId, event.dataTransfer.getData("text/plain"));
  }

  if (sourceSlide === 9) {
    const completed = Object.keys(bankingPlan).length === bankingItems.length;
    return (
      <section className="lesson-interaction-panel grade56-banking" aria-label="은행 거래 용어 연결하기">
        <h3>은행 거래 용어를 알맞은 문장에 넣어 보세요</h3>
        <p>용어를 끌어 놓거나, 용어를 누른 뒤 알맞은 문장을 선택하세요.</p>
        <div className="grade56-banking-labels">
          {bankingItems.map((item) => (
            <button type="button" key={item.id} draggable disabled={Boolean(bankingPlan[item.id])} className={selectedBanking === item.id ? "selected" : ""}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => setSelectedBanking(item.id)}>{item.label}</button>
          ))}
        </div>
        <div className="grade56-banking-sentences">
          {bankingItems.map((item) => (
            <button type="button" key={item.id} className={bankingPlan[item.id] ? "correct" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropBanking(event, item.id)} onClick={() => placeBanking(item.id)}>
              <span>{item.sentence}<small>{item.description}</small></span>
              <strong>{bankingPlan[item.id] ? item.label : "여기에 넣기"}</strong>
            </button>
          ))}
        </div>
        {bankingFeedback && <p className="lesson-feedback wrong">{bankingFeedback}</p>}
        {completed && <p className="lesson-feedback correct">정답! 입금·출금·송금을 모두 알맞게 연결했어요.</p>}
      </section>
    );
  }

  if (sourceSlide === 10) return <SequentialQuiz title="금융 안전 OX 퀴즈" questions={safetyQuestions} choices={["O", "X"]} />;
  if (sourceSlide === 16) return <SequentialQuiz title="가격 변화 상황 퀴즈" questions={priceQuestions} choices={["가격이 올라간다", "가격이 내려간다"]} />;
  if (sourceSlide === 19) return <SequentialQuiz title="합리적 소비 OX 퀴즈" questions={consumptionQuestions} choices={["O", "X"]} />;
  return null;
}
