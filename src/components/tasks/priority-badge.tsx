"use client";

import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/types";

const MAP: Record<Priority, "urgent" | "high" | "medium" | "low" | "none"> = {
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
  none: "none",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={MAP[priority]}>{priority}</Badge>;
}
