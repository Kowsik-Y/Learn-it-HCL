"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RotateCcw,
  Brain,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Trophy,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Timer,
} from "lucide-react";

type ReviewCard = {
  skill_id: string;
  skill_name: string;
  mastery_score: number;
  retention_estimate: number;
  last_assessed_at: string | null;
  evidence_count: number;
  urgency: "critical" | "due" | "upcoming";
};

export default function ReviewQueuePage() {
  const [loading, setLoading] = useState(true);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [completedReviews, setCompletedReviews] = useState<Set<string>>(new Set());
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const loadReviewQueue = async () => {
    try {
      const res = (await api.getMastery()) as any;
      const allSkills = (res.skills || []) as any[];

      // Filter skills with low retention or needing review
      const needsReview = allSkills
        .filter((s: any) => s.retention_estimate < 0.85 && s.evidence_count > 0)
        .map((s: any) => ({
          skill_id: s.skill_id,
          skill_name: s.skill_name || `Skill ${s.skill_id}`,
          mastery_score: s.mastery_score,
          retention_estimate: s.retention_estimate,
          last_assessed_at: s.last_assessed_at,
          evidence_count: s.evidence_count,
          urgency: s.retention_estimate < 0.4 ? "critical" as const : s.retention_estimate < 0.6 ? "due" as const : "upcoming" as const,
        }))
        .sort((a: ReviewCard, b: ReviewCard) => a.retention_estimate - b.retention_estimate);

      setReviewCards(needsReview);
    } catch {
      // Demo data
      setReviewCards([
        { skill_id: "1", skill_name: "REST APIs", mastery_score: 0.42, retention_estimate: 0.25, last_assessed_at: new Date(Date.now() - 7 * 86400000).toISOString(), evidence_count: 5, urgency: "critical" },
        { skill_id: "2", skill_name: "Machine Learning Basics", mastery_score: 0.35, retention_estimate: 0.30, last_assessed_at: new Date(Date.now() - 5 * 86400000).toISOString(), evidence_count: 4, urgency: "critical" },
        { skill_id: "3", skill_name: "System Design", mastery_score: 0.55, retention_estimate: 0.45, last_assessed_at: new Date(Date.now() - 4 * 86400000).toISOString(), evidence_count: 6, urgency: "due" },
        { skill_id: "4", skill_name: "Data Structures", mastery_score: 0.78, retention_estimate: 0.55, last_assessed_at: new Date(Date.now() - 3 * 86400000).toISOString(), evidence_count: 10, urgency: "due" },
        { skill_id: "5", skill_name: "Testing & QA", mastery_score: 0.48, retention_estimate: 0.60, last_assessed_at: new Date(Date.now() - 2 * 86400000).toISOString(), evidence_count: 6, urgency: "upcoming" },
        { skill_id: "6", skill_name: "React & Next.js", mastery_score: 0.65, retention_estimate: 0.72, last_assessed_at: new Date(Date.now() - 1 * 86400000).toISOString(), evidence_count: 8, urgency: "upcoming" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (skillId: string, ratingValue: number) => {
    setRating(ratingValue);

    // Record mastery evidence
    try {
      await api.request("/mastery/record-evidence", {
        method: "POST",
        body: JSON.stringify({
          skill_id: skillId,
          evidence_type: "review",
          source_id: skillId,
          score: ratingValue >= 3 ? 1.0 : ratingValue === 2 ? 0.6 : 0.2,
          max_score: 1.0,
        }),
      });
    } catch {
      // Continue even if API fails
    }

    // Mark as completed
    setTimeout(() => {
      setCompletedReviews((prev) => new Set(prev).add(skillId));
      setActiveCard(null);
      setRating(null);
    }, 500);
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case "critical": return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", label: "Critical", icon: AlertTriangle };
      case "due": return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Due", icon: Clock };
      default: return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Upcoming", icon: Timer };
    }
  };

  const getDaysSince = (date: string | null) => {
    if (!date) return "Never";
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const ratingLabels = [
    { value: 1, label: "Again", emoji: "😟", color: "bg-red-500 hover:bg-red-600" },
    { value: 2, label: "Hard", emoji: "😐", color: "bg-amber-500 hover:bg-amber-600" },
    { value: 3, label: "Good", emoji: "😊", color: "bg-blue-500 hover:bg-blue-600" },
    { value: 4, label: "Easy", emoji: "🤩", color: "bg-emerald-500 hover:bg-emerald-600" },
  ];

  const pendingCards = reviewCards.filter((c) => !completedReviews.has(c.skill_id));
  const completedCount = completedReviews.size;
  const totalCount = reviewCards.length;

  if (loading) {
    return (
      <div className="container max-w-3xl py-8 space-y-8">
        <PageHeader title="Spaced Repetition Review" description="FSRS-powered daily review queue." />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // ── All Reviews Done ──
  if (pendingCards.length === 0 && totalCount > 0) {
    return (
      <div className="container max-w-2xl py-16 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-emerald-500/10 mx-auto">
            <Trophy className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-extrabold">All Reviews Done! 🎉</h1>
          <p className="text-muted-foreground">
            You&apos;ve completed all {totalCount} reviews for today. Your memory retention has been reinforced.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-5xl font-extrabold text-emerald-500">{totalCount}/{totalCount}</div>
            <p className="text-sm text-muted-foreground">Skills reviewed today</p>
            <Button onClick={() => { setCompletedReviews(new Set()); loadReviewQueue(); }} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh Queue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── No Reviews Needed ──
  if (totalCount === 0) {
    return (
      <div className="container max-w-2xl py-16 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mx-auto">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold">No Reviews Needed!</h1>
          <p className="text-muted-foreground">
            All your skills have strong retention. Come back tomorrow or take a quiz to add skills to your review queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <PageHeader
        title="Spaced Repetition Review"
        description="FSRS v4-powered daily review queue. Skills are ordered by memory decay urgency — review the most at-risk skills first."
      />

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" /> Review Progress
            </span>
            <span className="text-sm font-bold text-primary">{completedCount} / {totalCount}</span>
          </div>
          <Progress value={(completedCount / totalCount) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Urgency summary */}
      <div className="flex gap-3">
        {["critical", "due", "upcoming"].map((urgency) => {
          const config = getUrgencyConfig(urgency);
          const count = pendingCards.filter((c) => c.urgency === urgency).length;
          const UrgencyIcon = config.icon;
          return (
            <Badge key={urgency} variant="outline" className={`${config.bg} ${config.color} border-0 gap-1 px-3 py-1`}>
              <UrgencyIcon className="h-3.5 w-3.5" /> {count} {config.label}
            </Badge>
          );
        })}
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {pendingCards.map((card) => {
          const config = getUrgencyConfig(card.urgency);
          const isActive = activeCard === card.skill_id;
          const UrgencyIcon = config.icon;

          return (
            <Card key={card.skill_id} className={`transition-all ${config.border} ${isActive ? "ring-2 ring-primary/30" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">{card.skill_name}</CardTitle>
                    <CardDescription className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Brain className="h-3.5 w-3.5" /> Mastery: {(card.mastery_score * 100).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {getDaysSince(card.last_assessed_at)}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={`${config.bg} ${config.color} border-0 gap-1`}>
                    <UrgencyIcon className="h-3 w-3" /> {config.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Retention bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Memory Retention</span>
                    <span className={`font-bold ${card.retention_estimate < 0.4 ? "text-red-500" : card.retention_estimate < 0.6 ? "text-amber-500" : ""}`}>
                      {(card.retention_estimate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={card.retention_estimate * 100} className="h-2" />
                </div>

                {/* FSRS explanation */}
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                  📊 FSRS predicts your memory for this skill has decayed to <strong>{(card.retention_estimate * 100).toFixed(0)}%</strong>.
                  {card.retention_estimate < 0.5 ? " Review now to prevent further forgetting!" : " A quick review will reinforce retention."}
                </p>
              </CardContent>

              <CardFooter>
                {!isActive ? (
                  <Button onClick={() => setActiveCard(card.skill_id)} className="w-full gap-2">
                    <RotateCcw className="h-4 w-4" /> Review Now <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="w-full space-y-3">
                    <p className="text-sm font-medium text-center">How well did you remember this?</p>
                    <div className="grid grid-cols-4 gap-2">
                      {ratingLabels.map((r) => (
                        <Button
                          key={r.value}
                          onClick={() => handleReview(card.skill_id, r.value)}
                          className={`${r.color} text-white flex flex-col gap-0.5 h-auto py-2`}
                          disabled={rating !== null}
                        >
                          <span className="text-lg">{r.emoji}</span>
                          <span className="text-[10px] font-bold">{r.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
