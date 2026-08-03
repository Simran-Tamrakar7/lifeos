"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { cn, uid } from "@/lib/utils";
import type { Meeting, MeetingStatus, MeetingType } from "@/types";

const MEETING_TYPES: MeetingType[] = [
  "internal",
  "client",
  "personal",
  "interview",
  "standup",
  "sprint",
  "retro",
  "one_on_one",
  "hr",
  "training",
];

const MEETING_STATUSES: MeetingStatus[] = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

const TEMPLATES: {
  id: string;
  label: string;
  type: MeetingType;
  agenda: string[];
  title: string;
}[] = [
  {
    id: "standup",
    label: "Daily Standup",
    type: "standup",
    title: "Daily Standup",
    agenda: ["Yesterday", "Today", "Blockers"],
  },
  {
    id: "client-kickoff",
    label: "Client Kickoff",
    type: "client",
    title: "Client Kickoff",
    agenda: ["Introductions", "Scope", "Timeline", "Success metrics"],
  },
  {
    id: "one-on-one",
    label: "1:1",
    type: "one_on_one",
    title: "1:1 Check-in",
    agenda: ["Wins", "Challenges", "Goals", "Support needed"],
  },
  {
    id: "sprint",
    label: "Sprint Planning",
    type: "sprint",
    title: "Sprint Planning",
    agenda: ["Capacity", "Backlog grooming", "Commit"],
  },
  {
    id: "retro",
    label: "Retrospective",
    type: "retro",
    title: "Sprint Retro",
    agenda: ["Went well", "Needs improvement", "Action items"],
  },
];

function statusVariant(s: MeetingStatus) {
  if (s === "completed") return "success" as const;
  if (s === "cancelled") return "danger" as const;
  if (s === "in_progress") return "warning" as const;
  return "default" as const;
}

function labelize(s: string) {
  return s.replaceAll("_", " ");
}

