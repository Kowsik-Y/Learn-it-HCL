/**
 * Content API — /api/content/*
 * Courses, lessons, and resources.
 */

import { NextResponse } from 'next/server';
import { AuthError, getCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export async function GET(request: Request, { params }: { params: Promise<{ route: string[] }> }) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const url = new URL(request.url);

    // GET /api/content/courses
    if (route[0] === 'courses' && route.length === 1) {
      return handleListCourses(user, url);
    }

    // GET /api/content/courses/:courseId
    if (route[0] === 'courses' && route.length === 2) {
      return handleGetCourse(user, route[1]);
    }

    // GET /api/content/lessons/:lessonId
    if (route[0] === 'lessons' && route.length === 2) {
      return handleGetLesson(user, route[1]);
    }

    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Unknown content path' } },
      { status: 404 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('Content error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ route: string[] }> }) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;

    // POST /api/content/lessons/:lessonId/complete
    if (route[0] === 'lessons' && route.length === 3 && route[2] === 'complete') {
      return handleCompleteLesson(user, route[1]);
    }

    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Unknown content path' } },
      { status: 404 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('Content error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 },
    );
  }
}

async function handleListCourses(user: { tenantId: string }, url: URL) {
  const search = url.searchParams.get('search') || undefined;
  const difficulty = url.searchParams.get('difficulty') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('page_size') || '20', 10);

  const where: Record<string, unknown> = {
    tenantId: user.tenantId,
    isPublished: true,
  };
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (difficulty) where.difficultyLevel = difficulty;

  const courses = await prisma.course.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({
    items: courses.map(
      (c: {
        id: any;
        title: any;
        slug: any;
        shortDescription: any;
        difficultyLevel: any;
        estimatedDurationHours: any;
        thumbnailUrl: any;
        enrollmentCount: any;
        rating: any;
        isFree: any;
      }) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        short_description: c.shortDescription,
        difficulty_level: c.difficultyLevel,
        estimated_duration_hours: c.estimatedDurationHours,
        thumbnail_url: c.thumbnailUrl,
        enrollment_count: c.enrollmentCount,
        rating: c.rating,
        is_free: c.isFree,
      }),
    ),
    page,
    page_size: pageSize,
  });
}

async function handleGetCourse(user: { tenantId: string }, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId: user.tenantId },
    include: {
      modules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          chapters: {
            orderBy: { orderIndex: 'asc' },
            include: {
              lessons: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Course not found' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: course.id,
    title: course.title,
    description: course.description,
    difficulty_level: course.difficultyLevel,
    estimated_duration_hours: course.estimatedDurationHours,
    modules: course.modules.map((m: any) => ({
      id: m.id,
      title: m.title,
      order_index: m.orderIndex,
      chapters: m.chapters.map((ch: any) => ({
        id: ch.id,
        title: ch.title,
        order_index: ch.orderIndex,
        lessons: ch.lessons.map((l: any) => ({
          id: l.id,
          title: l.title,
          content_type: l.contentType,
          order_index: l.orderIndex,
        })),
      })),
    })),
  });
}

async function handleGetLesson(user: { tenantId: string }, lessonId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, tenantId: user.tenantId },
  });

  if (!lesson) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Lesson not found' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    content_type: lesson.contentType,
    content_url: lesson.contentUrl,
    content_body: lesson.contentBody,
    estimated_duration_minutes: lesson.estimatedDurationMinutes,
    difficulty_level: lesson.difficultyLevel,
    skill_ids: lesson.skillIds,
    learning_objectives: lesson.learningObjectives,
  });
}

async function handleCompleteLesson(user: { id: string; tenantId: string }, lessonId: string) {
  // Check if already completed
  const existingEvent = await prisma.xPEvent.findFirst({
    where: {
      learnerId: user.id,
      sourceType: 'lesson',
      sourceId: lessonId,
    },
  });

  if (existingEvent) {
    return NextResponse.json({ success: true, message: 'Already completed' });
  }

  // Create XP Event
  await prisma.xPEvent.create({
    data: {
      tenantId: user.tenantId,
      learnerId: user.id,
      amount: 10,
      reason: 'Completed lesson',
      sourceType: 'lesson',
      sourceId: lessonId,
    },
  });

  return NextResponse.json({ success: true, xp_gained: 10 });
}
