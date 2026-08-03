"use client";

import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import type { AccentColor, ThemeMode } from "@/types";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ACCENTS: AccentColor[] = ["blue", "violet", "emerald", "rose", "amber", "cyan", "orange"];

export default function SettingsPage() {
  const settings = useLifeOSStore((s) => s.settings);
  const updateSettings = useLifeOSStore((s) => s.updateSettings);
  const exportData = useLifeOSStore((s) => s.exportData);
  const importData = useLifeOSStore((s) => s.importData);
  const resetData = useLifeOSStore((s) => s.resetData);
  const achievements = useLifeOSStore((s) => s.achievements);
  const xp = useLifeOSStore((s) => s.xp);
  const level = useLifeOSStore((s) => s.level);
  const { setTheme } = useTheme();

  const setThemeMode = (theme: ThemeMode) => {
    updateSettings({ theme });
    setTheme(theme);
  };

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    if (importData(text)) toast.success("Import successful");
    else toast.error("Invalid backup file");
  };

  const xpInLevel = xp % 200;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Theme, profile, data, and shortcuts." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Local identity — Supabase auth later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="Name" />
            <Input value={settings.email} onChange={(e) => updateSettings({ email: e.target.value })} placeholder="Email" />
            <p className="text-xs text-[var(--fg-muted)]">Timezone: {settings.timezone}</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["light", "dark", "system"] as ThemeMode[]).map((t) => (
                <Button key={t} size="sm" variant={settings.theme === t ? "default" : "secondary"} onClick={() => setThemeMode(t)} className="capitalize">
                  {t}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => {
                const colors: Record<AccentColor, string> = {
                  blue: "#2563eb",
                  violet: "#7c3aed",
                  emerald: "#059669",
                  rose: "#e11d48",
                  amber: "#d97706",
                  cyan: "#0891b2",
                  orange: "#ea580c",
                };
                return (
                  <button
                    key={a}
                    type="button"
                    aria-label={a}
                    onClick={() => updateSettings({ accent: a })}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg)] ${settings.accent === a ? "ring-[var(--fg)]" : "ring-transparent"}`}
                    style={{ background: colors[a] }}
                  />
                );
              })}
            </div>
            <p className="text-xs text-[var(--fg-muted)]">Accent: {settings.accent}</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Focus defaults</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between text-sm">
              Focus minutes
              <Input className="w-24" type="number" value={settings.focusMinutes} onChange={(e) => updateSettings({ focusMinutes: Number(e.target.value) || 25 })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              Break minutes
              <Input className="w-24" type="number" value={settings.breakMinutes} onChange={(e) => updateSettings({ breakMinutes: Number(e.target.value) || 5 })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              Daily task goal
              <Input className="w-24" type="number" value={settings.dailyGoalTasks} onChange={(e) => updateSettings({ dailyGoalTasks: Number(e.target.value) || 5 })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              Notifications
              <Switch checked={settings.notifications} onCheckedChange={(v) => updateSettings({ notifications: v })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              Compact mode
              <Switch checked={settings.compactMode} onCheckedChange={(v) => updateSettings({ compactMode: v })} />
            </label>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Data</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={download}>Export JSON</Button>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 h-10 text-sm font-medium hover:bg-[var(--surface-3)]">
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onImport(f);
                }}
              />
            </label>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Reset all LifeOS data to demo seed?")) {
                  resetData();
                  toast.message("Reset to seed data");
                }
              }}
            >
              Reset
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Shortcuts</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--fg-muted)]">
            <p><kbd className="rounded border border-[var(--border)] px-1.5">⌘/Ctrl</kbd> + <kbd className="rounded border border-[var(--border)] px-1.5">K</kbd> Command palette / capture</p>
            <p>Konami code unlocks a secret achievement</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>XP & Achievements</CardTitle>
            <CardDescription>Level {level} · {xp} XP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(xpInLevel / 200) * 100} />
            <div className="flex flex-wrap gap-2">
              {achievements.map((a) => (
                <Badge key={a.id} variant={a.unlockedAt ? "default" : "outline"} title={a.description}>
                  {a.icon} {a.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
