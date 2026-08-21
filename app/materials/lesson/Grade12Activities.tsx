"use client";

export type Grade12Answer = "O" | "X";
export type Grade12Feedback = { correct: boolean; message: string } | null;

export const grade12OxQuizzes: Record<number, { number: number; question: string; answer: Grade12Answer; correctMessage: string }> = {
  17: {
    number: 1,
    question: "필요한 것은 ‘가지고 싶기만 한 것’이에요.",
    answer: "X",
    correctMessage: "정답 X · 필요한 것은 생활에 꼭 필요하거나 문제를 해결해 주는 것이에요. 단순히 갖고 싶은 것은 원하는 것에 가까워요.",
  },
  18: {
    number: 2,
    question: "목이 마를 때 물은 필요한 것이에요.",
    answer: "O",
    correctMessage: "정답 O · 물은 목마름을 해결하고 우리 몸을 건강하게 유지하는 데 필요한 것이에요.",
  },
  19: {
    number: 3,
    question: "원하는 것은 가지고 싶거나 하고 싶은 것이에요.",
    answer: "O",
    correctMessage: "정답 O · 꼭 필요한 것은 아니어도 원하는 마음은 소중해요. 필요한 것과 구분해서 선택하면 돼요.",
  },
  20: {
    number: 4,
    question: "할인하면 필요 없는 물건도 꼭 사야 해요.",
    answer: "X",
    correctMessage: "정답 X · 가격이 싸더라도 필요하지 않다면 사지 않는 것이 좋아요. 먼저 정말 필요한지 생각해요.",
  },
};

type Grade12OxQuizSlideProps = {
  sourceSlide: number;
  selectedAnswer: Grade12Answer | null;
  feedback: Grade12Feedback;
  disabled?: boolean;
  onAnswer: (answer: Grade12Answer) => void;
};

export default function Grade12OxQuizSlide({ sourceSlide, selectedAnswer, feedback, disabled = false, onAnswer }: Grade12OxQuizSlideProps) {
  const quiz = grade12OxQuizzes[sourceSlide];
  if (!quiz) return null;

  return (
    <section className="grade12-quiz-slide" aria-label={`O X 퀴즈 ${quiz.number}`}>
      <div className="grade12-quiz-copy">
        <span>OX QUIZ · {quiz.number}</span>
        <h2>{quiz.question}</h2>
        <p>맞다고 생각하면 O, 틀리다고 생각하면 X를 골라보세요.</p>
      </div>

      <div className="grade12-slide-choices" role="group" aria-label="O 또는 X 선택">
        {(["O", "X"] as const).map((answer) => (
          <button
            type="button"
            key={answer}
            className={`${answer === "O" ? "answer-o" : "answer-x"} ${selectedAnswer === answer ? "selected" : ""}`}
            aria-pressed={selectedAnswer === answer}
            disabled={disabled}
            onClick={() => onAnswer(answer)}
          >
            <strong>{answer}</strong>
            <small>{answer === "O" ? "맞아요" : "틀려요"}</small>
          </button>
        ))}
      </div>

      <div className={`grade12-quiz-result ${feedback ? (feedback.correct ? "correct" : "wrong") : "waiting"}`} role="status">
        {feedback ? (
          <>
            <strong>{feedback.correct ? "잘했어요!" : "땡! 다시 선택해 보세요"}</strong>
            <p>{feedback.message}</p>
          </>
        ) : (
          <>
            <strong>어떤 답이 맞을까요?</strong>
            <p>정답을 선택하면 설명이 나타나요.</p>
          </>
        )}
      </div>
    </section>
  );
}
