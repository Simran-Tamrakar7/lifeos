"use client";

import { useSyncExternalStore } from "react";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
];

function subscribe() {
  return () => {};
}

function getDayIndex() {
  return Math.floor(Date.now() / 86_400_000) % QUOTES.length;
}

export function QuoteCard() {
  const dayIndex = useSyncExternalStore(subscribe, getDayIndex, () => 0);
  const quote = QUOTES[dayIndex]!;

  return (
    <Card className="glass">
      <CardContent className="flex gap-3 pt-5">
        <Quote className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="text-sm leading-relaxed italic text-[var(--fg)]">&ldquo;{quote.text}&rdquo;</p>
          <p className="mt-2 text-xs text-[var(--fg-muted)]">— {quote.author}</p>
        </div>
      </CardContent>
    </Card>
  );
}
