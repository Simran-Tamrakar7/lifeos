"use client";

import { useState } from "react";
import { FileText, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function DocumentsPage() {
  const documents = useLifeOSStore((s) => s.documents);
  const addDocument = useLifeOSStore((s) => s.addDocument);
  const deleteDocument = useLifeOSStore((s) => s.deleteDocument);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const folders = ["all", ...new Set(documents.map((d) => d.folder).filter(Boolean) as string[])];
  const filtered = documents.filter((d) => {
    const matchQ = d.name.toLowerCase().includes(q.toLowerCase()) || d.tags.some((t) => t.includes(q.toLowerCase()));
    const matchF = folder === "all" || d.folder === folder;
    return matchQ && matchF;
  });

  const create = () => {
    if (!name.trim()) return;
    addDocument({
      name: name.trim(),
      type: "md",
      size: "4 KB",
      folder: "Inbox",
      tags: [],
      updatedAt: new Date().toISOString(),
    });
    setName("");
    setOpen(false);
    toast.success("Document added (placeholder file)");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Files, folders, and favorites — cloud sync ready."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add document metadata</DialogTitle></DialogHeader>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Filename" />
              <Button className="mt-3" onClick={create}>Add</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        {folders.map((f) => (
          <Button key={f} size="sm" variant={folder === f ? "default" : "secondary"} onClick={() => setFolder(f)} className="capitalize">
            {f}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" description="Add files or connect cloud storage later." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="glass">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
                  <FileText className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.name}</p>
                  <p className="text-xs text-[var(--fg-muted)]">{d.type.toUpperCase()} · {d.size} · {d.folder}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    {d.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDocument(d.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
