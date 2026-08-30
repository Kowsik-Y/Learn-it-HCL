/**
 * Auth API — GET /api/auth/me
 */

import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  student: ["read:own_profile", "read:courses", "read:content", "submit:assessments", "use:ai_tutor"],
  teacher: ["read:own_profile", "read:courses", "read:content", "manage:courses", "manage:assessments", "view:analytics"],
  admin: ["read:own_profile", "read:courses", "read:content", "manage:courses", "manage:assessments", "manage:users", "view:analytics", "manage:organization"],
  org_admin: ["read:own_profile", "read:courses", "read:content", "manage:courses", "manage:assessments", "manage:users", "view:analytics", "manage:organization"],
  super_admin: ["*"],
};

const COMMON_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "Target", group: "Learning Platform" },
  { href: "/courses", label: "Courses", icon: "BookOpen", group: "Learning Platform" },
  { href: "/learning-paths", label: "Learning Paths", icon: "Map", group: "Learning Platform" },
  { href: "/skills", label: "Skills Map", icon: "Brain", group: "Mastery & Review" },
  { href: "/review", label: "Review Queue", icon: "RotateCcw", group: "Mastery & Review" },
  { href: "/achievements", label: "Achievements", icon: "Award", group: "Progress" },
  { href: "/profile", label: "Profile", icon: "User", group: "Account" },
];

const ROLE_NAVIGATION: Record<string, any[]> = {
  student: COMMON_LINKS,
  teacher: [
    { href: "/teacher/analytics", label: "Class Analytics", icon: "BarChart3", group: "Teacher Tools" },
    { href: "/teacher/courses", label: "Manage Courses", icon: "BookOpen", group: "Teacher Tools" },
    ...COMMON_LINKS,
  ],
  org_admin: [
    { href: "/org/users", label: "Organization Users", icon: "Users", group: "Organization" },
    { href: "/org/settings", label: "Settings", icon: "Settings", group: "Organization" },
    ...COMMON_LINKS,
  ],
  admin: [
    { href: "/org/users", label: "Organization Users", icon: "Users", group: "Organization" },
    { href: "/org/settings", label: "Settings", icon: "Settings", group: "Organization" },
    ...COMMON_LINKS,
  ],
  super_admin: [
    { href: "/admin/organizations", label: "Organizations", icon: "Building", group: "Administration" },
    { href: "/admin/users", label: "Global Users", icon: "Users", group: "Administration" },
    { href: "/admin/roles", label: "Role Management", icon: "Shield", group: "Administration" },
    { href: "/admin/settings", label: "System Settings", icon: "Settings", group: "Administration" },
    ...COMMON_LINKS,
  ],
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);

    const org = await prisma.organization.findUnique({
      where: { id: user.tenantId },
    });

    const permissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.student;
    const navigation_links = ROLE_NAVIGATION[user.role] || ROLE_NAVIGATION.student;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        tenant_id: user.tenantId,
        is_active: user.isActive,
        is_verified: true,
        avatar_url: user.avatarUrl,
      },
      permissions,
      navigation_links,
      organization: org
        ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
            tenant_type: org.tenantType,
            logo_url: org.logoUrl,
            is_active: org.isActive,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
