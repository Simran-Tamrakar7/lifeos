"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
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
import { INK_PALETTE } from "@/lib/ink";

const ACCENTS: AccentColor[] = [
  "brass",
  "blue",
  "violet",
  "emerald",
  "rose",
  "amber",
  "cyan",
  "orange",
  "plum",
];

const ACCENT_HEX: Record<AccentColor, string> = {
  brass: "#C9A227",
  blue: "#5C7A99",
  violet: "#7c3aed",
  emerald: "#6B8F71",
  rose: "#B5533C",
  amber: "#A8842C",
  cyan: "#4E7A72",
  orange: "#B5533C",
  plum: "#7A5C74",
};

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

  useEffect(() => {
    document.documentElement.classList.toggle("daylight", !!settings.daylightMode);
    document.documentElement.classList.toggle("serif-display", settings.serifDisplay !== false);
    document.documentElement.classList.toggle("reduce-motion", !!settings.reducedMotion);
    document.documentElement.classList.toggle("high-contrast", !!settings.highContrast);
  }, [settings.daylightMode, settings.serifDisplay, settings.reducedMotion, settings.highContrast]);

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
      <PageHeader
        title="Settings"
        description="Ledger appearance, profile, data, and shortcuts."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">Profile</CardTitle>
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
            <CardTitle className="font-display">Appearance</CardTitle>
            <CardDescription>Fonts, ink accents, and display density.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Theme</p>
              <div className="flex flex-wrap gap-2">
                {(["light", "dark", "system"] as ThemeMode[]).map((t) => (
                  <Button key={t} size="sm" variant={settings.theme === t ? "default" : "secondary"} onClick={() => setThemeMode(t)} className="capitalize">
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">Daylight mode</p>
                <p className="text-xs text-[var(--fg-muted)]">Warm paper cream instead of cool light</p>
              </div>
              <Switch
                checked={!!settings.daylightMode}
                onCheckedChange={(v) => {
                  updateSettings({ daylightMode: v });
                  if (v) setThemeMode("light");
                }}
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">Serif display</p>
                <p className="text-xs text-[var(--fg-muted)]">Fraunces headings (Ledger look)</p>
              </div>
              <Switch
                checked={settings.serifDisplay !== false}
                onCheckedChange={(v) => updateSettings({ serifDisplay: v })}
              />
            </label>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Accent</p>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-label={a}
                    onClick={() => updateSettings({ accent: a })}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg)] ${settings.accent === a ? "ring-[var(--fg)]" : "ring-transparent"}`}
                    style={{ background: ACCENT_HEX[a] }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs capitalize text-[var(--fg-muted)]">Accent: {settings.accent}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Ink palette</p>
              <div className="flex flex-wrap gap-2">
                {INK_PALETTE.map((ink) => (
                  <div key={ink.hex} className="flex flex-col items-center gap-1">
                    <span className="h-6 w-6 rounded-full" style={{ background: ink.hex }} title={ink.name} />
                    <span className="text-[9px] text-[var(--fg-muted)]">{ink.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--fg-muted)]">Used by categories across notes, tasks, and meetings.</p>
            </div>

            <label className="flex items-center justify-between text-sm">
              Compact mode
              <Switch checked={settings.compactMode} onCheckedChange={(v) => updateSettings({ compactMode: v })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              Reduced motion
              <Switch checked={!!settings.reducedMotion} onCheckedChange={(v) => updateSettings({ reducedMotion: v })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              High contrast
              <Switch checked={!!settings.highContrast} onCheckedChange={(v) => updateSettings({ highContrast: v })} />
            </label>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="font-display">Focus defaults</CardTitle></CardHeader>
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
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="font-display">Data</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="font-display">Shortcuts</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--fg-muted)]">
            <p><kbd className="rounded border border-[var(--border)] px-1.5">⌘/Ctrl</kbd> + <kbd className="rounded border border-[var(--border)] px-1.5">K</kbd> Command palette / capture</p>
            <p>Konami code unlocks a secret achievement</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">XP & Achievements</CardTitle>
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
