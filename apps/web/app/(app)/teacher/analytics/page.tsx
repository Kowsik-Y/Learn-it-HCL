"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Users,
  Brain,
  TrendingDown,
  TrendingUp,
  Shield,
  Flame,
  BarChart3,
  Lightbulb,
  UserX,
  UserCheck,
  Activity,
} from "lucide-react";

type StudentRisk = {
  id: string;
  name: string;
  email: string;
  risk_score: number;
  risk_level: string;
  suggested_nudge: string;
  days_inactive: number;
  current_streak: number;
  mastery_avg: number;
};

type SkillHeatmapRow = {
  student_name: string;
  skills: Record<string, number>;
};

export default function TeacherAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRisk[]>([]);
  const [classStats, setClassStats] = useState({
    total: 0,
    at_risk: 0,
    avg_mastery: 0,
    avg_streak: 0,
  });
  const [heatmapData, setHeatmapData] = useState<SkillHeatmapRow[]>([]);
  const [skillNames, setSkillNames] = useState<string[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Demo data for the teacher dashboard
    const demoStudents: StudentRisk[] = [
      { id: "s1", name: "Alex Thompson", email: "alex@learnit.dev", risk_score: 85, risk_level: "critical", suggested_nudge: "Send a personal check-in message. Student hasn't logged in for 12 days.", days_inactive: 12, current_streak: 0, mastery_avg: 0.25 },
      { id: "s2", name: "Maya Patel", email: "maya@learnit.dev", risk_score: 72, risk_level: "high", suggested_nudge: "Recommend easier practice material — 4 consecutive failures detected.", days_inactive: 5, current_streak: 0, mastery_avg: 0.35 },
      { id: "s3", name: "Jordan Lee", email: "jordan@learnit.dev", risk_score: 55, risk_level: "moderate", suggested_nudge: "Encourage spaced repetition review — retention dropping.", days_inactive: 3, current_streak: 2, mastery_avg: 0.52 },
      { id: "s4", name: "Sam Rivera", email: "sam@learnit.dev", risk_score: 40, risk_level: "moderate", suggested_nudge: "Suggest taking the adaptive diagnostic quiz to identify gaps.", days_inactive: 2, current_streak: 4, mastery_avg: 0.60 },
      { id: "s5", name: "Priya Sharma", email: "priya@learnit.dev", risk_score: 15, risk_level: "low", suggested_nudge: "On track! Consider recommending advanced challenges.", days_inactive: 0, current_streak: 14, mastery_avg: 0.82 },
      { id: "s6", name: "Chris Kim", email: "chris@learnit.dev", risk_score: 10, risk_level: "low", suggested_nudge: "Excellent progress. Ready for project-based assessment.", days_inactive: 0, current_streak: 21, mastery_avg: 0.91 },
      { id: "s7", name: "Taylor Wu", email: "taylor@learnit.dev", risk_score: 65, risk_level: "high", suggested_nudge: "Student struggling with SQL topics. Consider 1-on-1 support.", days_inactive: 4, current_streak: 0, mastery_avg: 0.38 },
      { id: "s8", name: "Robin Clarke", email: "robin@learnit.dev", risk_score: 28, risk_level: "low", suggested_nudge: "Consistent learner. Encourage peer mentoring.", days_inactive: 1, current_streak: 8, mastery_avg: 0.72 },
    ];

    const skills = ["Python", "Data Structures", "Algorithms", "SQL", "REST APIs", "ML Basics"];
    const demoHeatmap: SkillHeatmapRow[] = demoStudents.map((s) => ({
      student_name: s.name,
      skills: Object.fromEntries(
        skills.map((sk) => [sk, Math.max(0, Math.min(1, s.mastery_avg + (Math.random() - 0.5) * 0.4))])
      ),
    }));

    setStudents(demoStudents.sort((a, b) => b.risk_score - a.risk_score));
    setSkillNames(skills);
    setHeatmapData(demoHeatmap);
    setClassStats({
      total: demoStudents.length,
      at_risk: demoStudents.filter((s) => s.risk_level === "high" || s.risk_level === "critical").length,
      avg_mastery: demoStudents.reduce((sum, s) => sum + s.mastery_avg, 0) / demoStudents.length,
      avg_streak: demoStudents.reduce((sum, s) => sum + s.current_streak, 0) / demoStudents.length,
    });
    setLoading(false);
  };

  const getRiskConfig = (level: string) => {
    switch (level) {
      case "critical": return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: UserX };
      case "high": return { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertTriangle };
      case "moderate": return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Activity };
      default: return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: UserCheck };
    }
  };

  const getMasteryBg = (score: number) => {
    if (score >= 0.65) return "bg-emerald-500";
    if (score >= 0.30) return "bg-amber-500";
    if (score > 0) return "bg-red-500";
    return "bg-muted-foreground/20";
  };

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 space-y-8">
        <PageHeader title="Teacher Analytics" description="Class-level analytics dashboard." />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <PageHeader
        title="Teacher Analytics Dashboard"
        description="Monitor student engagement, identify at-risk learners, and get AI-powered intervention recommendations."
      />

      {/* Class summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-1" />
            <div className="text-3xl font-extrabold">{classStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card className={classStats.at_risk > 0 ? "border-red-500/30" : ""}>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className={`h-6 w-6 mx-auto mb-1 ${classStats.at_risk > 0 ? "text-red-500" : "text-emerald-500"}`} />
            <div className={`text-3xl font-extrabold ${classStats.at_risk > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {classStats.at_risk}
            </div>
            <p className="text-xs text-muted-foreground">At Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Brain className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <div className="text-3xl font-extrabold">{(classStats.avg_mastery * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Avg Mastery</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <div className="text-3xl font-extrabold">{classStats.avg_streak.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Avg Streak</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attrition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="attrition" className="gap-1"><AlertTriangle className="h-4 w-4" /> Attrition Radar</TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1"><BarChart3 className="h-4 w-4" /> Skill Heatmap</TabsTrigger>
          <TabsTrigger value="interventions" className="gap-1"><Lightbulb className="h-4 w-4" /> Interventions</TabsTrigger>
        </TabsList>

        {/* Attrition Radar */}
        <TabsContent value="attrition" className="space-y-4">
          {students.map((student) => {
            const config = getRiskConfig(student.risk_level);
            const RiskIcon = config.icon;
            return (
              <Card key={student.id} className={`${config.border} transition-colors`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Risk indicator */}
                    <div className={`h-12 w-12 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                      <RiskIcon className={`h-6 w-6 ${config.color}`} />
                    </div>

                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{student.name}</h3>
                        <Badge className={`${config.bg} ${config.color} border-0 text-[10px] uppercase`}>
                          {student.risk_level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="text-center">
                        <div className="font-bold text-foreground">{student.days_inactive}d</div>
                        Inactive
                      </span>
                      <span className="text-center">
                        <div className="font-bold text-foreground">{student.current_streak}</div>
                        Streak
                      </span>
                      <span className="text-center">
                        <div className="font-bold text-foreground">{(student.mastery_avg * 100).toFixed(0)}%</div>
                        Mastery
                      </span>
                    </div>

                    {/* Risk score bar */}
                    <div className="w-24 shrink-0">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Risk</span>
                        <span className={`font-bold ${config.color}`}>{student.risk_score}%</span>
                      </div>
                      <Progress value={student.risk_score} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Skill Heatmap */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Class Mastery Heatmap</CardTitle>
              <CardDescription>Mastery scores across skills for each student. 🔴 &lt;30% | 🟡 30-65% | 🟢 &gt;65%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-semibold text-muted-foreground sticky left-0 bg-background">Student</th>
                      {skillNames.map((skill) => (
                        <th key={skill} className="p-2 font-semibold text-muted-foreground text-center min-w-16">{skill}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-medium sticky left-0 bg-background whitespace-nowrap">{row.student_name}</td>
                        {skillNames.map((skill) => {
                          const score = row.skills[skill] || 0;
                          return (
                            <td key={skill} className="p-1.5 text-center">
                              <div
                                className={`h-8 w-full rounded flex items-center justify-center text-white font-bold text-[10px] ${getMasteryBg(score)}`}
                                style={{ opacity: Math.max(0.3, score) }}
                              >
                                {(score * 100).toFixed(0)}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interventions */}
        <TabsContent value="interventions" className="space-y-4">
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" /> AI-Powered Intervention Recommendations
              </CardTitle>
              <CardDescription>
                Based on the Dropout Risk Predictor model, here are suggested actions for at-risk students.
              </CardDescription>
            </CardHeader>
          </Card>

          {students
            .filter((s) => s.risk_level === "critical" || s.risk_level === "high")
            .map((student) => {
              const config = getRiskConfig(student.risk_level);
              return (
                <Card key={student.id} className={config.border}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <AlertTriangle className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm">{student.name}</h3>
                          <Badge className={`${config.bg} ${config.color} border-0 text-[10px]`}>
                            {student.risk_score}% risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{student.suggested_nudge}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {students.filter((s) => s.risk_level === "critical" || s.risk_level === "high").length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-emerald-500/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No high-risk students detected!</p>
              <p className="text-sm text-muted-foreground">All students are on track.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
