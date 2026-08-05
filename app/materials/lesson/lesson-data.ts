export type LessonGrade = "1-2" | "3-4" | "5-6";

export type LessonInfo = {
  grade: LessonGrade;
  label: string;
  title: string;
  description: string;
  slideCount: number;
  slideSources?: number[];
  accent: string;
};

export const lessons: Record<LessonGrade, LessonInfo> = {
  "1-2": {
    grade: "1-2",
    label: "1·2학년",
    title: "K-HEEL 탐험대!",
    description: "필요한 것과 원하는 것을 놀이와 퀴즈로 구분해 봅니다.",
    slideCount: 23,
    slideSources: [1, 2, ...Array.from({ length: 21 }, (_, index) => index + 4)],
    accent: "lime",
  },
  "3-4": {
    grade: "3-4",
    label: "3·4학년",
    title: "돈을 키우는 아이들",
    description: "합리적 소비와 저축의 원리를 생활 속 사례로 익힙니다.",
    slideCount: 29,
    accent: "green",
  },
  "5-6": {
    grade: "5-6",
    label: "5·6학년",
    title: "알쓸경금",
    description: "은행, 시장, 합리적 소비와 투자의 기본을 차근차근 배웁니다.",
    slideCount: 39,
    accent: "yellow",
  },
};

export function isLessonGrade(value: string): value is LessonGrade {
  return value === "1-2" || value === "3-4" || value === "5-6";
}
