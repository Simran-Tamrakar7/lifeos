"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

const NAV = [
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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const unread = useLifeOSStore((s) => s.notifications.filter((n) => !n.read).length);
  const level = useLifeOSStore((s) => s.level);
  const xp = useLifeOSStore((s) => s.xp);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen flex-col border-r border-[var(--border)] bg-[var(--glass)] backdrop-blur-2xl transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[var(--sidebar-w)]"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/30">
          L
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-none tracking-tight">LifeOS</p>
            <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
              Lvl {level} · {xp} XP
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
              )}
              title={item.label}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-[var(--accent-soft)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="relative z-10 flex-1 truncate font-medium">{item.label}</span>
              )}
              {!collapsed && item.href === "/notifications" && unread > 0 && (
                <span className="relative z-10 rounded-md bg-[var(--accent)] px-1.5 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="m-2 flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
      </button>
    </aside>
  );
}
