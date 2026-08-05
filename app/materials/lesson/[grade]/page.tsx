import { notFound } from "next/navigation";
import ResponsiveLesson from "../ResponsiveLesson";
import { isLessonGrade, lessons } from "../lesson-data";

type LessonPageProps = {
  params: Promise<{ grade: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { grade } = await params;
  if (!isLessonGrade(grade)) notFound();

  return <ResponsiveLesson lesson={lessons[grade]} />;
}

