"use client";

import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PriorityBadge } from "./priority-badge";
import type { Task, TaskStatus } from "@/types";

const STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done", "cancelled"];

export function TaskTableView({ tasks }: { tasks: Task[] }) {
  const moveTask = useLifeOSStore((s) => s.moveTask);
  const deleteTask = useLifeOSStore((s) => s.deleteTask);
  const updateTask = useLifeOSStore((s) => s.updateTask);

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-xs text-[var(--fg-muted)]">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Tags</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/40"
            >
              <td className="px-4 py-3">
                <input
                  className="w-full bg-transparent font-medium outline-none focus:text-[var(--accent)]"
                  defaultValue={task.title}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== task.title) updateTask(task.id, { title: v });
                  }}
                />
                {task.subtasks.length > 0 && (
                  <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                    {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}{" "}
                    subtasks
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs"
                  value={task.status}
                  onChange={(e) => {
                    moveTask(task.id, e.target.value as TaskStatus);
                    toast.success("Status updated");
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {task.tags.length === 0 && (
                    <span className="text-xs text-[var(--fg-muted)]">—</span>
                  )}
                  {task.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--fg-muted)] whitespace-nowrap">
                {task.dueDate ? format(parseISO(task.dueDate), "MMM d") : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-[var(--fg-muted)] hover:text-rose-500"
                  onClick={() => {
                    deleteTask(task.id);
                    toast.success("Task deleted");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
