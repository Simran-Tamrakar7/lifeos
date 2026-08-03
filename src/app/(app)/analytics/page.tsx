"use client";

import { useMemo, useState } from "react";
import { subDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"];

export default function AnalyticsPage() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const focusSessions = useLifeOSStore((s) => s.focusSessions);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const meetings = useLifeOSStore((s) => s.meetings);
  const [range, setRange] = useState<"week" | "month">("week");
  const days = range === "week" ? 7 : 30;

  const trend = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = startOfDay(subDays(new Date(), days - 1 - i));
      const done = tasks.filter((t) => t.status === "done" && t.updatedAt && isSameDay(parseISO(t.updatedAt), d)).length;
      const focus = focusSessions
        .filter((s) => isSameDay(parseISO(s.completedAt), d))
        .reduce((a, s) => a + s.durationMinutes, 0);
      const habitHits = habits.filter((h) =>
        h.completions.includes(format(d, "yyyy-MM-dd"))
      ).length;
      return {
        day: format(d, "MMM d"),
        tasks: done,
        focus: Math.round(focus / 60 * 10) / 10,
        habits: habitHits,
      };
    });
  }, [tasks, focusSessions, habits, days]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      const c = t.category || "Uncategorized";
      map.set(c, (map.get(c) || 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const tasksDone = tasks.filter((t) => t.status === "done").length;
  const focusHours = Math.round(focusSessions.reduce((a, s) => a + s.durationMinutes, 0) / 60 * 10) / 10;
  const habitScore = habits.length
    ? Math.round(habits.reduce((a, h) => a + Math.min(100, h.streak * 10), 0) / habits.length)
    : 0;
  const goalAvg = goals.length
    ? Math.round(goals.reduce((a, g) => a + (g.progress / g.target) * 100, 0) / goals.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Productivity trends across tasks, focus, habits, and goals."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant={range === "week" ? "default" : "secondary"} onClick={() => setRange("week")}>Weekly</Button>
            <Button size="sm" variant={range === "month" ? "default" : "secondary"} onClick={() => setRange("month")}>Monthly</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Tasks done", tasksDone],
          ["Focus hours", focusHours],
          ["Habit score", habitScore],
          ["Goal avg %", goalAvg],
          ["Meetings", meetings.length],
        ].map(([label, value]) => (
          <Card key={label as string} className="glass">
            <CardContent className="p-5">
              <p className="text-sm text-[var(--fg-muted)]">{label}</p>
              <p className="font-display text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle>Tasks completed</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Focus hours</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--fg-muted)" fontSize={11} />
                <YAxis stroke="var(--fg-muted)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="focus" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Habit check-ins</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--fg-muted)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--fg-muted)" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="habits" stroke="#8b5cf6" fill="#8b5cf633" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Task categories</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" outerRadius={85} label>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
