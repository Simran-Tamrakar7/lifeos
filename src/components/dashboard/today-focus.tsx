"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function TodayFocus() {
  const todayFocus = useLifeOSStore((s) => s.todayFocus);
  const setTodayFocus = useLifeOSStore((s) => s.setTodayFocus);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? todayFocus ?? "";

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[var(--accent)]" />
          Today&apos;s focus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setTodayFocus(value.trim());
            setDraft(null);
          }}
          placeholder="What would make today a win?"
          className="min-h-[72px] resize-none border-transparent bg-[var(--surface-2)] focus-visible:border-[var(--border)]"
          rows={2}
        />
      </CardContent>
    </Card>
  );
}
