"use client";

import { useMemo, useState } from "react";
import { formatISO, startOfDay } from "date-fns";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PROMPTS = [
  "What would make today a win?",
  "What are you grateful for right now?",
  "What drained your energy today?",
  "What did you learn?",
];

export default function JournalPage() {
  const journal = useLifeOSStore((s) => s.journal);
  const addJournal = useLifeOSStore((s) => s.addJournal);
  const deleteJournal = useLifeOSStore((s) => s.deleteJournal);
  const today = formatISO(startOfDay(new Date()), { representation: "date" });

  const [type, setType] = useState<"morning" | "evening" | "gratitude" | "free">("morning");
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(4);
  const [stress, setStress] = useState(2);
  const [body, setBody] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const prompt = useMemo(() => PROMPTS[new Date().getDate() % PROMPTS.length], []);

  const save = () => {
    addJournal({
      date: today,
      type,
      mood,
      energy,
      stress,
      gratitude: gratitude.split(",").map((s) => s.trim()).filter(Boolean),
      wins: wins.split(",").map((s) => s.trim()).filter(Boolean),
      challenges: challenges.split(",").map((s) => s.trim()).filter(Boolean),
      body,
      prompt,
    });
    setBody("");
    setGratitude("");
    setWins("");
    setChallenges("");
    toast.success("Journal entry saved");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Morning clarity, evening reflection, and gratitude."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>New entry</CardTitle>
            <p className="text-sm text-[var(--fg-muted)]">Prompt: {prompt}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
              <TabsList>
                <TabsTrigger value="morning">Morning</TabsTrigger>
                <TabsTrigger value="evening">Evening</TabsTrigger>
                <TabsTrigger value="gratitude">Gratitude</TabsTrigger>
                <TabsTrigger value="free">Free</TabsTrigger>
              </TabsList>
            </Tabs>
            {(["mood", "energy", "stress"] as const).map((key) => {
              const val = key === "mood" ? mood : key === "energy" ? energy : stress;
              const set = key === "mood" ? setMood : key === "energy" ? setEnergy : setStress;
              return (
                <label key={key} className="block text-sm capitalize">
                  <span className="mb-1 flex justify-between text-[var(--fg-muted)]">
                    {key} <span>{val}/5</span>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={val}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
              );
            })}
            <Input placeholder="Gratitude (comma separated)" value={gratitude} onChange={(e) => setGratitude(e.target.value)} />
            <Input placeholder="Wins" value={wins} onChange={(e) => setWins(e.target.value)} />
            <Input placeholder="Challenges" value={challenges} onChange={(e) => setChallenges(e.target.value)} />
            <Textarea placeholder="Write freely…" value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
            <Button onClick={save}><Plus className="h-4 w-4" /> Save entry</Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {journal.length === 0 ? (
            <EmptyState icon={BookOpen} title="No entries yet" description="Start with a morning reflection." />
          ) : (
            journal.map((j) => (
              <Card key={j.id} className="glass">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge>{j.type}</Badge>
                      <span className="text-xs text-[var(--fg-muted)]">{j.date}</span>
                      <span className="text-xs">😊 {j.mood} · ⚡ {j.energy} · 😰 {j.stress}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{j.body || j.gratitude.join(", ")}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteJournal(j.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
