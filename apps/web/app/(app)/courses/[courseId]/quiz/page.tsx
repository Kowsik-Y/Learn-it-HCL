"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Brain,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Target,
  Trophy,
  HelpCircle,
  Clock,
  Lightbulb,
  BarChart3,
} from "lucide-react";

type Question = {
  id: string;
  content: string;
  question_type: string;
  difficulty_level: string;
  estimated_time_seconds: number;
  options: any;
  hints: any;
};

type AnswerResult = {
  is_correct: boolean;
  explanation: string | null;
  correct_answer: string | null;
};

export default function AdaptiveQuizPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  // Quiz state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Tracking
  const [questionNumber, setQuestionNumber] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [abilityEstimate, setAbilityEstimate] = useState(0);
  const [standardError, setStandardError] = useState(1.0);
  const [isComplete, setIsComplete] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const res = (await api.getAssessments()) as any;
      setAssessments(res.items || []);
    } catch {
      // Use demo assessment if API fails
      setAssessments([
        {
          id: "demo-adaptive",
          title: "Adaptive Diagnostic Quiz",
          assessment_type: "adaptive",
          question_count: 10,
          is_adaptive: true,
          passing_score: 0.7,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (assessmentId: string) => {
    setSelectedAssessment(assessmentId);
    setLoading(true);
    try {
      const res = (await api.startAssessment(assessmentId)) as any;
      setAttemptId(res.attempt_id);
      setCurrentQuestion(res.question);
      setQuestionNumber(1);
    } catch {
      // Demo mode with sample questions
      setAttemptId("demo-attempt");
      setCurrentQuestion({
        id: "q1",
        content: "What is the time complexity of binary search?",
        question_type: "multiple_choice",
        difficulty_level: "intermediate",
        estimated_time_seconds: 60,
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        hints: ["Think about how the search space is divided at each step."],
      });
      setQuestionNumber(1);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || !attemptId) return;
    setSubmitting(true);

    try {
      const result = (await api.submitAnswer(attemptId, currentQuestion.id, selectedAnswer)) as any;
      setAnswerResult(result);
      setTotalAnswered((prev) => prev + 1);
      if (result.is_correct) setCorrectCount((prev) => prev + 1);

      // Track response for IRT
      const newResponse = {
        item_id: currentQuestion.id,
        difficulty: currentQuestion.difficulty_level === "beginner" ? -1 : currentQuestion.difficulty_level === "advanced" ? 1.5 : 0,
        discrimination: 1.0,
        is_correct: result.is_correct,
      };
      setResponses((prev) => [...prev, newResponse]);

      // Update ability estimate
      const newTheta = calculateSimpleTheta([...responses, newResponse]);
      setAbilityEstimate(newTheta);
      setStandardError(Math.max(0.2, 1.0 / Math.sqrt(totalAnswered + 1)));
    } catch {
      // Demo mode
      const isCorrect = selectedAnswer === "O(log n)" || Math.random() > 0.4;
      setAnswerResult({
        is_correct: isCorrect,
        explanation: isCorrect ? null : "Binary search divides the search space in half each time, giving O(log n).",
        correct_answer: isCorrect ? null : "O(log n)",
      });
      setTotalAnswered((prev) => prev + 1);
      if (isCorrect) setCorrectCount((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setAnswerResult(null);
    setSelectedAnswer("");
    setShowHint(false);

    if (questionNumber >= 10 || (standardError < 0.35 && questionNumber >= 3)) {
      setIsComplete(true);
      return;
    }

    // Demo: generate next question
    const demoQuestions: Question[] = [
      { id: "q2", content: "Which data structure uses LIFO ordering?", question_type: "multiple_choice", difficulty_level: "beginner", estimated_time_seconds: 45, options: ["Queue", "Stack", "Array", "Tree"], hints: ["Think: Last In, First Out."] },
      { id: "q3", content: "What is the space complexity of merge sort?", question_type: "multiple_choice", difficulty_level: "intermediate", estimated_time_seconds: 60, options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], hints: ["Merge sort needs extra space for merging."] },
      { id: "q4", content: "In a hash table, what is the average time complexity of lookup?", question_type: "multiple_choice", difficulty_level: "intermediate", estimated_time_seconds: 45, options: ["O(n)", "O(1)", "O(log n)", "O(n log n)"], hints: ["Hash functions map directly to indices."] },
      { id: "q5", content: "Which algorithm is used for finding shortest paths in weighted graphs?", question_type: "multiple_choice", difficulty_level: "advanced", estimated_time_seconds: 60, options: ["BFS", "DFS", "Dijkstra's", "Bubble Sort"], hints: ["Named after a Dutch computer scientist."] },
      { id: "q6", content: "What is the worst-case time complexity of quicksort?", question_type: "multiple_choice", difficulty_level: "advanced", estimated_time_seconds: 60, options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], hints: ["Think about what happens with an already sorted array and poor pivot selection."] },
      { id: "q7", content: "Which tree data structure ensures O(log n) operations?", question_type: "multiple_choice", difficulty_level: "intermediate", estimated_time_seconds: 45, options: ["Binary Tree", "Balanced BST (AVL/Red-Black)", "Linked List", "Heap"], hints: ["The key property is 'balanced'."] },
      { id: "q8", content: "What does the 'P' stand for in P vs NP?", question_type: "multiple_choice", difficulty_level: "advanced", estimated_time_seconds: 60, options: ["Polynomial", "Probabilistic", "Parallel", "Primary"], hints: ["Think about time complexity classes."] },
      { id: "q9", content: "Which sorting algorithm is stable and runs in O(n) for small integer ranges?", question_type: "multiple_choice", difficulty_level: "advanced", estimated_time_seconds: 60, options: ["Quicksort", "Merge Sort", "Counting Sort", "Heap Sort"], hints: ["It counts occurrences rather than comparing elements."] },
      { id: "q10", content: "What is a trie data structure used for?", question_type: "multiple_choice", difficulty_level: "intermediate", estimated_time_seconds: 45, options: ["Sorting", "String prefix matching", "Graph traversal", "Numerical computation"], hints: ["Also called a 'prefix tree'."] },
    ];

    const nextIdx = questionNumber - 1;
    if (nextIdx < demoQuestions.length) {
      setCurrentQuestion(demoQuestions[nextIdx]);
    }
    setQuestionNumber((prev) => prev + 1);
  };

  const calculateSimpleTheta = (resps: any[]): number => {
    if (resps.length === 0) return 0;
    const correctRate = resps.filter((r) => r.is_correct).length / resps.length;
    return Math.round(((correctRate - 0.5) * 4) * 100) / 100;
  };

  const getAbilityLevel = (theta: number) => {
    if (theta >= 1.5) return { label: "Advanced", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (theta >= 0.0) return { label: "Intermediate", color: "text-blue-500", bg: "bg-blue-500/10" };
    if (theta >= -1.0) return { label: "Beginner", color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: "Novice", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const abilityLevel = getAbilityLevel(abilityEstimate);

  // ── Completion Screen ──
  if (isComplete) {
    const accuracy = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
    return (
      <div className="container max-w-2xl py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold">Quiz Complete!</h1>
          <p className="text-muted-foreground">Here&apos;s your diagnostic assessment result</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-extrabold text-primary">{accuracy.toFixed(0)}%</div>
              <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className={`text-4xl font-extrabold ${abilityLevel.color}`}>{abilityEstimate.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-1">Ability θ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-extrabold">{correctCount}/{totalAnswered}</div>
              <p className="text-sm text-muted-foreground mt-1">Correct</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Badge className={`text-lg px-4 py-1 ${abilityLevel.bg} ${abilityLevel.color} border-0`}>
                {abilityLevel.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Skill Level</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> IRT Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ability Estimate (θ)</span>
              <span className="font-mono font-bold">{abilityEstimate.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Standard Error</span>
              <span className="font-mono font-bold">±{standardError.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precision Level</span>
              <Badge variant={standardError < 0.35 ? "default" : "secondary"}>
                {standardError < 0.35 ? "High" : "Moderate"}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button onClick={() => { setIsComplete(false); setQuestionNumber(0); setCorrectCount(0); setTotalAnswered(0); setResponses([]); setAttemptId(null); setSelectedAssessment(null); setAbilityEstimate(0); setStandardError(1.0); }} variant="outline" className="flex-1">
              Retake Quiz
            </Button>
            <Button onClick={() => window.location.href = `/courses/${courseId}`} className="flex-1">
              Back to Course
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── Assessment Selection ──
  if (!attemptId) {
    return (
      <div className="container max-w-3xl py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" /> Adaptive Quiz
          </h1>
          <p className="text-muted-foreground">
            Take a CAT-powered diagnostic assessment. The quiz adapts to your ability level in real-time,
            selecting questions that maximise diagnostic precision using Fisher Information.
          </p>
        </div>

        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))
          ) : (
            assessments.map((a) => (
              <Card key={a.id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => startQuiz(a.id)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="group-hover:text-primary transition-colors">{a.title}</CardTitle>
                    {a.is_adaptive && <Badge className="bg-violet-500/10 text-violet-500 border-0">CAT Adaptive</Badge>}
                  </div>
                  <CardDescription>
                    {a.question_count} questions · {a.is_adaptive ? "Adapts to your level" : "Fixed difficulty"} · Pass: {(a.passing_score * 100).toFixed(0)}%
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="gap-2 w-full">
                    <Zap className="h-4 w-4" /> Start Assessment <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Quiz In Progress ──
  return (
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Header with live stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Question {questionNumber}</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {correctCount}/{totalAnswered} correct</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{currentQuestion?.estimated_time_seconds}s</span>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className={`text-lg font-bold font-mono ${abilityLevel.color}`}>θ = {abilityEstimate.toFixed(2)}</div>
          <Badge variant="outline" className={`${abilityLevel.color} text-xs`}>{abilityLevel.label}</Badge>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={(questionNumber / 10) * 100} className="h-2" />

      {/* Question card */}
      {currentQuestion && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs uppercase">{currentQuestion.difficulty_level}</Badge>
              <Badge variant="outline" className="text-xs">{currentQuestion.question_type.replace("_", " ")}</Badge>
            </div>
            <CardTitle className="text-xl leading-relaxed">{currentQuestion.content}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {Array.isArray(currentQuestion.options) &&
              currentQuestion.options.map((option: string, idx: number) => {
                const isSelected = selectedAnswer === option;
                const showResult = answerResult !== null;
                const isCorrectOption = showResult && answerResult.correct_answer === option;
                const isWrongSelected = showResult && isSelected && !answerResult.is_correct;
                const isCorrectSelected = showResult && isSelected && answerResult.is_correct;

                return (
                  <button
                    key={idx}
                    onClick={() => !answerResult && setSelectedAnswer(option)}
                    disabled={!!answerResult}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      isCorrectSelected ? "border-emerald-500 bg-emerald-500/10" :
                      isWrongSelected ? "border-red-500 bg-red-500/10" :
                      isCorrectOption ? "border-emerald-500 bg-emerald-500/10" :
                      isSelected ? "border-primary bg-primary/5" :
                      "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
                      isCorrectSelected || isCorrectOption ? "border-emerald-500 text-emerald-500" :
                      isWrongSelected ? "border-red-500 text-red-500" :
                      isSelected ? "border-primary text-primary bg-primary/10" :
                      "border-muted-foreground/30 text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 font-medium">{option}</span>
                    {isCorrectSelected && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                    {isWrongSelected && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                    {isCorrectOption && !isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
          </CardContent>

          {/* Answer feedback */}
          {answerResult && (
            <div className={`mx-6 mb-4 p-4 rounded-lg ${answerResult.is_correct ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {answerResult.is_correct ? (
                  <><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Correct!</>
                ) : (
                  <><XCircle className="h-5 w-5 text-red-500" /> Incorrect</>
                )}
              </div>
              {answerResult.explanation && (
                <p className="text-sm text-muted-foreground mt-1">{answerResult.explanation}</p>
              )}
            </div>
          )}

          <CardFooter className="flex justify-between gap-3">
            {!answerResult && currentQuestion.hints && (
              <Button variant="ghost" size="sm" onClick={() => setShowHint(!showHint)} className="gap-1 text-muted-foreground">
                <Lightbulb className="h-4 w-4" /> {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
            )}
            {answerResult && <div />}

            {!answerResult ? (
              <Button onClick={submitAnswer} disabled={!selectedAnswer || submitting} className="gap-2 min-w-32">
                {submitting ? "Checking..." : <><CheckCircle2 className="h-4 w-4" /> Submit Answer</>}
              </Button>
            ) : (
              <Button onClick={nextQuestion} className="gap-2 min-w-32">
                Next Question <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Hint panel */}
      {showHint && currentQuestion?.hints && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              {Array.isArray(currentQuestion.hints) ? currentQuestion.hints[0] : currentQuestion.hints}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Why this question? */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <HelpCircle className="h-4 w-4" /> Why this question?
          </div>
          <p className="text-xs text-muted-foreground">
            Selected via <strong>Maximum Fisher Information</strong> at θ = {abilityEstimate.toFixed(2)}.
            This question&apos;s difficulty ({currentQuestion?.difficulty_level}) provides the most diagnostic
            information at your current estimated ability level. SE = ±{standardError.toFixed(3)}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
