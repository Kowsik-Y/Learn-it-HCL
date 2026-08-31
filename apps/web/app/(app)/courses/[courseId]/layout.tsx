'use client';

import { AiTutorChat } from '@/components/ai-tutor-chat';
import { CourseSidebar } from '@/components/course/course-sidebar';
import { GlobalSidebarCloser } from '@/components/course/global-sidebar-closer';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalSidebarCloser />
      <SidebarProvider className="h-svh w-full overflow-hidden flex flex-row">
        <CourseSidebar />
        <main className="flex-1 overflow-y-auto min-w-0 h-full relative">{children}</main>
        <AiTutorChat />
      </SidebarProvider>
    </>
  );
}
