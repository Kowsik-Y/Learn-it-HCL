"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Zap,
  Flame,
  Target,
  Trophy,
  PlayCircle,
  Map,
  CalendarCheck,
  CheckCircle2,
  Activity,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dashboardData = (await api.getDashboardData()) as any;
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Loading your personalized dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <Activity className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">Failed to load dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const gamification = data.gamification || { current_xp: 0, next_level_xp: 500, level: 1, level_name: "Novice", streak_days: 0 };
  const learnerName = user?.full_name || data.learner?.full_name || "Learner";
  const goals = data.goals || [];
  const daily_mission = data.daily_mission || null;
  const active_quests = data.active_quests || [];
  const recent_xp = data.recent_xp || [];
  const mastery_summary = data.mastery_summary || [];

  const currentLevelProgress = Math.min(100, (gamification.current_xp / gamification.next_level_xp) * 100);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Left Column (Main Dashboard Content) ──── */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Welcome Card */}
        <Card className="bg-linear-to-br from-card via-card to-primary/5 border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-primary/40 text-primary font-bold">
                    {gamification.level_name} Level {gamification.level}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Target className="h-3 w-3" /> {goals[0]?.target_role || "Backend Software Engineer"}
                  </Badge>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Welcome back, {learnerName.split(" ")[0]}!
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {goals[0]?.title || "Mastering Python & Full-Stack Development"}
                </p>
              </div>

              <Link href="/tutor">
                <Button className="gap-2 shrink-0 font-bold">
                  <Sparkles className="h-4 w-4" /> AI Tutor Scaffolding
                </Button>
              </Link>
            </div>

            {/* Level progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Level Progression</span>
                <span>{gamification.current_xp} / {gamification.next_level_xp} XP</span>
              </div>
              <Progress value={currentLevelProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Today's Mission & Skill Mastery */}
        <Tabs defaultValue="mission" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="mission" className="gap-2 font-semibold">
              <CalendarCheck className="h-4 w-4" /> Today's Mission
            </TabsTrigger>
            <TabsTrigger value="mastery" className="gap-2 font-semibold">
              <Brain className="h-4 w-4" /> Skill Mastery
            </TabsTrigger>
          </TabsList>

          {/* Mission Content */}
          <TabsContent value="mission" className="mt-6 space-y-4">
            {daily_mission && daily_mission.activities && daily_mission.activities.length > 0 ? (
              daily_mission.activities.map((rec: any, idx: number) => (
                <Card key={idx} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {rec.type === "lesson" ? <PlayCircle className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{rec.title}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">{rec.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.explanation}</p>
                    </div>
                    <Link href="/courses">
                      <Button className="w-full sm:w-auto gap-2 font-bold" variant={idx === 0 ? "default" : "secondary"}>
                        {idx === 0 ? "Start Mission" : "View"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">Daily Mission Complete!</h3>
                  <p className="text-muted-foreground text-sm mb-4">You've completed your practice recommendations for today.</p>
                  <Link href="/courses">
                    <Button variant="outline">Explore Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Skill Mastery Content */}
          <TabsContent value="mastery" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Skill Mastery Status</CardTitle>
                <CardDescription>Evidence-based proficiency estimation across your core skills.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {mastery_summary.length > 0 ? (
                  mastery_summary.map((skill: any) => (
                    <div key={skill.skill_id} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-foreground">{skill.skill_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={skill.score >= 0.8 ? "default" : skill.score >= 0.5 ? "secondary" : "outline"} className="text-xs">
                            {skill.status}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{Math.round(skill.score * 100)}%</span>
                        </div>
                      </div>
                      <Progress value={skill.score * 100} className="h-2.5" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No skills tracked yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>

      {/* ── Right Column (Sidebar) ────────────────── */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Active Quests Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Trophy className="h-5 w-5 text-amber-500" /> Active Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {active_quests.length > 0 ? (
              <div className="space-y-5">
                {active_quests.map((quest: any) => (
                  <div key={quest.id} className="space-y-2 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-foreground">{quest.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0 ml-2 font-bold">
                        +{quest.reward_xp} XP
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                        <span>Progress</span>
                        <span>{quest.progress}%</span>
                      </div>
                      <Progress value={quest.progress} className="h-1.5" />
                    </div>
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

        {/* XP Activity Log Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Map className="h-5 w-5 text-primary" /> XP Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent_xp.length > 0 ? (
              <ScrollArea className="h-72 pr-3">
                <div className="space-y-4">
                  {recent_xp.map((xp: any) => (
                    <div key={xp.id} className="flex items-start gap-3 text-sm border-b border-border/40 pb-3 last:border-0">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{xp.reason}</p>
                        <p className="text-xs text-muted-foreground">{new Date(xp.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs text-primary font-bold">
                        +{xp.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                No activity logged yet.
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
