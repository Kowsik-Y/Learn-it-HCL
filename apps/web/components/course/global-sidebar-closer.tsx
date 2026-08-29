"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function GlobalSidebarCloser() {
  const { setOpen } = useSidebar();
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);
  return null;
}
