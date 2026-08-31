'use client';

import { CheckCircle2, Circle, Clock, Lock, MapPin, Play, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

import { useCourse } from '@/components/course/course-context';

type PathNode = {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'quiz' | 'project';
  skill_name: string;
  estimated_duration_minutes: number;
  status: 'completed' | 'current' | 'locked' | 'available';
  mastery_score: number;
  order: number;
};

export default function LearningPathsPage() {
  const [loading, setLoading] = useState(true);
  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);
  const [pathTitle, _setPathTitle] = useState('Your Personalized Learning Path');
  const { completedLessons } = useCourse();

  const loadLearningPath = useCallback(async () => {
    try {
      const res = (await api.getRecommendations({ max_results: 15 })) as any;
      const items = res.items || res.recommendations || [];
      if (items.length > 0) {
        let foundCurrent = false;
        setPathNodes(
          items.map((r: any, idx: number) => {
            const isCompleted = completedLessons.includes(r.resource_id);
            let status: 'completed' | 'current' | 'available' | 'locked' = 'locked';
            
            if (isCompleted) {
              status = 'completed';
            } else if (!foundCurrent) {
              status = 'current';
              foundCurrent = true;
            } else {
              status = 'available';
            }

            return {
              id: r.resource_id,
              title: r.title,
              description: r.reasons?.[0] || 'Recommended for your learning goals',
              type: r.resource_type === 'lesson' ? 'lesson' : 'quiz',
              skill_name: r.fills_skills?.[0] || 'General',
              estimated_duration_minutes: r.estimated_duration_minutes || 30,
              status,
              mastery_score: r.score || 0,
              order: idx + 1,
            };
          }),
        );
      } else {
        setPathNodes([]);
      }
    } catch (err) {
      console.error(err);
      setPathNodes([]);
    } finally {
      setLoading(false);
    }
  }, [completedLessons]);

  useEffect(() => {
    loadLearningPath();
  }, [loadLearningPath]);

  const getNodeConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500',
          ringColor: 'ring-emerald-500',
          lineColor: 'bg-emerald-500',
        };
      case 'current':
        return {
          icon: Play,
          color: 'text-primary',
          bg: 'bg-primary',
          ringColor: 'ring-primary',
          lineColor: 'bg-primary',
        };
      case 'available':
        return {
          icon: Circle,
          color: 'text-muted-foreground',
          bg: 'bg-muted-foreground/30',
          ringColor: 'ring-muted-foreground/30',
          lineColor: 'bg-muted-foreground/20',
        };
      default:
        return {
          icon: Lock,
          color: 'text-muted-foreground/30',
          bg: 'bg-muted-foreground/10',
          ringColor: 'ring-muted-foreground/10',
          lineColor: 'bg-muted-foreground/10',
        };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'quiz':
        return { label: 'Quiz', color: 'text-violet-500', bg: 'bg-violet-500/10' };
      case 'project':
        return { label: 'Project', color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default:
        return { label: 'Lesson', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    }
  };

  const completedCount = pathNodes.filter((n) => n.status === 'completed').length;
  const _currentNode = pathNodes.find((n) => n.status === 'current');
  const totalDuration = pathNodes.reduce((sum, n) => sum + n.estimated_duration_minutes, 0);
  const completedDuration = pathNodes
    .filter((n) => n.status === 'completed')
    .reduce((sum, n) => sum + n.estimated_duration_minutes, 0);

  if (loading) {
    return (
      <div className="container max-w-3xl py-8 space-y-8">
        <PageHeader title="Learning Path" description="Your personalized roadmap." />
        <Skeleton className="h-24 rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (pathNodes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-8 space-y-8">
        <PageHeader
          title={pathTitle}
          description="Your AI-generated learning roadmap ordered by skill prerequisites."
        />
        <Card className="border-dashed p-8 text-center flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">No Learning Path Generated Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Please complete onboarding, configure your career goals, or start studying to let the recommendation engine build your personalized learning path.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8 space-y-8">
      <PageHeader
        title={pathTitle}
        description="Your AI-generated learning roadmap ordered by skill prerequisites. Complete each node to unlock the next."
      />

      {/* Progress summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h2 className="text-lg font-bold">
                {completedCount} of {pathNodes.length} completed
              </h2>
              <Progress value={(completedCount / pathNodes.length) * 100} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {Math.round(completedDuration / 60)}h done
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ~
                  {Math.round((totalDuration - completedDuration) / 60)}h remaining
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {pathNodes.map((node, idx) => {
          const config = getNodeConfig(node.status);
          const typeConfig = getTypeConfig(node.type);
          const NodeIcon = config.icon;
          const isLast = idx === pathNodes.length - 1;

          return (
            <div key={node.id} className="relative flex gap-4">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full ring-4 ${config.ringColor} ${config.bg} flex items-center justify-center z-10 shrink-0 ${node.status === 'current' ? 'animate-pulse' : ''}`}
                >
                  <NodeIcon
                    className={`h-5 w-5 ${node.status === 'completed' || node.status === 'current' ? 'text-white' : config.color}`}
                  />
                </div>
                {!isLast && <div className={`w-0.5 flex-1 min-h-[2rem] ${config.lineColor}`} />}
              </div>

              {/* Content card */}
              <Card
                className={`flex-1 mb-4 transition-all ${
                  node.status === 'current'
                    ? 'border-primary/50 ring-1 ring-primary/20 bg-primary/[0.02]'
                    : node.status === 'locked'
                      ? 'opacity-50'
                      : 'hover:border-primary/30'
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-bold text-sm ${node.status === 'locked' ? 'text-muted-foreground' : ''}`}
                        >
                          {node.title}
                        </h3>
                        <Badge
                          className={`${typeConfig.bg} ${typeConfig.color} border-0 text-[10px]`}
                        >
                          {typeConfig.label}
                        </Badge>
                        {node.status === 'current' && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] animate-pulse">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{node.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" /> {node.skill_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {node.estimated_duration_minutes}min
                        </span>
                        {node.mastery_score > 0 && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> {(node.mastery_score * 100).toFixed(0)}
                            % mastery
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    {node.status === 'current' && (
                      <Link
                        href={
                          node.type === 'quiz' ? `/courses/${node.id}/quiz` : `/courses/${node.id}`
                        }
                      >
                        <Button size="sm" className="gap-1 shrink-0">
                          <Play className="h-3.5 w-3.5" /> Start
                        </Button>
                      </Link>
                    )}
                    {node.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                    )}
                    {node.status === 'locked' && (
                      <Lock className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
