"use client";

import { useMemo, useState } from "react";

export type GradeBand = "1-2" | "3-4" | "5-6";
export type GameOutcome = { score: number; remainingBudget: number };

type ConsumerValue = "value" | "health" | "environment" | "local";
type IngredientChoice = {
  name: string;
  description: string;
  price: number;
  score: number;
  values: ConsumerValue[];
};
type Ingredient = {
  name: string;
  choices: [IngredientChoice, IngredientChoice];
};
type Menu = {
  id: string;
  icon: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
};

const STARTING_BUDGET = 15_000;

const menus: Menu[] = [
  {
    id: "doenjang",
    icon: "♨",
    name: "구수한 된장찌개",
    description: "된장과 신선한 채소를 골라 따뜻한 한 끼를 완성해요.",
    ingredients: [
      { name: "된장", choices: [
        { name: "일반 된장", description: "가격 부담이 적은 기본 된장", price: 3000, score: 7, values: ["value"] },
        { name: "재래된장", description: "전통 방식의 깊은 맛을 살린 된장", price: 5000, score: 9, values: ["local"] },
      ] },
      { name: "두부", choices: [
        { name: "수입 콩 두부", description: "수입 콩으로 만든 실속 두부", price: 2000, score: 6, values: ["value"] },
        { name: "국내산 콩 두부", description: "국내산 콩으로 만든 두부", price: 3500, score: 8, values: ["local"] },
      ] },
      { name: "애호박", choices: [
        { name: "일반 애호박", description: "가까운 마트의 보통 애호박", price: 1500, score: 7, values: ["value"] },
        { name: "친환경 애호박", description: "환경을 생각해 재배한 애호박", price: 2500, score: 8, values: ["health", "environment"] },
      ] },
      { name: "양파", choices: [
        { name: "일반 양파", description: "가격 부담이 적은 기본 양파", price: 1000, score: 7, values: ["value"] },
        { name: "지역 농가 양파", description: "우리 지역 농가에서 온 양파", price: 2000, score: 8, values: ["local"] },
      ] },
      { name: "당근", choices: [
        { name: "못난이 당근", description: "모양은 달라도 맛과 품질은 좋은 당근", price: 800, score: 8, values: ["value", "environment"] },
        { name: "프리미엄 당근", description: "보기 좋게 선별한 고급 당근", price: 1800, score: 7, values: [] },
      ] },
    ],
  },
  {
    id: "kimchi-rice",
    icon: "●",
    name: "김치볶음밥",
    description: "쌀, 김치, 달걀을 균형 있게 골라 든든한 볶음밥을 만들어요.",
    ingredients: [
      { name: "쌀", choices: [
        { name: "일반 쌀", description: "가격과 품질이 안정적인 쌀", price: 2000, score: 7, values: ["value"] },
        { name: "친환경 쌀", description: "환경을 생각해 재배한 쌀", price: 3500, score: 9, values: ["health", "environment"] },
      ] },
      { name: "김치", choices: [
        { name: "수입 김치", description: "가격 부담이 적은 수입 김치", price: 2500, score: 6, values: ["value"] },
        { name: "국내산 김치", description: "국내산 재료로 만든 김치", price: 4000, score: 9, values: ["local"] },
      ] },
      { name: "달걀", choices: [
        { name: "일반 달걀", description: "가격과 영양을 고루 갖춘 달걀", price: 1500, score: 7, values: ["value"] },
        { name: "동물복지 달걀", description: "닭의 사육 환경을 생각한 달걀", price: 2500, score: 8, values: ["health", "environment"] },
      ] },
      { name: "식용유", choices: [
        { name: "일반 식용유", description: "여러 요리에 쓰는 실속 식용유", price: 1000, score: 7, values: ["value"] },
        { name: "올리브유", description: "건강을 생각한 식용유 선택", price: 3000, score: 6, values: ["health"] },
      ] },
      { name: "햄", choices: [
        { name: "일반 햄", description: "가격이 낮고 익숙한 맛의 햄", price: 2000, score: 7, values: ["value"] },
        { name: "무첨가 햄", description: "첨가물을 줄인 햄", price: 3500, score: 8, values: ["health"] },
      ] },
    ],
  },
  {
    id: "vegetable-curry",
    icon: "◆",
    name: "채소카레",
    description: "여러 채소의 가격과 품질을 비교해 알찬 카레를 만들어요.",
    ingredients: [
      { name: "쌀", choices: [
        { name: "일반 쌀", description: "가격과 품질이 안정적인 쌀", price: 2000, score: 7, values: ["value"] },
        { name: "친환경 쌀", description: "환경을 생각해 재배한 쌀", price: 3500, score: 9, values: ["health", "environment"] },
      ] },
      { name: "카레가루", choices: [
        { name: "일반 카레", description: "익숙한 맛의 실속 제품", price: 2000, score: 7, values: ["value"] },
        { name: "저염 카레", description: "나트륨을 줄인 카레", price: 3000, score: 8, values: ["health"] },
      ] },
      { name: "감자", choices: [
        { name: "일반 감자", description: "가격이 안정적인 일반 감자", price: 1500, score: 7, values: ["value"] },
        { name: "못난이 감자", description: "모양은 달라도 맛과 품질은 좋은 감자", price: 1000, score: 8, values: ["value", "environment"] },
      ] },
      { name: "당근", choices: [
        { name: "일반 당근", description: "가격 부담이 적은 기본 당근", price: 1500, score: 7, values: ["value"] },
        { name: "친환경 당근", description: "환경을 생각해 재배한 당근", price: 2500, score: 8, values: ["health", "environment"] },
      ] },
      { name: "양파", choices: [
        { name: "일반 양파", description: "가격 부담이 적은 기본 양파", price: 1000, score: 7, values: ["value"] },
        { name: "지역 농가 양파", description: "지역 경제에 도움을 주는 양파", price: 2000, score: 8, values: ["local"] },
      ] },
    ],
  },
  {
    id: "kimchi-pancake",
    icon: "▰",
    name: "김치전",
    description: "필요한 재료를 알맞게 골라 바삭한 김치전을 완성해요.",
    ingredients: [
      { name: "밀가루", choices: [
        { name: "일반 밀가루", description: "가격 부담이 적은 기본 제품", price: 1500, score: 7, values: ["value"] },
        { name: "우리밀", description: "국내에서 기른 밀로 만든 제품", price: 3000, score: 9, values: ["local"] },
      ] },
      { name: "달걀", choices: [
        { name: "일반 달걀", description: "필요한 만큼 소포장한 달걀", price: 1500, score: 7, values: ["value"] },
        { name: "동물복지 달걀", description: "사육 환경까지 생각한 달걀", price: 2500, score: 8, values: ["health", "environment"] },
      ] },
      { name: "김치", choices: [
        { name: "수입 김치", description: "가격 부담이 적은 수입 김치", price: 2500, score: 6, values: ["value"] },
        { name: "국내산 김치", description: "국내산 재료로 만든 김치", price: 4000, score: 9, values: ["local"] },
      ] },
      { name: "식용유", choices: [
        { name: "일반 식용유", description: "가격 대비 활용도가 높은 제품", price: 1000, score: 8, values: ["value"] },
        { name: "올리브유", description: "건강을 생각한 식용유 선택", price: 3000, score: 6, values: ["health"] },
      ] },
      { name: "부추", choices: [
        { name: "일반 부추", description: "필요한 양만 담은 일반 부추", price: 1500, score: 7, values: ["value"] },
        { name: "친환경 부추", description: "환경을 생각해 재배한 부추", price: 2500, score: 8, values: ["health", "environment"] },
      ] },
    ],
  },
  {
    id: "fruit-yogurt",
    icon: "♥",
    name: "과일요거트",
    description: "건강, 환경, 가격을 살펴 상큼한 간식을 만들어요.",
    ingredients: [
      { name: "요거트", choices: [
        { name: "플레인 요거트", description: "담백한 기본 요거트", price: 2000, score: 8, values: ["value", "health"] },
        { name: "유기농 요거트", description: "환경과 건강을 생각한 요거트", price: 3500, score: 9, values: ["health", "environment"] },
      ] },
      { name: "바나나", choices: [
        { name: "수입 바나나", description: "가격이 저렴한 수입 바나나", price: 1500, score: 7, values: ["value"] },
        { name: "친환경 바나나", description: "환경을 생각해 재배한 바나나", price: 2500, score: 8, values: ["health", "environment"] },
      ] },
      { name: "사과", choices: [
        { name: "일반 사과", description: "보기 좋게 선별한 일반 사과", price: 2000, score: 7, values: [] },
        { name: "못난이 사과", description: "모양 때문에 버려질 과일을 활용", price: 1500, score: 9, values: ["value", "environment"] },
      ] },
      { name: "딸기", choices: [
        { name: "일반 딸기", description: "가격과 품질이 안정적인 딸기", price: 3000, score: 7, values: ["value"] },
        { name: "지역 농가 딸기", description: "가까운 지역 농가에서 온 딸기", price: 4000, score: 8, values: ["local"] },
      ] },
      { name: "꿀", choices: [
        { name: "일반 꿀", description: "가격 부담이 적은 일반 꿀", price: 2000, score: 7, values: ["value"] },
        { name: "천연 벌꿀", description: "자연에서 얻은 천연 벌꿀", price: 3500, score: 9, values: ["health", "environment"] },
      ] },
    ],
  },
];

