import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import React from "react";

interface DetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string; // e.g. "sm:max-w-md w-100"
}

export function DetailsSheet({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  className = "sm:max-w-md w-100 overflow-y-auto"
}: DetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={className}>
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2 text-xl">
            {icon}
            <span>{title}</span>
          </SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="space-y-8 px-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
