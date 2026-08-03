"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

export function TaskCapture() {
  const captureTask = useLifeOSStore((s) => s.captureTask);
  const [value, setValue] = useState("");

  const submit = () => {
    const nl = value.trim();
    if (!nl) return;
    const task = captureTask(nl);
    toast.success(`Captured: ${task.title}`);
    setValue("");
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent)]" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder='Try: "Finish report tomorrow 10am #qa !high"'
          className="pl-9"
        />
      </div>
      <Button onClick={submit} disabled={!value.trim()}>
        Capture
      </Button>
    </div>
  );
}
