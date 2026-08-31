import { Brain } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-extrabold text-lg">Learn-it HCL</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Auth Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">{children}</div>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground relative z-10">
        &copy; {new Date().getFullYear()} Learn-it HCL — AI-Powered Personalized Learning Platform.
      </footer>
    </div>
  );
}
