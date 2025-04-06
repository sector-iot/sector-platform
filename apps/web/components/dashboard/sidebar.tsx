"use client";

import { cn } from "@/lib/utils";
import { Boxes, Cpu, GitBranch, Home, Users, Key } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  {
    label: "Overview",
    icon: Home,
    href: "/dashboard",
  },
  {
    label: "Devices",
    icon: Cpu,
    href: "/dashboard/devices",
  },
  {
    label: "Device Groups",
    icon: Boxes,
    href: "/dashboard/groups",
  },
  {
    label: "Git Repositories",
    icon: GitBranch,
    href: "/dashboard/repositories",
  },
  {
    label: "API Keys",
    icon: Key,
    href: "/dashboard/api-keys",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-[240px] flex-col border-r border-sidebar-border bg-primary px-3 py-4 shadow-lg">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                  pathname === route.href ? "bg-primary-foreground/20 text-primary-foreground" : "text-primary-foreground/80"
                )}
              >
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}