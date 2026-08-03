"use client";

import { Frown, Meh, Smile, SmilePlus, Laugh } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

const MOODS = [
  { value: 1, label: "Low", Icon: Frown },
  { value: 2, label: "Meh", Icon: Meh },
  { value: 3, label: "Okay", Icon: Smile },
  { value: 4, label: "Good", Icon: SmilePlus },
  { value: 5, label: "Great", Icon: Laugh },
] as const;

export function MoodSelector() {
  const todayMood = useLifeOSStore((s) => s.todayMood);
  const setTodayMood = useLifeOSStore((s) => s.setTodayMood);

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Mood</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between gap-1">
          {MOODS.map(({ value, label, Icon }) => {
            const active = todayMood === value;
            return (
              <button
                key={value}
                type="button"
                title={label}
                onClick={() => {
                  setTodayMood(value);
                  toast.success(`Mood set to ${label}`);
                }}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
