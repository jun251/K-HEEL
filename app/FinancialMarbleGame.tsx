"use client";

import { useMemo, useState } from "react";
import type { GameOutcome } from "./GradeGame";

type CellKind = "start" | "income" | "expense" | "quiz" | "choice" | "special";
type BoardCell = { number: number; icon: string; title: string; detail: string; kind: CellKind };
type Quiz = { question: string; options: string[]; answer: number; correct: number; wrong: number; explanation: string };
type Dialog =
  | { type: "message"; title: string; copy: string; amount?: number; extraRoll?: boolean }
  | { type: "quiz"; title: string; quiz: Quiz; after?: "inflation" | "popular" }
  | { type: "lotto" }
  | { type: "inflation" }
  | { type: "travel" };

type MarblePlayer = {
  id: number;
  name: string;
  color: string;
  cash: number;
  position: number;
  laps: number;
  expenseMultiplier: number;
  startup: boolean;
  skipTurns: number;
};

const START_CASH = 100;
const GOAL_LAPS = 2;
const playerColors = ["#ef5b4c", "#2788e8", "#18a66f", "#9b5de5", "#f29f05", "#e5489b"];
const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const cells: BoardCell[] = [
  { number: 1, icon: "🏁", title: "출발", detail: "월급 +20만 원", kind: "start" },
  { number: 2, icon: "🏦", title: "은행", detail: "금융 퀴즈", kind: "quiz" },
  { number: 3, icon: "🛍", title: "시장", detail: "장보기 -18만 원", kind: "expense" },
  { number: 4, icon: "💼", title: "아르바이트", detail: "+50만 원", kind: "income" },
  { number: 5, icon: "🍀", title: "로또 당첨", detail: "번호를 선택하세요", kind: "choice" },
  { number: 6, icon: "💡", title: "창업", detail: "-20만 원", kind: "special" },
  { number: 7, icon: "🎁", title: "용돈", detail: "+5만 원", kind: "income" },
  { number: 8, icon: "📰", title: "경제뉴스", detail: "뉴스 구매 -4만 원", kind: "expense" },
  { number: 9, icon: "🛒", title: "할인마트", detail: "아이스크림 -1만 원", kind: "expense" },
  { number: 10, icon: "🎲", title: "주사위", detail: "한 번 더", kind: "special" },
  { number: 11, icon: "🎯", title: "경제 퀴즈", detail: "정답 +10만 원", kind: "quiz" },
  { number: 12, icon: "📦", title: "수요 증가", detail: "다음 지출 ×2", kind: "special" },
  { number: 13, icon: "📦", title: "공급 증가", detail: "다음 지출 ×0.7", kind: "special" },
  { number: 14, icon: "🎉", title: "보너스", detail: "+10만 원", kind: "income" },
  { number: 15, icon: "🏝", title: "무인도", detail: "1턴 쉬기", kind: "special" },
  { number: 16, icon: "⭐", title: "보너스", detail: "+1만 원", kind: "income" },
  { number: 17, icon: "🛠", title: "자전거 수리", detail: "-10만 원", kind: "expense" },
  { number: 18, icon: "🛒", title: "편의점", detail: "간식 -8만 원", kind: "expense" },
  { number: 19, icon: "💸", title: "STOP", detail: "금융 퀴즈", kind: "quiz" },
  { number: 20, icon: "🎲", title: "행운", detail: "주사위 한 번 더", kind: "special" },
  { number: 21, icon: "👨‍👩‍👧", title: "세뱃돈", detail: "+15만 원", kind: "income" },
  { number: 22, icon: "🌱", title: "투자", detail: "10만 원 투자", kind: "choice" },
  { number: 23, icon: "📢", title: "인기상품", detail: "왁뿌볼 -10만 원", kind: "quiz" },
  { number: 24, icon: "🎁", title: "깜짝 선물", detail: "+10만 원", kind: "income" },
  { number: 25, icon: "✈", title: "세계여행", detail: "원하는 칸으로 이동", kind: "special" },
  { number: 26, icon: "🏭", title: "공장 견학", detail: "정답 +10만 원", kind: "quiz" },
  { number: 27, icon: "⚠", title: "보너스", detail: "-20만 원", kind: "expense" },
  { number: 28, icon: "🎫", title: "도전 티켓", detail: "경제 퀴즈", kind: "quiz" },
  { number: 29, icon: "🛍", title: "중고장터", detail: "물건 사기 -6만 원", kind: "expense" },
  { number: 30, icon: "📉", title: "투자 실패", detail: "-20만 원", kind: "expense" },
  { number: 31, icon: "🎁", title: "행운상자", detail: "1% 확률 +100만 원", kind: "choice" },
  { number: 32, icon: "👑", title: "경제 퀴즈", detail: "왕관 퀴즈", kind: "quiz" },
];

