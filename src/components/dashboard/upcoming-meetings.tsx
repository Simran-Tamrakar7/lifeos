"use client";

import Link from "next/link";
import { format, isAfter, parseISO } from "date-fns";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function UpcomingMeetings() {
  const meetings = useLifeOSStore((s) => s.meetings);
  const upcoming = meetings
    .filter((m) => m.status === "scheduled" && isAfter(parseISO(m.end), new Date()))
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
    .slice(0, 4);

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--accent)]" />
            Upcoming meetings
          </CardTitle>
          <CardDescription>Next on your calendar</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/meetings">All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No meetings"
            description="Your schedule is open for deep work."
          />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-[var(--fg-muted)]">
                    {format(parseISO(m.start), "EEE · h:mm a")}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                </div>
                <Badge variant="secondary">{m.type.replaceAll("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
