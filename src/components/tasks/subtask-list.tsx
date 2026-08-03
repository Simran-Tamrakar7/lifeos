"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Subtask } from "@/types";

export function SubtaskList({
  taskId,
  subtasks,
  depth = 0,
  onToggle,
}: {
  taskId: string;
  subtasks: Subtask[];
  depth?: number;
  onToggle: (taskId: string, subtaskId: string) => void;
}) {
  if (!subtasks.length) return null;

  return (
    <ul className={cn("mt-2 space-y-1.5", depth > 0 && "ml-5 border-l border-[var(--border)] pl-3")}>
      {subtasks.map((st) => (
        <li key={st.id}>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={st.completed}
              onCheckedChange={() => onToggle(taskId, st.id)}
              className="mt-0.5"
            />
            <span className={cn(st.completed && "text-[var(--fg-muted)] line-through")}>
              {st.title}
            </span>
          </label>
          {st.subtasks && st.subtasks.length > 0 && (
            <SubtaskList
              taskId={taskId}
              subtasks={st.subtasks}
              depth={depth + 1}
              onToggle={onToggle}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
