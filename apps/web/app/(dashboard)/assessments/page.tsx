"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Brain,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active quiz state
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAssessments() {
      try {
        const res = (await api.getAssessments()) as any;
        setAssessments(res.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessments();
  }, []);

  const startQuiz = async (id: string) => {
    try {
      const res = (await api.startAssessment(id)) as any;
      setActiveAttempt(res);
      setSelectedAnswer(null);
      setFeedback(null);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAnswer = async () => {
    if (!activeAttempt || !selectedAnswer) return;
    setSubmitting(true);
    try {
      const res = (await api.submitAnswer(
        activeAttempt.attempt_id,
        activeAttempt.question.id,
        selectedAnswer
      )) as any;
      setFeedback(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Adaptive Diagnostics & Quizzes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Test your knowledge to update evidence-based mastery states and earn XP.
        </p>
      </div>

      {/* Active Quiz Player */}
      {activeAttempt && activeAttempt.question ? (
        <Card className="border-primary/40 shadow-lg">
          <CardHeader className="bg-primary/5 border-b border-border">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="gap-1 font-semibold border-primary/40 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Diagnostic Question
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setActiveAttempt(null)}>
                Exit Quiz
              </Button>
            </div>
            <CardTitle className="text-xl font-bold mt-2">
              {activeAttempt.question.content}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {activeAttempt.question.options ? (
                JSON.parse(
                  typeof activeAttempt.question.options === "string"
                    ? activeAttempt.question.options
                    : JSON.stringify(activeAttempt.question.options)
                ).map((option: string, i: number) => (
                  <Button
                    key={i}
                    variant={selectedAnswer === option ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-3.5 px-4 font-normal"
                    onClick={() => setSelectedAnswer(option)}
                    disabled={!!feedback}
                  >
                    <span className="font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No options available for this question.</p>
              )}
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <Alert variant={feedback.is_correct ? "success" : "destructive"} className="mt-4">
                {feedback.is_correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{feedback.is_correct ? "Correct! (+50 XP)" : "Incorrect"}</AlertTitle>
                <AlertDescription>
                  {feedback.is_correct
                    ? "Great job! Your mastery score for Python has been updated."
                    : `The correct answer was: ${feedback.correct_answer}`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="border-t border-border bg-muted/20 flex justify-between">
            {!feedback ? (
              <Button onClick={submitAnswer} disabled={!selectedAnswer || submitting} className="w-full sm:w-auto ml-auto font-bold">
                {submitting ? "Submitting..." : "Submit Answer"}
              </Button>
            ) : (
              <Button onClick={() => setActiveAttempt(null)} className="w-full sm:w-auto ml-auto gap-2 font-bold">
                Complete Quiz <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        /* Available Assessments List */
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">
              Loading available assessments...
            </div>
          ) : (
            assessments.map((a) => (
              <Card key={a.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h3 className="text-lg font-bold">{a.title}</h3>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {a.assessment_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {a.question_count} Questions • Adaptive Difficulty • Passing Score: {Math.round(a.passing_score * 100)}%
                    </p>
                  </div>

                  <Button onClick={() => startQuiz(a.id)} className="gap-2 shrink-0 font-bold">
                    Start Diagnostic <Award className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </main>
  );
}
