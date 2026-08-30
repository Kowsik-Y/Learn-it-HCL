"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  CheckCircle2,
  BookOpen,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

type SkillMastery = {
  skill_id: string;
  skill_name?: string;
  mastery_score: number;
  confidence: number;
  status: string;
  evidence_count: number;
  retention_estimate: number;
  last_assessed_at: string | null;
};

type MasterySummary = {
  total_skills: number;
  mastered: number;
  learning: number;
  practiced: number;
  not_started: number;
  overall_progress: number;
};

export default function SkillMasteryMapPage() {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillMastery[]>([]);
  const [summary, setSummary] = useState<MasterySummary | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadMastery();
  }, []);

  const loadMastery = async () => {
    try {
      const res = (await api.getMastery()) as any;
      setSummary(res.summary);
      setSkills(res.skills || []);
    } catch {
      // Demo data
      setSummary({
        total_skills: 12,
        mastered: 3,
        learning: 5,
        practiced: 2,
        not_started: 2,
        overall_progress: 25,
      });
      setSkills([
        { skill_id: "1", skill_name: "Python Fundamentals", mastery_score: 0.92, confidence: 0.88, status: "mastered", evidence_count: 15, retention_estimate: 0.95, last_assessed_at: new Date().toISOString() },
        { skill_id: "2", skill_name: "Data Structures", mastery_score: 0.78, confidence: 0.72, status: "practiced", evidence_count: 10, retention_estimate: 0.82, last_assessed_at: new Date().toISOString() },
        { skill_id: "3", skill_name: "Algorithms", mastery_score: 0.55, confidence: 0.60, status: "learning", evidence_count: 7, retention_estimate: 0.65, last_assessed_at: new Date().toISOString() },
        { skill_id: "4", skill_name: "SQL & Databases", mastery_score: 0.88, confidence: 0.85, status: "mastered", evidence_count: 12, retention_estimate: 0.90, last_assessed_at: new Date().toISOString() },
        { skill_id: "5", skill_name: "REST APIs", mastery_score: 0.42, confidence: 0.50, status: "learning", evidence_count: 5, retention_estimate: 0.45, last_assessed_at: new Date().toISOString() },
        { skill_id: "6", skill_name: "Machine Learning", mastery_score: 0.18, confidence: 0.25, status: "learning", evidence_count: 3, retention_estimate: 0.30, last_assessed_at: new Date().toISOString() },
        { skill_id: "7", skill_name: "React & Next.js", mastery_score: 0.65, confidence: 0.68, status: "practiced", evidence_count: 8, retention_estimate: 0.70, last_assessed_at: new Date().toISOString() },
        { skill_id: "8", skill_name: "System Design", mastery_score: 0.30, confidence: 0.35, status: "learning", evidence_count: 4, retention_estimate: 0.40, last_assessed_at: new Date().toISOString() },
        { skill_id: "9", skill_name: "Docker & DevOps", mastery_score: 0.0, confidence: 0.0, status: "not_started", evidence_count: 0, retention_estimate: 0.0, last_assessed_at: null },
        { skill_id: "10", skill_name: "TypeScript", mastery_score: 0.90, confidence: 0.82, status: "mastered", evidence_count: 11, retention_estimate: 0.88, last_assessed_at: new Date().toISOString() },
        { skill_id: "11", skill_name: "Testing & QA", mastery_score: 0.48, confidence: 0.55, status: "learning", evidence_count: 6, retention_estimate: 0.52, last_assessed_at: new Date().toISOString() },
        { skill_id: "12", skill_name: "Cloud Architecture", mastery_score: 0.0, confidence: 0.0, status: "not_started", evidence_count: 0, retention_estimate: 0.0, last_assessed_at: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= 0.65) return { ring: "text-emerald-500", bg: "bg-emerald-500", label: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 0.30) return { ring: "text-amber-500", bg: "bg-amber-500", label: "text-amber-600 dark:text-amber-400" };
    if (score > 0) return { ring: "text-red-500", bg: "bg-red-500", label: "text-red-600 dark:text-red-400" };
    return { ring: "text-muted-foreground/30", bg: "bg-muted-foreground/30", label: "text-muted-foreground" };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "mastered": return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Mastered" };
      case "practiced": return { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", label: "Practiced" };
      case "learning": return { icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10", label: "Learning" };
      default: return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50", label: "Not Started" };
    }
  };

  const filteredSkills = skills
    .filter((s) => statusFilter === "all" || s.status === statusFilter)
    .filter((s) => (s.skill_name || s.skill_id).toLowerCase().includes(search.toLowerCase()));

  const statusFilters = [
    { key: "all", label: "All", count: skills.length },
    { key: "mastered", label: "Mastered", count: summary?.mastered || 0 },
    { key: "practiced", label: "Practiced", count: summary?.practiced || 0 },
    { key: "learning", label: "Learning", count: summary?.learning || 0 },
    { key: "not_started", label: "Not Started", count: summary?.not_started || 0 },
  ];

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 space-y-8">
        <PageHeader title="Skill Mastery Map" description="Your evidence-based mastery across all skills." />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <PageHeader
        title="Skill Mastery Map"
        description="Evidence-based mastery tracking across all your skills. Mastery ≠ completion — it's measured by BKT, assessments, and retrieval success."
      />

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-primary/30">
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-extrabold text-primary">{summary.total_skills}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Skills</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-extrabold text-emerald-500">{summary.mastered}</div>
              <p className="text-xs text-muted-foreground mt-1">Mastered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-extrabold text-blue-500">{summary.practiced}</div>
              <p className="text-xs text-muted-foreground mt-1">Practiced</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-extrabold text-amber-500">{summary.learning}</div>
              <p className="text-xs text-muted-foreground mt-1">Learning</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-extrabold text-muted-foreground">{summary.not_started}</div>
              <p className="text-xs text-muted-foreground mt-1">Not Started</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall progress */}
      {summary && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Mastery Progress</span>
              <span className="text-sm font-bold text-primary">{summary.overall_progress.toFixed(1)}%</span>
            </div>
            <Progress value={summary.overall_progress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => {
          const colors = getMasteryColor(skill.mastery_score);
          const statusConfig = getStatusConfig(skill.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={skill.skill_id} className="hover:border-primary/30 transition-colors group overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                    {skill.skill_name || `Skill ${skill.skill_id}`}
                  </CardTitle>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 text-[10px]`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Mastery score circle */}
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                      <circle
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeDasharray={`${skill.mastery_score * 100} ${100 - skill.mastery_score * 100}`}
                        strokeLinecap="round"
                        className={colors.ring}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-extrabold ${colors.label}`}>
                        {(skill.mastery_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-mono font-semibold">{(skill.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={skill.confidence * 100} className="h-1.5" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Retention</span>
                      <span className={`font-mono font-semibold ${skill.retention_estimate < 0.5 ? "text-red-500" : ""}`}>
                        {(skill.retention_estimate * 100).toFixed(0)}%
                        {skill.retention_estimate < 0.5 && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                      </span>
                    </div>
                    <Progress value={skill.retention_estimate * 100} className="h-1.5" />
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex justify-between text-[11px] text-muted-foreground pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> {skill.evidence_count} evidence
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {skill.last_assessed_at
                      ? new Date(skill.last_assessed_at).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-16">
          <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No skills match your filter.</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