const awardLabels: Record<ConsumerValue, string> = {
  value: "최고의 가성비상",
  health: "건강 소비상",
  environment: "친환경 소비상",
  local: "지역 경제 지킴이상",
};

export default function GradeGame({
  band,
  onFinish,
  disabled,
}: {
  band: GradeBand;
  onFinish: (outcome: GameOutcome) => void;
  disabled: boolean;
}) {
  if (band === "3-4") {
    return <RationalConsumerGame onFinish={onFinish} disabled={disabled} />;
  }
  return <SimpleGradeGame band={band} onFinish={onFinish} disabled={disabled} />;
}

function RationalConsumerGame({
  onFinish,
  disabled,
}: {
  onFinish: (outcome: GameOutcome) => void;
  disabled: boolean;
}) {
  const [step, setStep] = useState<"intro" | "menu" | "shop" | "result">("intro");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const selectedMenu = menus.find((menu) => menu.id === menuId) ?? null;

  const summary = useMemo(() => {
    if (!selectedMenu) return { spent: 0, remaining: STARTING_BUDGET, ingredientScore: 0, bonus: 15, finalScore: 15, award: awardLabels.value };
    const selectedChoices = selectedMenu.ingredients.flatMap((ingredient) => {
      const selectedIndex = selections[ingredient.name];
      return selectedIndex === undefined ? [] : [ingredient.choices[selectedIndex]];
    });
    const spent = selectedChoices.reduce((sum, choice) => sum + choice.price, 0);
    const ingredientScore = selectedChoices.reduce((sum, choice) => sum + choice.score, 0);
    const remaining = STARTING_BUDGET - spent;
    const bonus = Math.max(0, Math.floor(remaining / 1000));
    const valueCounts = selectedChoices.reduce<Record<ConsumerValue, number>>(
      (counts, choice) => {
        choice.values.forEach((value) => { counts[value] += 1; });
        return counts;
      },
      { value: 0, health: 0, environment: 0, local: 0 },
    );
    const awardValue = (Object.keys(valueCounts) as ConsumerValue[]).sort((a, b) => {
      if (valueCounts[b] !== valueCounts[a]) return valueCounts[b] - valueCounts[a];
      return a === "value" && remaining >= 3000 ? -1 : 0;
    })[0];
    return {
      spent,
      remaining,
      ingredientScore,
      bonus,
      finalScore: ingredientScore + bonus,
      award: awardLabels[awardValue],
    };
  }, [selectedMenu, selections]);

  const selectedCount = Object.keys(selections).length;
  const overBudget = summary.remaining < 0;

  const chooseMenu = (id: string) => {
    setMenuId(id);
    setSelections({});
    setStep("shop");
  };

  if (step === "intro") {
    return (
      <section className="consumer-intro">
        <div className="consumer-title-card">
          <span>3·4학년 경제 미션</span>
          <h3>합리적 소비왕 챌린지</h3>
          <p>주어진 예산 안에서 재료를 선택해 가장 높은 점수를 얻어 보세요.</p>
        </div>
        <div className="consumer-rule-grid">
          <article><b>예산</b><strong>15,000원</strong><p>선택한 재료의 가격을 모두 더해요.</p></article>
          <article><b>기본 점수</b><strong>품질 점수의 합</strong><p>가격뿐 아니라 건강과 환경도 살펴요.</p></article>
          <article><b>보너스</b><strong>1,000원당 1점</strong><p>남은 예산만큼 추가 점수를 받아요.</p></article>
        </div>
        <div className="consumer-values">
          <b>합리적인 소비의 네 가지 기준</b>
          <div><span>가격</span><span>품질</span><span>건강</span><span>환경·지역 경제</span></div>
        </div>
        <button className="primary-button consumer-start" onClick={() => setStep("menu")}>챌린지 시작하기 →</button>
      </section>
    );
  }

  if (step === "menu") {
    return (
      <section className="consumer-menu-step">
        <div className="consumer-step-heading">
          <span>STEP 1</span>
          <h3>만들고 싶은 메뉴를 골라 보세요</h3>
          <p>어떤 메뉴를 골라도 다섯 가지 재료를 선택하게 됩니다.</p>
        </div>
        <div className="consumer-menu-grid">
          {menus.map((menu, index) => (
            <button key={menu.id} onClick={() => chooseMenu(menu.id)}>
              <i>{menu.icon}</i>
              <small>MENU 0{index + 1}</small>
              <strong>{menu.name}</strong>
              <span>{menu.description}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (step === "result" && selectedMenu) {
    return (
      <section className="consumer-result">
        <span className="consumer-result-crown">♛</span>
        <p className="eyebrow">CHALLENGE COMPLETE</p>
        <h3>합리적 소비왕 도전 완료!</h3>
        <p>{selectedMenu.name} 재료를 예산 안에서 모두 골랐어요.</p>
        <div className="consumer-score-formula">
          <div><small>재료 점수</small><strong>{summary.ingredientScore}점</strong></div>
          <span>+</span>
          <div><small>남은 예산 보너스</small><strong>{summary.bonus}점</strong></div>
          <span>=</span>
          <div className="final"><small>최종 점수</small><strong>{summary.finalScore}점</strong></div>
        </div>
        <div className="consumer-result-details">
          <span>사용 금액 <b>{summary.spent.toLocaleString()}원</b></span>
          <span>남은 금액 <b>{summary.remaining.toLocaleString()}원</b></span>
          <span>나의 특별상 <b>{summary.award}</b></span>
        </div>
        <p className="consumer-lesson">가격이 비싸거나 싸다는 이유만으로 고르지 않고, 품질·건강·환경·지역 경제를 함께 살피는 것이 합리적인 소비예요.</p>
        <div className="consumer-result-actions">
          <button type="button" onClick={() => { setSelections({}); setStep("menu"); }}>다른 메뉴 도전하기</button>
          <button
            className="primary-button"
            disabled={disabled}
            onClick={() => onFinish({ score: summary.finalScore, remainingBudget: summary.remaining })}
          >
            결과판에 기록하기
          </button>
        </div>
      </section>
    );
  }

  if (!selectedMenu) return null;

  return (
    <section className="consumer-shop">
      <div className="consumer-shop-top">
        <button type="button" onClick={() => setStep("menu")}>← 메뉴 바꾸기</button>
        <div><span>STEP 2</span><h3>{selectedMenu.name} 재료 고르기</h3></div>
        <strong>{selectedCount} / {selectedMenu.ingredients.length}</strong>
      </div>

      <div className={`consumer-budget ${overBudget ? "over" : ""}`}>
        <div><small>시작 예산</small><strong>{STARTING_BUDGET.toLocaleString()}원</strong></div>
        <div><small>사용 금액</small><strong>{summary.spent.toLocaleString()}원</strong></div>
        <div><small>남은 금액</small><strong>{summary.remaining.toLocaleString()}원</strong></div>
        <div><small>현재 예상 점수</small><strong>{summary.finalScore}점</strong></div>
      </div>

      <div className="ingredient-list">
        {selectedMenu.ingredients.map((ingredient, ingredientIndex) => (
          <article className="ingredient-row" key={ingredient.name}>
            <div className="ingredient-name"><span>{ingredientIndex + 1}</span><strong>{ingredient.name}</strong></div>
            <div className="ingredient-options">
              {ingredient.choices.map((choice, choiceIndex) => {
                const selected = selections[ingredient.name] === choiceIndex;
                return (
                  <button
                    type="button"
                    className={selected ? "selected" : ""}
                    key={choice.name}
                    onClick={() => setSelections((current) => ({ ...current, [ingredient.name]: choiceIndex }))}
                  >
                    <span>{selected ? "✓" : "+"}</span>
                    <div><strong>{choice.name}</strong><small>{choice.description}</small></div>
                    <div><b>{choice.price.toLocaleString()}원</b><em>{choice.score}점</em></div>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {overBudget && <p className="consumer-budget-warning">예산을 {Math.abs(summary.remaining).toLocaleString()}원 초과했어요. 다른 재료를 선택해 보세요.</p>}
      <button
        className="primary-button consumer-finish"
        disabled={selectedCount !== selectedMenu.ingredients.length || overBudget}
        onClick={() => setStep("result")}
      >
        점수 계산하기 →
      </button>
    </section>
  );
}

function SimpleGradeGame({
  band,
  onFinish,
  disabled,
}: {
  band: Exclude<GradeBand, "3-4">;
  onFinish: (outcome: GameOutcome) => void;
  disabled: boolean;
}) {
  const [choices, setChoices] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const options = band === "1-2"
    ? [
      { name: "아플 때 먹는 약", value: 20 },
      { name: "새로 나온 장난감", value: 0 },
      { name: "학교 갈 버스비", value: 20 },
      { name: "유행하는 스티커", value: 0 },
      { name: "점심 식사", value: 20 },
    ]
    : [
      { name: "바로 오늘 쓰기", value: 20 },
      { name: "절반 저축하기", value: 30 },
      { name: "목표를 정해 저축하기", value: 50 },
    ];
  const score = band === "1-2"
    ? choices.reduce((sum, index) => sum + options[index].value, 40)
    : choices.length ? options[choices[0]].value + 50 : 0;
  const toggle = (index: number) => {
    setChoices((current) =>
      band === "5-6"
        ? [index]
        : current.includes(index)
          ? current.filter((item) => item !== index)
          : [...current, index],
    );
  };

  if (done) {
    return (
      <div className="game-complete">
        <span>🎉</span>
        <h3>미션 완료!</h3>
        <strong>{Math.round(score)}점</strong>
        <p>{score >= 90 ? "경제 선택 달인! 계획과 필요를 모두 잘 생각했어요." : "좋은 시작이에요! 다음에는 예산과 미래도 함께 생각해 봐요."}</p>
        <button className="primary-button" disabled={disabled} onClick={() => onFinish({ score: Math.round(score), remainingBudget: 0 })}>결과판에 기록하기</button>
      </div>
    );
  }

  return (
    <div className="mission">
      <div className="mission-question">
        <b>{band === "1-2" ? "꼭 필요한 것만 골라 보세요" : "용돈 10,000원이 생겼어요. 어떻게 할까요?"}</b>
      </div>
      <div className="choice-grid">
        {options.map((option, index) => (
          <button key={option.name} className={choices.includes(index) ? "selected" : ""} onClick={() => toggle(index)}>
            <span>{choices.includes(index) ? "✓" : "+"}</span>
            <strong>{option.name}</strong>
          </button>
        ))}
      </div>
      <button className="primary-button finish" disabled={!choices.length} onClick={() => setDone(true)}>선택 완료하기 →</button>
    </div>
  );
}
