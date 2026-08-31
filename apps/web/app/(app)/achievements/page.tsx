"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Flame,
  Award,
  Star,
  Zap,
  Target,
  Lock,
  CheckCircle2,
  Clock,
  TrendingUp,
  Gift,
  Sparkles,
  Crown,
  Shield,
  BookOpen,
  RotateCw,
  Sprout,
  Compass,
  Hammer,
  Rocket,
} from "lucide-react";

type Level = {
  name: string;
  number: number;
  min_xp: number;
  max_xp: number;
  icon: string;
  progress: number;
};

type GamificationProfile = {
  total_xp: number;
  level: Level;
  streak: {
    current: number;
    longest: number;
    is_active: boolean;
    freeze_available: boolean;
  };
  badges_count: number;
  quests_completed: number;
};

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: string;
  is_earned: boolean;
};

type Quest = {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  tasks: any;
  xp_reward: number;
  progress_percentage: number;
  expires_at: string | null;
};

type XPEvent = {
  id: string;
  amount: number;
  reason: string;
  source_type: string;
  created_at: string;
};

const LEVEL_ICONS: Record<string, React.ComponentType<any>> = {
  Novice: Sprout,
  Explorer: Compass,
  Builder: Hammer,
  Practitioner: Zap,
  Advanced: Rocket,
  Expert: Crown,
};

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [xpHistory, setXpHistory] = useState<XPEvent[]>([]);
  const [badgeFilter, setBadgeFilter] = useState("all");

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, badgesRes, questsRes, xpRes] = await Promise.allSettled([
        api.getGamificationProfile(),
        api.getBadges(),
        api.getActiveQuests(),
        api.getXPHistory(),
      ]);

      if (profileRes.status === "fulfilled") setProfile(profileRes.value as GamificationProfile);
      if (badgesRes.status === "fulfilled") setBadges((badgesRes.value as any).items || []);
      if (questsRes.status === "fulfilled") setQuests((questsRes.value as any).items || []);
      if (xpRes.status === "fulfilled") setXpHistory((xpRes.value as any).items || []);
    } catch {
      // Demo data
      setProfile({
        total_xp: 2350,
        level: { name: "Builder", number: 3, min_xp: 1500, max_xp: 3500, icon: "🔨", progress: 0.425 },
        streak: { current: 7, longest: 14, is_active: true, freeze_available: true },
        badges_count: 5,
        quests_completed: 8,
      });
      setBadges([
        { id: "b1", name: "First Steps", description: "Complete your first lesson", icon_url: "", category: "milestone", is_earned: true },
        { id: "b2", name: "Quiz Master", description: "Score 100% on 3 quizzes", icon_url: "", category: "achievement", is_earned: true },
        { id: "b3", name: "Week Warrior", description: "Maintain a 7-day streak", icon_url: "", category: "streak", is_earned: true },
        { id: "b4", name: "Skill Seeker", description: "Master 5 skills", icon_url: "", category: "mastery", is_earned: false },
        { id: "b5", name: "Night Owl", description: "Complete a session after 10 PM", icon_url: "", category: "special", is_earned: true },
        { id: "b6", name: "Speed Demon", description: "Complete a quiz in under 2 minutes", icon_url: "", category: "achievement", is_earned: true },
        { id: "b7", name: "Persistent", description: "Complete 3 review sessions in a day", icon_url: "", category: "streak", is_earned: false },
        { id: "b8", name: "Scholar", description: "Master 10 skills", icon_url: "", category: "mastery", is_earned: false },
      ]);
      setQuests([
        { id: "q1", title: "Daily Explorer", description: "Complete 3 lessons today", quest_type: "daily", tasks: null, xp_reward: 50, progress_percentage: 66, expires_at: new Date(Date.now() + 8 * 3600000).toISOString() },
        { id: "q2", title: "Review Champion", description: "Review 5 skills using spaced repetition", quest_type: "weekly", tasks: null, xp_reward: 150, progress_percentage: 40, expires_at: new Date(Date.now() + 3 * 86400000).toISOString() },
        { id: "q3", title: "Quiz Streak", description: "Score above 80% on 3 consecutive quizzes", quest_type: "challenge", tasks: null, xp_reward: 200, progress_percentage: 33, expires_at: null },
      ]);
      setXpHistory([
        { id: "x1", amount: 25, reason: "Completed lesson: Python Basics", source_type: "lesson", created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
        { id: "x2", amount: 50, reason: "Quiz score: 90%", source_type: "quiz", created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: "x3", amount: 10, reason: "Daily login streak bonus", source_type: "streak", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
        { id: "x4", amount: 25, reason: "Completed lesson: Data Structures", source_type: "lesson", created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
        { id: "x5", amount: 100, reason: "Quest completed: Daily Explorer", source_type: "quest", created_at: new Date(Date.now() - 26 * 3600000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const getBadgeIcon = (category: string, isEarned: boolean) => {
    const icons: Record<string, any> = {
      milestone: Star,
      achievement: Trophy,
      streak: Flame,
      mastery: Crown,
      special: Sparkles,
    };
    return icons[category] || Award;
  };

  const getBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      milestone: "text-amber-500",
      achievement: "text-violet-500",
      streak: "text-orange-500",
      mastery: "text-emerald-500",
      special: "text-pink-500",
    };
    return colors[category] || "text-primary";
  };

  const getSourceIcon = (sourceType: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      lesson_complete: BookOpen,
      assessment_pass: CheckCircle2,
      streak_bonus: Flame,
      practice: Zap,
      badge_earned: Trophy,
      attendance: Clock,
      lesson: BookOpen,
      quiz: CheckCircle2,
      streak: Flame,
      quest: Target,
      review: RotateCw,
    };
    return icons[sourceType] || Star;
  };

  const badgeCategories = ["all", ...Array.from(new Set(badges.map((b) => b.category)))];
  const filteredBadges = badgeFilter === "all" ? badges : badges.filter((b) => b.category === badgeFilter);
  const earnedCount = badges.filter((b) => b.is_earned).length;

  if (loading) {
    return (
      <div className="container max-w-5xl py-8 space-y-8">
        <PageHeader title="Achievements" description="Your XP, streaks, badges, and quests." />
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <PageHeader
        title="Achievements & Gamification"
        description="Track your XP, level progression, streaks, badges, and active quests."
      />

      {/* XP & Level Hero Section */}
      {profile && (
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-violet-500/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Level icon */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {(() => {
                    const Icon = LEVEL_ICONS[profile.level.name] || Sprout;
                    return <Icon className="h-12 w-12" />;
                  })()}
                </div>
                <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3">
                  Lvl {profile.level.number}
                </Badge>
              </div>

              {/* XP info */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-2xl font-extrabold">{profile.level.name}</h2>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span className="text-xl font-bold">{profile.total_xp.toLocaleString()} XP</span>
                </div>
                <div className="max-w-md">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{profile.level.min_xp.toLocaleString()} XP</span>
                    <span>{profile.level.max_xp.toLocaleString()} XP</span>
                  </div>
                  <Progress value={profile.level.progress * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(profile.level.max_xp - profile.total_xp).toLocaleString()} XP to next level
                  </p>
                </div>
              </div>

              {/* Streak */}
              <div className="text-center space-y-1">
                <div className="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                  <Flame className={`h-10 w-10 ${profile.streak.is_active ? "text-orange-500 animate-pulse" : "text-muted-foreground/30"}`} />
                </div>
                <div className="text-2xl font-extrabold">{profile.streak.current}</div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
                <p className="text-[10px] text-muted-foreground">Best: {profile.streak.longest} days</p>
                {profile.streak.freeze_available && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Shield className="h-3 w-3" /> Freeze Available
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Zap className="h-6 w-6 text-amber-500 mx-auto mb-1" />
              <div className="text-2xl font-extrabold">{profile.total_xp.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Award className="h-6 w-6 text-violet-500 mx-auto mb-1" />
              <div className="text-2xl font-extrabold">{earnedCount}/{badges.length}</div>
              <p className="text-xs text-muted-foreground">Badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Target className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-extrabold">{quests.length}</div>
              <p className="text-xs text-muted-foreground">Active Quests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-2xl font-extrabold">{profile.quests_completed}</div>
              <p className="text-xs text-muted-foreground">Quests Done</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for Badges, Quests, XP History */}
      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="badges" className="gap-1"><Award className="h-4 w-4" /> Badges</TabsTrigger>
          <TabsTrigger value="quests" className="gap-1"><Target className="h-4 w-4" /> Quests</TabsTrigger>
          <TabsTrigger value="xp" className="gap-1"><TrendingUp className="h-4 w-4" /> XP History</TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {badgeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setBadgeFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  badgeFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBadges.map((badge) => {
              const BadgeIcon = getBadgeIcon(badge.category, badge.is_earned);
              const color = getBadgeColor(badge.category);
              return (
                <Card key={badge.id} className={`text-center transition-all ${badge.is_earned ? "hover:border-primary/30" : "opacity-50"}`}>
                  <CardContent className="pt-6 space-y-2">
                    <div className={`h-14 w-14 rounded-full mx-auto flex items-center justify-center ${badge.is_earned ? `${color} bg-current/10` : "text-muted-foreground/30 bg-muted"}`}>
                      {badge.is_earned ? (
                        <BadgeIcon className="h-7 w-7" />
                      ) : (
                        <Lock className="h-6 w-6" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {badge.is_earned ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">Earned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Locked</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Quests Tab */}
        <TabsContent value="quests" className="space-y-4">
          {quests.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No active quests. Check back later!</p>
            </div>
          ) : (
            quests.map((quest) => (
              <Card key={quest.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">{quest.title}</CardTitle>
                      <CardDescription>{quest.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs shrink-0">{quest.quest_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-bold">{quest.progress_percentage}%</span>
                    </div>
                    <Progress value={quest.progress_percentage} className="h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5 text-amber-500" /> {quest.xp_reward} XP reward
                    </span>
                    {quest.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Expires {new Date(quest.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* XP History Tab */}
        <TabsContent value="xp" className="space-y-2">
          {xpHistory.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No XP activity yet. Start learning to earn XP!</p>
            </div>
          ) : (
            xpHistory.map((event) => (
              <Card key={event.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    {(() => {
                      const Icon = getSourceIcon(event.source_type);
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 font-bold">
                    +{event.amount} XP
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
