"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Search } from "lucide-react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/page";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { TaskCapture } from "@/components/tasks/task-capture";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskKanbanView } from "@/components/tasks/task-kanban-view";
import { TaskTableView } from "@/components/tasks/task-table-view";
import type { Priority, TaskStatus } from "@/types";

const STATUS_FILTERS: Array<"all" | TaskStatus> = [
  "all",
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];

const PRIORITY_FILTERS: Array<"all" | Priority> = [
  "all",
  "urgent",
  "high",
  "medium",
  "low",
  "none",
];

export default function TasksPage() {
  const hydrated = useLifeOSStore((s) => s.hydrated);
  const tasks = useLifeOSStore((s) => s.tasks);
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [tag, setTag] = useState<string>("all");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) t.tags.forEach((x) => set.add(x));
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (t.archived) return false;
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (tag !== "all" && !t.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        t.tags.some((x) => x.toLowerCase().includes(q))
      );
    });
  }, [tasks, query, status, priority, tag]);

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Tasks"
        description="Capture, organize, and ship — list, board, or table."
        actions={<AddTaskDialog />}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <TaskCapture />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks… (press / to focus)"
              className="pl-9"
              aria-label="Search tasks"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | TaskStatus)}
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "all" | Priority)}
              aria-label="Filter by priority"
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All priorities" : p}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              aria-label="Filter by tag"
            >
              <option value="all">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <Badge variant="secondary">{filtered.length} shown</Badge>
          <span>of {tasks.filter((t) => !t.archived).length} tasks</span>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            {filtered.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks match"
                description="Try clearing filters or capture a new task above."
              />
            ) : (
              <TaskListView tasks={filtered} />
            )}
          </TabsContent>
          <TabsContent value="kanban">
            {filtered.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="Board is empty"
                description="Add a task or loosen your filters."
              />
            ) : (
              <TaskKanbanView tasks={filtered} />
            )}
          </TabsContent>
          <TabsContent value="table">
            {filtered.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="Nothing to show"
                description="No rows match the current filters."
              />
            ) : (
              <TaskTableView tasks={filtered} />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
