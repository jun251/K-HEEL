export type GradeBand = "1-2" | "3-4" | "5-6";

export type Player = {
  token: string;
  nickname: string;
  roomCode: string;
  gradeBand: GradeBand;
};

export type GradeGameProps = {
  onFinish: (score: number) => void;
  disabled: boolean;
};

export type GradeGameMeta = {
  label: string;
  title: string;
  description: string;
};
