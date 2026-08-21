"use client";

import { useEffect, useMemo, useState } from "react";
import FinancialMarbleGame from "./FinancialMarbleGame";
import Grade12GameMenu from "./Grade12GameMenu";

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

const menuImages: Record<string, string> = {
  doenjang: "/game-images/menus/doenjang-stew.jpg",
  "kimchi-rice": "/game-images/menus/kimchi-rice.avif",
  "vegetable-curry": "/game-images/menus/vegetable-curry.jpg",
  "kimchi-pancake": "/game-images/menus/kimchi-pancake.jpg",
  "fruit-yogurt": "/game-images/menus/fruit-yogurt.jpg",
};

const choiceImages: Record<string, string> = {
  "일반 된장": "/game-images/choices/doenjang.jpg",
  재래된장: "/game-images/choices/traditional-doenjang.jpg",
  "수입 콩 두부": "/game-images/choices/tofu-imported.jpg",
  "국내산 콩 두부": "/game-images/choices/tofu-domestic.jpg",
  "일반 애호박": "/game-images/choices/zucchini.jpg",
  "친환경 애호박": "/game-images/choices/zucchini-eco.jpg",
  "일반 양파": "/game-images/choices/onion.jpg",
  "지역 농가 양파": "/game-images/choices/onion-eco.jpg",
  "못난이 당근": "/game-images/choices/carrot.jpg",
  "프리미엄 당근": "/game-images/choices/carrot-eco.jpg",
  "일반 쌀": "/game-images/choices/rice.jpg",
  "친환경 쌀": "/game-images/choices/rice-eco.jpg",
  "수입 김치": "/game-images/choices/kimchi-imported.jpg",
  "국내산 김치": "/game-images/choices/kimchi-domestic.jpg",
  "일반 달걀": "/game-images/choices/egg.jpg",
  "동물복지 달걀": "/game-images/choices/egg-welfare.jpg",
  "일반 식용유": "/game-images/choices/oil.jpg",
  올리브유: "/game-images/choices/olive-oil.jpg",
  "일반 햄": "/game-images/choices/ham.jpg",
  "무첨가 햄": "/game-images/choices/ham-additive-free.jpg",
  "일반 카레": "/game-images/choices/curry.jpg",
  "저염 카레": "/game-images/choices/curry-low-salt.jpg",
  "일반 감자": "/game-images/choices/potato.jpg",
  "못난이 감자": "/game-images/choices/potato-imperfect.jpg",
  "일반 당근": "/game-images/choices/carrot.jpg",
  "친환경 당근": "/game-images/choices/carrot-eco.jpg",
  "일반 밀가루": "/game-images/choices/flour.jpg",
  우리밀: "/game-images/choices/flour-organic.jpg",
  "일반 부추": "/game-images/choices/chives.jpg",
  "친환경 부추": "/game-images/choices/chives-organic.jpg",
  "플레인 요거트": "/game-images/choices/yogurt.jpg",
  "유기농 요거트": "/game-images/choices/yogurt-organic.jpg",
  "수입 바나나": "/game-images/choices/banana.jpg",
  "친환경 바나나": "/game-images/choices/banana-eco.jpg",
  "일반 사과": "/game-images/choices/apple.jpg",
  "못난이 사과": "/game-images/choices/apple-imperfect.jpg",
  "일반 딸기": "/game-images/choices/strawberry.jpg",
  "지역 농가 딸기": "/game-images/choices/strawberry-eco.jpg",
  "일반 꿀": "/game-images/choices/honey.jpg",
  "천연 벌꿀": "/game-images/choices/honey-natural.jpg",
};

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
  if (band === "5-6") {
    return <FinancialMarbleGame onFinish={onFinish} disabled={disabled} />;
  }
  return <Grade12GameMenu onFinish={onFinish} disabled={disabled} />;
}

