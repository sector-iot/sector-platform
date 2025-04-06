import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-6",
        "bg-gradient-to-br from-card to-card/50",
        "border border-border/50",
        "shadow-lg transition-all duration-300 hover:shadow-xl",
        "group hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && (
          <div className="rounded-full p-2 transition-colors group-hover:bg-primary/10">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-semibold tracking-tight">{value}</h3>
        {trend && (
          <div className="mt-1 flex items-center gap-1">
            <span
              className={cn(
                "text-sm",
                trend.positive
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-rose-500 dark:text-rose-400"
              )}
            >
              {trend.value}%
            </span>
            <span className="text-sm text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          "bg-gradient-to-br from-primary/10 to-transparent",
          "group-hover:opacity-100"
        )}
      />
    </div>
  );
}