const quizzes: Record<number, Quiz> = {
  2: { question: "은행에 돈을 맡기고 받는 돈을 무엇이라고 할까요?", options: ["이자", "세금", "용돈"], answer: 0, correct: 7, wrong: -5, explanation: "은행에 돈을 맡기면 약속한 비율에 따라 이자를 받을 수 있어요." },
  11: { question: "계획적으로 돈을 쓰기 위해 가장 먼저 할 일은?", options: ["예산 세우기", "친구 따라 사기", "전부 써 버리기"], answer: 0, correct: 10, wrong: 0, explanation: "쓸 수 있는 돈과 필요한 지출을 먼저 정하면 계획 소비에 도움이 돼요." },
  12: { question: "사려는 사람은 늘었는데 물건 수가 같다면 가격은 보통 어떻게 될까요?", options: ["올라간다", "내려간다", "항상 같다"], answer: 0, correct: 0, wrong: 0, explanation: "수요가 늘고 공급이 그대로라면 가격은 오를 가능성이 커요." },
  19: { question: "비밀번호나 인증번호를 다른 사람에게 알려줘도 될까요?", options: ["알려줘도 된다", "절대 알려주지 않는다"], answer: 1, correct: 4, wrong: -30, explanation: "금융 비밀번호와 인증번호는 누구에게도 알려주면 안 돼요." },
  23: { question: "왁뿌볼의 인기가 시들었습니다. 공급이 같다면 어떻게 될까요?", options: ["수요가 줄어 가격이 내려간다", "수요가 늘어 가격이 오른다", "공급이 사라진다"], answer: 0, correct: 0, wrong: 0, explanation: "인기가 줄면 수요가 감소해 가격이 내려갈 가능성이 커요." },
  26: { question: "공장에서 같은 시간에 더 많은 물건을 만들게 되면 공급은?", options: ["늘어난다", "줄어든다"], answer: 0, correct: 10, wrong: 0, explanation: "생산량이 많아지면 시장에 공급되는 물건도 늘어나요." },
  28: { question: "돈을 빌릴 때 꼭 확인해야 하는 것은?", options: ["이자율과 갚는 기간", "광고 색깔", "은행 건물 높이"], answer: 0, correct: 20, wrong: -10, explanation: "빌린 돈의 비용인 이자율과 상환 기간을 꼭 확인해야 해요." },
  32: { question: "위험을 줄이기 위해 투자금을 여러 곳에 나누는 방법은?", options: ["분산 투자", "충동 구매", "전액 소비"], answer: 0, correct: 30, wrong: -15, explanation: "여러 자산에 나누어 투자하면 한 곳의 손실 위험을 줄일 수 있어요." },
};

const expenseByCell: Record<number, number> = { 3: 18, 8: 4, 9: 1, 17: 10, 18: 8, 27: 20, 29: 6, 30: 20 };
const incomeByCell: Record<number, number> = { 4: 50, 7: 5, 14: 10, 16: 1, 21: 15, 24: 10 };

function boardPosition(index: number) {
  if (index <= 9) return { gridColumn: index + 1, gridRow: 1 };
  if (index <= 16) return { gridColumn: 10, gridRow: index - 8 };
  if (index <= 25) return { gridColumn: 26 - index, gridRow: 8 };
  return { gridColumn: 1, gridRow: 33 - index };
}

