import {
  formatISO,
  startOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  isBefore,
  isAfter,
} from "date-fns";
import type { Task } from "@/types";

export type TaskGroupKey = "today" | "week" | "upcoming" | "nodate" | "completed";

export const TASK_GROUP_META: Record<
  TaskGroupKey,
  { label: string; empty: string }
> = {
  today: {
    label: "Today",
    empty: "Nothing due today. Add a task above, or drag one here from another group.",
  },
  week: {
    label: "This Week",
    empty: "This week is clear. Drop a task here to schedule it mid-week.",
  },
  upcoming: {
    label: "Upcoming",
    empty: "No future tasks yet. Give something a due date further out.",
  },
  nodate: {
    label: "No Date",
    empty: "Every task has a date — or you haven't captured any undated ones yet.",
  },
  completed: {
    label: "Completed",
    empty: "No completed tasks in this view.",
  },
};

export function groupTasks(tasks: Task[]): Record<TaskGroupKey, Task[]> {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const todayStr = formatISO(today, { representation: "date" });

  const groups: Record<TaskGroupKey, Task[]> = {
    today: [],
    week: [],
    upcoming: [],
    nodate: [],
    completed: [],
  };

  for (const task of tasks) {
    if (task.archived) continue;
    if (task.status === "done" || task.status === "cancelled") {
      groups.completed.push(task);
      continue;
    }
    if (!task.dueDate) {
      groups.nodate.push(task);
      continue;
    }
    const due = startOfDay(parseISO(task.dueDate));
    const dueStr = formatISO(due, { representation: "date" });
    if (dueStr <= todayStr) {
      groups.today.push(task);
    } else if (isWithinInterval(due, { start: weekStart, end: weekEnd })) {
      groups.week.push(task);
    } else if (isAfter(due, weekEnd)) {
      groups.upcoming.push(task);
    } else if (isBefore(due, today)) {
      groups.today.push(task);
    } else {
      groups.upcoming.push(task);
    }
  }

  return groups;
}

/** Assign a due date when dropping into a ledger-style group */
export function dueDateForGroup(group: TaskGroupKey): string | undefined {
  const today = startOfDay(new Date());
  if (group === "today") return today.toISOString();
  if (group === "week") {
    const mid = new Date(today);
    mid.setDate(today.getDate() + 3);
    return mid.toISOString();
  }
  if (group === "upcoming") {
    const later = new Date(today);
    later.setDate(today.getDate() + 14);
    return later.toISOString();
  }
  if (group === "nodate") return undefined;
  return undefined;
}
