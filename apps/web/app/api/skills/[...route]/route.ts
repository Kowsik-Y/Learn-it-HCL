/**
 * Skills API — /api/skills/*
 */

import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ route?: string[] }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const path = route?.join("/") || "";
    const url = new URL(request.url);

    // GET /api/skills/ — list skills
    if (!path) {
      return handleListSkills(user, url);
    }

    // GET /api/skills/career-roles
    if (path === "career-roles") {
      return handleListCareerRoles(user);
    }

    // GET /api/skills/career-roles/:roleId/skills
    if (route && route[0] === "career-roles" && route.length === 3 && route[2] === "skills") {
      return handleRoleSkills(route[1]);
    }

    // GET /api/skills/:skillId — single skill
    return handleGetSkill(user, path);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Skills error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}

async function handleListSkills(user: { tenantId: string }, url: URL) {
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("page_size") || "50", 10);

  const where: Record<string, unknown> = {
    tenantId: user.tenantId,
    isActive: true,
  };
  if (category) where.category = category;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.skill.count({ where }),
  ]);

  return NextResponse.json({
    items: skills.map((s: { id: any; name: any; slug: any; category: any; description: any; difficultyLevel: any; }) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category,
      description: s.description,
      difficulty_level: s.difficultyLevel,
    })),
    total,
    page,
    page_size: pageSize,
  });
}

async function handleGetSkill(user: { tenantId: string }, skillId: string) {
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, tenantId: user.tenantId },
  });

  if (!skill) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Skill not found" } },
      { status: 404 }
    );
  }

  const prerequisites = await prisma.skillRelationship.findMany({
    where: { targetSkillId: skillId, relationshipType: "prerequisite" },
  });

  return NextResponse.json({
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    category: skill.category,
    description: skill.description,
    difficulty_level: skill.difficultyLevel,
    prerequisites: prerequisites.map((p: { sourceSkillId: any; }) => p.sourceSkillId),
  });
}

async function handleListCareerRoles(user: { tenantId: string }) {
  const roles = await prisma.careerRole.findMany({
    where: { tenantId: user.tenantId, isActive: true },
  });

  return NextResponse.json({
    items: roles.map((r: { id: any; name: any; slug: any; description: any; category: any; }) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      category: r.category,
    })),
  });
}

async function handleRoleSkills(roleId: string) {
  const roleSkills = await prisma.roleSkill.findMany({
    where: { careerRoleId: roleId },
    include: { skill: true },
  });

  return NextResponse.json({
    role_id: roleId,
    skills: roleSkills.map((rs: { skillId: any; skill: { name: any; }; importance: any; minimumMastery: any; }) => ({
      skill_id: rs.skillId,
      skill_name: rs.skill.name,
      importance: rs.importance,
      minimum_mastery: rs.minimumMastery,
    })),
  });
}
