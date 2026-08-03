"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Download,
  FileUp,
  Folder,
  Link2,
  Pin,
  Plus,
  Search,
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
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const addNote = useLifeOSStore((s) => s.addNote);
  const updateNote = useLifeOSStore((s) => s.updateNote);
  const deleteNote = useLifeOSStore((s) => s.deleteNote);

  const [folderId, setFolderId] = useState<string | "all" | "pinned" | "favorites" | "archived">(
    "all"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [editorTab, setEditorTab] = useState("write");
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
  }, [notes, folderId, search]);

  const selectedIdResolved =
    selectedId && filtered.some((n) => n.id === selectedId)
      ? selectedId
      : filtered[0]?.id ?? null;
  const selected = notes.find((n) => n.id === selectedIdResolved) ?? null;
  const words = selected ? wordCount(selected.content) : 0;

  const backlinkNotes = useMemo(() => {
    if (!selected) return [];
    const fromField = selected.backlinks
      .map((id) => notes.find((n) => n.id === id))
      .filter(Boolean) as Note[];
    const fromMentions = notes.filter(
      (n) =>
        n.id !== selected.id &&
        (n.content.includes(`[[${selected.title}]]`) ||
          selected.content.includes(`[[${n.title}]]`))
    );
    const map = new Map<string, Note>();
    for (const n of [...fromField, ...fromMentions]) map.set(n.id, n);
    return Array.from(map.values());
  }, [selected, notes]);

  function createNote() {
    const note = addNote({
      title: "Untitled",
      content: "",
      folderId: folderId !== "all" && folderId !== "pinned" && folderId !== "favorites" && folderId !== "archived"
        ? folderId
        : "fld_inbox",
      tags: [],
      backlinks: [],
    });
    setSelectedId(note.id);
    setEditorTab("write");
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

  function addTag(note: Note) {
    const t = tagDraft.trim().toLowerCase();
    if (!t) return;
    if (note.tags.includes(t)) {
      toast.message("Tag already exists");
      return;
    }
    updateNote(note.id, { tags: [...note.tags, t] });
    setTagDraft("");
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
                <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={selected.pinned ? "default" : "ghost"}
                      onClick={() => {
                        updateNote(selected.id, { pinned: !selected.pinned });
                        toast.message(selected.pinned ? "Unpinned" : "Pinned");
                      }}
                    >
                      <Pin className="h-3.5 w-3.5" />
                      Pin
                    </Button>
                    <Button
                      size="sm"
                      variant={selected.favorite ? "default" : "ghost"}
                      onClick={() => {
                        updateNote(selected.id, { favorite: !selected.favorite });
                        toast.message(selected.favorite ? "Removed favorite" : "Favorited");
                      }}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Favorite
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        updateNote(selected.id, { archived: !selected.archived });
                        toast.message(selected.archived ? "Restored" : "Archived");
                      }}
                    >
                      <Archive className="h-3.5 w-3.5" />
                      {selected.archived ? "Restore" : "Archive"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => exportNote(selected)}>
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-500 hover:text-rose-600"
                      onClick={() => {
                        deleteNote(selected.id);
                        setSelectedId(null);
                        toast.success("Note deleted");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                    <div className="ml-auto flex items-center gap-3 text-xs text-[var(--fg-muted)]">
                      <span>{words} words</span>
                      <span>·</span>
                      <span>{readingTimeMin(words)} min read</span>
                    </div>
                  </div>

                  <Input
                    value={selected.title}
                    onChange={(e) => updateNote(selected.id, { title: e.target.value })}
                    className="border-0 bg-transparent px-0 font-display text-2xl font-semibold shadow-none focus-visible:ring-0"
                    placeholder="Note title"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
                      value={selected.folderId ?? ""}
                      onChange={(e) =>
                        updateNote(selected.id, {
                          folderId: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">No folder</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.parentId ? `↳ ${f.name}` : f.name}
                        </option>
                      ))}
                    </select>
                    {selected.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() =>
                          updateNote(selected.id, {
                            tags: selected.tags.filter((x) => x !== t),
                          })
                        }
                        title="Click to remove"
                      >
                        #{t}
                      </Badge>
                    ))}
                    <form
                      className="flex gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addTag(selected);
                      }}
                    >
                      <Input
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        placeholder="Add tag"
                        className="h-8 w-28 text-xs"
                      />
                      <Button type="submit" size="sm" variant="ghost">
                        +
                      </Button>
                    </form>
                  </div>

                  <Tabs value={editorTab} onValueChange={setEditorTab} className="flex flex-1 flex-col">
                    <TabsList>
                      <TabsTrigger value="write">Write</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="split" className="hidden sm:inline-flex">
                        Split
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="write" className="mt-3 flex-1">
                      <Textarea
                        value={selected.content}
                        onChange={(e) => updateNote(selected.id, { content: e.target.value })}
                        placeholder="Write markdown…"
                        className="min-h-[320px] resize-y font-mono text-[13px] leading-relaxed"
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="mt-3 flex-1">
                      <div className="prose-lifeos glass min-h-[320px] rounded-xl p-4">
                        {selected.content.trim() ? (
                          <Markdown body={selected.content} />
                        ) : (
                          <p className="text-sm text-[var(--fg-muted)]">Nothing to preview.</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="split" className="mt-3 flex-1">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Textarea
                          value={selected.content}
                          onChange={(e) => updateNote(selected.id, { content: e.target.value })}
                          placeholder="Write markdown…"
                          className="min-h-[320px] resize-y font-mono text-[13px] leading-relaxed"
                        />
                        <div className="prose-lifeos glass min-h-[320px] rounded-xl p-4">
                          <Markdown body={selected.content} />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

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

                  <p className="text-[11px] text-[var(--fg-muted)]">
                    Updated {format(parseISO(selected.updatedAt), "MMM d, yyyy · h:mm a")}
                    {" · "}
                    Created {format(parseISO(selected.createdAt), "MMM d, yyyy")}
                  </p>
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
