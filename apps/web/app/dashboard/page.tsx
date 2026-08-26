"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Zap,
  Flame,
  Target,
  Trophy,
  PlayCircle,
  Map,
  LogOut,
  CalendarCheck,
  CheckCircle2,
  Activity,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dashboardData = await api.getDashboardData() as any;
        setData(dashboardData);
      } catch (err: any) {
        if (err.message === "Session expired") return;
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <Activity className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Safely extract real data
  const gamification = data.gamification || { current_xp: 0, next_level_xp: 100, level: 1, streak_days: 0 };
  const learner = data.learner || { full_name: "Learner", avatar_url: "" };
  const goals = data.goals || [];
  const daily_mission = data.daily_mission || null;
  const active_quests = data.active_quests || [];
  const recent_xp = data.recent_xp || [];
  const mastery_summary = data.mastery_summary || [];

  const currentLevelProgress = (gamification.current_xp / gamification.next_level_xp) * 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Header ────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold hidden sm:inline-block">Learn-it HCL</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium">
              <Flame className="h-4 w-4 text-orange-500" />
              {gamification.streak_days}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium">
              <Zap className="h-4 w-4 text-yellow-500" />
              {gamification.current_xp}
            </Badge>
            
            <Separator orientation="vertical" className="h-6" />
            
            <ThemeToggle />
            
            <div className="flex items-center gap-3 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{learner.full_name}</p>
                <p className="text-xs text-muted-foreground mt-1">Level {gamification.level}</p>
              </div>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={learner.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {learner.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Column (Main Content) ──────────── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Welcome & Level Progress */}
          <section>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, {learner.full_name.split(" ")[0]}!</h1>
            <p className="text-muted-foreground mb-6">Continue your progress towards {goals[0]?.target_role || "your goals"}.</p>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Level</p>
                    <h2 className="text-3xl font-bold">Level {gamification.level}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{gamification.current_xp} / {gamification.next_level_xp} XP</p>
                  </div>
                </div>
                <Progress value={currentLevelProgress} className="h-3" />
              </CardContent>
            </Card>
          </section>

          {/* Daily Mission */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Today's Mission</h2>
            </div>
            
            {daily_mission && daily_mission.activities && daily_mission.activities.length > 0 ? (
              <div className="grid gap-4">
                {daily_mission.activities.map((rec: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="p-6 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {rec.type === "lesson" ? <PlayCircle className="h-6 w-6 text-foreground" /> : <Target className="h-6 w-6 text-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rec.title}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase">{rec.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.explanation}</p>
                      </div>
                      <Button className="w-full sm:w-auto gap-2" variant={idx === 0 ? "default" : "secondary"}>
                        {idx === 0 ? "Start Now" : "View"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                  <p className="text-muted-foreground mb-4">You've completed your daily mission or haven't been assigned one yet.</p>
                  <Button variant="outline">Browse Content</Button>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Skill Mastery */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Skill Mastery</h2>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Your current mastery progression across skills.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mastery_summary.length > 0 ? (
                    mastery_summary.map((skill: any) => (
                      <div key={skill.skill_id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{skill.skill_name}</span>
                          <span className="text-muted-foreground">{Math.round(skill.score * 100)}%</span>
                        </div>
                        <Progress value={skill.score * 100} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                      No skills tracked yet. Complete lessons to build your mastery profile.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ── Right Column (Sidebar) ──────────────── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Quests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-primary" /> Active Quests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {active_quests.length > 0 ? (
                <div className="grid gap-6">
                  {active_quests.map((quest: any) => (
                    <div key={quest.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{quest.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {quest.reward_xp} XP
                        </Badge>
                      </div>
                      <Progress value={(quest.progress / quest.target) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                  No active quests right now.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Map className="h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recent_xp.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {recent_xp.map((xp: any) => (
                      <div key={xp.id} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{xp.reason}</p>
                          <p className="text-xs text-muted-foreground">{new Date(xp.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="font-medium text-sm text-primary">
                          +{xp.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                  No recent activity.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ── Bottom Nav (Mobile) ─────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border sm:hidden z-40 pb-safe">
        <div className="flex justify-around py-3">
          <Button variant="ghost" className="flex flex-col h-auto py-1 gap-1 flex-1">
            <Target className="h-5 w-5" />
            <span className="text-[10px]">Learn</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-auto py-1 gap-1 flex-1 text-muted-foreground">
            <Map className="h-5 w-5" />
            <span className="text-[10px]">Path</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-auto py-1 gap-1 flex-1 text-muted-foreground">
            <Trophy className="h-5 w-5" />
            <span className="text-[10px]">Rank</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-auto py-1 gap-1 flex-1 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="text-[10px]">Exit</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
