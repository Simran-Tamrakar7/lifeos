"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { CalendarEvent, Meeting, Task } from "@/types";

const CALENDAR_COLORS: Record<string, string> = {
  Focus: "#3b82f6",
  Work: "#8b5cf6",
  Meetings: "#a855f7",
  Tasks: "#f59e0b",
  Health: "#10b981",
  Birthdays: "#f43f5e",
  Personal: "#06b6d4",
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7–20

type CalItem =
  | { kind: "event"; data: CalendarEvent }
  | { kind: "meeting"; data: Meeting }
  | { kind: "task"; data: Task };

function eventColor(ev: CalendarEvent) {
  return ev.color || CALENDAR_COLORS[ev.calendar] || "var(--accent)";
}

function matchesSearch(text: string, q: string) {
  return !q || text.toLowerCase().includes(q.toLowerCase());
}

export default function CalendarPage() {
  const events = useLifeOSStore((s) => s.events);
  const meetings = useLifeOSStore((s) => s.meetings);
  const tasks = useLifeOSStore((s) => s.tasks);
  const addEvent = useLifeOSStore((s) => s.addEvent);
  const weekStartsOn = useLifeOSStore((s) => s.settings.weekStartsOn ?? 1);
  const weekOpts = { weekStartsOn } as const;

  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    allDay: false,
    calendar: "Work",
  });

  const filteredEvents = useMemo(
    () => events.filter((e) => matchesSearch(`${e.title} ${e.calendar} ${e.description ?? ""}`, search)),
    [events, search]
  );

  // ponytail: recompute per render; React Compiler / small lists make memoizing the day scan unnecessary
  function itemsForDay(day: Date): CalItem[] {
    const list: CalItem[] = [];
    const meetingIdsOnEvents = new Set(
      filteredEvents.filter((e) => e.meetingId).map((e) => e.meetingId!)
    );
    const taskIdsOnEvents = new Set(
      filteredEvents.filter((e) => e.taskId).map((e) => e.taskId!)
    );

    for (const e of filteredEvents) {
      if (isSameDay(parseISO(e.start), day)) list.push({ kind: "event", data: e });
    }
    // Skip meetings already represented by a linked calendar event (avoids duplicates)
    for (const m of meetings) {
      if (meetingIdsOnEvents.has(m.id)) continue;
      if (
        isSameDay(parseISO(m.start), day) &&
        matchesSearch(`${m.title} ${m.type}`, search)
      ) {
        list.push({ kind: "meeting", data: m });
      }
    }
    for (const t of tasks) {
      if (taskIdsOnEvents.has(t.id)) continue;
      if (
        t.dueDate &&
        t.status !== "done" &&
        t.status !== "cancelled" &&
        isSameDay(parseISO(t.dueDate), day) &&
        matchesSearch(t.title, search)
      ) {
        list.push({ kind: "task", data: t });
      }
    }
    return list.sort((a, b) => {
      const as =
        a.kind === "task"
          ? a.data.dueDate!
          : a.kind === "event"
            ? a.data.start
            : a.data.start;
      const bs =
        b.kind === "task"
          ? b.data.dueDate!
          : b.kind === "event"
            ? b.data.start
            : b.data.start;
      return as.localeCompare(bs);
    });
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), weekOpts);
    const end = endOfWeek(endOfMonth(cursor), weekOpts);
    return eachDayOfInterval({ start, end });
  }, [cursor, weekStartsOn]);

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(cursor, weekOpts),
        end: endOfWeek(cursor, weekOpts),
      }),
    [cursor, weekStartsOn]
  );

  const agendaDays = eachDayOfInterval({
    start: startOfDay(cursor),
    end: endOfDay(addDays(startOfDay(cursor), 21)),
  });
  const agendaItems = agendaDays
    .map((d) => ({ day: d, items: itemsForDay(d) }))
    .filter((x) => x.items.length > 0);
  const calendars = useMemo(() => {
    const set = new Set(events.map((e) => e.calendar));
    return Array.from(set).sort();
  }, [events]);

  function nav(dir: -1 | 1) {
    if (view === "month") setCursor((c) => (dir === 1 ? addMonths(c, 1) : subMonths(c, 1)));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => addDays(c, dir));
  }

  function goToday() {
    const t = startOfDay(new Date());
    setCursor(t);
    setSelected(t);
  }

  function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const base = parseISO(form.date);
    const start = form.allDay
      ? startOfDay(base).toISOString()
      : setMinutes(setHours(base, sh), sm).toISOString();
    const end = form.allDay
      ? endOfDay(base).toISOString()
      : setMinutes(setHours(base, eh), em).toISOString();

    addEvent({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      start,
      end,
      allDay: form.allDay,
      calendar: form.calendar,
      color: CALENDAR_COLORS[form.calendar] || "#3b82f6",
      reminder: true,
    });
    toast.success(
      /meet/i.test(form.calendar)
        ? "Event added · synced to Meetings"
        : "Event added"
    );
    setOpen(false);
    setForm({
      title: "",
      description: "",
      date: format(selected, "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      calendar: "Work",
    });
  }

  const label =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(cursor, weekOpts), "MMM d")} – ${format(endOfWeek(cursor, weekOpts), "MMM d, yyyy")}`
        : format(cursor, "EEEE, MMM d, yyyy");

  const weekdayLabels =
    weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Calendar"
        description="Month, week, day, and agenda — events, meetings, and due tasks."
        actions={
          <>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9"
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() =>
                    setForm((f) => ({ ...f, date: format(selected, "yyyy-MM-dd") }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New event</DialogTitle>
                </DialogHeader>
                <form onSubmit={submitEvent} className="space-y-3">
                  <Input
                    placeholder="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    autoFocus
                  />
                  <Textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                    <select
                      className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                      value={form.calendar}
                      onChange={(e) => setForm({ ...form, calendar: e.target.value })}
                    >
                      {["Meetings", "Work", "Focus", "Personal", "Health", "Tasks", "Birthdays"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                          {c === "Meetings" ? " (syncs to Meetings)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                      className="rounded"
                    />
                    All day
                  </label>
                  {!form.allDay && (
                    <div className="grid grid-cols-2 gap-3">
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
                  )}
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {calendars.map((c) => (
          <Badge key={c} variant="outline" className="gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CALENDAR_COLORS[c] || "var(--accent)" }}
            />
            {c}
          </Badge>
        ))}
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" /> Meetings
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <CheckSquare className="h-3 w-3" /> Tasks due
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <Tabs value={view} onValueChange={setView}>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button variant="ghost" size="icon" onClick={() => nav(-1)} aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-display min-w-[10ch] text-center text-2xl font-semibold tracking-tight sm:text-3xl">
                  {label}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => nav(1)} aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToday}
                  className="ml-1 rounded-lg"
                >
                  Today
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TabsList className="bg-[var(--surface-2)]">
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="agenda">Agenda</TabsTrigger>
                </TabsList>
                <Button
                  size="sm"
                  onClick={() => {
                    setForm((f) => ({ ...f, date: format(selected, "yyyy-MM-dd") }));
                    setOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Event
                </Button>
              </div>
            </div>

            <TabsContent value="month" className="mt-0">
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]">
                {weekdayLabels.map((d) => (
                  <div
                    key={d}
                    className="bg-[var(--surface-2)] px-1 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)] sm:text-xs"
                  >
                    {d}
                  </div>
                ))}
                {monthDays.map((day) => {
                  const items = itemsForDay(day);
                  const active = isSameDay(day, selected);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => {
                        setSelected(day);
                        setCursor(day);
                      }}
                      className={cn(
                        "min-h-[72px] bg-[var(--surface)] p-1.5 text-left transition-colors hover:bg-[var(--surface-2)] sm:min-h-[96px]",
                        !isSameMonth(day, cursor) && "opacity-40",
                        active && "ring-2 ring-inset ring-[var(--accent)]"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          isToday(day) && "bg-[var(--accent)] text-white"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {items.slice(0, 3).map((item) => (
                          <DayChip key={`${item.kind}-${item.data.id}`} item={item} compact />
                        ))}
                        {items.length > 3 && (
                          <p className="px-0.5 text-[10px] text-[var(--fg-muted)]">
                            +{items.length - 3} more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-0 overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-px rounded-xl border border-[var(--border)] bg-[var(--border)]">
                  <div className="bg-[var(--surface-2)]" />
                  {weekDays.map((d) => (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => {
                        setSelected(d);
                        setCursor(d);
                        setView("day");
                      }}
                      className={cn(
                        "bg-[var(--surface-2)] px-2 py-2 text-center text-xs transition-colors hover:bg-[var(--surface-3)]",
                        isSameDay(d, selected) && "text-[var(--accent)]"
                      )}
                    >
                      <div className="text-[var(--fg-muted)]">{format(d, "EEE")}</div>
                      <div
                        className={cn(
                          "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full font-semibold",
                          isToday(d) && "bg-[var(--accent)] text-white"
                        )}
                      >
                        {format(d, "d")}
                      </div>
                    </button>
                  ))}
                  {HOURS.map((h) => (
                    <HourRow key={h} hour={h} days={weekDays} itemsForDay={itemsForDay} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="day" className="mt-0">
              <DayView day={cursor} items={itemsForDay(cursor)} />
            </TabsContent>

            <TabsContent value="agenda" className="mt-0">
              {agendaItems.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Nothing upcoming"
                  description="No events, meetings, or due tasks in the next three weeks."
                  action={
                    <Button onClick={() => setOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add event
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {agendaItems.map(({ day, items }) => (
                    <motion.div
                      key={day.toISOString()}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-2xl p-4"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(day);
                          setCursor(day);
                          setView("day");
                        }}
                        className="mb-3 flex items-baseline gap-2 text-left"
                      >
                        <span className="font-display text-lg font-semibold">
                          {format(day, "EEEE")}
                        </span>
                        <span className="text-sm text-[var(--fg-muted)]">
                          {format(day, "MMM d, yyyy")}
                        </span>
                        {isToday(day) && <Badge>Today</Badge>}
                      </button>
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li key={`${item.kind}-${item.data.id}`}>
                            <AgendaRow item={item} />
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected day strip on month */}
      <AnimatePresence>
        {view === "month" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">
                    {format(selected, "EEEE, MMM d")}
                  </h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setForm((f) => ({ ...f, date: format(selected, "yyyy-MM-dd") }));
                      setOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
                {itemsForDay(selected).length === 0 ? (
                  <p className="text-sm text-[var(--fg-muted)]">No items this day.</p>
                ) : (
                  <ul className="space-y-2">
                    {itemsForDay(selected).map((item) => (
                      <li key={`${item.kind}-${item.data.id}`}>
                        <AgendaRow item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DayChip({ item, compact }: { item: CalItem; compact?: boolean }) {
  if (item.kind === "event") {
    return (
      <div
        className={cn(
          "truncate rounded-md px-1 text-[10px] font-medium text-white sm:text-[11px]",
          compact ? "py-0.5" : "py-1"
        )}
        style={{ background: eventColor(item.data) }}
        title={item.data.title}
      >
        {item.data.allDay ? item.data.title : `${format(parseISO(item.data.start), "HH:mm")} ${item.data.title}`}
      </div>
    );
  }
  if (item.kind === "meeting") {
    return (
      <div
        className={cn(
          "truncate rounded-md bg-violet-500/15 px-1 text-[10px] font-medium text-violet-600 dark:text-violet-300 sm:text-[11px]",
          compact ? "py-0.5" : "py-1"
        )}
      >
        {format(parseISO(item.data.start), "HH:mm")} {item.data.title}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "truncate rounded-md bg-amber-500/15 px-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 sm:text-[11px]",
        compact ? "py-0.5" : "py-1"
      )}
    >
      Due · {item.data.title}
    </div>
  );
}

function AgendaRow({ item }: { item: CalItem }) {
  if (item.kind === "event") {
    const ev = item.data;
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: eventColor(ev) }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{ev.title}</p>
            <Badge variant="outline">{ev.calendar}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
            {ev.allDay
              ? "All day"
              : `${format(parseISO(ev.start), "h:mm a")} – ${format(parseISO(ev.end), "h:mm a")}`}
            {ev.description ? ` · ${ev.description}` : ""}
          </p>
        </div>
        <CalendarIcon className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
      </div>
    );
  }
  if (item.kind === "meeting") {
    const m = item.data;
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{m.title}</p>
            <Badge variant="secondary">{m.type.replaceAll("_", " ")}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
            {format(parseISO(m.start), "h:mm a")} – {format(parseISO(m.end), "h:mm a")}
            {m.location ? ` · ${m.location}` : ""}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-3">
      <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.data.title}</p>
        <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
          Task due · {item.data.priority} priority
        </p>
      </div>
    </div>
  );
}

function HourRow({
  hour,
  days,
  itemsForDay,
}: {
  hour: number;
  days: Date[];
  itemsForDay: (d: Date) => CalItem[];
}) {
  return (
    <>
      <div className="bg-[var(--surface)] py-2 pr-1 text-right text-[10px] text-[var(--fg-muted)]">
        {format(setHours(new Date(), hour), "ha")}
      </div>
      {days.map((d) => {
        const items = itemsForDay(d).filter((item) => {
          if (item.kind === "task") return hour === 8; // show due tasks once in morning slot
          const start = parseISO(item.kind === "event" ? item.data.start : item.data.start);
          return start.getHours() === hour;
        });
        return (
          <div
            key={d.toISOString() + hour}
            className="min-h-[44px] border-t border-[var(--border)] bg-[var(--surface)] p-0.5"
          >
            {items.map((item) => (
              <DayChip key={`${item.kind}-${item.data.id}`} item={item} />
            ))}
          </div>
        );
      })}
    </>
  );
}

function DayView({ day, items }: { day: Date; items: CalItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={`Free on ${format(day, "MMM d")}`}
        description="No events, meetings, or tasks due. Enjoy the open day."
      />
    );
  }
  return (
    <div className="space-y-2">
      {HOURS.map((h) => {
        const slot = items.filter((item) => {
          if (item.kind === "task") {
            const due = item.data.dueDate ? parseISO(item.data.dueDate) : null;
            return due ? due.getHours() === h || (h === 9 && due.getHours() < 7) : false;
          }
          if (item.kind === "event" && item.data.allDay) return h === 7;
          const start = parseISO(item.kind === "event" ? item.data.start : item.data.start);
          return start.getHours() === h;
        });
        if (slot.length === 0) return null;
        return (
          <div key={h} className="flex gap-3">
            <div className="w-14 shrink-0 pt-3 text-right text-xs text-[var(--fg-muted)]">
              {format(setHours(day, h), "h a")}
            </div>
            <div className="flex-1 space-y-2 border-l border-[var(--border)] pl-3">
              {slot.map((item) => (
                <AgendaRow key={`${item.kind}-${item.data.id}`} item={item} />
              ))}
            </div>
          </div>
        );
      })}
      {/* catch all-day / untimed leftovers */}
      {items
        .filter((item) => {
          if (item.kind === "event" && item.data.allDay) return true;
          if (item.kind === "task") return true;
          return false;
        })
        .filter((item) => {
          // only show if not already rendered in hour slots above for all-day at 7
          if (item.kind === "event" && item.data.allDay) return false;
          if (item.kind === "task") {
            const due = item.data.dueDate ? parseISO(item.data.dueDate) : null;
            if (!due) return true;
            const h = due.getHours();
            return h < 7 || h > 20;
          }
          return false;
        }).length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            Also today
          </p>
          {items
            .filter((item) => item.kind === "task")
            .map((item) => (
              <AgendaRow key={`${item.kind}-${item.data.id}`} item={item} />
            ))}
        </div>
      )}
    </div>
  );
}
