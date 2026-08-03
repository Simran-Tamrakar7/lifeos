"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { ArrowRight, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PriorityBadge } from "./priority-badge";
import { SubtaskList } from "./subtask-list";
import type { Task, TaskStatus } from "@/types";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  backlog: "todo",
  todo: "in_progress",
  in_progress: "review",
  review: "done",
};

function CardBody({ task, showActions }: { task: Task; showActions?: boolean }) {
  const deleteTask = useLifeOSStore((s) => s.deleteTask);
  const toggleSubtask = useLifeOSStore((s) => s.toggleSubtask);
  const moveTask = useLifeOSStore((s) => s.moveTask);
  const next = NEXT[task.status];

  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <PriorityBadge priority={task.priority} />
        {task.tags.slice(0, 2).map((t) => (
          <Badge key={t} variant="outline">
            {t}
          </Badge>
        ))}
      </div>
      {task.subtasks.length > 0 && (
        <SubtaskList taskId={task.id} subtasks={task.subtasks} onToggle={toggleSubtask} />
      )}
      {showActions && (
        <div className="mt-2 flex gap-1">
          {next && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => {
                moveTask(task.id, next);
                toast.success(`Moved to ${next.replaceAll("_", " ")}`);
              }}
            >
              <ArrowRight className="h-3 w-3" />
              Move
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-[var(--fg-muted)] hover:text-rose-500"
            onClick={() => {
              deleteTask(task.id);
              toast.success("Task deleted");
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SortableKanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-[var(--fg-muted)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <CardBody task={task} showActions />
      </div>
    </div>
  );
}

function OverlayCard({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg ring-2 ring-[var(--accent)]">
      <div className="flex items-start gap-1">
        <GripVertical className="mt-0.5 h-4 w-4 text-[var(--fg-muted)]" />
        <CardBody task={task} />
      </div>
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[320px] w-[240px] shrink-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-3 backdrop-blur-xl",
        isOver && "ring-2 ring-[var(--accent)]/40"
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <SortableKanbanCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <p className="py-8 text-center text-xs text-[var(--fg-muted)]">Drop here</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskKanbanView({ tasks }: { tasks: Task[] }) {
  const moveTask = useLifeOSStore((s) => s.moveTask);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      cancelled: [],
    };
    for (const t of tasks) {
      if (t.status !== "cancelled") map[t.status].push(t);
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const overId = String(over.id);

    let nextStatus: TaskStatus | undefined;
    if (COLUMNS.some((c) => c.id === overId)) {
      nextStatus = overId as TaskStatus;
    } else {
      nextStatus = tasks.find((t) => t.id === overId)?.status;
    }
    if (!nextStatus) return;
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === nextStatus) return;
    moveTask(taskId, nextStatus);
    toast.success(`Moved to ${nextStatus.replaceAll("_", " ")}`);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <Column key={col.id} status={col.id} label={col.label} tasks={byStatus[col.id]} />
        ))}
      </div>
      <DragOverlay>{activeTask ? <OverlayCard task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}
