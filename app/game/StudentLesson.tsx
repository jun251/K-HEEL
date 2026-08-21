"use client";

import { useEffect, useState } from "react";
import type { LessonGrade } from "../materials/lesson/lesson-data";
import Grade12OxQuizSlide, { grade12OxQuizzes, type Grade12Answer } from "../materials/lesson/Grade12Activities";
import Grade34Activities, { Grade34GoldenBellSlide, Grade34UnitPriceSlide } from "../materials/lesson/Grade34Activities";
import Grade56Activities, { Grade56InvestmentChoice } from "../materials/lesson/Grade56Activities";

type StudentLessonProps = {
  token: string;
  nickname: string;
  lesson: {
    phase: "waiting" | "active" | "completed";
    active: boolean;
    gradeBand: LessonGrade;
    page: number;
    sourceSlide: number;
  };
};

type AnswerFeedback = { correct: boolean; message: string } | null;

const quizAnswers: Record<number, { answer: string; correctMessage: string }> = {
  4: { answer: "water", correctMessage: "정답: 물! 목마름을 해결해 주기 때문이에요." },
};

export default function StudentLesson({ token, nickname, lesson }: StudentLessonProps) {
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [sending, setSending] = useState(false);
  const [unitPriceRevealed, setUnitPriceRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Grade12Answer | null>(null);
  const oxQuiz = lesson.phase === "active" && lesson.gradeBand === "1-2" ? grade12OxQuizzes[lesson.sourceSlide] : undefined;
  const quiz = lesson.phase === "active" && lesson.gradeBand === "1-2" ? (quizAnswers[lesson.sourceSlide] ?? oxQuiz) : undefined;
  const isRabbitQuestion = lesson.gradeBand === "1-2" && lesson.sourceSlide === 4;
  const isGrade34Activity = lesson.phase === "active" && lesson.gradeBand === "3-4" && [3, 8, 9].includes(lesson.sourceSlide);
  const isGrade34GoldenBell = lesson.phase === "active" && lesson.gradeBand === "3-4" && lesson.sourceSlide === 26;
  const isGrade56Activity = lesson.phase === "active" && lesson.gradeBand === "5-6" && [9, 10, 16, 19, 23, 24].includes(lesson.sourceSlide);

  useEffect(() => {
    setFeedback(null);
    setUnitPriceRevealed(false);
    setSelectedAnswer(null);
  }, [lesson.sourceSlide]);

  async function answer(value: string) {
    if (!quiz || sending) return;
    if (oxQuiz && (value === "O" || value === "X")) setSelectedAnswer(value);
    setSending(true);
    try {
      const response = await fetch("/api/classroom/lesson-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sourceSlide: lesson.sourceSlide, answer: value }),
      });
      const data = (await response.json()) as { correct?: boolean; error?: string };
      if (!response.ok || typeof data.correct !== "boolean") throw new Error(data.error || "응답을 보내지 못했어요.");
      setFeedback(data.correct
        ? { correct: true, message: quiz.correctMessage }
        : { correct: false, message: isRabbitQuestion ? "땡! 다시 선택해보세요." : "선택한 답은 정답이 아니에요. 다시 생각해 보세요." });
    } catch (error) {
      setFeedback({ correct: false, message: error instanceof Error ? error.message : "응답을 보내지 못했어요." });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="student-lesson" aria-live="polite">
      <div className="student-lesson-heading">
        <span>선생님과 함께 보는 교육자료</span>
        <h2>{nickname}님, 화면을 함께 보세요</h2>
        <p>선생님이 페이지를 넘기면 이 화면도 자동으로 넘어갑니다.</p>
      </div>

      {lesson.phase === "waiting" && (
        <p className="student-following-note" role="status">
          <i /> 교육자료가 먼저 표시됩니다. 선생님이 수업을 시작하면 화면이 함께 넘어가요.
        </p>
      )}

      <div className="student-lesson-stage">
        {oxQuiz ? (
          <Grade12OxQuizSlide
            key={lesson.sourceSlide}
            sourceSlide={lesson.sourceSlide}
            selectedAnswer={selectedAnswer}
            feedback={feedback}
            disabled={sending || Boolean(feedback?.correct)}
            onAnswer={(value) => void answer(value)}
          />
        ) : isGrade34GoldenBell ? (
          <Grade34GoldenBellSlide key={lesson.sourceSlide} />
        ) : lesson.gradeBand === "3-4" && lesson.sourceSlide === 9 ? (
          <Grade34UnitPriceSlide revealed={unitPriceRevealed} />
        ) : lesson.gradeBand === "5-6" && [23, 24].includes(lesson.sourceSlide) ? (
          <Grade56InvestmentChoice key={lesson.sourceSlide} />
        ) : (
          <img
            src={`/lesson-slides/grade-${lesson.gradeBand}/slide-${lesson.sourceSlide}.png`}
            alt={`${lesson.gradeBand.replace("-", "·")}학년 교육자료 ${lesson.page}페이지`}
          />
        )}
        {isRabbitQuestion && <span className="lesson-answer-mask rabbit" aria-hidden="true" />}
        {!(lesson.gradeBand === "5-6" && [23, 24].includes(lesson.sourceSlide)) && <span className="student-lesson-page">{lesson.page}쪽</span>}
      </div>

      {isGrade34Activity && (
        <Grade34Activities sourceSlide={lesson.sourceSlide} token={token} onUnitPriceReveal={setUnitPriceRevealed} />
      )}
      {lesson.phase === "active" && lesson.gradeBand === "5-6" && [9, 10, 16, 19].includes(lesson.sourceSlide) && (
        <Grade56Activities key={lesson.sourceSlide} sourceSlide={lesson.sourceSlide} />
      )}

      {isRabbitQuestion ? (
        <section className="lesson-activity student-lesson-activity" aria-label="퀴즈 참여">
          <p>토끼가 가장 먼저 필요한 것을 골라보세요.</p>
          <div className="lesson-rabbit-choices">
            <button type="button" disabled={sending} onClick={() => void answer("water")}><span aria-hidden="true">💧</span> 물</button>
            <button type="button" disabled={sending} onClick={() => void answer("balloon")}><span aria-hidden="true">🎈</span> 풍선</button>
            <button type="button" disabled={sending} onClick={() => void answer("crown")}><span aria-hidden="true">👑</span> 왕관</button>
          </div>
          {feedback && <p className={`lesson-feedback ${feedback.correct ? "correct" : "wrong"}`} role="status">{feedback.message}</p>}
        </section>
      ) : !isGrade34Activity && !isGrade34GoldenBell && !isGrade56Activity ? (
        <p className="student-following-note"><i /> 선생님의 설명을 들으며 화면을 함께 보세요.</p>
      ) : null}
    </section>
  );
}