function moneyText(amount: number) {
  const rounded = Math.round(amount * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded.toLocaleString()}만 원`;
}

export default function FinancialMarbleGame({ onFinish, disabled }: { onFinish: (outcome: GameOutcome) => void; disabled: boolean }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<MarblePlayer[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(1);
  const [dice, setDice] = useState<number | null>(null);
  const [diceTwo, setDiceTwo] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [bonusRoll, setBonusRoll] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [finished, setFinished] = useState(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(["금융마블을 시작했어요. 시작 자산은 100만 원이에요."]);

  const activePlayer = players[activePlayerIndex];
  const activeCell = cells[activePlayer?.position ?? 0];
  const progress = useMemo(() => Math.min(100, ((activePlayer?.laps ?? 0) / GOAL_LAPS) * 100), [activePlayer?.laps]);

  function startGame() {
    setPlayers(Array.from({ length: playerCount }, (_, index) => ({
      id: index + 1,
      name: `${index + 1}번 플레이어`,
      color: playerColors[index],
      cash: START_CASH,
      position: 0,
      laps: 0,
      expenseMultiplier: 1,
      startup: false,
      skipTurns: 0,
    })));
    setStarted(true);
    setHistory([`${playerCount}명이 금융마블을 시작했어요. 각자 시작 자산은 100만 원이에요.`]);
  }

  function updateActivePlayer(change: (player: MarblePlayer) => MarblePlayer) {
    setPlayers((current) => current.map((player, index) => index === activePlayerIndex ? change(player) : player));
  }

  function addHistory(message: string) {
    setHistory((current) => [message, ...current].slice(0, 5));
  }

  function changeCash(amount: number, reason: string) {
    updateActivePlayer((player) => ({ ...player, cash: Math.round((player.cash + amount) * 10) / 10 }));
    addHistory(`${activePlayer.name} · ${reason} ${moneyText(amount)}`);
  }

  function spend(baseAmount: number, reason: string) {
    const multiplier = activePlayer.expenseMultiplier;
    const actual = Math.round(baseAmount * multiplier * 10) / 10;
    changeCash(-actual, reason + (multiplier !== 1 ? ` (물가 효과 ×${multiplier})` : ""));
    updateActivePlayer((player) => ({ ...player, expenseMultiplier: 1 }));
    return actual;
  }

  function finishLanding(extraRoll = false) {
    setDialog(null);
    setRolling(false);
    const rollAgain = extraRoll || bonusRoll;
    setBonusRoll(false);
    if (!rollAgain) {
      setTurn((value) => value + 1);
      setActivePlayerIndex((value) => (value + 1) % players.length);
    }
  }

  function openMessage(title: string, copy: string, amount?: number, extraRoll = false) {
    setDialog({ type: "message", title, copy, amount, extraRoll });
  }

  function resolveCell(cellNumber: number) {
    const cell = cells[cellNumber - 1];
    if (incomeByCell[cellNumber]) {
      const amount = incomeByCell[cellNumber];
      changeCash(amount, cell.title);
      openMessage(cell.title, `${moneyText(amount)}을 받았어요.`, amount);
      return;
    }
    if (expenseByCell[cellNumber]) {
      const actual = spend(expenseByCell[cellNumber], cell.title);
      openMessage(cell.title, `${actual.toLocaleString()}만 원을 지출했어요.`, -actual);
      return;
    }
    if (quizzes[cellNumber]) {
      if (cellNumber === 23) spend(10, "왁뿌볼 구매");
      setDialog({ type: "quiz", title: cell.title, quiz: quizzes[cellNumber], after: cellNumber === 23 ? "popular" : undefined });
      return;
    }
    switch (cellNumber) {
      case 1: openMessage("출발", "새로운 한 바퀴를 시작해요."); break;
      case 5: setDialog({ type: "lotto" }); break;
      case 6:
        if (activePlayer.startup) openMessage("창업", "이미 창업했어요. 출발을 지날 때마다 추가 수익을 받아요.");
        else { spend(20, "창업 비용"); updateActivePlayer((player) => ({ ...player, startup: true })); openMessage("창업 성공", "이제 출발을 지날 때마다 월급과 함께 5만 원을 더 받아요.", -20); }
        break;
      case 10: openMessage("주사위 한 번 더!", "행운의 주사위를 바로 한 번 더 굴리세요.", undefined, true); break;
      case 12: setDialog({ type: "inflation" }); break;
      case 13: updateActivePlayer((player) => ({ ...player, expenseMultiplier: 0.7 })); openMessage("물가 하락", "공급이 늘어 다음 지출 1회가 30% 할인돼요."); break;
      case 15: updateActivePlayer((player) => ({ ...player, skipTurns: 1 })); openMessage("무인도", "다음 차례에는 주사위를 굴리지 못해요."); break;
      case 20: openMessage("행운!", "주사위를 바로 한 번 더 굴리세요.", undefined, true); break;
      case 22: {
        spend(10, "투자금");
        const success = Math.random() < 0.5;
        if (success) changeCash(20, "투자 성공");
        openMessage(success ? "투자 성공!" : "투자 아쉬움", success ? "투자금 10만 원을 내고 수익 20만 원을 받았어요." : "이번 투자는 수익을 내지 못했어요.", success ? 10 : -10);
        break;
      }
      case 25: setDialog({ type: "travel" }); break;
      case 31: {
        const amount = Math.random() < 0.01 ? 100 : Math.floor(Math.random() * 10) + 1;
        changeCash(amount, "행운상자");
        openMessage(amount === 100 ? "1% 대박!" : "행운상자", `${amount}만 원을 발견했어요!`, amount);
        break;
      }
      default: openMessage(cell.title, cell.detail);
    }
  }

  function rollDice() {
    if (disabled || rolling || dialog || finished) return;
    if (activePlayer.skipTurns > 0) {
      updateActivePlayer((player) => ({ ...player, skipTurns: 0 }));
      addHistory(`${activePlayer.name} · 무인도에서 한 턴 쉬었어요.`);
      openMessage("한 턴 쉬기", "무인도 탈출 준비 완료! 다음 차례부터 다시 이동해요.");
      return;
    }
    setRolling(true);
    const firstValue = Math.floor(Math.random() * 6) + 1;
    const secondValue = Math.floor(Math.random() * 6) + 1;
    const value = firstValue + secondValue;
    const isDouble = firstValue === secondValue;
    let animationStep = 0;
    const animation = window.setInterval(() => {
      setDice((animationStep++ % 6) + 1);
      setDiceTwo(((animationStep + 2) % 6) + 1);
    }, 85);
    window.setTimeout(() => {
      window.clearInterval(animation);
      setDice(firstValue);
      setDiceTwo(secondValue);
      setBonusRoll(isDouble);
      const raw = activePlayer.position + value;
      const passedStart = raw >= cells.length;
      const next = raw % cells.length;
      const nextLaps = activePlayer.laps + (passedStart ? 1 : 0);
      const salary = passedStart ? 20 + (activePlayer.startup ? 5 : 0) : 0;
      if (isDouble) addHistory(`${activePlayer.name} · 더블! 한 번 더 굴릴 수 있어요.`);
      for (let step = 1; step <= value; step += 1) {
        window.setTimeout(() => {
          const stepPosition = (activePlayer.position + step) % cells.length;
          setPlayers((current) => current.map((player, index) => index === activePlayerIndex ? { ...player, position: stepPosition } : player));
        }, step * 145);
      }
      window.setTimeout(() => {
        setPlayers((current) => current.map((player, index) => index === activePlayerIndex ? {
          ...player,
          position: next,
          laps: nextLaps,
          cash: Math.round((player.cash + salary) * 10) / 10,
        } : player));
        if (passedStart) {
          addHistory(`${activePlayer.name} · ${activePlayer.startup ? "월급과 창업 수익" : "월급"} ${moneyText(salary)}`);
          if (nextLaps >= GOAL_LAPS) {
            setFinished(true);
            setWinnerId(activePlayer.id);
            setRolling(false);
            addHistory(`${activePlayer.name}이(가) 두 바퀴를 완주했어요!`);
            return;
          }
        }
        resolveCell(next + 1);
      }, value * 145 + 120);
    }, 850);
  }

  function answerQuiz(optionIndex: number) {
    if (dialog?.type !== "quiz") return;
    const correct = optionIndex === dialog.quiz.answer;
    const amount = correct ? dialog.quiz.correct : dialog.quiz.wrong;
    if (amount) changeCash(amount, correct ? `${dialog.title} 정답` : `${dialog.title} 오답`);
    if (!correct && dialog.after === "inflation") updateActivePlayer((player) => ({ ...player, expenseMultiplier: 2 }));
    setDialog({
      type: "message",
      title: correct ? "정답이에요!" : "아쉬워요!",
      copy: `${dialog.quiz.explanation}${amount ? ` ${moneyText(amount)}` : ""}`,
      amount,
    });
  }

  function chooseLotto(option: 1 | 2) {
    const amount = option === 1 ? -5 : 10;
    changeCash(amount, `로또 ${option}번 선택`);
    setDialog({ type: "message", title: option === 1 ? "1번 결과" : "2번 당첨!", copy: `${moneyText(amount)} 결과가 나왔어요.`, amount });
  }

  function chooseInflation(quiz: boolean) {
    if (quiz) setDialog({ type: "quiz", title: "수요 증가 방어 퀴즈", quiz: quizzes[12], after: "inflation" });
    else { updateActivePlayer((player) => ({ ...player, expenseMultiplier: 2 })); setDialog({ type: "message", title: "물가 상승 적용", copy: "다음 지출 1회가 두 배가 돼요." }); }
  }

  function travelTo(index: number) {
    updateActivePlayer((player) => ({ ...player, position: index }));
    setDialog(null);
    resolveCell(index + 1);
  }

  if (!started) {
    return (
      <section className="financial-setup" aria-label="금융마블 인원 선택">
        <span>🎲</span><p>FINANCIAL MARBLE</p><h3>몇 명이 함께할까요?</h3>
        <small>한 기기에서 차례대로 주사위를 굴리는 보드게임이에요.</small>
        <div className="financial-player-count" role="group" aria-label="플레이어 수">
          {[2, 3, 4, 5, 6].map((count) => <button type="button" key={count} className={playerCount === count ? "selected" : ""} onClick={() => setPlayerCount(count)} aria-pressed={playerCount === count}>{count}명</button>)}
        </div>
        <div className="financial-token-preview">{Array.from({ length: playerCount }, (_, index) => <i key={index} style={{ background: playerColors[index] }}>{index + 1}</i>)}</div>
        <button type="button" className="primary-button" disabled={disabled} onClick={startGame}>{playerCount}명으로 게임 시작</button>
      </section>
    );
  }

  if (finished) {
    const winner = players.find((player) => player.id === winnerId) ?? players[0];
    const ranking = [...players].sort((a, b) => b.cash - a.cash);
    return (
      <section className="financial-finish">
        <span>👑</span><p>FINANCIAL MARBLE COMPLETE</p><h3>{winner.name} 완주!</h3>
        <strong>{winner.cash.toLocaleString()}만 원</strong><small>완주 플레이어의 최종 자산</small>
        <div>{ranking.map((player, index) => <b key={player.id} style={{ borderColor: player.color }}>{index + 1}위 {player.name} · {player.cash.toLocaleString()}만 원</b>)}</div>
        <p>수입과 지출, 저축과 투자, 수요와 공급을 생각하며 자산을 지켰어요.</p>
        <button className="primary-button" disabled={disabled} onClick={() => onFinish({ score: Math.max(0, Math.round(winner.cash)), remainingBudget: Math.round(winner.cash * 10000) })}>결과판에 기록하기</button>
      </section>
    );
  }

  return (
    <section className="financial-marble" aria-label="금융마블 보드게임">
      <header className="financial-marble-header">
        <div><p>5·6학년 경제 보드게임</p><h3>금융마블</h3></div>
        <div className="financial-stats"><span>현재 차례 <b style={{ color: activePlayer.color }}>{activePlayer.name}</b></span><span>자산 <b>{activePlayer.cash.toLocaleString()}만 원</b></span><span>진행 <b>{activePlayer.laps}/{GOAL_LAPS}바퀴</b></span><span>턴 <b>{turn}</b></span></div>
      </header>

      <div className="financial-player-strip">
        {players.map((player, index) => <div key={player.id} className={index === activePlayerIndex ? "active" : ""}><i style={{ background: player.color }}>{player.id}</i><span>{player.name}<b>{player.cash.toLocaleString()}만 원</b></span></div>)}
      </div>

      <div className="financial-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="financial-board-wrap">
        <div className="financial-board">
          {cells.map((cell, index) => {
            const cellPlayers = players.filter((player) => player.position === index);
            return (
            <article key={cell.number} className={`financial-cell ${cell.kind} ${cellPlayers.some((player) => player.id === activePlayer.id) ? "active" : ""}`} style={boardPosition(index)}>
              <small>{cell.number}</small><span>{cell.icon}</span><b>{cell.title}</b><em>{cell.detail}</em>
              {cellPlayers.length > 0 && <div className="financial-cell-tokens">{cellPlayers.map((player) => <i key={player.id} aria-label={`${player.name} 말`} style={{ background: player.color }}>{player.id}</i>)}</div>}
            </article>
          )})}
          <div className="financial-center">
            <span className="financial-center-logo">₩</span><h4>금융마블</h4>
            <p>{activeCell.icon} 현재 <b>{activeCell.number}. {activeCell.title}</b></p>
            <button type="button" className={rolling ? "rolling" : ""} onClick={rollDice} disabled={disabled || rolling || Boolean(dialog)}>
              <span className="financial-dice-pair"><i>{dice ? diceFaces[dice - 1] : "⚄"}</i><i>{diceTwo ? diceFaces[diceTwo - 1] : "⚂"}</i></span>
              <b>{rolling ? "주사위 굴리는 중…" : activePlayer.skipTurns ? "한 턴 쉬기" : dice && diceTwo ? `합계 ${dice + diceTwo} · 다시 굴리기` : "두 주사위 굴리기"}</b>
            </button>
            <div className="financial-effects"><span className={activePlayer.expenseMultiplier !== 1 ? "on" : ""}>다음 지출 ×{activePlayer.expenseMultiplier}</span><span className={activePlayer.startup ? "on" : ""}>창업 수익 {activePlayer.startup ? "+5" : "없음"}</span></div>
          </div>
        </div>
      </div>

      <div className="financial-mobile-track" aria-label="32칸 이동 경로">
        {cells.map((cell, index) => <div key={cell.number} className={activePlayer.position === index ? "active" : ""}><small>{cell.number}</small><span>{cell.icon}</span><b>{cell.title}</b>{players.filter((player) => player.position === index).map((player) => <i key={player.id} style={{ background: player.color }}>{player.id}</i>)}</div>)}
      </div>
      <div className="financial-mobile-control">
        <p>{activeCell.icon} 현재 <b>{activeCell.number}. {activeCell.title}</b></p>
        <button type="button" className={rolling ? "rolling" : ""} onClick={rollDice} disabled={disabled || rolling || Boolean(dialog)}><span className="financial-dice-pair"><i>{dice ? diceFaces[dice - 1] : "⚄"}</i><i>{diceTwo ? diceFaces[diceTwo - 1] : "⚂"}</i></span>{rolling ? "굴리는 중…" : activePlayer.skipTurns ? "한 턴 쉬기" : "두 주사위 굴리기"}</button>
      </div>

      <aside className="financial-history"><strong>최근 금융 기록</strong>{history.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</aside>

      {dialog && <div className="financial-dialog-backdrop"><div className="financial-dialog" role="dialog" aria-modal="true">
        {dialog.type === "message" && <><span className={dialog.amount && dialog.amount < 0 ? "loss" : "gain"}>{dialog.amount ? moneyText(dialog.amount) : "금융 이벤트"}</span><h4>{dialog.title}</h4><p>{dialog.copy}</p>{bonusRoll && <strong className="financial-double-notice">🎲 더블! 한 번 더 굴려요</strong>}<button type="button" onClick={() => finishLanding(dialog.extraRoll)}>{dialog.extraRoll || bonusRoll ? "한 번 더 굴리기" : "확인"}</button></>}
        {dialog.type === "quiz" && <><span>경제 퀴즈</span><h4>{dialog.title}</h4><p>{dialog.quiz.question}</p><div className="financial-dialog-options">{dialog.quiz.options.map((option, index) => <button type="button" key={option} onClick={() => answerQuiz(index)}>{index + 1}. {option}</button>)}</div></>}
        {dialog.type === "lotto" && <><span>운명의 선택</span><h4>로또 번호를 골라 보세요</h4><p>결과를 보기 전에는 어느 쪽이 당첨인지 알 수 없어요.</p><div className="financial-dialog-options two"><button type="button" onClick={() => chooseLotto(1)}>🍀 1번 선택</button><button type="button" onClick={() => chooseLotto(2)}>🍀 2번 선택</button></div></>}
        {dialog.type === "inflation" && <><span>수요 증가 카드</span><h4>다음 지출이 두 배!</h4><p>퀴즈에 도전해 물가 상승 카드를 없던 일로 만들 수 있어요.</p><div className="financial-dialog-options two"><button type="button" onClick={() => chooseInflation(true)}>퀴즈로 막기</button><button type="button" onClick={() => chooseInflation(false)}>그대로 적용</button></div></>}
        {dialog.type === "travel" && <><span>세계여행</span><h4>이동할 칸을 선택하세요</h4><p>선택한 칸의 이벤트가 바로 실행돼요.</p><div className="financial-travel-grid">{cells.map((cell, index) => <button type="button" disabled={index === activePlayer.position || cell.number === 25} key={cell.number} onClick={() => travelTo(index)}>{cell.number}<small>{cell.title}</small></button>)}</div></>}
      </div></div>}
    </section>
  );
}
