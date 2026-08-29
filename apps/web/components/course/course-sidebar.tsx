"use client";

import { useCourse } from "./course-context";
import { mockCourseData } from "@/lib/mock-course-data";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayCircle, FileText, Award } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function CourseSidebar() {
  const { completedLessons, totalXp } = useCourse();
  const params = useParams();
  
  const courseId = params.courseId as string;
  const activeLesson = params.subtopicId as string;

  return (
    <Sidebar collapsible="none" className="h-full border-r bg-muted/10 shrink-0">
      <SidebarHeader className="p-4 border-b bg-background shrink-0">
        <h2 className="font-bold text-lg leading-tight">{mockCourseData.title}</h2>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-500">
          <Award className="size-4" />
          <span>{totalXp} XP Earned</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 bg-muted/10">
        <Accordion defaultValue={["mod-1"]} className="w-full">
          {mockCourseData.modules.map((mod) => (
            <AccordionItem value={mod.id} key={mod.id} className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 text-left">
                {mod.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-1 mt-1">
                  {mod.lessons.map((lesson) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    const isActive = activeLesson === lesson.id;
                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-2 p-2 text-sm rounded-md transition-colors ${
                          isActive 
                            ? "bg-primary/10 font-medium" 
                            : "hover:bg-muted/50"
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
                          {lesson.type === 'video' ? (
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
          ))}
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
}
