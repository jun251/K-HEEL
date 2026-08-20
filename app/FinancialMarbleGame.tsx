"use client";

import { useMemo, useState } from "react";
import type { GameOutcome } from "./GradeGame";

type CellKind = "start" | "income" | "expense" | "quiz" | "choice" | "special";
type BoardCell = { number: number; icon: string; title: string; detail: string; kind: CellKind };
type Quiz = { question: string; options: string[]; answer: number; correct: number; wrong: number; explanation: string };
type QuizQuestion = Omit<Quiz, "correct" | "wrong">;
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
  turnsUsed: number;
};

const START_CASH = 100;
const MAX_TURNS = 4;
const playerColors = ["#ef5b4c", "#2788e8", "#18a66f", "#9b5de5", "#f29f05", "#e5489b"];
const pipMap: Record<number, Array<[number, number]>> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
  6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
};

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
  { number: 22, icon: "🌱", title: "투자", detail: "투자 퀴즈", kind: "quiz" },
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

const quizQuestions: Record<number, QuizQuestion> = {
  1: { question: "은행에 돈을 맡기는 것을 무엇이라고 할까요?", options: ["대출", "예금", "출금"], answer: 1, explanation: "은행에 돈을 맡기는 것을 예금이라고 해요." },
  2: { question: "내 계좌에 돈을 넣는 것은 무엇일까요?", options: ["입금", "출금", "이체"], answer: 0, explanation: "계좌에 돈을 넣는 거래는 입금이에요." },
  3: { question: "내 계좌의 돈을 친구 계좌로 보내는 것은 무엇일까요?", options: ["출금", "입금", "이체"], answer: 2, explanation: "한 계좌에서 다른 계좌로 돈을 보내는 것은 이체예요." },
  4: { question: "계좌에서 돈을 꺼내는 것을 무엇이라고 할까요?", options: ["입금", "출금", "예금"], answer: 1, explanation: "계좌에 있는 돈을 꺼내는 거래는 출금이에요." },
  5: { question: "은행에서 돈의 거래 내용을 기록하는 것은 무엇일까요?", options: ["통장", "주식", "영수증"], answer: 0, explanation: "통장에는 입금과 출금 같은 계좌 거래 내용이 기록돼요." },
  6: { question: "물건이나 서비스를 사고 싶어 하는 사람을 무엇이라고 할까요?", options: ["생산자", "소비자", "은행원"], answer: 1, explanation: "물건이나 서비스를 구입해 사용하는 사람은 소비자예요." },
  7: { question: "물건이나 서비스를 만들어 판매하는 사람이나 기업은?", options: ["생산자", "소비자", "투자자"], answer: 0, explanation: "물건이나 서비스를 만들어 파는 사람이나 기업은 생산자예요." },
  8: { question: "소비자가 어떤 물건을 사고 싶어 하는 마음과 양을 무엇이라고 할까요?", options: ["공급", "수요", "투자"], answer: 1, explanation: "사고 싶어 하는 마음과 그 양을 수요라고 해요." },
  9: { question: "생산자가 어떤 물건을 팔 수 있는 양을 무엇이라고 할까요?", options: ["수요", "소비", "공급"], answer: 2, explanation: "생산자가 시장에 내놓아 팔 수 있는 양을 공급이라고 해요." },
  10: { question: "인기 있는 빵을 사고 싶은 사람이 갑자기 많아졌습니다. 가격은 어떻게 될 가능성이 높을까요?", options: ["올라간다", "내려간다", "항상 같다"], answer: 0, explanation: "공급이 같을 때 수요가 늘어나면 가격은 오를 가능성이 커요." },
  11: { question: "농장에서 사과를 평소보다 훨씬 많이 수확했습니다. 공급은 어떻게 될까요?", options: ["증가한다", "감소한다", "변하지 않는다"], answer: 0, explanation: "생산된 사과가 많아지면 시장에 공급되는 양도 증가해요." },
  12: { question: "물건의 공급이 많아지면 가격은 어떻게 될 가능성이 높을까요?", options: ["올라간다", "내려간다", "반드시 2배가 된다"], answer: 1, explanation: "다른 조건이 같다면 공급이 늘어날수록 가격은 내려갈 가능성이 커요." },
  13: { question: "합리적인 소비를 할 때 생각해야 할 것과 거리가 먼 것은?", options: ["가격", "품질", "친구가 샀는지"], answer: 2, explanation: "합리적인 소비는 남을 따라 사기보다 가격, 품질, 필요성을 살펴야 해요." },
  14: { question: "할인한다는 이유만으로 필요하지 않은 물건을 사는 것은 합리적인 소비일까요?", options: ["O", "X"], answer: 1, explanation: "싸더라도 필요하지 않은 물건을 사는 것은 합리적인 소비가 아니에요." },
  15: { question: "물건을 사기 전에 정말 필요한지 생각하는 것은 합리적인 소비일까요?", options: ["O", "X"], answer: 0, explanation: "구매 전에 필요성을 확인하면 충동구매를 줄일 수 있어요." },
  16: { question: "충동구매를 막는 STOP에서 S는 무엇을 의미할까요?", options: ["Stop", "Save", "Shopping"], answer: 0, explanation: "S는 일단 멈추라는 뜻의 Stop이에요." },
  17: { question: "STOP에서 O는 무엇을 의미할까요?", options: ["Open", "Options", "Order"], answer: 1, explanation: "O는 다른 선택지를 살펴보는 Options예요." },
  18: { question: "STOP에서 T는 무엇을 의미할까요?", options: ["Think", "Time", "Trade"], answer: 0, explanation: "T는 구매가 필요한지 다시 생각하는 Think예요." },
  19: { question: "투자란 무엇일까요?", options: ["돈을 숨겨두는 것", "미래에 더 큰 돈을 얻기 위해 지금 돈을 사용하는 것", "돈을 모두 쓰는 것"], answer: 1, explanation: "투자는 미래의 수익을 기대하며 현재의 돈을 사용하는 일이에요." },
  20: { question: "투자한 돈이 늘어나 원래보다 돈이 많아지는 것을 무엇이라고 할까요?", options: ["손실", "수익", "위험"], answer: 1, explanation: "투자 결과 돈이 늘어난 부분을 수익이라고 해요." },
  21: { question: "투자한 돈이 줄어들어 원래보다 돈이 적어지는 것을 무엇이라고 할까요?", options: ["손실", "수익", "예금"], answer: 0, explanation: "투자한 돈이 줄어든 결과를 손실이라고 해요." },
  22: { question: "투자한 돈을 잃거나 줄어들 수 있는 가능성을 무엇이라고 할까요?", options: ["위험", "수익", "공급"], answer: 0, explanation: "투자금이 줄거나 사라질 수 있는 가능성을 위험이라고 해요." },
  23: { question: "일반적으로 위험이 클수록 기대할 수 있는 수익도 커질 수 있습니다. 맞을까요?", options: ["O", "X"], answer: 0, explanation: "보통 높은 수익을 기대하는 투자에는 더 큰 위험이 따를 수 있어요." },
  24: { question: "주식은 회사를 여러 조각으로 나눈 '작은 주인 자격'이라고 설명할 수 있습니다. 맞을까요?", options: ["O", "X"], answer: 0, explanation: "주식을 사면 그 회사의 일부를 가진 주주가 돼요." },
  25: { question: "사람들이 주식을 사고팔 수 있도록 도와주는 회사는 무엇일까요?", options: ["편의점", "증권회사", "마트"], answer: 1, explanation: "증권회사는 사람들이 주식을 거래할 수 있도록 도와줘요." },
  26: { question: "주식의 가격인 주가는 무엇에 따라 오르내릴 수 있을까요?", options: ["사람들의 사고파는 양", "날씨만", "학교 성적"], answer: 0, explanation: "주가는 주식을 사려는 사람과 팔려는 사람의 양 등에 따라 변해요." },
  27: { question: "한 곳이 아니라 여러 곳에 나누어 투자하는 것을 무엇이라고 할까요?", options: ["집중투자", "분산투자", "충동투자"], answer: 1, explanation: "여러 곳에 나누어 투자하는 방법을 분산투자라고 해요." },
  28: { question: "'계란을 한 바구니에 담지 마라'와 관련된 투자 방법은?", options: ["분산투자", "몰아서 투자하기", "아무 곳에나 투자하기"], answer: 0, explanation: "투자 대상을 나누면 한 곳에서 생긴 손실의 영향을 줄일 수 있어요." },
  29: { question: "꼭 필요한 생활비나 빌린 돈으로 위험한 투자를 하는 것은 좋은 방법일까요?", options: ["O", "X"], answer: 1, explanation: "생활비와 빌린 돈은 위험한 투자에 사용하지 않는 것이 안전해요." },
  30: { question: "다음 중 배운 투자 방법으로 가장 적절한 것은?", options: ["한 곳에 모든 돈 투자하기", "빌린 돈으로 투자하기", "여러 곳에 나누어 투자하기"], answer: 2, explanation: "여러 곳에 나누어 투자하면 위험을 분산할 수 있어요." },
};

