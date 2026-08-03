"use client";

import Link from "next/link";
import { isToday, parseISO } from "date-fns";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

const priorityVariant: Record<Priority, "urgent" | "high" | "medium" | "low" | "none"> = {
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
  none: "none",
};

export function TodayTasks() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const moveTask = useLifeOSStore((s) => s.moveTask);

  const today = tasks.filter(
    (t) =>
      !t.archived &&
      t.status !== "cancelled" &&
      (t.pinned || (t.dueDate && isToday(parseISO(t.dueDate))) || t.status === "in_progress")
  );

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[var(--accent)]" />
            Today&apos;s tasks
          </CardTitle>
          <CardDescription>{today.length} on your plate</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {today.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="All clear"
            description="No tasks due today. Enjoy the breathing room."
          />
        ) : (
          <ul className="space-y-2">
            {today.map((task) => {
              const done = task.status === "done";
              return (
                <li
                  key={task.id}
                  className="flex items-start gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                >
                  <Checkbox
                    checked={done}
                    onCheckedChange={(checked) => {
                      moveTask(task.id, checked ? "done" : "todo");
                      toast.success(checked ? "Task completed" : "Task reopened");
                    }}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        done && "text-[var(--fg-muted)] line-through"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                      {task.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
