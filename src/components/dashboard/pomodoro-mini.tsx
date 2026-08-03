"use client";

import { useCallback, useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PomodoroMini() {
  const focusMinutes = useLifeOSStore((s) => s.settings.focusMinutes);
  const completeFocusSession = useLifeOSStore((s) => s.completeFocusSession);
  const totalSeconds = focusMinutes * 60;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(false);
  const display = active ? remaining : totalSeconds;

  const finish = useCallback(() => {
    setRunning(false);
    setActive(false);
    setRemaining(totalSeconds);
    completeFocusSession({ mode: "pomodoro", durationMinutes: focusMinutes });
    toast.success(`Pomodoro complete · +${focusMinutes} XP`);
  }, [completeFocusSession, focusMinutes, totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          queueMicrotask(finish);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, finish]);

  const progress = ((totalSeconds - display) / totalSeconds) * 100;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-[var(--accent)]" />
          Pomodoro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-display text-center text-4xl font-semibold tabular-nums tracking-tight">
          {formatTime(display)}
        </p>
        <Progress value={progress} />
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant={running ? "secondary" : "default"}
            onClick={() => {
              if (!active) {
                setRemaining(totalSeconds);
                setActive(true);
              }
              setRunning((v) => !v);
            }}
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRunning(false);
              setActive(false);
              setRemaining(totalSeconds);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