function RationalConsumerGame({
  onFinish,
  disabled,
}: {
  onFinish: (outcome: GameOutcome) => void;
  disabled: boolean;
}) {
  const [step, setStep] = useState<"shop" | "result">("shop");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [ingredientIndex, setIngredientIndex] = useState(0);
  const [playedMenuIds, setPlayedMenuIds] = useState<string[]>([]);
  const selectedMenu = menus.find((menu) => menu.id === menuId) ?? null;
  const currentIngredient = selectedMenu?.ingredients[ingredientIndex] ?? null;

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

  const overBudget = summary.remaining < 0;

  const startRandomMenu = (completedMenuIds: string[]) => {
    const unplayedMenus = menus.filter((menu) => !completedMenuIds.includes(menu.id));
    const candidates = unplayedMenus.length > 0 ? unplayedMenus : menus;
    const randomMenu = candidates[Math.floor(Math.random() * candidates.length)];
    setPlayedMenuIds(unplayedMenus.length > 0 ? completedMenuIds : []);
    setMenuId(randomMenu.id);
    setSelections({});
    setIngredientIndex(0);
    setStep("shop");
  };

  useEffect(() => {
    const randomMenu = menus[Math.floor(Math.random() * menus.length)];
    setMenuId(randomMenu.id);
  }, []);

  const selectIngredient = (choiceIndex: number) => {
    if (!selectedMenu || !currentIngredient) return;
    const choice = currentIngredient.choices[choiceIndex];
    const currentChoiceIndex = selections[currentIngredient.name];
    const currentChoicePrice = currentChoiceIndex === undefined ? 0 : currentIngredient.choices[currentChoiceIndex].price;
    if (summary.spent - currentChoicePrice + choice.price > STARTING_BUDGET) return;
    setSelections((current) => ({ ...current, [currentIngredient.name]: choiceIndex }));
    if (ingredientIndex < selectedMenu.ingredients.length - 1) {
      setIngredientIndex((current) => current + 1);
    } else {
      setPlayedMenuIds((current) => current.includes(selectedMenu.id) ? current : [...current, selectedMenu.id]);
      setStep("result");
    }
  };

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
        <p className="consumer-round-progress">이번 순환에서 {playedMenuIds.length} / {menus.length}개 메뉴 완료</p>
        <p className="consumer-lesson">가격이 비싸거나 싸다는 이유만으로 고르지 않고, 품질·건강·환경·지역 경제를 함께 살피는 것이 합리적인 소비예요.</p>
        <div className="consumer-result-actions">
          <button type="button" onClick={() => startRandomMenu(playedMenuIds)}>안 한 메뉴 랜덤 도전</button>
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

  if (!selectedMenu) {
    return <section className="consumer-assigning" aria-live="polite">메뉴를 자동으로 배정하고 있어요…</section>;
  }

  return (
    <section className="consumer-shop">
      <div className="consumer-shop-top">
        <span className="random-menu-badge">랜덤 메뉴</span>
        <div className="consumer-menu-identity">
          <img src={menuImages[selectedMenu.id]} alt={`${selectedMenu.name} 완성 사진`} />
          <div><span>합리적 소비왕 챌린지 · 재료 {ingredientIndex + 1}</span><h3>{selectedMenu.name}</h3></div>
        </div>
        <strong>{ingredientIndex + 1} / {selectedMenu.ingredients.length}</strong>
      </div>

      <div className={`consumer-budget ${overBudget ? "over" : ""}`}>
        <div><small>시작 예산</small><strong>{STARTING_BUDGET.toLocaleString()}원</strong></div>
        <div><small>사용 금액</small><strong>{summary.spent.toLocaleString()}원</strong></div>
        <div><small>남은 금액</small><strong>{summary.remaining.toLocaleString()}원</strong></div>
        <div><small>현재 예상 점수</small><strong>{summary.finalScore}점</strong></div>
      </div>

      <div className="ingredient-progress" aria-label="재료 선택 진행 상황">
        {selectedMenu.ingredients.map((ingredient, index) => (
          <span key={ingredient.name} className={index < ingredientIndex ? "done" : index === ingredientIndex ? "active" : ""}>
            <b>{index < ingredientIndex ? "✓" : index + 1}</b>{ingredient.name}
          </span>
        ))}
      </div>

      {currentIngredient && (
        <article className="single-ingredient-card">
          <div className="single-ingredient-heading">
            <span>{ingredientIndex + 1}</span>
            <div><small>둘 중 하나를 선택하세요</small><h4>{currentIngredient.name}</h4></div>
          </div>
          <div className="ingredient-options single-ingredient-options">
            {currentIngredient.choices.map((choice, choiceIndex) => {
              const currentChoiceIndex = selections[currentIngredient.name];
              const currentChoicePrice = currentChoiceIndex === undefined ? 0 : currentIngredient.choices[currentChoiceIndex].price;
              const exceedsBudget = summary.spent - currentChoicePrice + choice.price > STARTING_BUDGET;
              return (
                <button
                  type="button"
                  disabled={exceedsBudget}
                  className={currentChoiceIndex === choiceIndex ? "selected" : ""}
                  key={choice.name}
                  onClick={() => selectIngredient(choiceIndex)}
                  aria-label={`${choice.name}, ${choice.price.toLocaleString()}원, ${choice.score}점${exceedsBudget ? ", 예산 초과" : ""}`}
                >
                  <img className="choice-card-image" src={choiceImages[choice.name]} alt={choice.name} />
                  <div className="choice-card-copy"><strong>{choice.name}</strong><small>{choice.description}</small></div>
                  <div className="choice-card-meta"><b>{choice.price.toLocaleString()}원</b><em>{choice.score}점</em></div>
                  <span className="choice-card-action">선택</span>
                  {exceedsBudget && <small className="option-budget-warning">예산 초과</small>}
                </button>
              );
            })}
          </div>
          <div className="ingredient-navigation">
            <button type="button" disabled={ingredientIndex === 0} onClick={() => setIngredientIndex((current) => Math.max(0, current - 1))}>← 이전 재료</button>
            <p>선택하면 자동으로 다음 재료로 넘어갑니다.</p>
          </div>
        </article>
      )}
    </section>
  );
}