export default function MeetingsPage() {
  const meetings = useLifeOSStore((s) => s.meetings);
  const tasks = useLifeOSStore((s) => s.tasks);
  const projects = useLifeOSStore((s) => s.projects);
  const addMeeting = useLifeOSStore((s) => s.addMeeting);
  const updateMeeting = useLifeOSStore((s) => s.updateMeeting);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "internal" as MeetingType,
    status: "scheduled" as MeetingStatus,
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "14:00",
    endTime: "15:00",
    location: "",
    participants: "",
    agenda: "",
    notes: "",
    template: "",
  });

  const filtered = useMemo(() => {
    return meetings
      .filter((m) => {
        if (typeFilter !== "all" && m.type !== typeFilter) return false;
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          m.title.toLowerCase().includes(q) ||
          m.participants.some((p) => p.toLowerCase().includes(q)) ||
          m.location?.toLowerCase().includes(q) ||
          m.type.includes(q)
        );
      })
      .sort((a, b) => b.start.localeCompare(a.start));
  }, [meetings, search, typeFilter, statusFilter]);

  const selectedIdResolved =
    selectedId && filtered.some((m) => m.id === selectedId)
      ? selectedId
      : filtered[0]?.id ?? null;
  const selected = meetings.find((m) => m.id === selectedIdResolved) ?? null;

  function applyTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) {
      setForm((f) => ({ ...f, template: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      template: id,
      title: t.title,
      type: t.type,
      agenda: t.agenda.join("\n"),
    }));
  }

  function submitMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const start = new Date(`${form.date}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`);
    const end = new Date(`${form.date}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`);

    addMeeting({
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      start: start.toISOString(),
      end: end.toISOString(),
      location: form.location.trim() || undefined,
      participants: form.participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      agenda: form.agenda
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
      notes: form.notes.trim() || undefined,
      template: form.template || undefined,
    });
    toast.success("Meeting scheduled");
    setOpen(false);
    setForm({
      title: "",
      type: "internal",
      status: "scheduled",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "14:00",
      endTime: "15:00",
      location: "",
      participants: "",
      agenda: "",
      notes: "",
      template: "",
    });
  }

  function toggleAction(meeting: Meeting, actionId: string) {
    updateMeeting(meeting.id, {
      actionItems: meeting.actionItems.map((a) =>
        a.id === actionId ? { ...a, done: !a.done } : a
      ),
    });
  }

  function addActionItem(meeting: Meeting, text: string) {
    const t = text.trim();
    if (!t) return;
    updateMeeting(meeting.id, {
      actionItems: [...meeting.actionItems, { id: uid("ai"), text: t, done: false }],
    });
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Meetings"
        description="Agendas, participants, notes, and action items in one place."
        actions={
          <>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search meetings…"
                className="pl-9"
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Add meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New meeting</DialogTitle>
                </DialogHeader>
                <form onSubmit={submitMeeting} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--fg-muted)]">Template</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                      value={form.template}
                      onChange={(e) => applyTemplate(e.target.value)}
                    >
                      <option value="">Blank meeting</option>
                      {TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    placeholder="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm capitalize"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value as MeetingType })
                      }
                    >
                      {MEETING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {labelize(t)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm capitalize"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as MeetingStatus })
                      }
                    >
                      {MEETING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {labelize(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Location / link"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                  <Input
                    placeholder="Participants (comma-separated)"
                    value={form.participants}
                    onChange={(e) => setForm({ ...form, participants: e.target.value })}
                  />
                  <Textarea
                    placeholder="Agenda (one item per line)"
                    value={form.agenda}
                    onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                    rows={4}
                  />
                  <Textarea
                    placeholder="Notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm capitalize"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All types</option>
          {MEETING_TYPES.map((t) => (
            <option key={t} value={t}>
              {labelize(t)}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm capitalize"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {MEETING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {labelize(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="overflow-hidden lg:max-h-[calc(100vh-220px)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="border-b border-[var(--border)] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              {filtered.length} meeting{filtered.length === 1 ? "" : "s"}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No meetings"
                  description="Adjust filters or schedule a new meeting."
                  action={
                    <Button size="sm" onClick={() => setOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-1">
                  {filtered.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(m.id)}
                        className={cn(
                          "w-full rounded-xl px-3 py-3 text-left transition-colors",
                          selectedIdResolved === m.id
                            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "hover:bg-[var(--surface-2)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium leading-snug text-[var(--fg)]">{m.title}</p>
                          <Badge variant={statusVariant(m.status)} className="shrink-0 capitalize">
                            {labelize(m.status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-[var(--fg-muted)]">
                          {format(parseISO(m.start), "MMM d · h:mm a")}
                          <span className="mx-1">·</span>
                          <span className="capitalize">{labelize(m.type)}</span>
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <MeetingDetail
                meeting={selected}
                tasks={tasks}
                projects={projects}
                onUpdate={updateMeeting}
                onToggleAction={toggleAction}
                onAddAction={addActionItem}
              />
            </motion.div>
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  icon={Users}
                  title="Select a meeting"
                  description="Choose a meeting from the list to view details."
                />
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MeetingDetail({
  meeting,
  tasks,
  projects,
  onUpdate,
  onToggleAction,
  onAddAction,
}: {
  meeting: Meeting;
  tasks: { id: string; title: string }[];
  projects: { id: string; name: string; color: string }[];
  onUpdate: (id: string, patch: Partial<Meeting>) => void;
  onToggleAction: (m: Meeting, actionId: string) => void;
  onAddAction: (m: Meeting, text: string) => void;
}) {
  const [newAction, setNewAction] = useState("");
  const linkedTasks = tasks.filter((t) => meeting.linkedTaskIds.includes(t.id));
  const linkedProject = projects.find((p) => p.id === meeting.linkedProjectId);

  return (
    <Card>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{meeting.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="capitalize">{labelize(meeting.type)}</Badge>
              <Badge variant={statusVariant(meeting.status)} className="capitalize">
                {labelize(meeting.status)}
              </Badge>
              {meeting.template && <Badge variant="outline">Template · {meeting.template}</Badge>}
            </div>
          </div>
          <select
            className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm capitalize"
            value={meeting.status}
            onChange={(e) => {
              onUpdate(meeting.id, { status: e.target.value as MeetingStatus });
              toast.success("Status updated");
            }}
          >
            {MEETING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Meta
            icon={Clock}
            label="When"
            value={`${format(parseISO(meeting.start), "EEE, MMM d · h:mm a")} – ${format(parseISO(meeting.end), "h:mm a")}`}
          />
          <Meta
            icon={MapPin}
            label="Where"
            value={meeting.location || "No location"}
          />
        </div>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Participants</h3>
          {meeting.participants.length === 0 ? (
            <p className="text-sm text-[var(--fg-muted)]">No participants listed.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {meeting.participants.map((p) => (
                <Badge key={p} variant="secondary" className="gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] text-[var(--accent)]">
                    {p.charAt(0)}
                  </span>
                  {p}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Agenda</h3>
          {meeting.agenda.length === 0 ? (
            <p className="text-sm text-[var(--fg-muted)]">No agenda items.</p>
          ) : (
            <ol className="space-y-2">
              {meeting.agenda.map((item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2 text-sm"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)]">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Notes</h3>
          <Textarea
            value={meeting.notes ?? ""}
            onChange={(e) => onUpdate(meeting.id, { notes: e.target.value })}
            placeholder="Meeting notes…"
            rows={4}
            className="min-h-[100px]"
          />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Action items</h3>
            <span className="text-xs text-[var(--fg-muted)]">
              {meeting.actionItems.filter((a) => a.done).length}/{meeting.actionItems.length} done
            </span>
          </div>
          {meeting.actionItems.length === 0 ? (
            <p className="mb-3 text-sm text-[var(--fg-muted)]">No action items yet.</p>
          ) : (
            <ul className="mb-3 space-y-2">
              {meeting.actionItems.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  <Checkbox
                    checked={a.done}
                    onCheckedChange={() => onToggleAction(meeting, a.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", a.done && "text-[var(--fg-muted)] line-through")}>
                      {a.text}
                    </p>
                    {a.assignee && (
                      <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{a.assignee}</p>
                    )}
                  </div>
                  {a.done && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAddAction(meeting, newAction);
              setNewAction("");
              toast.success("Action item added");
            }}
          >
            <Input
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              placeholder="Add action item…"
            />
            <Button type="submit" variant="secondary" size="sm">
              Add
            </Button>
          </form>
        </section>

        {(linkedTasks.length > 0 || linkedProject || meeting.followUps.length > 0) && (
          <section className="space-y-3 border-t border-[var(--border)] pt-4">
            {linkedProject && (
              <div className="flex items-center gap-2 text-sm">
                <FolderKanban className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-[var(--fg-muted)]">Project</span>
                <Badge variant="outline" className="gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: linkedProject.color }}
                  />
                  {linkedProject.name}
                </Badge>
              </div>
            )}
            {linkedTasks.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                  <ListTodo className="h-4 w-4" />
                  Linked tasks
                </div>
                <div className="flex flex-wrap gap-2">
                  {linkedTasks.map((t) => (
                    <Badge key={t.id} variant="secondary">
                      {t.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {meeting.followUps.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Follow-ups</p>
                <ul className="list-inside list-disc text-sm text-[var(--fg-muted)]">
                  {meeting.followUps.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
