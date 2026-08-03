"use client";

import { useMemo, useState } from "react";
import { formatISO, startOfDay, subDays, eachDayOfInterval } from "date-fns";
import { Repeat, Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function HabitsPage() {
  const habits = useLifeOSStore((s) => s.habits);
  const toggleHabitToday = useLifeOSStore((s) => s.toggleHabitToday);
  const addHabit = useLifeOSStore((s) => s.addHabit);
  const deleteHabit = useLifeOSStore((s) => s.deleteHabit);
  const today = formatISO(startOfDay(new Date()), { representation: "date" });
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const days = useMemo(
    () => eachDayOfInterval({ start: subDays(new Date(), 83), end: new Date() }),
    []
  );

  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = formatISO(startOfDay(subDays(new Date(), 6 - i)), { representation: "date" });
      const count = habits.filter((h) => h.completions.includes(d)).length;
      return { day: d.slice(5), count };
    });
  }, [habits]);

  const create = () => {
    if (!name.trim()) return;
    addHabit({ name: name.trim() });
    setName("");
    setOpen(false);
    toast.success("Habit added");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Streaks, heatmaps, and daily compounding."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Add habit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New habit</DialogTitle></DialogHeader>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meditate" />
              <Button className="mt-3" onClick={create}>Create</Button>
            </DialogContent>
          </Dialog>
        }
      />

      {habits.length === 0 ? (
        <EmptyState icon={Repeat} title="No habits" description="Build one small daily ritual." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {habits.map((h) => {
              const done = h.completions.includes(today);
              const rate = Math.round((h.completions.filter((c) => c >= formatISO(startOfDay(subDays(new Date(), 29)), { representation: "date" })).length / 30) * 100);
              return (
                <Card key={h.id} className="glass">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: h.color }} />
                        {h.name}
                      </CardTitle>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                        <Flame className="h-3 w-3 text-orange-500" /> {h.streak} day streak · best {h.bestStreak}
                      </p>
                    </div>
                    <Button
                      variant={done ? "default" : "secondary"}
                      size="sm"
                      onClick={() => toggleHabitToday(h.id)}
                    >
                      {done ? "Done" : "Check in"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-xs text-[var(--fg-muted)]">
                      <span>30-day completion</span>
                      <span>{rate}%</span>
                    </div>
                    <Progress value={rate} />
                    <Badge variant="secondary" className="capitalize">{h.frequency}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => deleteHabit(h.id)}>Remove</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="glass">
            <CardHeader><CardTitle>Heatmap · last 12 weeks</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {days.map((d) => {
                  const key = formatISO(startOfDay(d), { representation: "date" });
                  const count = habits.filter((h) => h.completions.includes(key)).length;
                  const intensity = habits.length ? count / habits.length : 0;
                  return (
                    <div
                      key={key}
                      title={`${key}: ${count}/${habits.length}`}
                      className="h-3 w-3 rounded-sm"
                      style={{
                        background:
                          intensity === 0
                            ? "var(--surface-2)"
                            : `color-mix(in srgb, var(--accent) ${Math.round(30 + intensity * 70)}%, transparent)`,
                      }}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader><CardTitle>Weekly check-ins</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--fg-muted)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="var(--fg-muted)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
