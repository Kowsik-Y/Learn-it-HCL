"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Brain,
  Target,
  BookOpen,
  Layers,
  Sparkles,
  Award,
  Users,
  Settings,
  Shield,
  LogOut,
  User as UserIcon,
  ChevronUp,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const IconMap: Record<string, any> = {
  Target,
  BookOpen,
  Layers,
  Sparkles,
  Award,
  Building,
  Users,
  User: UserIcon,
  Shield,
  Settings,
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [navLinks, setNavLinks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNav() {
      try {
        const res = await api.request<{ navigation_links: any[] }>("/auth/me");
        if (res.navigation_links) {
          setNavLinks(res.navigation_links);
        }
      } catch (err) {
        console.error("Failed to load nav links", err);
      }
    }
    fetchNav();
  }, []);

  const isAdmin = user?.role === "super_admin";
  const isOrgAdmin = user?.role === "org_admin";

  const groupedLinks = navLinks.reduce((acc, link) => {
    const group = link.group || "Navigation";
    if (!acc[group]) acc[group] = [];
    acc[group].push(link);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-16 border-b border-border flex flex-col justify-center px-4">
        <div className="flex items-center justify-between">
          <Link
            href={isAdmin ? "/admin/users" : isOrgAdmin ? "/org/users" : "/dashboard"}
            className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden"
          >
            <Brain className="h-6 w-6 text-primary shrink-0" />
            <span className="font-bold text-lg whitespace-nowrap">
              Learn-it HCL
            </span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(groupedLinks).map(([group, links]: [string, any]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {links.map((link: any) => {
                const Icon = IconMap[link.icon] || Target;
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton tooltip={link.label} render={<Link href={link.href} />} isActive={pathname.startsWith(link.href)}>
                      <Icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar_url || ""} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                      {user?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.full_name || "User"}</span>
                    <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="end"
                sideOffset={4}
              >
                <Link href="/profile" className="w-full">
                  <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
                    <UserIcon className="size-4 text-muted-foreground" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="gap-2 p-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
