import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "accent";
}

export function GradientCard({
  children,
  className,
  variant = "primary",
}: GradientCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-6",
        "bg-gradient-to-br shadow-lg transition-all duration-300 hover:shadow-xl",
        variant === "primary" && "from-primary/20 to-primary/5 hover:from-primary/30 hover:to-primary/10",
        variant === "secondary" && "from-secondary/20 to-secondary/5 hover:from-secondary/30 hover:to-secondary/10",
        variant === "accent" && "from-accent/20 to-accent/5 hover:from-accent/30 hover:to-accent/10",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
      <div
        className={cn(
          "absolute inset-0 blur-3xl opacity-30 transition-opacity duration-300",
          variant === "primary" && "bg-primary/20",
          variant === "secondary" && "bg-secondary/20",
          variant === "accent" && "bg-accent/20"
        )}
      />
    </div>
  );
}