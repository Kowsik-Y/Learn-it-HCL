"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Brain,
  Zap,
  Flame,
  Target,
  Trophy,
  BookOpen,
  Layers,
  Sparkles,
  Award,
  CalendarCheck,
  CheckCircle2,
  LogOut,
  User as UserIcon
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Attendance check-in state
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);

  // Skip layout for login, register, landing
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isPublicPage) {
    return <>{children}</>;
  }

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingIn(true);
    setTimeout(() => {
      setCheckingIn(false);
      setCheckInSuccess("Attendance verified! You earned +15 XP.");
      setTimeout(() => {
        setAttendanceOpen(false);
        setCheckInSuccess(null);
        setOtpCode("");
      }, 1800);
    }, 800);
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Target },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/skills", label: "Skills", icon: Layers },
    { href: "/tutor", label: "AI Tutor", icon: Sparkles },
    { href: "/assessments", label: "Quizzes", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Persistent Top Navbar ──────────────── */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg hidden sm:inline-block">Learn-it HCL</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={`gap-1.5 font-medium ${isActive ? "text-primary font-bold" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Attendance OTP Check-in Dialog */}
            <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-emerald-500" />
                  <span className="hidden sm:inline">Check-in</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-emerald-500" />
                    Attendance Check-in
                  </DialogTitle>
                  <DialogDescription>
                    Enter the 6-digit OTP code provided by your instructor to log attendance.
                  </DialogDescription>
                </DialogHeader>

                {checkInSuccess ? (
                  <Alert variant="success" className="my-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Verified</AlertTitle>
                    <AlertDescription>{checkInSuccess}</AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleCheckInSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">
                        Session OTP Code
                      </label>
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="e.g. 482910"
                        maxLength={6}
                        className="text-center text-lg font-mono tracking-widest"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={checkingIn || otpCode.length < 6} className="w-full">
                        {checkingIn ? "Verifying..." : "Verify Attendance (+15 XP)"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Streak & XP Badges */}
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium">
              <Flame className="h-4 w-4 text-orange-500" /> 5d
            </Badge>

            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium">
              <Zap className="h-4 w-4 text-yellow-500" /> 200 XP
            </Badge>

            <Separator orientation="vertical" className="h-6" />

            <ThemeToggle />

            {/* User Profile Avatar & Logout */}
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user?.full_name?.charAt(0) || "S"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={logout} title="Sign Out">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout Body ───────────────────── */}
      <div className="flex-1">{children}</div>

      {/* ── Mobile Bottom Navigation Bar ────────── */}
      <nav className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border md:hidden z-40">
        <div className="flex justify-around py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className="flex-1">
                <Button
                  variant="ghost"
                  className={`w-full flex-col h-auto py-1 gap-1 ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{link.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
