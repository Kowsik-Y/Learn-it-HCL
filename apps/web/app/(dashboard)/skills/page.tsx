"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowRight } from "lucide-react";

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSkills() {
      try {
        const res = (await api.getSkills()) as any;
        setSkills(res.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSkills();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Skill Matrix & Graph</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Map of your technical competencies, prerequisite dependencies, and mastery progression.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">
          Loading skill graph...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, idx) => (
            <Card key={skill.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {skill.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Difficulty Lvl {skill.difficulty_level}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold">{skill.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {skill.description || "Core technical competency in your learning path."}
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Estimated Mastery</span>
                    <span className="text-primary">{idx % 2 === 0 ? "82%" : "55%"}</span>
                  </div>
                  <Progress value={idx % 2 === 0 ? 82 : 55} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/tutor" className="w-full">
                  <Button variant="outline" size="sm" className="w-full gap-1 text-xs font-semibold">
                    Practice Skill <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
