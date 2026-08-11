"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { INK_PALETTE } from "@/lib/ink";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CategoriesManager() {
  const categories = useLifeOSStore((s) => s.categories);
  const tasks = useLifeOSStore((s) => s.tasks);
  const events = useLifeOSStore((s) => s.events);
  const notes = useLifeOSStore((s) => s.notes);
  const meetings = useLifeOSStore((s) => s.meetings);
  const addCategory = useLifeOSStore((s) => s.addCategory);
  const updateCategory = useLifeOSStore((s) => s.updateCategory);
  const deleteCategory = useLifeOSStore((s) => s.deleteCategory);

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(INK_PALETTE[0].hex);

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const counts = (id: string) => ({
    t: tasks.filter((x) => x.categoryId === id).length,
    e: meetings.filter((x) => x.categoryId === id).length + events.filter((x) => x.calendar.toLowerCase() === categories.find((c) => c.id === id)?.name.toLowerCase()).length,
    n: notes.filter((x) => x.categoryId === id).length,
  });

  const create = () => {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), color });
    setName("");
    toast.success("Category added");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Categories</h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          One ink palette for tasks, meetings, and notes.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          className="flex-1"
        />
        <div className="flex items-center gap-1.5">
          {INK_PALETTE.map((ink) => (
            <button
              key={ink.hex}
              type="button"
              aria-label={ink.name}
              onClick={() => setColor(ink.hex)}
              className={cn(
                "h-6 w-6 rounded-full ring-offset-2 ring-offset-[var(--bg)]",
                color === ink.hex ? "ring-2 ring-[var(--fg)]" : "ring-0"
              )}
              style={{ background: ink.hex }}
            />
          ))}
        </div>
        <Button onClick={create}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {sorted.map((c) => {
          const ct = counts(c.id);
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
              <GripVertical className="h-4 w-4 text-[var(--fg-muted)]" />
              <span className="ink-dot" style={{ background: c.color, width: 10, height: 10 }} />
              <Input
                value={c.name}
                onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                className="h-9 max-w-[160px] border-transparent bg-transparent px-1 shadow-none focus-visible:border-[var(--border)] focus-visible:bg-[var(--surface-2)]"
              />
              <div className="flex items-center gap-1">
                {INK_PALETTE.map((ink) => (
                  <button
                    key={ink.hex}
                    type="button"
                    aria-label={ink.name}
                    onClick={() => updateCategory(c.id, { color: ink.hex })}
                    className={cn(
                      "h-5 w-5 rounded-full",
                      c.color === ink.hex ? "ring-2 ring-[var(--fg)] ring-offset-1 ring-offset-[var(--surface)]" : ""
                    )}
                    style={{ background: ink.hex }}
                  />
                ))}
              </div>
              <span className="ml-auto font-mono text-[11px] text-[var(--fg-muted)]">
                {ct.t}t · {ct.e}e · {ct.n}n
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-rose-500"
                onClick={() => {
                  deleteCategory(c.id);
                  toast.message("Category removed");
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
