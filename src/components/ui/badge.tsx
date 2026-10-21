import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const badgeVariants = {
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  indigo:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
};

export type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: LucideIcon;
  tooltip?: React.ReactNode;
}

export function Badge({
  variant = "indigo",
  icon: Icon,
  tooltip,
  className,
  children,
  tabIndex,
  ...props
}: BadgeProps) {
  const badge = (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        badgeVariants[variant],
        tooltip &&
          "cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className,
      )}
      tabIndex={tooltip ? (tabIndex ?? 0) : tabIndex}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </span>
  );

  if (!tooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="pointer-events-auto">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
