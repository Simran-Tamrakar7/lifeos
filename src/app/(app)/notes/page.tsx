"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CalendarDays,
  Download,
  FileUp,
  Folder,
  Link2,
  Pin,
  Plus,
  Search,
  Settings2,
  Star,
  StickyNote,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategoriesManager } from "@/components/categories/categories-manager";
import { NoteEditor } from "@/components/notes/note-editor";
import { cn } from "@/lib/utils";
import type { Note } from "@/types";

function wordCount(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function readingTimeMin(words: number) {
  return Math.max(1, Math.ceil(words / 200));
}

export default function NotesPage() {
  const notes = useLifeOSStore((s) => s.notes);
  const folders = useLifeOSStore((s) => s.folders);
  const categories = useLifeOSStore((s) => s.categories);
  const addNote = useLifeOSStore((s) => s.addNote);
  const updateNote = useLifeOSStore((s) => s.updateNote);
  const deleteNote = useLifeOSStore((s) => s.deleteNote);
  const addTask = useLifeOSStore((s) => s.addTask);

  const [folderId, setFolderId] = useState<string | "all" | "pinned" | "favorites" | "archived">(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [catOpen, setCatOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (folderId === "pinned") return !!n.pinned && !n.archived;
        if (folderId === "favorites") return !!n.favorite && !n.archived;
        if (folderId === "archived") return !!n.archived;
        if (folderId !== "all" && n.folderId !== folderId) return false;
        if (folderId !== "archived" && n.archived) return false;
        if (categoryFilter !== "all" && n.categoryId !== categoryFilter) return false;
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [notes, folderId, search, categoryFilter]);

  const selectedIdResolved =
    selectedId && filtered.some((n) => n.id === selectedId)
      ? selectedId
      : filtered[0]?.id ?? null;
  const selected = notes.find((n) => n.id === selectedIdResolved) ?? null;
  const words = selected ? wordCount(selected.content) : 0;

  const backlinkNotes = useMemo(() => {
    if (!selectedIdResolved) return [];
    const current = notes.find((n) => n.id === selectedIdResolved);
    if (!current) return [];
    const fromField = current.backlinks
      .map((id) => notes.find((n) => n.id === id))
      .filter(Boolean) as Note[];
    const fromMentions = notes.filter(
      (n) =>
        n.id !== current.id &&
        (n.content.includes(`[[${current.title}]]`) ||
          current.content.includes(`[[${n.title}]]`))
    );
    const map = new Map<string, Note>();
    for (const n of [...fromField, ...fromMentions]) map.set(n.id, n);
    return Array.from(map.values());
  }, [selectedIdResolved, notes]);

  function createNote() {
    const note = addNote({
      title: "Untitled note",
      content: "",
      date: format(new Date(), "yyyy-MM-dd"),
      folderId:
        folderId !== "all" &&
        folderId !== "pinned" &&
        folderId !== "favorites" &&
        folderId !== "archived"
          ? folderId
          : "fld_inbox",
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      tags: [],
      backlinks: [],
    });
    setSelectedId(note.id);
    toast.success("Note created");
  }

  function exportNote(note: Note) {
    const blob = new Blob([`# ${note.title}\n\n${note.content}`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^\w\s-]/g, "").trim() || "note"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported markdown");
  }

  function importMd(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const lines = raw.split("\n");
      let title = file.name.replace(/\.md$/i, "");
      let content = raw;
      if (lines[0]?.startsWith("# ")) {
        title = lines[0].slice(2).trim();
        content = lines.slice(1).join("\n").replace(/^\n/, "");
      }
      const note = addNote({
        title,
        content,
        folderId: "fld_inbox",
        tags: ["imported"],
        backlinks: [],
      });
      setSelectedId(note.id);
      setFolderId("all");
      toast.success(`Imported “${title}”`);
    };
    reader.readAsText(file);
  }

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of folders) counts[f.id] = 0;
    for (const n of notes) {
      if (n.archived) continue;
      if (n.folderId && counts[n.folderId] !== undefined) counts[n.folderId]++;
    }
    return counts;
  }, [folders, notes]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Notes"
        description="Folders, markdown editing, backlinks, and quick export."
        actions={
          <>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="pl-9"
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".md,text/markdown,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importMd(f);
                e.target.value = "";
              }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={createNote}>
              <Plus className="h-4 w-4" />
              New note
            </Button>
          </>
        }
      />

      {/* Ledger-style category chips */}
      <div className="flex flex-wrap items-center gap-2">
        {[...categories].sort((a, b) => a.order - b.order).map((c) => {
          const count = notes.filter((n) => n.categoryId === c.id && !n.archived).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter((f) => (f === c.id ? "all" : c.id))}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm transition",
                categoryFilter === c.id
                  ? "bg-[var(--accent-soft)] text-[var(--fg)]"
                  : "bg-[var(--surface)] text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
              )}
            >
              <span className="ink-dot" style={{ background: c.color }} />
              {c.name}
              <span className="font-mono text-[11px] opacity-70">{count}</span>
            </button>
          );
        })}
        <Dialog open={catOpen} onOpenChange={setCatOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings2 className="h-3.5 w-3.5" /> Categories
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">Categories</DialogTitle>
            </DialogHeader>
            <CategoriesManager />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_260px_1fr]">
        {/* Folders */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardContent className="space-y-1 p-3">
            <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              Library
            </p>
            <SideItem
              active={folderId === "all"}
              onClick={() => setFolderId("all")}
              label="All notes"
              count={notes.filter((n) => !n.archived).length}
            />
            <SideItem
              active={folderId === "pinned"}
              onClick={() => setFolderId("pinned")}
              label="Pinned"
              icon={<Pin className="h-3.5 w-3.5" />}
              count={notes.filter((n) => n.pinned && !n.archived).length}
            />
            <SideItem
              active={folderId === "favorites"}
              onClick={() => setFolderId("favorites")}
              label="Favorites"
              icon={<Star className="h-3.5 w-3.5" />}
              count={notes.filter((n) => n.favorite && !n.archived).length}
            />
            <SideItem
              active={folderId === "archived"}
              onClick={() => setFolderId("archived")}
              label="Archived"
              icon={<Archive className="h-3.5 w-3.5" />}
              count={notes.filter((n) => n.archived).length}
            />
            <p className="mb-2 mt-4 px-2 text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              Folders
            </p>
            {folders
              .filter((f) => !f.parentId)
              .map((f) => (
                <div key={f.id}>
                  <SideItem
                    active={folderId === f.id}
                    onClick={() => setFolderId(f.id)}
                    label={f.name}
                    icon={<Folder className="h-3.5 w-3.5" />}
                    count={folderCounts[f.id] ?? 0}
                  />
                  {folders
                    .filter((c) => c.parentId === f.id)
                    .map((c) => (
                      <SideItem
                        key={c.id}
                        active={folderId === c.id}
                        onClick={() => setFolderId(c.id)}
                        label={c.name}
                        icon={<Folder className="h-3.5 w-3.5" />}
                        count={folderCounts[c.id] ?? 0}
                        nested
                      />
                    ))}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Note list */}
        <Card className="overflow-hidden lg:max-h-[calc(100vh-220px)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="border-b border-[var(--border)] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              {filtered.length} note{filtered.length === 1 ? "" : "s"}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={StickyNote}
                  title="No notes"
                  description="Create a note or clear your search."
                  action={
                    <Button size="sm" onClick={createNote}>
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-1">
                  {filtered.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(n.id)}
                        className={cn(
                          "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                          selectedIdResolved === n.id
                            ? "bg-[var(--accent-soft)]"
                            : "hover:bg-[var(--surface-2)]"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {n.pinned && <Pin className="h-3 w-3 text-[var(--accent)]" />}
                          {n.favorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                          {n.meetingId && (
                            <span className="rounded bg-[var(--accent-soft)] px-1 text-[10px] text-[var(--accent)]">
                              mtg
                            </span>
                          )}
                          <p className="truncate text-sm font-medium">{n.title || "Untitled"}</p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--fg-muted)]">
                          {n.content.replace(/^#+\s*/gm, "").slice(0, 100) || "Empty note"}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--fg-muted)]">
                          {format(parseISO(n.updatedAt), "MMM d, yyyy")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="min-h-[520px]">
                <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
                  {/* Ledger layout: title → trash → date/category → tags → editor */}
                  <Input
                    value={selected.title}
                    onChange={(e) => updateNote(selected.id, { title: e.target.value })}
                    className="h-auto border-0 bg-transparent px-0 font-display text-2xl font-semibold shadow-none focus-visible:ring-0 sm:text-3xl"
                    placeholder="Untitled note"
                  />

                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                      aria-label="Delete note"
                      onClick={() => {
                        deleteNote(selected.id);
                        setSelectedId(null);
                        toast.success("Note deleted");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={selected.pinned ? "Unpin" : "Pin"}
                      onClick={() => {
                        updateNote(selected.id, { pinned: !selected.pinned });
                        toast.message(selected.pinned ? "Unpinned" : "Pinned");
                      }}
                    >
                      <Pin
                        className={cn(
                          "h-3.5 w-3.5",
                          selected.pinned && "text-[var(--accent)]"
                        )}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={selected.favorite ? "Unfavorite" : "Favorite"}
                      onClick={() =>
                        updateNote(selected.id, { favorite: !selected.favorite })
                      }
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5",
                          selected.favorite && "fill-amber-400 text-amber-400"
                        )}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label="Export note"
                      onClick={() => exportNote(selected)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <span className="ml-auto text-xs text-[var(--fg-muted)]">
                      {words} words · {readingTimeMin(words)} min
                    </span>
                  </div>

                  {(selected.meetingId || (selected.taskIds && selected.taskIds.length > 0)) && (
                    <div className="flex flex-wrap gap-2">
                      {selected.meetingId && (
                        <a href="/meetings">
                          <Badge variant="default">Synced from Meeting minutes</Badge>
                        </a>
                      )}
                      {selected.taskIds?.map((tid) => (
                        <a key={tid} href="/tasks">
                          <Badge variant="secondary">Linked task</Badge>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <label className="relative flex h-10 min-w-[150px] flex-1 items-center rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm">
                      <Input
                        type="date"
                        value={
                          selected.date ??
                          format(parseISO(selected.createdAt), "yyyy-MM-dd")
                        }
                        onChange={(e) => updateNote(selected.id, { date: e.target.value })}
                        className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      />
                      <CalendarDays className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--fg-muted)]" />
                    </label>
                    <select
                      className="h-10 min-w-[150px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm"
                      value={selected.categoryId ?? ""}
                      onChange={(e) =>
                        updateNote(selected.id, {
                          categoryId: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    value={selected.tags.join(", ")}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);
                      updateNote(selected.id, { tags });
                    }}
                    placeholder="Tags (comma-separated)"
                    className="rounded-lg bg-[var(--bg)]"
                  />

                  <NoteEditor
                    content={selected.content}
                    onChange={(content) => updateNote(selected.id, { content })}
                    onConvertChecked={(lines) => {
                      const created = lines.map((title) =>
                        addTask({
                          title,
                          tags: ["from-note"],
                          noteId: selected.id,
                          categoryId: selected.categoryId,
                          description: `From note: ${selected.title}`,
                        })
                      );
                      updateNote(selected.id, {
                        taskIds: [
                          ...(selected.taskIds ?? []),
                          ...created.map((t) => t.id),
                        ],
                      });
                      toast.success(
                        `Created ${created.length} task${created.length === 1 ? "" : "s"}`
                      );
                    }}
                  />

                  {selected.content.trim() && (
                    <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-[var(--fg-muted)]">
                        Preview markdown
                      </summary>
                      <div className="prose-lifeos border-t border-[var(--border)] p-4">
                        <Markdown body={selected.content} />
                      </div>
                    </details>
                  )}

                  {backlinkNotes.length > 0 && (
                    <div className="border-t border-[var(--border)] pt-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Link2 className="h-4 w-4 text-[var(--fg-muted)]" />
                        Backlinks
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {backlinkNotes.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setSelectedId(n.id)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-left text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          >
                            {n.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  icon={StickyNote}
                  title="No note selected"
                  description="Pick a note from the list or create a new one."
                  action={
                    <Button onClick={createNote}>
                      <Plus className="h-4 w-4" />
                      New note
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SideItem({
  active,
  onClick,
  label,
  count,
  icon,
  nested,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  nested?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        nested && "pl-6",
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {typeof count === "number" && (
        <span className="text-[11px] tabular-nums opacity-70">{count}</span>
      )}
    </button>
  );
}

function Markdown({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="font-display mb-3 text-2xl font-semibold tracking-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-display mb-2 mt-4 text-xl font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-3 text-base font-semibold">{children}</h3>
        ),
        p: ({ children }) => <p className="mb-3 text-sm leading-relaxed">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-sm">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-[var(--accent)] pl-3 text-sm italic text-[var(--fg-muted)]">
            {children}
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const inline = !className;
          if (inline) {
            return (
              <code
                className="rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[12px]"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={cn(
                "mb-3 block overflow-x-auto rounded-xl bg-[var(--surface-2)] p-3 font-mono text-[12px]",
                className
              )}
              {...props}
            >
              {children}
            </code>
          );
        },
        a: ({ href, children }) => (
          <a href={href} className="text-[var(--accent)] underline-offset-2 hover:underline">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-[var(--border)] px-2 py-1">{children}</td>
        ),
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
