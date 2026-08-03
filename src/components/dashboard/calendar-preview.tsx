"use client";

import Link from "next/link";
import { format, isToday, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function CalendarPreview() {
  const events = useLifeOSStore((s) => s.events);
  const todayEvents = events
    .filter((e) => isToday(parseISO(e.start)))
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--accent)]" />
            Calendar
          </CardTitle>
          <CardDescription>Today&apos;s events</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar">Open</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {todayEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nothing scheduled"
            description="No events on the calendar today."
          />
        ) : (
          <ul className="space-y-2">
            {todayEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5">
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: e.color ?? "var(--accent)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-[var(--fg-muted)]">
                    {e.allDay
                      ? "All day"
                      : `${format(parseISO(e.start), "h:mm a")} – ${format(parseISO(e.end), "h:mm a")}`}
                    {" · "}
                    {e.calendar}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
