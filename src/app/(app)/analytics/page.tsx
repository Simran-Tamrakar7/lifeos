"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { SlidersHorizontal } from "lucide-react";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const COLORS = ["#5C7A99", "#6B8F71", "#C9A227", "#7A5C74", "#B5533C"];

const VIS_KEY = "lifeos:analytics-visibility";

type VisKey =
  | "completedWeek"
  | "streak"
  | "openTasks"
  | "completedAll"
  | "busiest"
  | "overview"
  | "taskChart"
  | "focusChart"
  | "habitChart"
  | "categoryChart";

type Visibility = Record<VisKey, boolean>;

const DEFAULT_VIS: Visibility = {
  completedWeek: true,
  streak: true,
  openTasks: true,
  completedAll: true,
  busiest: true,
  overview: true,
  taskChart: true,
  focusChart: true,
  habitChart: true,
  categoryChart: true,
};

const VIS_LABELS: { key: VisKey; label: string; group: string }[] = [
  { key: "completedWeek", label: "Completed this week", group: "Stats" },
  { key: "streak", label: "Daily streak", group: "Stats" },
  { key: "openTasks", label: "Open tasks", group: "Stats" },
  { key: "completedAll", label: "Completed (all time)", group: "Stats" },
  { key: "busiest", label: "Busiest category", group: "Stats" },
  { key: "overview", label: "Overview cards", group: "LifeOS" },
  { key: "taskChart", label: "Tasks completed chart", group: "LifeOS" },
  { key: "focusChart", label: "Focus hours chart", group: "LifeOS" },
  { key: "habitChart", label: "Habit check-ins chart", group: "LifeOS" },
  { key: "categoryChart", label: "Task categories chart", group: "LifeOS" },
];

function loadVisibility(): Visibility {
  if (typeof window === "undefined") return DEFAULT_VIS;
  try {
    const raw = localStorage.getItem(VIS_KEY);
    if (!raw) return DEFAULT_VIS;
    return { ...DEFAULT_VIS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VIS;
  }
}

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
  const [vis, setVis] = useState<Visibility>(DEFAULT_VIS);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const days = range === "week" ? 7 : 30;

  useEffect(() => {
    setVis(loadVisibility());
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [panelOpen]);

  const setVisKey = (key: VisKey, on: boolean) => {
    setVis((prev) => {
      const next = { ...prev, [key]: on };
      localStorage.setItem(VIS_KEY, JSON.stringify(next));
      return next;
    });
  };

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

  const showAnyStatCard =
    vis.completedWeek || vis.streak || vis.openTasks || vis.completedAll;
  const showAnyChart =
    vis.taskChart || vis.focusChart || vis.habitChart || vis.categoryChart;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Productivity trends across tasks, focus, habits, and goals."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative" ref={panelRef}>
              <Button
                size="icon"
                variant="secondary"
                aria-label="Toggle visible analytics"
                aria-expanded={panelOpen}
                onClick={() => setPanelOpen((o) => !o)}
              >
                {/* ponytail: Lucide = FA fa-sliders */}
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
              </Button>
              {panelOpen && (
                <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]">
                  <p className="mb-3 font-display text-sm font-semibold">Show on this page</p>
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {VIS_LABELS.map((item, i) => {
                      const prev = VIS_LABELS[i - 1];
                      return (
                        <div key={item.key}>
                          {(!prev || prev.group !== item.group) && (
                            <p className="mb-1 mt-2 font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)] first:mt-0">
                              {item.group}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-sm">
                            <span className="text-[var(--fg)]">{item.label}</span>
                            <Switch
                              checked={vis[item.key]}
                              onCheckedChange={(on) => setVisKey(item.key, on)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
          <h2 className="font-display text-3xl font-semibold tracking-tight">Stats</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            A quiet look at how the week is going.
          </p>
        </div>
        {showAnyStatCard && (
          <div className="grid gap-4 sm:grid-cols-2">
            {vis.completedWeek && (
              <StatCard label="Completed this week" value={String(completedThisWeek)} />
            )}
            {vis.streak && (
              <StatCard
                label="Daily streak"
                value={`${dailyStreak} day${dailyStreak === 1 ? "" : "s"}`}
              />
            )}
            {vis.openTasks && <StatCard label="Open tasks" value={String(openTasks)} />}
            {vis.completedAll && (
              <StatCard label="Completed (all time)" value={String(completedAll)} />
            )}
          </div>
        )}
        {vis.busiest && (
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
        )}
      </section>

      {vis.overview && (
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
      )}

      {showAnyChart && (
        <div className="grid gap-4 lg:grid-cols-2">
          {vis.taskChart && (
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
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      stroke="var(--accent)"
                      fill="url(#gTasks)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {vis.focusChart && (
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
          )}

          {vis.habitChart && (
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
          )}

          {vis.categoryChart && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display">Task categories</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={85}
                      label
                    >
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
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
