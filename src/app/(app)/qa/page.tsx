"use client";

import { useState } from "react";
import { Bug, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import type { Bug as BugT } from "@/types";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const BUG_STATUSES: BugT["status"][] = ["open", "in_progress", "resolved", "wontfix"];

export default function QAPage() {
  const bugs = useLifeOSStore((s) => s.bugs);
  const testCases = useLifeOSStore((s) => s.testCases);
  const releases = useLifeOSStore((s) => s.releases);
  const addBug = useLifeOSStore((s) => s.addBug);
  const updateBug = useLifeOSStore((s) => s.updateBug);
  const updateTestCase = useLifeOSStore((s) => s.updateTestCase);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");

  const create = () => {
    if (!title.trim()) return;
    addBug({ title: title.trim(), severity: "medium", status: "open", steps });
    setTitle("");
    setSteps("");
    setOpen(false);
    toast.success("Bug filed");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QA Workspace"
        description="Bugs, test cases, releases, and sprint board."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> File bug</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New bug</DialogTitle></DialogHeader>
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea className="mt-2" placeholder="Steps to reproduce" value={steps} onChange={(e) => setSteps(e.target.value)} />
              <Button className="mt-3" onClick={create}>Create</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="bugs">
        <TabsList>
          <TabsTrigger value="bugs">Bugs</TabsTrigger>
          <TabsTrigger value="tests">Test cases</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="sprint">Sprint board</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="bugs" className="space-y-2">
          {bugs.length === 0 ? (
            <EmptyState icon={Bug} title="No bugs" description="Enjoy the silence — or file one." />
          ) : (
            bugs.map((b) => (
              <Card key={b.id} className="glass">
                <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{b.title}</p>
                    {b.steps && <p className="text-xs text-[var(--fg-muted)]">{b.steps}</p>}
                  </div>
                  <Badge variant={b.severity === "critical" || b.severity === "high" ? "danger" : "secondary"}>{b.severity}</Badge>
                  <select
                    className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
                    value={b.status}
                    onChange={(e) => updateBug(b.id, { status: e.target.value as BugT["status"] })}
                  >
                    {BUG_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-2">
          {testCases.map((t) => (
            <Card key={t.id} className="glass">
              <CardContent className="flex items-center gap-3 p-4 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-[var(--fg-muted)]">{t.module}</p>
                </div>
                <Badge variant="secondary">{t.priority}</Badge>
                <select
                  className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
                  value={t.status}
                  onChange={(e) =>
                    updateTestCase(t.id, {
                      status: e.target.value as typeof t.status,
                    })
                  }
                >
                  {(["pass", "fail", "pending", "blocked"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="releases" className="grid gap-3 md:grid-cols-3">
          {releases.map((r) => (
            <Card key={r.id} className="glass">
              <CardHeader>
                <CardTitle>v{r.version}</CardTitle>
                <Badge className="w-fit capitalize">{r.status.replace("_", " ")}</Badge>
              </CardHeader>
              <CardContent className="text-sm text-[var(--fg-muted)]">{r.notes}</CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sprint">
          <div className="grid gap-3 md:grid-cols-4">
            {BUG_STATUSES.map((status) => (
              <Card key={status} className="glass">
                <CardHeader><CardTitle className="capitalize text-sm">{status.replace("_", " ")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {bugs.filter((b) => b.status === status).map((b) => (
                    <div key={b.id} className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">{b.title}</div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation">
          <Card className="glass">
            <CardContent className="space-y-3 p-5 text-sm">
              {[
                ["Playwright smoke", "scheduled nightly", "green"],
                ["Vitest unit", "on PR", "green"],
                ["Lighthouse CI", "planned", "amber"],
                ["Visual regression", "backlog", "muted"],
              ].map(([name, when, tone]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-[var(--fg-muted)]">{when}</p>
                  </div>
                  <Badge variant={tone === "green" ? "success" : "secondary"}>{tone === "green" ? "OK" : tone}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
