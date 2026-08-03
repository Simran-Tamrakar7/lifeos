import { addDays, setHours, setMinutes, nextMonday, nextFriday, startOfTomorrow } from "date-fns";
import type { Priority } from "@/types";

export interface ParsedCapture {
  title: string;
  dueDate?: string;
  priority?: Priority;
  tags: string[];
  estimateMinutes?: number;
}

const PRIORITY_MAP: Record<string, Priority> = {
  urgent: "urgent",
  "p0": "urgent",
  high: "high",
  "p1": "high",
  medium: "medium",
  "p2": "medium",
  low: "low",
  "p3": "low",
};

/** Natural language quick-capture: "Finish QA report tomorrow 10 AM #work !high" */
export function parseNaturalLanguage(input: string): ParsedCapture {
  let text = input.trim();
  const tags: string[] = [];
  let priority: Priority | undefined;
  let dueDate: Date | undefined;
  let estimateMinutes: number | undefined;

  // Tags #foo
  text = text.replace(/#([\w-]+)/g, (_, t) => {
    tags.push(t);
    return "";
  });

  // Priority !high or p1
  text = text.replace(/!(urgent|high|medium|low|p[0-3])/gi, (_, p) => {
    priority = PRIORITY_MAP[p.toLowerCase()];
    return "";
  });

  // Estimate ~30m or ~1h
  text = text.replace(/~(\d+)\s*(m|min|mins|h|hr|hrs)/gi, (_, n, u) => {
    const num = Number(n);
    estimateMinutes = /h/i.test(u) ? num * 60 : num;
    return "";
  });

  const now = new Date();
  const lower = text.toLowerCase();

  if (/\btomorrow\b/i.test(text)) {
    dueDate = startOfTomorrow();
    text = text.replace(/\btomorrow\b/i, "");
  } else if (/\btoday\b/i.test(text)) {
    dueDate = now;
    text = text.replace(/\btoday\b/i, "");
  } else if (/\bnext monday\b/i.test(text)) {
    dueDate = nextMonday(now);
    text = text.replace(/\bnext monday\b/i, "");
  } else if (/\bnext friday\b/i.test(text)) {
    dueDate = nextFriday(now);
    text = text.replace(/\bnext friday\b/i, "");
  } else if (/\bin (\d+) days?\b/i.test(text)) {
    const m = text.match(/\bin (\d+) days?\b/i);
    if (m) {
      dueDate = addDays(now, Number(m[1]));
      text = text.replace(/\bin \d+ days?\b/i, "");
    }
  }

  const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (timeMatch && dueDate) {
    let h = Number(timeMatch[1]);
    const mins = timeMatch[2] ? Number(timeMatch[2]) : 0;
    const ap = timeMatch[3].toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    dueDate = setMinutes(setHours(dueDate, h), mins);
    text = text.replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/i, "");
  }

  // swallow leftover noise words used above
  void lower;

  return {
    title: text.replace(/\s+/g, " ").trim() || input.trim(),
    dueDate: dueDate?.toISOString(),
    priority,
    tags,
    estimateMinutes,
  };
}
