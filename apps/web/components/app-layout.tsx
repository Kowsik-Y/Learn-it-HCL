'use client';

import { usePathname } from 'next/navigation';
import type React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth-context';
import { CourseProvider } from '@/components/course/course-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Skip layout for login, register, landing
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  if (isPublicPage) {
    return <>{children}</>;
  }

  const _isStudent = user?.role === 'student' || user?.role === 'learner';

  return (
    <CourseProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          {/* ── Main Layout Body ───────────────────── */}
          <div className="flex-1 overflow-x-hidden">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </CourseProvider>
  );
}
