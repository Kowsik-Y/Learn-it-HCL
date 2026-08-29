"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnerDashboardPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch this from the Next.js API route that calls our ML service.
    // For now, we mock the ML service response to demonstrate the UI.
    setTimeout(() => {
      setRecommendations([
        {
          course_id: "course-ai-101",
          title: "Introduction to AI with LangChain",
          reason: "Highly relevant for your Senior Developer role and builds on your Python skills.",
          match_score: 0.95
        },
        {
          course_id: "course-react-202",
          title: "Advanced React and Next.js Patterns",
          reason: "Popular among learners with similar backgrounds.",
          match_score: 0.88
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <PageHeader 
        title="Welcome back, Learner!" 
        description="Here is your progress and recommended learning path." 
      />
      
      <div>
        <h2 className="text-2xl font-semibold mb-4 tracking-tight">AI Recommended Courses</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.course_id} className="relative overflow-hidden group">
                {rec.match_score > 0.9 && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                    Best Match
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {rec.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">
                    {rec.reason}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    Match Score: {(rec.match_score * 100).toFixed(0)}%
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/courses/${rec.course_id}`} className="w-full">
                    <Button variant="secondary" className="w-full">View Course Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
