"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { toast } from "sonner";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const unlockAchievement = useLifeOSStore((s) => s.unlockAchievement);
  const addXp = useLifeOSStore((s) => s.addXp);

  useEffect(() => {
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[idx] || (KONAMI[idx] === "b" && key === "b") || (KONAMI[idx] === "a" && key === "a")) {
        idx += 1;
        if (idx === KONAMI.length) {
          unlockAchievement("ach_konami");
          addXp(500);
          toast.success("🎮 Konami unlocked! +500 XP");
          document.body.classList.add("animate-shimmer");
          setTimeout(() => document.body.classList.remove("animate-shimmer"), 2000);
          idx = 0;
        }
      } else {
        idx = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlockAchievement, addXp]);

  return (
    <div className="flex min-h-screen">
      <div className="lifeos-bg" aria-hidden />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenCommand={() => setCmdOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
