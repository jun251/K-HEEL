"use client";

import { useEffect, useState } from "react";
import type { LessonGrade } from "../materials/lesson/lesson-data";

type StudentLessonProps = {
  token: string;
  nickname: string;
  lesson: {
    active: true;
    gradeBand: LessonGrade;
    page: number;
    sourceSlide: number;
  };
};

type AnswerFeedback = { correct: boolean; message: string } | null;

const quizAnswers: Record<number, { answer: string; correctMessage: string }> = {
  4: { answer: "water", correctMessage: "정답: 물! 목마름을 해결해 주기 때문이에요." },
  17: { answer: "X", correctMessage: "정답 X · 그것은 원하는 것에 가까워요." },
  18: { answer: "O", correctMessage: "정답 O · 물은 목마름을 해결해 주는 필요한 것이에요." },
  19: { answer: "O", correctMessage: "정답 O · 원하는 마음도 소중해요." },
  20: { answer: "X", correctMessage: "정답 X · 필요 없는 물건인지 먼저 생각해요." },
};

export default function StudentLesson({ token, nickname, lesson }: StudentLessonProps) {
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [sending, setSending] = useState(false);
  const quiz = lesson.gradeBand === "1-2" ? quizAnswers[lesson.sourceSlide] : undefined;
  const isRabbitQuestion = lesson.gradeBand === "1-2" && lesson.sourceSlide === 4;

  useEffect(() => {
    setFeedback(null);
  }, [lesson.sourceSlide]);

  async function answer(value: string) {
    if (!quiz || sending) return;
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
        : { correct: false, message: isRabbitQuestion ? "땡! 다시 선택해보세요." : "땡! 다시 골라보세요." });
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

      <div className="student-lesson-stage">
        <img
          src={`/lesson-slides/grade-${lesson.gradeBand}/slide-${lesson.sourceSlide}.png`}
          alt={`${lesson.gradeBand.replace("-", "·")}학년 교육자료 ${lesson.page}페이지`}
        />
        {isRabbitQuestion && <span className="lesson-answer-mask rabbit" aria-hidden="true" />}
        {quiz && !isRabbitQuestion && <span className="lesson-answer-mask ox" aria-hidden="true" />}
        <span className="student-lesson-page">{lesson.page}쪽</span>
      </div>

      {quiz ? (
        <section className="lesson-activity student-lesson-activity" aria-label="퀴즈 참여">
          <p>{isRabbitQuestion ? "토끼가 가장 먼저 필요한 것을 골라보세요." : "O 또는 X를 골라보세요."}</p>
          <div className={isRabbitQuestion ? "lesson-rabbit-choices" : "lesson-ox-choices"}>
            {isRabbitQuestion ? (
              <>
                <button type="button" disabled={sending} onClick={() => void answer("water")}><span aria-hidden="true">💧</span> 물</button>
                <button type="button" disabled={sending} onClick={() => void answer("balloon")}><span aria-hidden="true">🎈</span> 풍선</button>
                <button type="button" disabled={sending} onClick={() => void answer("crown")}><span aria-hidden="true">👑</span> 왕관</button>
              </>
            ) : (
              <>
                <button type="button" disabled={sending} onClick={() => void answer("O")} aria-label="O 선택">O</button>
                <button type="button" disabled={sending} onClick={() => void answer("X")} aria-label="X 선택">X</button>
              </>
            )}
          </div>
          {feedback && <p className={`lesson-feedback ${feedback.correct ? "correct" : "wrong"}`} role="status">{feedback.message}</p>}
        </section>
      ) : (
        <p className="student-following-note"><i /> 선생님의 설명을 들으며 화면을 함께 보세요.</p>
      )}
    </section>
  );
}
