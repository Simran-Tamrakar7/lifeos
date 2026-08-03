"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { greeting } from "@/lib/utils";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function GreetingHeader() {
  const name = useLifeOSStore((s) => s.settings.name);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting(name)}
        </h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          {format(now, "EEEE, MMMM d")}
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
