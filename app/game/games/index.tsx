import { GradeFiveSixGame } from "./grade-5-6";
import { GradeOneTwoGame } from "./grade-1-2";
import { GradeThreeFourGame } from "./grade-3-4";
import type { ComponentType } from "react";
import type { GradeBand, GradeGameMeta, GradeGameProps } from "./types";

export const gradeGameMeta: Record<GradeBand, GradeGameMeta> = {
  "1-2": {
    label: "1·2학년",
    title: "꼭 필요할까?",
    description: "필요한 것과 갖고 싶은 것을 구별해요.",
  },
  "3-4": {
    label: "3·4학년",
    title: "만원 장보기",
    description: "예산 안에서 똑똑하게 선택해요.",
  },
  "5-6": {
    label: "5·6학년",
    title: "미래 통장",
    description: "오늘의 선택이 미래를 어떻게 바꾸는지 알아봐요.",
  },
};

const gamesByGrade: Record<GradeBand, ComponentType<GradeGameProps>> = {
  "1-2": GradeOneTwoGame,
  "3-4": GradeThreeFourGame,
  "5-6": GradeFiveSixGame,
};

export function getGradeGame(gradeBand: GradeBand) {
  return gamesByGrade[gradeBand];
}
