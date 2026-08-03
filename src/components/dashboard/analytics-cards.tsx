"use client";

import { isToday, parseISO } from "date-fns";
import { CheckCircle2, Flame, Target, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function AnalyticsCards() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const focusSessions = useLifeOSStore((s) => s.focusSessions);
  const habits = useLifeOSStore((s) => s.habits);
  const dailyGoal = useLifeOSStore((s) => s.settings.dailyGoalTasks);

  const tasksDoneToday = tasks.filter(
    (t) => t.status === "done" && isToday(parseISO(t.updatedAt))
  ).length;

  const focusMinutesToday = focusSessions
    .filter((s) => isToday(parseISO(s.completedAt)))
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const focusHours = Math.round((focusMinutesToday / 60) * 10) / 10;

  const habitStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const completionRate = Math.min(100, Math.round((tasksDoneToday / Math.max(dailyGoal, 1)) * 100));
  const focusScore = Math.min(40, Math.round((focusMinutesToday / 120) * 40));
  const streakScore = Math.min(30, habitStreak * 4);
  const productivity = Math.min(100, Math.round(completionRate * 0.3 + focusScore + streakScore));

  const cards = [
    {
      label: "Tasks done",
      value: `${tasksDoneToday}`,
      hint: `of ${dailyGoal} goal`,
      icon: CheckCircle2,
    },
    {
      label: "Focus hours",
      value: `${focusHours}h`,
      hint: `${focusMinutesToday} min today`,
      icon: Timer,
    },
    {
      label: "Habit streak",
      value: `${habitStreak}`,
      hint: "best active",
      icon: Flame,
    },
    {
      label: "Productivity",
      value: `${productivity}`,
      hint: "score / 100",
      icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="glass">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-[var(--fg-muted)]">{c.label}</p>
                <Icon className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{c.value}</p>
              <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{c.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
