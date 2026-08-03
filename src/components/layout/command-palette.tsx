"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  StickyNote,
  BookOpen,
  FolderKanban,
  Target,
  Repeat,
  Wallet,
  HeartPulse,
  FileText,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  Bug,
  Timer,
  Plus,
} from "lucide-react";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { toast } from "sonner";

const ROUTES = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/meetings", label: "Meetings", icon: Users },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai", label: "AI Assistant", icon: Sparkles },
  { href: "/qa", label: "QA Workspace", icon: Bug },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const captureTask = useLifeOSStore((s) => s.captureTask);
  const tasks = useLifeOSStore((s) => s.tasks);
  const notes = useLifeOSStore((s) => s.notes);
  const projects = useLifeOSStore((s) => s.projects);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!open) setQuery("");
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const capture = () => {
    if (!query.trim()) return;
    const task = captureTask(query);
    toast.success(`Captured: ${task.title}`);
    onOpenChange(false);
    router.push("/tasks");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <Command
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
        label="Global command palette"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
          <Plus className="h-4 w-4 text-[var(--accent)]" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Jump somewhere or capture a task… (tomorrow 3pm #work)"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--fg-muted)]"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-[var(--fg-muted)]">
            No results. Press Enter to capture as task.
          </Command.Empty>

          {query.trim() && (
            <Command.Group heading="Quick capture">
              <Command.Item
                value={`capture ${query}`}
                onSelect={capture}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm aria-selected:bg-[var(--accent-soft)]"
              >
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                Create task from “{query}”
              </Command.Item>
            </Command.Group>
          )}

          <Command.Group heading="Navigate">
            {ROUTES.map((r) => {
              const Icon = r.icon;
              return (
                <Command.Item
                  key={r.href}
                  value={r.label}
                  onSelect={() => go(r.href)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm aria-selected:bg-[var(--surface-2)]"
                >
                  <Icon className="h-4 w-4 text-[var(--fg-muted)]" />
                  {r.label}
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group heading="Tasks">
            {tasks.slice(0, 8).map((t) => (
              <Command.Item
                key={t.id}
                value={`task ${t.title}`}
                onSelect={() => go("/tasks")}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm aria-selected:bg-[var(--surface-2)]"
              >
                <CheckSquare className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="truncate">{t.title}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Notes">
            {notes.slice(0, 6).map((n) => (
              <Command.Item
                key={n.id}
                value={`note ${n.title}`}
                onSelect={() => go("/notes")}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm aria-selected:bg-[var(--surface-2)]"
              >
                <StickyNote className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="truncate">{n.title}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Projects">
            {projects.map((p) => (
              <Command.Item
                key={p.id}
                value={`project ${p.name}`}
                onSelect={() => go("/projects")}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm aria-selected:bg-[var(--surface-2)]"
              >
                <FolderKanban className="h-4 w-4 text-[var(--fg-muted)]" />
                {p.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
