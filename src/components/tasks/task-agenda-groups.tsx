"use client";

import { useMemo } from "react";
import { groupTasks, TASK_GROUP_META, type TaskGroupKey } from "@/lib/task-groups";
import { TaskListView } from "@/components/tasks/task-list-view";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import type { Task } from "@/types";

const ORDER: TaskGroupKey[] = ["today", "week", "upcoming", "nodate"];

export function TaskAgendaGroups({ tasks }: { tasks: Task[] }) {
  const weekStartsOn = useLifeOSStore((s) => s.settings.weekStartsOn ?? 1);
  const groups = useMemo(() => groupTasks(tasks, weekStartsOn), [tasks, weekStartsOn]);

  return (
    <div className="space-y-8">
      {ORDER.map((key) => {
        const list = groups[key];
        const meta = TASK_GROUP_META[key];
        return (
          <section key={key} className="space-y-3">
            <div className="flex items-baseline gap-3 ledger-rule pb-2">
              <h2 className="font-display text-xl font-semibold tracking-tight">{meta.label}</h2>
              <span className="font-mono text-xs text-[var(--fg-muted)]">{list.length}</span>
            </div>
            {list.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-4 py-8 text-center text-sm text-[var(--fg-muted)]">
                {meta.empty}
              </p>
            ) : (
              <TaskListView tasks={list} />
            )}
          </section>
        );
      })}
    </div>
  );
}
