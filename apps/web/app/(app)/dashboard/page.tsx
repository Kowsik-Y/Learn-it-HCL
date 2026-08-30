"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap,
  Flame,
  Brain,
  Target,
  Trophy,
  BookOpen,
  ArrowRight,
  Clock,
  RotateCcw,
  Sparkles,
  Award,
  BarChart3,
  Map,
  PlayCircle,
  ChevronRight,
} from "lucide-react";

type DashboardData = {
  gamification: {
    current_xp: number;
    next_level_xp: number;
    level: number;
    level_name: string;
    streak_days: number;
  };
  learner: {
    full_name: string;
    email: string;
    avatar_url: string;
    role: string;
  };
  goals: Array<{
    id: string;
    title: string;
    goal_type: string;
    target_role: string;
    progress_percentage: number;
  }>;
  mastery_summary: Array<{
    skill_id: string;
    skill_name: string;
    score: number;
    confidence: number;
    status: string;
  }>;
  daily_mission: {
    activities: Array<{
      title: string;
      type: string;
      explanation: string;
    }>;
  };
  active_quests: Array<{
    id: string;
    title: string;
    description: string;
    reward_xp: number;
    progress: number;
    target: number;
  }>;
  recent_xp: Array<{
    id: string;
    amount: number;
    reason: string;
    created_at: string;
  }>;
};

const LEVEL_ICONS: Record<string, string> = {
  Novice: "🌱",
  Explorer: "🔍",
  Builder: "🔨",
  Practitioner: "⚡",
  Advanced: "🚀",
  Expert: "👑",
};

export default function LearnerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = (await api.getDashboardData()) as DashboardData;
      setData(res);
    } catch {
      // Demo data
      setData({
        gamification: { current_xp: 2350, next_level_xp: 3500, level: 3, level_name: "Builder", streak_days: 7 },
        learner: { full_name: "Learner", email: "student@learnit.dev", avatar_url: "", role: "student" },
        goals: [
          { id: "g1", title: "Become a Full-Stack Developer", goal_type: "career", target_role: "Full-Stack Developer", progress_percentage: 42 },
        ],
        mastery_summary: [
          { skill_id: "1", skill_name: "Python Fundamentals", score: 0.92, confidence: 0.88, status: "mastered" },
          { skill_id: "2", skill_name: "Data Structures", score: 0.78, confidence: 0.72, status: "practiced" },
          { skill_id: "3", skill_name: "Algorithms", score: 0.55, confidence: 0.60, status: "learning" },
          { skill_id: "4", skill_name: "SQL & Databases", score: 0.88, confidence: 0.85, status: "mastered" },
          { skill_id: "5", skill_name: "REST APIs", score: 0.42, confidence: 0.50, status: "learning" },
        ],
        daily_mission: {
          activities: [
            { title: "Practice: Algorithm Design", type: "lesson", explanation: "Your mastery is at 55% — practice sessions will push it past 70%." },
            { title: "Review: REST API Basics", type: "review", explanation: "Memory retention is at 45%. A quick review will reinforce this skill." },
            { title: "Quiz: SQL Fundamentals", type: "challenge", explanation: "Scoring above 60% will unlock the System Design module." },
          ],
        },
        active_quests: [
          { id: "q1", title: "Daily Explorer", description: "Complete 3 lessons today", reward_xp: 50, progress: 66, target: 100 },
          { id: "q2", title: "Review Champion", description: "Review 5 skills", reward_xp: 150, progress: 40, target: 100 },
        ],
        recent_xp: [
          { id: "x1", amount: 25, reason: "Completed lesson: Python Basics", created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
          { id: "x2", amount: 50, reason: "Quiz score: 90%", created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
          { id: "x3", amount: 10, reason: "Daily login streak bonus", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= 0.65) return "text-emerald-500";
    if (score >= 0.30) return "text-amber-500";
    return "text-red-500";
  };

  const getMissionIcon = (type: string) => {
    switch (type) {
      case "lesson": return "📚";
      case "review": return "🔄";
      case "challenge": return "⚡";
      default: return "🎯";
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const levelProgress = ((data.gamification.current_xp - 0) / (data.gamification.next_level_xp - 0)) * 100;
  const levelIcon = LEVEL_ICONS[data.gamification.level_name] || "🌱";

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <PageHeader
        title={`Welcome back, ${data.learner.full_name}!`}
        description="Here's your learning progress, daily missions, and personalized recommendations."
      />

      {/* Top stats row: XP + Level, Streak, Top Goal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* XP & Level */}
        <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {levelIcon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold">{data.gamification.level_name}</span>
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">Lvl {data.gamification.level}</Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-bold text-foreground">{data.gamification.current_xp.toLocaleString()}</span> XP
                </div>
              </div>
            </div>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-1">
              {(data.gamification.next_level_xp - data.gamification.current_xp).toLocaleString()} XP to next level
            </p>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardContent className="pt-4 flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${data.gamification.streak_days > 0 ? "bg-orange-500/10" : "bg-muted"}`}>
              <Flame className={`h-8 w-8 ${data.gamification.streak_days > 0 ? "text-orange-500 animate-pulse" : "text-muted-foreground/30"}`} />
            </div>
            <div>
              <div className="text-3xl font-extrabold">{data.gamification.streak_days}</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
              {data.gamification.streak_days >= 7 && (
                <Badge className="bg-orange-500/10 text-orange-500 border-0 text-[10px] mt-1">🔥 On fire!</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Goal */}
        {data.goals.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold">{data.goals[0].title}</h3>
              </div>
              <Progress value={data.goals[0].progress_percentage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{data.goals[0].progress_percentage}% complete</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Daily Mission */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Today&apos;s Mission
            </CardTitle>
            <CardDescription>AI-recommended activities based on your mastery and goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.daily_mission.activities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="text-xl mt-0.5">{getMissionIcon(activity.type)}</span>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold">{activity.title}</h4>
                  <p className="text-xs text-muted-foreground">{activity.explanation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Skills Mastery */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" /> Skill Mastery
              </CardTitle>
              <Link href="/skills">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.mastery_summary.slice(0, 5).map((skill) => (
              <div key={skill.skill_id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{skill.skill_name}</span>
                  <span className={`text-sm font-bold ${getMasteryColor(skill.score)}`}>
                    {(skill.score * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={skill.score * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Quests */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" /> Active Quests
              </CardTitle>
              <Link href="/achievements">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.active_quests.map((quest) => (
              <div key={quest.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">{quest.title}</h4>
                  <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px]">
                    +{quest.reward_xp} XP
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{quest.description}</p>
                <Progress value={quest.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent XP */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recent_xp.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-2">
                <Badge className="bg-amber-500/10 text-amber-500 border-0 text-xs font-bold shrink-0">
                  +{event.amount}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{event.reason}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/skills", icon: Brain, label: "Skill Map", color: "text-primary" },
          { href: "/review", icon: RotateCcw, label: "Review Queue", color: "text-orange-500" },
          { href: "/learning-paths", icon: Map, label: "Learning Path", color: "text-violet-500" },
          { href: "/achievements", icon: Trophy, label: "Achievements", color: "text-amber-500" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:border-primary/30 transition-all cursor-pointer group h-full">
              <CardContent className="pt-4 text-center">
                <action.icon className={`h-7 w-7 mx-auto mb-2 ${action.color} group-hover:scale-110 transition-transform`} />
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
