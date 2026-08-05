"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonInfo } from "./lesson-data";

type ResponsiveLessonProps = {
  lesson: LessonInfo;
};

export default function ResponsiveLesson({ lesson }: ResponsiveLessonProps) {
  const [slide, setSlide] = useState(1);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const stageRef = useRef<HTMLElement>(null);

  const goTo = useCallback(
    (next: number) => {
      setSlide(Math.min(lesson.slideCount, Math.max(1, next)));
    },
    [lesson.slideCount],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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

  const imagePath = `/lesson-slides/grade-${lesson.grade}/slide-${slide}.png`;
  const progress = (slide / lesson.slideCount) * 100;

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

      <section className="lesson-stage-wrap" aria-label="교육자료 슬라이드">
        <section className="lesson-stage" ref={stageRef}>
          <img
            src={imagePath}
            alt={`${lesson.label} 교육자료 ${slide}페이지`}
            key={imagePath}
          />
          <button className="lesson-fullscreen" type="button" onClick={() => void toggleFullscreen()}>
            크게 보기
          </button>
        </section>

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
                    src={`/lesson-slides/grade-${lesson.grade}/slide-${page}.png`}
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

