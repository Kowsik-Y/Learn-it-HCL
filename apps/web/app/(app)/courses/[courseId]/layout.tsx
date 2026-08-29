"use client";

import { CourseProvider } from "@/components/course/course-context";
import { CourseSidebar } from "@/components/course/course-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AiTutorChat } from "@/components/ai-tutor-chat";
import { GlobalSidebarCloser } from "@/components/course/global-sidebar-closer";

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <CourseProvider>
      <GlobalSidebarCloser />
      <SidebarProvider className="h-svh w-full overflow-hidden flex flex-row">
        <CourseSidebar />
        <main className="flex-1 overflow-y-auto min-w-0 h-full relative">
          {children}
        </main>
        <AiTutorChat />
      </SidebarProvider>
    </CourseProvider>
  );
}
