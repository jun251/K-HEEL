"use client";

import { useEffect, useRef, useState } from "react";
import GradeGame, { GameOutcome } from "../GradeGame";
import StudentLesson from "./StudentLesson";

type GradeBand = "1-2" | "3-4" | "5-6";
type Player = { token: string; nickname: string; roomCode: string; gradeBand: GradeBand };
type ClassroomState = "waiting" | "active" | "paused" | "ended";
type BlockingClassroomState = Extract<ClassroomState, "paused" | "ended">;
type LessonState = {
  phase: "waiting" | "active" | "completed";
  active: boolean;
  gradeBand: GradeBand;
  page: number;
  sourceSlide: number;
  updatedAt?: string;
};

function isBlockingClassroomState(state: ClassroomState): state is BlockingClassroomState {
  return state === "paused" || state === "ended";
}

const gradeInfo: Record<GradeBand, { label: string; title: string }> = {
  "1-2": { label: "1·2학년", title: "꼭 필요할까?" },
  "3-4": { label: "3·4학년", title: "합리적 소비왕 챌린지" },
  "5-6": { label: "5·6학년", title: "금융마블" },
};

export default function GameWindow() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [status, setStatus] = useState("게임 정보를 불러오는 중이에요.");
  const [loading, setLoading] = useState(false);
  const [classroomState, setClassroomState] = useState<ClassroomState>("waiting");
  const [lessonState, setLessonState] = useState<LessonState | null>(null);
  const previousClassroomState = useRef<ClassroomState | null>(null);
  const previousLessonPhase = useRef<LessonState["phase"] | null>(null);
  const completed = useRef(false);

  useEffect(() => {
    const session = new URLSearchParams(window.location.search).get("session");
    if (!session) {
      setStatus("입장 정보가 없어요. 원래 화면에서 다시 입장해 주세요.");
      return;
    }

    const storedPlayer = window.localStorage.getItem(`kheel-player-${session}`);
    if (!storedPlayer) {
      setStatus("입장 정보가 만료됐어요. 원래 화면에서 다시 입장해 주세요.");
      return;
    }

    try {
      const parsed = JSON.parse(storedPlayer) as Player;
      setPlayer(parsed);
      setStatus("");
    } catch {
      setStatus("입장 정보를 읽지 못했어요. 원래 화면에서 다시 입장해 주세요.");
    }
  }, []);

  useEffect(() => {
    if (!player) return;
    let disposed = false;

    const loadClassroomState = async () => {
      try {
        const response = await fetch("/api/classroom/status", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${player.token}` },
        });
        const data = (await response.json()) as { state?: ClassroomState; lesson?: LessonState; error?: string };
        if (!response.ok || !data.state) throw new Error(data.error || "수업 상태를 확인하지 못했습니다.");
        if (disposed) return;

        setClassroomState(data.state);
        setLessonState(data.lesson ?? null);
        const wasBlocked = previousClassroomState.current
          ? isBlockingClassroomState(previousClassroomState.current)
          : true;
        const gameJustOpened = data.lesson?.phase === "completed" && previousLessonPhase.current !== "completed";
        if (data.lesson?.phase === "completed" && !isBlockingClassroomState(data.state) && (wasBlocked || gameJustOpened) && !completed.current) {
          void fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: player.token,
              gameId: `game-${player.gradeBand}`,
              status: "in_progress",
            }),
          });
        }
        previousClassroomState.current = data.state;
        previousLessonPhase.current = data.lesson?.phase ?? null;
      } catch {
        if (!disposed) setStatus("선생님 화면과 연결을 확인하고 있어요.");
      }
    };

    void loadClassroomState();
    const timer = window.setInterval(() => void loadClassroomState(), 2000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [player]);

  const finishGame = async ({ score, remainingBudget }: GameOutcome) => {
    if (!player) return;
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, score, remainingBudget, gameId: `game-${player.gradeBand}` }),
      });

      if (!response.ok) throw new Error("점수 저장에 실패했습니다.");
      completed.current = true;
      window.opener?.postMessage({ type: "kheel-score-saved", roomCode: player.roomCode }, window.location.origin);
      setStatus(`${player.nickname}님의 ${score}점이 결과판에 기록됐어요.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "점수를 저장하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const blockingState = isBlockingClassroomState(classroomState) ? classroomState : null;

  return (
    <main className="game-window-main">
      <header className="game-window-top">
        <div className="brand"><span>₩</span> 머니놀이터</div>
        <button type="button" onClick={() => window.close()}>창 닫기</button>
      </header>

      <section className="game-shell game-window-shell">
        {player ? (
          <>
            {!lessonState ? (
              <div className="game-window-message" role="status">
                <h2>교육자료를 준비하고 있어요</h2>
                <p>잠시만 기다려 주세요.</p>
              </div>
            ) : lessonState.phase !== "completed" ? (
              <StudentLesson token={player.token} nickname={player.nickname} lesson={lessonState} />
            ) : (
              <>
                <div className="game-heading">
                  <span>{gradeInfo[player.gradeBand].label} 미션</span>
                  <h2>{player.nickname}님, {gradeInfo[player.gradeBand].title}</h2>
                  <p>정답보다 더 중요한 건 왜 그렇게 선택했는지 생각하는 거예요.</p>
                </div>
                <GradeGame band={player.gradeBand} onFinish={finishGame} disabled={loading || blockingState !== null} />
              </>
            )}
            {blockingState && <ClassroomOverlay state={blockingState} />}
          </>
        ) : (
          <div className="game-window-message">
            <h2>다시 입장해 주세요</h2>
            <p>{status}</p>
          </div>
        )}
        {status && player && <p className="game-window-status" role="status">{status}</p>}
      </section>
    </main>
  );
}
function ClassroomOverlay({ state }: { state: BlockingClassroomState }) {
  const content = {
    paused: {
      icon: "✋",
      title: "게임을 잠시 멈췄어요",
      copy: "선생님의 설명을 듣고 기다려 주세요. 선택한 내용은 그대로 남아 있어요.",
    },
    ended: {
      icon: "🏁",
      title: "오늘 수업이 끝났어요",
      copy: "참여해 줘서 고마워요. 선생님의 안내에 따라 창을 닫아 주세요.",
    },
  }[state];

  return (
    <div className={`classroom-control-overlay ${state}`} role="status" aria-live="polite">
      <span>{content.icon}</span>
      <h2>{content.title}</h2>
      <p>{content.copy}</p>
    </div>
  );
}
