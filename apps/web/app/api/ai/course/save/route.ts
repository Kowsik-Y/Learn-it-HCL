/**
 * POST /api/ai/course/save
 * Persists an AI-generated course (roadmap + materials + videos) to PostgreSQL
 * via Prisma, creating: Course → Module → Chapter → Lesson hierarchy.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const body = await request.json();
    const { roadmap, materials, topic, target_audience, language } = body as {
      roadmap: {
        title?: string;
        overview?: string;
        modules?: { title: string; lessons: string[] }[];
      };
      materials: { title: string; content: string }[];
      topic: string;
      target_audience: string;
      language: string;
    };

    const courseTitle = roadmap?.title || `AI Course: ${topic}`;
    const baseSlug = slugify(courseTitle);
    // Ensure uniqueness by appending timestamp
    const slug = `${baseSlug}-${Date.now()}`;

    // Build a map of lesson title → material content
    const materialMap: Record<string, string> = {};
    for (const mat of materials || []) {
      if (mat?.title) {
        materialMap[mat.title] = mat.content || '';
      }
    }

    // Compute total duration estimate (30 min/lesson default)
    const allModules = roadmap?.modules || [];
    const totalLessons = allModules.reduce((s, m) => s + (m.lessons?.length || 0), 0);
    const estimatedHours = Math.max(1, Math.round((totalLessons * 30) / 60));

    // ── Create Course ──────────────────────────────────────────────────────────
    const course = await prisma.course.create({
      data: {
        tenantId,
        title: courseTitle,
        slug,
        description: roadmap?.overview || `AI-generated course on ${topic} for ${target_audience}`,
        shortDescription: `AI-generated: ${topic}`,
        language: language?.slice(0, 2).toLowerCase() || 'en',
        difficultyLevel: 'intermediate',
        estimatedDurationHours: estimatedHours,
        isPublished: true,
        isFree: true,
      },
    });

    // ── Create Modules → Chapters → Lessons ───────────────────────────────────
    for (let mi = 0; mi < allModules.length; mi++) {
      const mod = allModules[mi];

      const module = await prisma.module.create({
        data: {
          tenantId,
          courseId: course.id,
          title: mod.title,
          orderIndex: mi,
          estimatedDurationMinutes: (mod.lessons?.length || 1) * 30,
        },
      });

      // One chapter per module for simplicity
      const chapter = await prisma.chapter.create({
        data: {
          tenantId,
          moduleId: module.id,
          title: `${mod.title} — Content`,
          orderIndex: 0,
          estimatedDurationMinutes: (mod.lessons?.length || 1) * 30,
        },
      });

      for (let li = 0; li < (mod.lessons || []).length; li++) {
        const lessonItem = mod.lessons[li];
        const isObject = typeof lessonItem === 'object' && lessonItem !== null;

        // Extract title
        // @ts-expect-error
        const lessonTitle = isObject ? lessonItem.title || 'Untitled Lesson' : String(lessonItem);

        // Extract or construct content
        let contentBody = materialMap[lessonTitle] || '';
        if (!contentBody && isObject) {
          // @ts-expect-error
          const material = lessonItem.lecture_material || lessonItem.summary;
          if (material) {
            contentBody = `## ${lessonTitle}\n\n${material}`;
          }
        }
        // Extract video URL if present
        // @ts-expect-error
        const videoUrl = isObject ? lessonItem.video_url : null;

        await prisma.lesson.create({
          data: {
            tenantId,
            chapterId: chapter.id,
            title: lessonTitle,
            contentType: videoUrl ? 'video' : 'article',
            contentUrl: videoUrl || null,
            contentBody:
              contentBody ||
              `## ${lessonTitle}\n\nThis lesson covers key concepts in **${topic}**.`,
            orderIndex: li,
            estimatedDurationMinutes: 30,
            difficultyLevel: 'intermediate',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        modules: allModules.length,
        lessons: totalLessons,
      },
    });
  } catch (error) {
    console.error('[AI_COURSE_SAVE_ERROR]', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
