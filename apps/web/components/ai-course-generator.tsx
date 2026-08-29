"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

export function AiCourseGenerator() {
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!topic || !targetAudience || !language) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/ai/course/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, target_audience: targetAudience, language }),
      });
      
      if (!response.ok) throw new Error("Failed to generate course");
      
      const data = await response.json();
      setResult(data);
      toast.success("Course generated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Enter the topic and audience for your new course.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input 
              id="topic" 
              placeholder="e.g. Advanced Machine Learning" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Target Audience</Label>
            <Input 
              id="audience" 
              placeholder="e.g. Senior Software Engineers" 
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input 
              id="language" 
              placeholder="e.g. Spanish" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Generating Course..." : "Generate AI Course"}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Generated Roadmap: {result.roadmap?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Modules</h3>
                <ul className="space-y-4">
                  {result.roadmap?.modules?.map((mod: any, idx: number) => (
                    <li key={idx} className="bg-muted p-4 rounded-md">
                      <span className="font-medium text-primary block">{mod.title}</span>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                        {mod.lessons?.map((lesson: string, lIdx: number) => (
                          <li key={lIdx}>{lesson}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Materials & Content</h3>
                {result.materials?.map((mat: any, idx: number) => (
                  <div key={idx} className="mb-4">
                    <h4 className="font-medium">{mat.title} ({mat.language})</h4>
                    <p className="text-sm mt-2 p-3 bg-secondary/50 rounded">{mat.content}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Generated Tests</h3>
                <div className="space-y-4">
                  {result.tests?.map((test: any, idx: number) => (
                    <div key={idx} className="bg-card border p-4 rounded-md shadow-sm">
                      <p className="font-medium mb-2">{idx + 1}. {test.question}</p>
                      <div className="space-y-1 text-sm ml-4">
                        {test.options?.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className={`px-2 py-1 rounded ${opt === test.correct_answer ? 'bg-green-100 dark:bg-green-900/30 font-semibold' : ''}`}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Recommended Videos</h3>
                <ul className="list-disc pl-5">
                  {result.videos?.map((vid: any, idx: number) => (
                    <li key={idx}><a href={vid.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{vid.title}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
