import { redirect } from 'next/navigation';
import { prisma } from '@/lib/server/db';

export default async function CourseRedirectPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          chapters: {
            orderBy: { orderIndex: 'asc' },
            include: {
              lessons: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  const firstModule = course?.modules[0];
  const firstChapter = firstModule?.chapters[0];
  const firstLesson = firstChapter?.lessons[0];

  if (firstModule && firstLesson) {
    redirect(`/courses/${courseId}/${firstModule.id}/${firstLesson.id}`);
  }

  return (
    <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
      This course currently has no content.
    </div>
  );
}
