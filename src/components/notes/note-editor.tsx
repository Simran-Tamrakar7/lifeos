"use client";

import { useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  ListTodo,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NoteEditor({
  content,
  onChange,
  onConvertChecked,
}: {
  content: string;
  onChange: (value: string) => void;
  onConvertChecked?: (lines: string[]) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after = before) => {
    const el = ref.current;
    if (!el) {
      onChange(`${before}${content}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || "text";
    const next =
      content.slice(0, start) + before + selected + after + content.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const prefixLines = (prefix: string) => {
    const el = ref.current;
    if (!el) {
      onChange(prefix + content);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const block = content.slice(start, end) || "";
    if (!block) {
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const next =
        content.slice(0, lineStart) + prefix + content.slice(lineStart);
      onChange(next);
      return;
    }
    const nextBlock = block
      .split("\n")
      .map((l) => (l.trim() ? prefix + l.replace(/^[-*]\s+(\[[ xX]\]\s+)?/, "") : l))
      .join("\n");
    onChange(content.slice(0, start) + nextBlock + content.slice(end));
  };

  const convertChecked = () => {
    if (!onConvertChecked) return;
    const lines = content
      .split("\n")
      .map((l) => {
        const m = l.match(/^\s*[-*]\s+\[[xX]\]\s+(.+)$/);
        return m?.[1]?.trim();
      })
      .filter(Boolean) as string[];
    if (lines.length) onConvertChecked(lines);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5">
        <ToolbarBtn label="Bold" onClick={() => wrap("**")}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Italic" onClick={() => wrap("*")}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Heading 2" onClick={() => prefixLines("## ")}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Bullet list" onClick={() => prefixLines("- ")}>
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Numbered list" onClick={() => prefixLines("1. ")}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Checklist" onClick={() => prefixLines("- [ ] ")}>
          <ListTodo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        {onConvertChecked && (
          <Button size="sm" variant="secondary" className="ml-auto" onClick={convertChecked}>
            <CheckSquare className="h-3.5 w-3.5" />
            Convert checked → tasks
          </Button>
        )}
      </div>
      <Textarea
        ref={ref}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write the meeting down. Checkboxes become tasks later."
        className="min-h-[280px] resize-y rounded-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      )}
    >
      {children}
    </button>
  );
}
