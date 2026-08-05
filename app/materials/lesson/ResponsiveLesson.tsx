"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonInfo } from "./lesson-data";

type Choice = "water" | "balloon" | "crown" | "O" | "X";

const oxQuizzes: Record<number, { answer: "O" | "X"; feedback: string }> = {
  17: { answer: "X", feedback: "정답 X · 그것은 원하는 것에 가까워요." },
  18: { answer: "O", feedback: "정답 O · 물은 목마름을 해결해 주는 필요한 것이에요." },
  19: { answer: "O", feedback: "정답 O · 원하는 마음도 소중해요." },
  20: { answer: "X", feedback: "정답 X · 필요 없는 물건인지 먼저 생각해요." },
};

type ResponsiveLessonProps = {
  lesson: LessonInfo;
};

export default function ResponsiveLesson({ lesson }: ResponsiveLessonProps) {
  const [slide, setSlide] = useState(1);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationStatus, setPresentationStatus] = useState("");
  const stageRef = useRef<HTMLElement>(null);

  const syncPresentation = useCallback(async (page: number) => {
    try {
      const response = await fetch("/api/teacher/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeBand: lesson.grade, page, active: true }),
      });
      if (!response.ok) throw new Error();
      setPresentationStatus("학생 화면 동기화 중");
    } catch {
      setPresentationStatus("선생님 페이지에서 다시 로그인해 주세요");
    }
  }, [lesson.grade]);

  const goTo = useCallback(
    (next: number) => {
      setSlide(Math.min(lesson.slideCount, Math.max(1, next)));
      setFeedback(null);
      const bounded = Math.min(lesson.slideCount, Math.max(1, next));
      if (presentationMode) void syncPresentation(bounded);
    },
    [lesson.slideCount, presentationMode, syncPresentation],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("present") !== "1") return;
    const requestedPage = Math.min(lesson.slideCount, Math.max(1, Number(params.get("page")) || 1));
    setSlide(requestedPage);
    setPresentationMode(true);
    void syncPresentation(requestedPage);
  }, [lesson.slideCount, syncPresentation]);

  useEffect(() => {
    if (!presentationMode) return;
    let disposed = false;
    const loadTeacherLesson = async () => {
      const response = await fetch("/api/teacher/status", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { lesson?: { active: boolean; gradeBand: string; page: number } };
      if (!disposed && data.lesson?.active && data.lesson.gradeBand === lesson.grade) {
        setSlide(data.lesson.page);
      }
    };
    const timer = window.setInterval(() => void loadTeacherLesson(), 2000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [lesson.grade, presentationMode]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") goTo(slide - 1);
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goTo(slide + 1);
      }
      if (event.key === "Escape") setOverviewOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, slide]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await stageRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }

  const sourceSlide = lesson.slideSources?.[slide - 1] ?? slide;
  const imagePath = `/lesson-slides/grade-${lesson.grade}/slide-${sourceSlide}.png`;
  const progress = (slide / lesson.slideCount) * 100;
  const isRabbitQuestion = lesson.grade === "1-2" && sourceSlide === 4;
  const oxQuiz = lesson.grade === "1-2" ? oxQuizzes[sourceSlide] : undefined;

  function choose(choice: Choice) {
    if (isRabbitQuestion) {
      setFeedback(
        choice === "water"
          ? { correct: true, message: "정답: 물! 목마름을 해결해 주기 때문이에요." }
          : { correct: false, message: "땡! 다시 선택해보세요." },
      );
      return;
    }

    if (oxQuiz) {
      setFeedback(
        choice === oxQuiz.answer
          ? { correct: true, message: oxQuiz.feedback }
          : { correct: false, message: "땡! 다시 골라보세요." },
      );
    }
  }

  return (
    <main className={`lesson-page lesson-${lesson.accent}`}>
      <header className="lesson-header">
        <a className="lesson-back" href="/materials" aria-label="교육자료로 돌아가기">
          <span aria-hidden="true">←</span> 교육자료
        </a>
        <div className="lesson-heading">
          <span>{lesson.label} 웹 학습</span>
          <strong>{lesson.title}</strong>
        </div>
        <button className="lesson-overview-button" type="button" onClick={() => setOverviewOpen(true)}>
          전체 페이지
        </button>
      </header>

      <section className="lesson-intro" aria-labelledby="lesson-title">
        <div>
          <p className="eyebrow">RESPONSIVE LESSON</p>
          <h1 id="lesson-title">{lesson.title}</h1>
          <p>{lesson.description}</p>
        </div>
        <div className="lesson-count" aria-label={`전체 ${lesson.slideCount}페이지`}>
          <strong>{lesson.slideCount}</strong>
          <span>pages</span>
        </div>
      </section>

      {presentationMode && <div className="lesson-sync-banner"><i /> {presentationStatus || "학생 화면 연결 중"}</div>}

      <section className="lesson-stage-wrap" aria-label="교육자료 슬라이드">
        <section className="lesson-stage" ref={stageRef}>
          <img
            src={imagePath}
            alt={`${lesson.label} 교육자료 ${slide}페이지`}
            key={imagePath}
          />
          {isRabbitQuestion && <span className="lesson-answer-mask rabbit" aria-hidden="true" />}
          {oxQuiz && <span className="lesson-answer-mask ox" aria-hidden="true" />}
          <button className="lesson-fullscreen" type="button" onClick={() => void toggleFullscreen()}>
            크게 보기
          </button>
        </section>

        {(isRabbitQuestion || oxQuiz) && (
          <section className="lesson-activity" aria-label="문제 선택">
            <p>{isRabbitQuestion ? "토끼가 가장 먼저 필요한 것을 골라보세요." : "O 또는 X를 골라보세요."}</p>
            <div className={isRabbitQuestion ? "lesson-rabbit-choices" : "lesson-ox-choices"}>
              {isRabbitQuestion ? (
                <>
                  <button type="button" onClick={() => choose("water")}><span aria-hidden="true">💧</span> 물</button>
                  <button type="button" onClick={() => choose("balloon")}><span aria-hidden="true">🎈</span> 풍선</button>
                  <button type="button" onClick={() => choose("crown")}><span aria-hidden="true">👑</span> 왕관</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => choose("O")} aria-label="O 선택">O</button>
                  <button type="button" onClick={() => choose("X")} aria-label="X 선택">X</button>
                </>
              )}
            </div>
            {feedback && (
              <p className={`lesson-feedback ${feedback.correct ? "correct" : "wrong"}`} role="status">
                {feedback.message}
              </p>
            )}
          </section>
        )}

        <div className="lesson-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <nav className="lesson-controls" aria-label="슬라이드 이동">
          <button type="button" onClick={() => goTo(slide - 1)} disabled={slide === 1}>
            <span aria-hidden="true">←</span> 이전
          </button>
          <button className="lesson-page-counter" type="button" onClick={() => setOverviewOpen(true)}>
            <strong>{slide}</strong> / {lesson.slideCount}
          </button>
          <button type="button" onClick={() => goTo(slide + 1)} disabled={slide === lesson.slideCount}>
            다음 <span aria-hidden="true">→</span>
          </button>
        </nav>

        <p className="lesson-key-help">키보드의 ← → 키로도 페이지를 넘길 수 있어요.</p>
      </section>

      {overviewOpen && (
        <div className="lesson-overview" role="dialog" aria-modal="true" aria-labelledby="overview-title">
          <div className="lesson-overview-panel">
            <div className="lesson-overview-header">
              <div>
                <span>{lesson.label}</span>
                <h2 id="overview-title">전체 페이지</h2>
              </div>
              <button type="button" onClick={() => setOverviewOpen(false)} aria-label="전체 페이지 닫기">×</button>
            </div>
            <div className="lesson-thumbnails">
              {Array.from({ length: lesson.slideCount }, (_, index) => index + 1).map((page) => (
                <button
                  className={page === slide ? "active" : ""}
                  type="button"
                  key={page}
                  onClick={() => {
                    goTo(page);
                    setOverviewOpen(false);
                  }}
                  aria-current={page === slide ? "page" : undefined}
                >
                  <img
                    src={`/lesson-slides/grade-${lesson.grade}/slide-${lesson.slideSources?.[page - 1] ?? page}.png`}
                    alt=""
                    loading="lazy"
                  />
                  <span>{page}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
