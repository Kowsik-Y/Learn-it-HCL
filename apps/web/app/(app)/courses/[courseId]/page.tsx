import { redirect } from "next/navigation";
import { mockCourseData } from "@/lib/mock-course-data";

export default async function CourseRedirectPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const firstModule = mockCourseData.modules[0];
  const firstLesson = firstModule?.lessons[0];
  
  if (firstModule && firstLesson) {
    redirect(`/courses/${courseId}/${firstModule.id}/${firstLesson.id}`);
  }
  
  return (
    <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
      This course currently has no content.
    </div>
  );
}
