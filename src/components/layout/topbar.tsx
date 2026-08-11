"use client";

import { Search, Moon, Sun, Command, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function TopBar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const { setTheme } = useTheme();
  const name = useLifeOSStore((s) => s.settings.name);
  const streak = useLifeOSStore((s) => s.dailyStreak);
  const daylightMode = useLifeOSStore((s) => s.settings.daylightMode);
  const updateSettings = useLifeOSStore((s) => s.updateSettings);

  const toggleDaylight = () => {
    const next = !daylightMode;
    updateSettings({ daylightMode: next, theme: next ? "light" : "dark" });
    setTheme(next ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--glass)] px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenCommand}
        className="flex max-w-xl flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg-muted)] transition hover:border-[var(--accent)]/40"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or jump…</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-xs text-[var(--fg-muted)] md:inline">
          🔥 {streak} day streak
        </span>
        <Button variant="ghost" size="icon" onClick={onOpenCommand} aria-label="Quick capture">
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={daylightMode ? "Switch to ink navy" : "Switch to daylight"}
          onClick={toggleDaylight}
        >
          {daylightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
          {name.slice(0, 1)}
        </div>
      </div>
    </header>
  );
}
