'use client';

import { Award, FileText, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useCourse } from './course-context';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function CourseSidebar() {
  const { completedLessons, totalXp } = useCourse();
  const params = useParams();

  const courseId = params.courseId as string;
  const activeLesson = params.subtopicId as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const res = await api.getCourse(courseId) as any;
        setCourse(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <Sidebar collapsible="none" className="h-full border-r bg-muted/10 shrink-0 w-64">
        <div className="p-4 space-y-4">
          <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          <div className="space-y-2 pt-4">
            <div className="h-10 bg-muted animate-pulse rounded animate-pulse" />
            <div className="h-10 bg-muted animate-pulse rounded animate-pulse" />
          </div>
        </div>
      </Sidebar>
    );
  }

  if (!course) {
    return (
      <Sidebar collapsible="none" className="h-full border-r bg-muted/10 shrink-0 w-64">
        <div className="p-4 text-sm text-muted-foreground">Course not found.</div>
      </Sidebar>
    );
  }

  const modules = course.modules || [];

  return (
    <Sidebar collapsible="none" className="h-full border-r bg-muted/10 shrink-0">
      <SidebarHeader className="p-4 border-b bg-background shrink-0">
        <h2 className="font-bold text-lg leading-tight">{course.title}</h2>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-500">
          <Award className="size-4" />
          <span>{totalXp} XP Earned</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 bg-muted/10">
        <Accordion defaultValue={modules[0]?.id ? [modules[0].id] : []} className="w-full">
          {modules.map((mod: any) => {
            const lessons = mod.chapters?.flatMap((ch: any) => ch.lessons || []) || [];
            return (
              <AccordionItem value={mod.id} key={mod.id} className="border-b-0">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 text-left">
                  {mod.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col space-y-1 mt-1">
                    {lessons.map((lesson: any) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isActive = activeLesson === lesson.id;
                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-2 p-2 text-sm rounded-md transition-colors ${
                            isActive ? 'bg-primary/10 font-medium' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isCompleted}
                            disabled={true}
                            className="pointer-events-none shrink-0"
                          />
                          <Link
                            href={`/courses/${courseId}/${mod.id}/${lesson.id}`}
                            className={`flex-1 flex items-center gap-2 text-left min-w-0 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            {lesson.content_type === 'video' ? (
                              <PlayCircle className="size-4 shrink-0" />
                            ) : (
                              <FileText className="size-4 shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
}
