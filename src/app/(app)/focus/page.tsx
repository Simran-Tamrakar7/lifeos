"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isToday, parseISO } from "date-fns";
import { Timer, Play, Pause, RotateCcw, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FocusPage() {
  const settings = useLifeOSStore((s) => s.settings);
  const sessions = useLifeOSStore((s) => s.focusSessions);
  const completeFocusSession = useLifeOSStore((s) => s.completeFocusSession);
  const [mode, setMode] = useState<"pomodoro" | "deep">("pomodoro");
  const duration = mode === "pomodoro" ? settings.focusMinutes * 60 : 90 * 60;
  const [left, setLeft] = useState(() =>
    (mode === "pomodoro" ? settings.focusMinutes : 90) * 60
  );
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const switchMode = (next: "pomodoro" | "deep") => {
    setMode(next);
    setRunning(false);
    setLeft((next === "pomodoro" ? settings.focusMinutes : 90) * 60);
  };
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          completeFocusSession({
            mode: mode === "pomodoro" ? "pomodoro" : "deep",
            durationMinutes: Math.round(duration / 60),
          });
          toast.success("Focus session complete!");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, completeFocusSession, mode, duration]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = Math.round(((duration - left) / duration) * 100);

  const todayMinutes = useMemo(
    () =>
      sessions
        .filter((s) => isToday(parseISO(s.completedAt)))
        .reduce((a, s) => a + s.durationMinutes, 0),
    [sessions]
  );

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-[var(--bg)] p-8" : "space-y-6"}>
      {!fullscreen && (
        <PageHeader
          title="Focus"
          description="Pomodoro and deep work — protect the block."
          actions={
            <Button variant="secondary" onClick={() => setFullscreen(true)}>
              <Maximize2 className="h-4 w-4" /> Fullscreen
            </Button>
          }
        />
      )}

      <div className={`grid gap-6 ${fullscreen ? "mx-auto max-w-2xl flex-1 content-center" : "lg:grid-cols-3"}`}>
        <Card className={`glass gradient-border ${fullscreen ? "col-span-full" : "lg:col-span-2"}`}>
          <CardHeader className="items-center">
            <Tabs value={mode} onValueChange={(v) => switchMode(v as typeof mode)}>
              <TabsList>
                <TabsTrigger value="pomodoro">Pomodoro ({settings.focusMinutes}m)</TabsTrigger>
                <TabsTrigger value="deep">Deep Focus (90m)</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div className="font-display text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl">
              {mm}:{ss}
            </div>
            <Progress value={pct} className="h-2 w-full max-w-md" />
            <div className="flex gap-2">
              <Button onClick={() => setRunning((r) => !r)}>
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "Pause" : "Start"}
              </Button>
              <Button variant="secondary" onClick={() => { setRunning(false); setLeft(duration); }}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              {fullscreen && (
                <Button variant="ghost" onClick={() => setFullscreen(false)}>Exit</Button>
              )}
            </div>
            <p className="text-sm text-[var(--fg-muted)]">Ambient sounds placeholder · Website blocker placeholder</p>
          </CardContent>
        </Card>

        {!fullscreen && (
          <div className="space-y-4">
            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-4 w-4" /> Today</CardTitle></CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-semibold">{todayMinutes}m</p>
                <p className="text-sm text-[var(--fg-muted)]">focused</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader><CardTitle>Recent sessions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {sessions.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <Badge variant="secondary" className="capitalize">{s.mode}</Badge>
                    <span>{s.durationMinutes}m</span>
                    <span className="text-[var(--fg-muted)]">{format(parseISO(s.completedAt), "MMM d · HH:mm")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
