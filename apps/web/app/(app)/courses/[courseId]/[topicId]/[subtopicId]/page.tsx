'use client';

import { Award, FileText } from 'lucide-react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useCourse } from '@/components/course/course-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseLearningInterface() {
  const params = useParams();
  const activeLesson = params.subtopicId as string;
  const { completedLessons, setCompletedLessons, setTotalXp } = useCourse();
  const [activeLanguage, setActiveLanguage] = useState('en');

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLesson() {
      try {
        setLoading(true);
        const res = await api.getLesson(activeLesson) as any;
        setLesson(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (activeLesson) {
      fetchLesson();
    }
  }, [activeLesson]);

  const handleComplete = async () => {
    if (!completedLessons.includes(activeLesson)) {
      try {
        await api.completeLesson(activeLesson);
        setCompletedLessons((prev) => [...prev, activeLesson]);
        const xpGained = 50; // standard dynamic lesson XP
        setTotalXp((prev) => prev + xpGained);
        toast.success(`Lesson Completed! +${xpGained} XP`, {
          icon: <Award className="text-yellow-500" />,
        });
      } catch (err) {
        toast.error('Failed to save progress');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 lg:p-10 space-y-8 pb-32">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
        Select a lesson from the sidebar to begin.
      </div>
    );
  }

  const hasVideo = lesson.content_type === 'video' && lesson.content_url;
  const videoUrl = hasVideo ? lesson.content_url : null;

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-8 lg:p-10 space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
        {videoUrl && (
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
      {videoUrl && (
        <div className="aspect-video w-full rounded-xl overflow-hidden border shadow-sm bg-black relative">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={videoUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Markdown Content */}
      {lesson.content_body ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8 prose dark:prose-invert max-w-none">
            <ReactMarkdown>{lesson.content_body}</ReactMarkdown>
          </CardContent>
        </Card>
      ) : !videoUrl ? (
        <Card className="shadow-sm border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
            <div>
              <p className="font-semibold">No content available</p>
              <p className="text-xs">This lesson does not contain any video or reading material yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end pt-6 border-t mt-8">
        <Button
          size="lg"
          onClick={handleComplete}
          disabled={completedLessons.includes(activeLesson)}
          className={
            completedLessons.includes(activeLesson)
              ? 'bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto font-bold'
              : 'w-full sm:w-auto font-bold'
          }
        >
          {completedLessons.includes(activeLesson) ? 'Completed' : 'Mark as Complete & Earn XP'}
        </Button>
      </div>
    </div>
  );
}
