"use client";

import { formatISO, startOfDay, subDays } from "date-fns";
import { Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { cn } from "@/lib/utils";

const WEEKS = 12;
const DAYS = 7;

export function HabitHeatmap() {
  const habits = useLifeOSStore((s) => s.habits);

  const completionCount = new Map<string, number>();
  for (const h of habits) {
    for (const d of h.completions) {
      completionCount.set(d, (completionCount.get(d) ?? 0) + 1);
    }
  }

  const today = startOfDay(new Date());
  // 7 rows (Sun–Sat) × N weeks columns — oldest left, today right
  const cells: { date: string; count: number }[] = [];
  const totalDays = WEEKS * DAYS;
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const key = formatISO(d, { representation: "date" });
    cells.push({ date: key, count: completionCount.get(key) ?? 0 });
  }

  const max = Math.max(1, ...cells.map((c) => c.count));

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-[var(--accent)]" />
          Habit heatmap
        </CardTitle>
        <CardDescription>Last {WEEKS} weeks across all habits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-1">
          <div className="flex flex-col justify-between py-0.5 text-[10px] text-[var(--fg-muted)]">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={`${d}-${i}`} className="h-3 leading-3">
                {i % 2 === 1 ? d : ""}
              </span>
            ))}
          </div>
          <div
            className="grid flex-1 gap-1"
            style={{
              gridTemplateRows: `repeat(${DAYS}, 0.75rem)`,
              gridTemplateColumns: `repeat(${WEEKS}, 0.75rem)`,
              gridAutoFlow: "column",
            }}
          >
            {cells.map((cell) => {
              const intensity = cell.count / max;
              return (
                <div
                  key={cell.date}
                  title={`${cell.date}: ${cell.count} completion${cell.count === 1 ? "" : "s"}`}
                  className={cn(
                    "h-3 w-3 rounded-[3px] transition-colors",
                    cell.count === 0 && "bg-[var(--surface-2)]"
                  )}
                  style={
                    cell.count > 0
                      ? {
                          background: `color-mix(in srgb, var(--accent) ${Math.round(30 + intensity * 70)}%, transparent)`,
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[var(--fg-muted)]">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <span
              key={v}
              className="h-3 w-3 rounded-[3px]"
              style={{
                background:
                  v === 0
                    ? "var(--surface-2)"
                    : `color-mix(in srgb, var(--accent) ${Math.round(30 + v * 70)}%, transparent)`,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
