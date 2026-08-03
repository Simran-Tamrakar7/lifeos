"use client";

import { Flame, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function StreaksXp() {
  const xp = useLifeOSStore((s) => s.xp);
  const level = useLifeOSStore((s) => s.level);
  const dailyStreak = useLifeOSStore((s) => s.dailyStreak);
  const xpInLevel = xp % 200;
  const progress = (xpInLevel / 200) * 100;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--accent)]" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] font-display text-lg font-semibold text-[var(--accent)]">
              {level}
            </div>
            <div>
              <p className="text-sm font-medium">Level {level}</p>
              <p className="text-xs text-[var(--fg-muted)]">{xp} XP total</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-3 py-1.5 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{dailyStreak}</span>
            <span className="text-[var(--fg-muted)]">day streak</span>
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--fg-muted)]">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Next level
            </span>
            <span>
              {xpInLevel} / 200 XP
            </span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  );
}
