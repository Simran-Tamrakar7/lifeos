"use client";

import { useMemo, useState } from "react";
import { isToday, parseISO } from "date-fns";
import { Sparkles, Mic, Send } from "lucide-react";
import { toast } from "sonner";
import { parseNaturalLanguage } from "@/lib/nl-parse";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Msg = { id: string; role: "user" | "assistant"; text: string };

export default function AIPage() {
  const captureTask = useLifeOSStore((s) => s.captureTask);
  const tasks = useLifeOSStore((s) => s.tasks);
  const meetings = useLifeOSStore((s) => s.meetings);
  const habits = useLifeOSStore((s) => s.habits);
  const todayFocus = useLifeOSStore((s) => s.todayFocus);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "1",
      role: "assistant",
      text: "I'm your LifeOS copilot. Try: “Finish QA report tomorrow 10 AM #work !high” — I'll turn it into a task.",
    },
  ]);

  const preview = useMemo(() => (input.trim() ? parseNaturalLanguage(input) : null), [input]);

  const briefing = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.dueDate && isToday(parseISO(t.dueDate)) && t.status !== "done");
    const todayMeetings = meetings.filter((m) => isToday(parseISO(m.start)));
    const pendingHabits = habits.length;
    return `Daily briefing\n• Focus: ${todayFocus || "Not set"}\n• ${todayTasks.length} tasks due today\n• ${todayMeetings.length} meetings\n• ${pendingHabits} habits to protect\n• Top task: ${todayTasks[0]?.title || "Inbox zero-ish"}`;
  }, [tasks, meetings, habits, todayFocus]);

  const send = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "user", text: userText }]);
    const task = captureTask(userText);
    setMsgs((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `Created task “${task.title}”${task.dueDate ? ` due ${new Date(task.dueDate).toLocaleString()}` : ""}${task.priority ? ` · ${task.priority}` : ""}${task.tags.length ? ` · #${task.tags.join(" #")}` : ""}.`,
      },
    ]);
    setInput("");
    toast.success("Task captured");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant" description="Natural language capture, briefings, and summaries." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass lg:col-span-2 flex min-h-[480px] flex-col">
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--accent)]" /> Copilot</CardTitle></CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-[var(--surface-2)]/50 p-3">
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "ml-auto bg-[var(--accent)] text-white"
                      : "bg-[var(--surface)] border border-[var(--border)]"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            {preview && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--fg-muted)]">
                Preview → <strong className="text-[var(--fg)]">{preview.title}</strong>
                {preview.dueDate && <> · {new Date(preview.dueDate).toLocaleString()}</>}
                {preview.priority && <Badge className="ml-2" variant={preview.priority}>{preview.priority}</Badge>}
                {preview.tags.map((t) => <Badge key={t} variant="secondary" className="ml-1">#{t}</Badge>)}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="icon" aria-label="Voice (placeholder)" onClick={() => toast.message("Voice-to-task coming soon")}>
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Finish report tomorrow 3 PM #work !high ~60m"
              />
              <Button onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader><CardTitle>Daily briefing</CardTitle></CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-[var(--fg-muted)]">{briefing}</pre>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader><CardTitle>Summaries</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--fg-muted)]">
              <p>Meeting summaries placeholder — paste notes later for AI distillation.</p>
              <p>OCR whiteboard → notes placeholder.</p>
              <p>Email-to-task forwarding placeholder.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
