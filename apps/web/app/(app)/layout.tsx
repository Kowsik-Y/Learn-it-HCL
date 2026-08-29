import React from "react";
import { AppLayout } from "@/components/app-layout";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <div className="px-4 space-y-8">
        {children}
      </div>
    </AppLayout>
  );
}
