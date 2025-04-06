"use client";

import { Bell, Menu, Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Header() {
  return (
    <header className="border-b border-sidebar-border bg-card shadow-sm">
      <div className="flex h-16 items-center px-4 sm:px-6 backdrop-blur-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-accent/20 hover:text-accent-foreground lg:hidden transition-colors duration-200">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[280px]">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-between">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">IoT Device Management</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-accent/20 transition-colors duration-200">
              <Settings className="h-5 w-5 text-accent" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}