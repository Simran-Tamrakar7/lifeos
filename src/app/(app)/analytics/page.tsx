"use client";

import { useMemo, useState } from "react";
import {
  subDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
  isWithinInterval,
} from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COLORS = ["#5C7A99", "#6B8F71", "#C9A227", "#7A5C74", "#B5533C"];

export default function AnalyticsPage() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const focusSessions = useLifeOSStore((s) => s.focusSessions);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const meetings = useLifeOSStore((s) => s.meetings);
  const storeCategories = useLifeOSStore((s) => s.categories);
  const dailyStreak = useLifeOSStore((s) => s.dailyStreak);
  const weekStartsOn = useLifeOSStore((s) => s.settings.weekStartsOn ?? 1);
  const [range, setRange] = useState<"week" | "month">("week");
  const days = range === "week" ? 7 : 30;

  const weekStart = startOfWeek(new Date(), { weekStartsOn });
  const completedThisWeek = tasks.filter(
    (t) =>
      t.status === "done" &&
      t.updatedAt &&
      isWithinInterval(parseISO(t.updatedAt), {
        start: weekStart,
        end: new Date(),
      })
  ).length;
  const openTasks = tasks.filter(
    (t) => !t.archived && t.status !== "done" && t.status !== "cancelled"
  ).length;
  const completedAll = tasks.filter((t) => t.status === "done").length;

  const busiest = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (!t.categoryId) continue;
      counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
    }
    let bestId: string | null = null;
    let bestCount = 0;
    counts.forEach((count, id) => {
      if (count > bestCount) {
        bestId = id;
        bestCount = count;
      }
    });
    if (!bestId) return null;
    const cat = storeCategories.find((c) => c.id === bestId);
    return {
      name: cat?.name ?? "Unknown",
      color: cat?.color ?? "#C9A227",
      count: bestCount,
    };
  }, [tasks, storeCategories]);

  const trend = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = startOfDay(subDays(new Date(), days - 1 - i));
      const done = tasks.filter(
        (t) => t.status === "done" && t.updatedAt && isSameDay(parseISO(t.updatedAt), d)
      ).length;
      const focus = focusSessions
        .filter((s) => isSameDay(parseISO(s.completedAt), d))
        .reduce((a, s) => a + s.durationMinutes, 0);
      const habitHits = habits.filter((h) =>
        h.completions.includes(format(d, "yyyy-MM-dd"))
      ).length;
      return {
        day: format(d, "MMM d"),
        tasks: done,
        focus: Math.round((focus / 60) * 10) / 10,
        habits: habitHits,
      };
    });
  }, [tasks, focusSessions, habits, days]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      const cat = storeCategories.find((c) => c.id === t.categoryId);
      const name = cat?.name || t.category || "Uncategorized";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [tasks, storeCategories]);

  const focusHours =
    Math.round(
      (focusSessions.reduce((a, s) => a + s.durationMinutes, 0) / 60) * 10
    ) / 10;
  const habitScore = habits.length
    ? Math.round(
        habits.reduce((a, h) => a + Math.min(100, h.streak * 10), 0) / habits.length
      )
    : 0;
  const goalAvg = goals.length
    ? Math.round(
        goals.reduce((a, g) => a + (g.progress / g.target) * 100, 0) / goals.length
      )
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Productivity trends across tasks, focus, habits, and goals."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={range === "week" ? "default" : "secondary"}
              onClick={() => setRange("week")}
            >
              Weekly
            </Button>
            <Button
              size="sm"
              variant={range === "month" ? "default" : "secondary"}
              onClick={() => setRange("month")}
            >
              Monthly
            </Button>
          </div>
        }
      />

      {/* Ledger-style quiet stats */}
      <section className="max-w-xl space-y-5">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Stats</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            A quiet look at how the week is going.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Completed this week" value={String(completedThisWeek)} />
          <StatCard
            label="Daily streak"
            value={`${dailyStreak} day${dailyStreak === 1 ? "" : "s"}`}
          />
          <StatCard label="Open tasks" value={String(openTasks)} />
          <StatCard label="Completed (all time)" value={String(completedAll)} />
        </div>
        <div className="ledger-rule py-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-[var(--fg-muted)]">
            Busiest category
          </p>
          {busiest ? (
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: busiest.color }}
              />
              <span className="font-display text-xl">{busiest.name}</span>
              <span className="font-mono text-sm text-[var(--fg-muted)]">
                {busiest.count} tasks
              </span>
            </div>
          ) : (
            <p className="text-sm text-[var(--fg-muted)]">
              Assign categories to tasks and this will fill in.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Tasks done", completedAll],
          ["Focus hours", focusHours],
          ["Habit score", habitScore],
          ["Goal avg %", goalAvg],
          ["Meetings", meetings.length],
        ].map(([label, value]) => (
          <Card key={label as string} className="glass">
            <CardContent className="p-5">
              <p className="text-sm text-[var(--fg-muted)]">{label}</p>
              <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">Tasks completed</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--fg-muted)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--fg-muted)" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="tasks" stroke="var(--accent)" fill="url(#gTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">Focus hours</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--fg-muted)" fontSize={11} />
                <YAxis stroke="var(--fg-muted)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="focus" fill="#6B8F71" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">Habit check-ins</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--fg-muted)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--fg-muted)" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="habits" stroke="#7A5C74" fill="#7A5C7433" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">Task categories</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" outerRadius={85} label>
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--fg-muted)]">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-[var(--accent)]">{value}</p>
    </div>
  );
}