const quizPools: Record<number, number[]> = {
  2: [1, 2, 3, 4, 5],
  11: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  12: [8, 10],
  19: [13, 14, 15, 16, 17, 18],
  22: [19, 20, 21, 22, 23, 29],
  23: [8, 10],
  26: [9, 11, 12],
  28: [24, 25, 26, 27, 28, 29, 30],
  32: Array.from({ length: 30 }, (_, index) => index + 1),
};

const quizRewards: Record<number, Pick<Quiz, "correct" | "wrong">> = {
  2: { correct: 7, wrong: -5 },
  11: { correct: 10, wrong: 0 },
  12: { correct: 0, wrong: 0 },
  19: { correct: 4, wrong: -30 },
  22: { correct: 20, wrong: 0 },
  23: { correct: 0, wrong: 0 },
  26: { correct: 10, wrong: 0 },
  28: { correct: 20, wrong: -10 },
  32: { correct: 30, wrong: -15 },
};

function randomQuiz(cellNumber: number): Quiz {
  const pool = quizPools[cellNumber];
  const questionNumber = pool[Math.floor(Math.random() * pool.length)];
  return { ...quizQuestions[questionNumber], ...quizRewards[cellNumber] };
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomChance(probability: number) {
  return Math.random() < probability;
}

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

function DiceCube({ value, rolling, second = false }: { value: number; rolling: boolean; second?: boolean }) {
  return (
    <span className="dice-cube-scene" aria-label={`주사위 ${value}`}>
      <span className={`dice-cube show-${value} ${rolling ? "is-rolling" : ""} ${second ? "second" : ""}`}>
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <span className={`dice-cube-face face-${face}`} key={face}>
            {pipMap[face].map(([column, row], index) => <i key={index} style={{ gridColumn: column, gridRow: row }} />)}
          </span>
        ))}
      </span>
    </span>
  );
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
  const [showingResult, setShowingResult] = useState(false);
  const [moving, setMoving] = useState(false);
  const [bonusRoll, setBonusRoll] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [landedCell, setLandedCell] = useState<BoardCell | null>(null);
  const [finished, setFinished] = useState(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(["금융마블을 시작했어요. 시작 자산은 100만 원이에요."]);

  const activePlayer = players[activePlayerIndex];
  const activeCell = cells[activePlayer?.position ?? 0];
  const rollTotal = dice && diceTwo ? dice + diceTwo : null;
  const progress = useMemo(() => Math.min(100, ((activePlayer?.turnsUsed ?? 0) / MAX_TURNS) * 100), [activePlayer?.turnsUsed]);

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
      turnsUsed: 0,
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
    setLandedCell(null);
    setRolling(false);
    setShowingResult(false);
    setMoving(false);
    const rollAgain = extraRoll || bonusRoll;
    setBonusRoll(false);
    if (!rollAgain) {
      const updatedPlayers = players.map((player, index) => index === activePlayerIndex ? { ...player, turnsUsed: player.turnsUsed + 1 } : player);
      setPlayers(updatedPlayers);
      setTurn((value) => value + 1);
      if (updatedPlayers.every((player) => player.turnsUsed >= MAX_TURNS)) {
        const richest = updatedPlayers.reduce((best, player) => player.cash > best.cash ? player : best);
        setWinnerId(richest.id);
        setFinished(true);
        addHistory(`모든 플레이어가 ${MAX_TURNS}턴을 마쳤어요.`);
        return;
      }
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
    if (cellNumber !== 12 && quizPools[cellNumber]) {
      if (cellNumber === 22) spend(10, "투자금");
      if (cellNumber === 23) spend(10, "왁뿌볼 구매");
      setDialog({ type: "quiz", title: cell.title, quiz: randomQuiz(cellNumber), after: cellNumber === 23 ? "popular" : undefined });
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
      case 25: setDialog({ type: "travel" }); break;
      case 31: {
        const amount = randomChance(0.01) ? 100 : randomInt(10) + 1;
        changeCash(amount, "행운상자");
        openMessage(amount === 100 ? "1% 대박!" : "행운상자", `${amount}만 원을 발견했어요!`, amount);
        break;
      }
      default: openMessage(cell.title, cell.detail);
    }
  }

  function rollDice() {
    if (disabled || rolling || showingResult || moving || dialog || finished) return;
    if (activePlayer.skipTurns > 0) {
      updateActivePlayer((player) => ({ ...player, skipTurns: 0 }));
      addHistory(`${activePlayer.name} · 무인도에서 한 턴 쉬었어요.`);
      openMessage("한 턴 쉬기", "무인도 탈출 준비 완료! 다음 차례부터 다시 이동해요.");
      return;
    }
    setRolling(true);
    const firstValue = randomInt(6) + 1;
    const secondValue = randomInt(6) + 1;
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
      setRolling(false);
      setShowingResult(true);
      const raw = activePlayer.position + value;
      const passedStart = raw >= cells.length;
      const next = raw % cells.length;
      const nextLaps = activePlayer.laps + (passedStart ? 1 : 0);
      const salary = passedStart ? 20 + (activePlayer.startup ? 5 : 0) : 0;
      if (isDouble) addHistory(`${activePlayer.name} · 더블! 한 번 더 굴릴 수 있어요.`);
      window.setTimeout(() => {
        setShowingResult(false);
        setMoving(true);
        for (let step = 1; step <= value; step += 1) {
          window.setTimeout(() => {
            const stepPosition = (activePlayer.position + step) % cells.length;
            setPlayers((current) => current.map((player, index) => index === activePlayerIndex ? { ...player, position: stepPosition } : player));
          }, step * 500);
        }
        window.setTimeout(() => {
          setMoving(false);
          setPlayers((current) => current.map((player, index) => index === activePlayerIndex ? {
            ...player,
            position: next,
            laps: nextLaps,
            cash: Math.round((player.cash + salary) * 10) / 10,
          } : player));
          if (passedStart) {
            addHistory(`${activePlayer.name} · ${activePlayer.startup ? "월급과 창업 수익" : "월급"} ${moneyText(salary)}`);
          }
          setLandedCell(cells[next]);
          resolveCell(next + 1);
        }, value * 500 + 180);
      }, 1250);
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
    if (quiz) setDialog({ type: "quiz", title: "수요 증가 방어 퀴즈", quiz: randomQuiz(12), after: "inflation" });
    else { updateActivePlayer((player) => ({ ...player, expenseMultiplier: 2 })); setDialog({ type: "message", title: "물가 상승 적용", copy: "다음 지출 1회가 두 배가 돼요." }); }
  }

  function travelTo(index: number) {
    updateActivePlayer((player) => ({ ...player, position: index }));
    setDialog(null);
    setLandedCell(cells[index]);
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
        <span>👑</span><p>FINANCIAL MARBLE COMPLETE</p><h3>{winner.name} 금융왕!</h3>
        <strong>{winner.cash.toLocaleString()}만 원</strong><small>4턴 종료 후 가장 많은 최종 자산</small>
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
        <div className="financial-stats"><span>현재 차례 <b style={{ color: activePlayer.color }}>{activePlayer.name}</b></span><span>자산 <b>{activePlayer.cash.toLocaleString()}만 원</b></span><span>개인 턴 <b>{Math.min(activePlayer.turnsUsed + 1, MAX_TURNS)}/{MAX_TURNS}</b></span><span>전체 차례 <b>{turn}</b></span></div>
      </header>

      <div className="financial-player-strip">
        {players.map((player, index) => <div key={player.id} className={index === activePlayerIndex ? "active" : ""}><i style={{ background: player.color }}>{player.id}</i><span>{player.name}<b>{player.cash.toLocaleString()}만 원 · {player.turnsUsed}/{MAX_TURNS}턴</b></span></div>)}
      </div>

      <div className="financial-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="financial-board-wrap">
        <div className="financial-board">
          {cells.map((cell, index) => {
            const cellPlayers = players.filter((player) => player.position === index);
            return (
            <article key={cell.number} className={`financial-cell ${cell.kind} ${cellPlayers.some((player) => player.id === activePlayer.id) ? "active" : ""}`} style={boardPosition(index)}>
              <small>{cell.number}</small><span>{cell.icon}</span><b>{cell.title}</b>
              {cellPlayers.length > 0 && <div className="financial-cell-tokens">{cellPlayers.map((player) => <i key={player.id} aria-label={`${player.name} 말`} style={{ background: player.color }}>{player.id}</i>)}</div>}
            </article>
          )})}
          <div className="financial-center">
            <span className="financial-center-logo">₩</span><h4>금융마블</h4>
            <p>{activeCell.icon} 현재 <b>{activeCell.number}. {activeCell.title}</b></p>
            <button type="button" className={rolling ? "rolling" : showingResult ? "showing-result" : moving ? "moving-piece" : ""} onClick={rollDice} disabled={disabled || rolling || showingResult || moving || Boolean(dialog)}>
              <span className="financial-dice-pair"><DiceCube value={dice ?? 5} rolling={rolling} /><DiceCube value={diceTwo ?? 3} rolling={rolling} second /></span>
              <b>{rolling ? "주사위 굴리는 중…" : showingResult ? `합계 ${rollTotal}!` : moving ? `${rollTotal}칸 이동 중…` : activePlayer.skipTurns ? "한 턴 쉬기" : rollTotal ? `합계 ${rollTotal} · 다시 굴리기` : "두 주사위 굴리기"}</b>
            </button>
            {(showingResult || moving) && <div className={`financial-roll-status ${moving ? "moving" : "result"}`} role="status"><strong>{showingResult ? `🎲 ${dice} + ${diceTwo} = ${rollTotal}` : `📍 ${rollTotal}칸 이동 중`}</strong><small>{showingResult ? "잠시 후 말이 이동해요" : `${activePlayer.name}의 말을 따라가 보세요`}</small></div>}
            <div className="financial-effects"><span className={activePlayer.expenseMultiplier !== 1 ? "on" : ""}>다음 지출 ×{activePlayer.expenseMultiplier}</span><span className={activePlayer.startup ? "on" : ""}>창업 수익 {activePlayer.startup ? "+5" : "없음"}</span></div>
          </div>
        </div>
      </div>

      <div className="financial-mobile-track" aria-label="32칸 이동 경로">
        {cells.map((cell, index) => <div key={cell.number} className={activePlayer.position === index ? "active" : ""}><small>{cell.number}</small><span>{cell.icon}</span><b>{cell.title}</b>{players.filter((player) => player.position === index).map((player) => <i key={player.id} style={{ background: player.color }}>{player.id}</i>)}</div>)}
      </div>
      <div className="financial-mobile-control">
        <p>{activeCell.icon} 현재 <b>{activeCell.number}. {activeCell.title}</b></p>
        <button type="button" className={rolling ? "rolling" : showingResult ? "showing-result" : moving ? "moving-piece" : ""} onClick={rollDice} disabled={disabled || rolling || showingResult || moving || Boolean(dialog)}><span className="financial-dice-pair"><DiceCube value={dice ?? 5} rolling={rolling} /><DiceCube value={diceTwo ?? 3} rolling={rolling} second /></span>{rolling ? "굴리는 중…" : showingResult ? `합계 ${rollTotal}!` : moving ? `${rollTotal}칸 이동 중` : activePlayer.skipTurns ? "한 턴 쉬기" : "두 주사위 굴리기"}</button>
      </div>

      <aside className="financial-history"><strong>최근 금융 기록</strong>{history.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</aside>

      {dialog && <div className="financial-dialog-backdrop"><div className="financial-dialog" role="dialog" aria-modal="true">
        {landedCell && <div className="financial-arrival"><span>도착!</span><strong>{landedCell.icon} {landedCell.number}번 칸 · {landedCell.title}</strong></div>}
        {dialog.type === "message" && <><span className={dialog.amount && dialog.amount < 0 ? "loss" : "gain"}>{dialog.amount ? moneyText(dialog.amount) : "금융 이벤트"}</span><h4>{dialog.title}</h4><p>{dialog.copy}</p>{bonusRoll && <strong className="financial-double-notice">🎲 더블! 한 번 더 굴려요</strong>}<button type="button" onClick={() => finishLanding(dialog.extraRoll)}>{dialog.extraRoll || bonusRoll ? "한 번 더 굴리기" : "확인"}</button></>}
        {dialog.type === "quiz" && <><span>경제 퀴즈</span><h4>{dialog.title}</h4><p>{dialog.quiz.question}</p><div className="financial-dialog-options">{dialog.quiz.options.map((option, index) => <button type="button" key={option} onClick={() => answerQuiz(index)}>{index + 1}. {option}</button>)}</div></>}
        {dialog.type === "lotto" && <><span>운명의 선택</span><h4>로또 번호를 골라 보세요</h4><p>결과를 보기 전에는 어느 쪽이 당첨인지 알 수 없어요.</p><div className="financial-dialog-options two"><button type="button" onClick={() => chooseLotto(1)}>🍀 1번 선택</button><button type="button" onClick={() => chooseLotto(2)}>🍀 2번 선택</button></div></>}
        {dialog.type === "inflation" && <><span>수요 증가 카드</span><h4>다음 지출이 두 배!</h4><p>퀴즈에 도전해 물가 상승 카드를 없던 일로 만들 수 있어요.</p><div className="financial-dialog-options two"><button type="button" onClick={() => chooseInflation(true)}>퀴즈로 막기</button><button type="button" onClick={() => chooseInflation(false)}>그대로 적용</button></div></>}
        {dialog.type === "travel" && <><span>세계여행</span><h4>이동할 칸을 선택하세요</h4><p>선택한 칸의 이벤트가 바로 실행돼요.</p><div className="financial-travel-grid">{cells.map((cell, index) => <button type="button" disabled={index === activePlayer.position || cell.number === 25} key={cell.number} onClick={() => travelTo(index)}>{cell.number}<small>{cell.title}</small></button>)}</div></>}
      </div></div>}
    </section>
  );
}
