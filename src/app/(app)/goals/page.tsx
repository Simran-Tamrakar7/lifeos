"use client";

import { useState } from "react";
import { Target, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import type { GoalCategory } from "@/types";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const CATS: GoalCategory[] = ["life", "career", "learning", "finance", "fitness", "travel", "reading", "custom"];

export default function GoalsPage() {
  const goals = useLifeOSStore((s) => s.goals);
  const addGoal = useLifeOSStore((s) => s.addGoal);
  const updateGoal = useLifeOSStore((s) => s.updateGoal);
  const deleteGoal = useLifeOSStore((s) => s.deleteGoal);
  const [filter, setFilter] = useState<GoalCategory | "all">("all");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("career");
  const [open, setOpen] = useState(false);

  const filtered = filter === "all" ? goals : goals.filter((g) => g.category === filter);

  const create = () => {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), category, progress: 0, target: 100, unit: "%" });
    setTitle("");
    setOpen(false);
    toast.success("Goal created");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Long-horizon outcomes with milestones and vision."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New goal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <select
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GoalCategory)}
                >
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Button onClick={create}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={filter === "all" ? "default" : "secondary"} onClick={() => setFilter("all")}>All</Button>
        {CATS.map((c) => (
          <Button key={c} size="sm" variant={filter === c ? "default" : "secondary"} onClick={() => setFilter(c)} className="capitalize">
            {c}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Target} title="No goals" description="Set a destination worth chasing." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((g) => {
            const pct = Math.min(100, Math.round((g.progress / g.target) * 100));
            return (
              <Card key={g.id} className="glass">
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div>
                    <Badge className="mb-2 capitalize">{g.category}</Badge>
                    <CardTitle>{g.title}</CardTitle>
                    {g.vision && <p className="mt-1 text-sm text-[var(--fg-muted)]">{g.vision}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteGoal(g.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{g.progress} / {g.target} {g.unit}</span>
                    <span className="font-medium text-[var(--accent)]">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                  <input
                    type="range"
                    min={0}
                    max={g.target}
                    value={g.progress}
                    onChange={(e) => updateGoal(g.id, { progress: Number(e.target.value) })}
                    className="w-full accent-[var(--accent)]"
                  />
                  <div className="space-y-1">
                    {g.milestones.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={() =>
                            updateGoal(g.id, {
                              milestones: g.milestones.map((x) =>
                                x.id === m.id ? { ...x, completed: !x.completed } : x
                              ),
                            })
                          }
                        />
                        <span className={m.completed ? "line-through text-[var(--fg-muted)]" : ""}>{m.title}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
