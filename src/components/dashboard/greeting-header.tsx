"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { greeting } from "@/lib/utils";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function GreetingHeader() {
  const name = useLifeOSStore((s) => s.settings.name);
  const tasks = useLifeOSStore((s) => s.tasks);
  const meetings = useLifeOSStore((s) => s.meetings);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tasksRemaining = useMemo(
    () =>
      tasks.filter(
        (t) => !t.archived && t.status !== "done" && t.status !== "cancelled"
      ).length,
    [tasks]
  );

  const meetingsToday = useMemo(() => {
    const today = startOfDay(now);
    return meetings.filter((m) => isSameDay(parseISO(m.start), today)).length;
  }, [meetings, now]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting(name)}
        </h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          {format(now, "EEEE, MMMM d")}
        </p>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          <span className="font-display text-base text-[var(--accent)] tabular-nums">
            {tasksRemaining}
          </span>{" "}
          tasks remaining
          <span className="mx-1.5 text-[var(--fg-muted)]/60">·</span>
          <span className="font-display text-base text-[var(--accent)] tabular-nums">
            {meetingsToday}
          </span>{" "}
          meetings today
        </p>
      </div>
      <div className="font-display text-3xl font-medium tabular-nums tracking-tight text-[var(--fg)] sm:text-4xl">
        {format(now, "h:mm")}
        <span className="ml-1 text-lg text-[var(--fg-muted)]">{format(now, "a")}</span>
        <span className="ml-2 text-sm font-normal text-[var(--fg-muted)] tabular-nums">
          :{format(now, "ss")}
        </span>
      </div>
    </motion.div>
  );
}
