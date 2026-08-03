"use client";

import Link from "next/link";
import { CheckSquare, StickyNote, Timer, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/ai", label: "AI", icon: Sparkles },
] as const;

export function QuickActions() {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl bg-[var(--surface-2)]/70 px-3 py-4 text-sm font-medium transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
