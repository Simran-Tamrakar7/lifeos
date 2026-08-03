import { describe, it, expect } from "vitest";
import { parseNaturalLanguage } from "@/lib/nl-parse";
import { cn, uid } from "@/lib/utils";

describe("parseNaturalLanguage", () => {
  it("parses tomorrow with time and tags", () => {
    const r = parseNaturalLanguage("Finish QA report tomorrow 10 AM #work !high");
    expect(r.title.toLowerCase()).toContain("finish qa report");
    expect(r.tags).toContain("work");
    expect(r.priority).toBe("high");
    expect(r.dueDate).toBeTruthy();
  });

  it("parses estimate", () => {
    const r = parseNaturalLanguage("Deep work ~90m");
    expect(r.estimateMinutes).toBe(90);
  });
});

describe("utils", () => {
  it("merges class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("generates ids", () => {
    expect(uid("task")).toMatch(/^task_/);
  });
});
