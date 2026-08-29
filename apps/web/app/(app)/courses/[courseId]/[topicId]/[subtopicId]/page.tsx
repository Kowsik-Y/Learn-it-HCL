"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import { useCourse } from "@/components/course/course-context";
import { mockCourseData } from "@/lib/mock-course-data";
import { api } from "@/lib/api";

export default function CourseLearningInterface() {
  const params = useParams();
  const activeLesson = params.subtopicId as string;
  const { completedLessons, setCompletedLessons, setTotalXp } = useCourse();
  const [activeLanguage, setActiveLanguage] = useState("en");

  const lessonContent = mockCourseData.content[activeLesson as keyof typeof mockCourseData.content] || null;

  const handleComplete = async () => {
    if (!completedLessons.includes(activeLesson)) {
      try {
        await api.completeLesson(activeLesson);
        setCompletedLessons((prev) => [...prev, activeLesson]);
        const xpGained = lessonContent?.xp || 10;
        setTotalXp((prev) => prev + xpGained);
        toast.success(`Lesson Completed! +${xpGained} XP`, {
          icon: <Award className="text-yellow-500" />,
        });
      } catch (err) {
        toast.error("Failed to save progress");
        console.error(err);
      }
    }
  };

  if (!lessonContent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
        Select a lesson from the sidebar to begin.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-8 lg:p-10 space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {mockCourseData.modules.flatMap(m => m.lessons).find(l => l.id === activeLesson)?.title}
        </h1>
        {lessonContent.videos && (
          <div className="w-full sm:w-45 shrink-0">
            <Select value={activeLanguage} onValueChange={(val) => val && setActiveLanguage(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Video Player */}
      {lessonContent.videos && (
        <div className="aspect-video w-full rounded-xl overflow-hidden border shadow-sm bg-black relative">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={lessonContent.videos[activeLanguage as keyof typeof lessonContent.videos]}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Markdown Content */}
      {lessonContent.markdown && (
        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8 prose dark:prose-invert max-w-none">
            <ReactMarkdown>{lessonContent.markdown}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-6 border-t mt-8">
        <Button 
          size="lg" 
          onClick={handleComplete}
          disabled={completedLessons.includes(activeLesson)}
          className={completedLessons.includes(activeLesson) ? "bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto" : "w-full sm:w-auto"}
        >
          {completedLessons.includes(activeLesson) ? "Completed" : "Mark as Complete & Earn XP"}
        </Button>
      </div>
    </div>
  );
}
