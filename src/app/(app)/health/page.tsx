"use client";

import { useMemo } from "react";
import { formatISO, startOfDay } from "date-fns";
import { Droplets, Footprints, Moon, Dumbbell } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function HealthPage() {
  const health = useLifeOSStore((s) => s.health);
  const upsertHealth = useLifeOSStore((s) => s.upsertHealth);
  const today = formatISO(startOfDay(new Date()), { representation: "date" });
  const entry = health.find((h) => h.date === today) ?? {
    date: today,
    steps: 0,
    waterMl: 0,
    sleepHours: 7,
    exerciseMinutes: 0,
    mood: 3,
  };

  const chart = useMemo(
    () =>
      [...health]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14)
        .map((h) => ({
          date: h.date.slice(5),
          steps: h.steps ?? 0,
          water: Math.round((h.waterMl ?? 0) / 100) / 10,
          sleep: Number((h.sleepHours ?? 0).toFixed(1)),
        })),
    [health]
  );

  const avg = (key: "steps" | "waterMl" | "sleepHours" | "exerciseMinutes") => {
    const vals = health.map((h) => h[key] ?? 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };

  const patch = (p: Partial<typeof entry>) => upsertHealth({ ...entry, ...p });

  return (
    <div className="space-y-6">
      <PageHeader title="Health" description="Steps, water, sleep, exercise — daily body OS." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Footprints className="h-4 w-4" /> Steps</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">{entry.steps ?? 0}</p>
            <input type="range" min={0} max={15000} value={entry.steps ?? 0} onChange={(e) => patch({ steps: Number(e.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
            <Progress value={Math.min(100, ((entry.steps ?? 0) / 10000) * 100)} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Droplets className="h-4 w-4" /> Water (ml)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">{entry.waterMl ?? 0}</p>
            <input type="range" min={0} max={4000} step={100} value={entry.waterMl ?? 0} onChange={(e) => patch({ waterMl: Number(e.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
            <Progress value={Math.min(100, ((entry.waterMl ?? 0) / 2500) * 100)} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Moon className="h-4 w-4" /> Sleep (h)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">{entry.sleepHours ?? 0}</p>
            <input type="range" min={0} max={12} step={0.5} value={entry.sleepHours ?? 0} onChange={(e) => patch({ sleepHours: Number(e.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Dumbbell className="h-4 w-4" /> Exercise (min)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">{entry.exerciseMinutes ?? 0}</p>
            <input type="range" min={0} max={120} value={entry.exerciseMinutes ?? 0} onChange={(e) => patch({ exerciseMinutes: Number(e.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass"><CardContent className="p-5"><p className="text-sm text-[var(--fg-muted)]">Avg steps</p><p className="text-xl font-semibold">{avg("steps").toLocaleString()}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-5"><p className="text-sm text-[var(--fg-muted)]">Avg water</p><p className="text-xl font-semibold">{avg("waterMl")} ml</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-5"><p className="text-sm text-[var(--fg-muted)]">Avg sleep</p><p className="text-xl font-semibold">{(avg("sleepHours"))} h</p></CardContent></Card>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle>14-day trends</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--fg-muted)" fontSize={11} />
              <YAxis stroke="var(--fg-muted)" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="steps" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
