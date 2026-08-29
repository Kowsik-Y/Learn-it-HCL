import * as React from "react";
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionMenuItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  className?: string;
  disabled?: boolean;
}

interface DataTableRowActionsProps {
  actions: (ActionMenuItem | false | null | undefined)[];
  loading?: boolean;
}

export function DataTableRowActions({ actions, loading }: DataTableRowActionsProps) {
  const validActions = actions.filter(Boolean) as ActionMenuItem[];
  if (validActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground h-8 w-8 p-0"
      >
        <span className="sr-only">Open menu</span>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <MoreHorizontal className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-full">
        {validActions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.className}
            {...(action.variant ? { variant: action.variant } : {})}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
