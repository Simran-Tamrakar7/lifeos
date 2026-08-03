"use client";

import { CloudSun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeatherCard() {
  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-[var(--fg-muted)]">
          <CloudSun className="h-4 w-4 text-[var(--accent)]" />
          Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-3">
        <div>
          <p className="font-display text-3xl font-semibold tracking-tight">72°</p>
          <p className="text-sm text-[var(--fg-muted)]">Partly cloudy · San Francisco</p>
        </div>
        <div className="rounded-2xl bg-[var(--accent-soft)] p-3">
          <CloudSun className="h-8 w-8 text-[var(--accent)]" />
        </div>
      </CardContent>
    </Card>
  );
}
