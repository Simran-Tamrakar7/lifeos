"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import type { ProjectStatus } from "@/types";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CategoriesManager } from "@/components/categories/categories-manager";

const STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "completed", "archived"];

export default function ProjectsPage() {
  const projects = useLifeOSStore((s) => s.projects);
  const tasks = useLifeOSStore((s) => s.tasks);
  const categories = useLifeOSStore((s) => s.categories);
  const addProject = useLifeOSStore((s) => s.addProject);
  const updateProject = useLifeOSStore((s) => s.updateProject);
  const deleteProject = useLifeOSStore((s) => s.deleteProject);
  const [selected, setSelected] = useState(projects[0]?.id);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const project = projects.find((p) => p.id === selected) ?? projects[0];
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project?.id),
    [tasks, project?.id]
  );

  const create = () => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), description });
    setName("");
    setDescription("");
    setOpen(false);
    toast.success("Project created");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Milestones, roadmap, and linked work."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea className="mt-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button className="mt-3" onClick={create}>Create</Button>
            </DialogContent>
          </Dialog>
        }
      />

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects" description="Create a container for related work." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
          <Card className="glass h-fit">
            <CardContent className="space-y-1 p-3">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    project?.id === p.id ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-xs text-[var(--fg-muted)]">{p.progress}%</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="font-display text-base">Categories</CardTitle>
              <Dialog open={catOpen} onOpenChange={setCatOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Settings2 className="h-3.5 w-3.5" /> Manage
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Categories</DialogTitle>
                  </DialogHeader>
                  <CategoriesManager />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              {[...categories].sort((a, b) => a.order - b.order).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--fg-muted)]"
                >
                  <span className="ink-dot" style={{ background: c.color }} />
                  <span className="flex-1 truncate text-[var(--fg)]">{c.name}</span>
                  <span className="font-mono text-[10px]">
                    {tasks.filter((t) => t.categoryId === c.id).length}t
                  </span>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setCatOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add category
              </Button>
            </CardContent>
          </Card>
          </div>

          {project && (
            <div className="space-y-4">
              <Card className="glass">
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <div className="mb-2 flex gap-2">
                      <Badge className="capitalize">{project.status.replace("_", " ")}</Badge>
                      <Badge variant={project.priority}>{project.priority}</Badge>
                    </div>
                    <CardTitle className="font-display text-2xl">{project.name}</CardTitle>
                    <p className="mt-1 text-sm text-[var(--fg-muted)]">{project.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteProject(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={project.progress} />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.progress}
                    onChange={(e) => updateProject(project.id, { progress: Number(e.target.value) })}
                    className="w-full accent-[var(--accent)]"
                  />
                  <select
                    className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                    value={project.status}
                    onChange={(e) => updateProject(project.id, { status: e.target.value as ProjectStatus })}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </CardContent>
              </Card>

              <Tabs defaultValue="milestones">
                <TabsList>
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks ({projectTasks.length})</TabsTrigger>
                  <TabsTrigger value="kanban">Kanban</TabsTrigger>
                </TabsList>
                <TabsContent value="milestones" className="space-y-2">
                  {project.milestones.map((m) => (
                    <Card key={m.id} className="glass">
                      <CardContent className="flex items-center gap-3 p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={() =>
                            updateProject(project.id, {
                              milestones: project.milestones.map((x) =>
                                x.id === m.id ? { ...x, completed: !x.completed } : x
                              ),
                            })
                          }
                        />
                        <span className={m.completed ? "line-through text-[var(--fg-muted)]" : ""}>{m.title}</span>
                        {m.dueDate && <span className="ml-auto text-xs text-[var(--fg-muted)]">{m.dueDate.slice(0, 10)}</span>}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="tasks" className="space-y-2">
                  {projectTasks.map((t) => (
                    <Card key={t.id} className="glass">
                      <CardContent className="flex items-center justify-between p-3 text-sm">
                        <span>{t.title}</span>
                        <Badge variant="secondary" className="capitalize">{t.status.replace("_", " ")}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="kanban">
                  <div className="grid gap-3 md:grid-cols-3">
                    {STATUSES.slice(0, 3).map((status) => (
                      <Card key={status} className="glass">
                        <CardHeader><CardTitle className="capitalize text-sm">{status.replace("_", " ")}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {projects.filter((p) => p.status === status).map((p) => (
                            <div key={p.id} className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">{p.name}</div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
