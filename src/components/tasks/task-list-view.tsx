"use client";

import { format, parseISO } from "date-fns";
import { Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PriorityBadge } from "./priority-badge";
import { SubtaskList } from "./subtask-list";
import type { Task, TaskStatus } from "@/types";
import { useState } from "react";

const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  backlog: "todo",
  todo: "in_progress",
  in_progress: "review",
  review: "done",
};

export function TaskListView({ tasks }: { tasks: Task[] }) {
  const moveTask = useLifeOSStore((s) => s.moveTask);
  const deleteTask = useLifeOSStore((s) => s.deleteTask);
  const toggleSubtask = useLifeOSStore((s) => s.toggleSubtask);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const done = task.status === "done";
        const open = expanded[task.id] ?? false;
        return (
          <li
            key={task.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-4 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={done}
                onCheckedChange={(checked) => {
                  moveTask(task.id, checked ? "done" : "todo");
                  toast.success(checked ? "Marked done" : "Reopened");
                }}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn("font-medium", done && "text-[var(--fg-muted)] line-through")}>
                    {task.title}
                  </p>
                  <PriorityBadge priority={task.priority} />
                  <Badge variant="secondary">{task.status.replaceAll("_", " ")}</Badge>
                </div>
                {task.description && (
                  <p className="mt-1 text-sm text-[var(--fg-muted)] line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--fg-muted)]">
                  {task.dueDate && <span>Due {format(parseISO(task.dueDate), "MMM d, h:mm a")}</span>}
                  {task.meetingId && (
                    <a href="/meetings" className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[var(--accent)] hover:underline">
                      From meeting
                    </a>
                  )}
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                {task.subtasks.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)]"
                      onClick={() =>
                        setExpanded((e) => ({ ...e, [task.id]: !open }))
                      }
                    >
                      <ChevronRight
                        className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
                      />
                      {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}{" "}
                      subtasks
                    </button>
                    {open && (
                      <SubtaskList
                        taskId={task.id}
                        subtasks={task.subtasks}
                        onToggle={toggleSubtask}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {NEXT[task.status] && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = NEXT[task.status]!;
                      moveTask(task.id, next);
                      toast.success(`Moved to ${next.replaceAll("_", " ")}`);
                    }}
                  >
                    Advance
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-[var(--fg-muted)] hover:text-rose-500"
                  onClick={() => {
                    deleteTask(task.id);
                    toast.success("Task deleted");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
