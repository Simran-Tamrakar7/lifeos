"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/page";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { QuoteCard } from "@/components/dashboard/quote-card";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings";
import { CalendarPreview } from "@/components/dashboard/calendar-preview";
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { HabitHeatmap } from "@/components/dashboard/habit-heatmap";
import { PomodoroMini } from "@/components/dashboard/pomodoro-mini";
import { MoodSelector } from "@/components/dashboard/mood-selector";
import { StreaksXp } from "@/components/dashboard/streaks-xp";
import { QuickActions } from "@/components/dashboard/quick-actions";

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const hydrated = useLifeOSStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-2/3" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <GreetingHeader />

      <motion.div
        {...fade}
        transition={{ delay: 0.05, duration: 0.35 }}
      >
        <AnalyticsCards />
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div {...fade} transition={{ delay: 0.08 }} className="xl:col-span-1">
          <WeatherCard />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.1 }} className="xl:col-span-1">
          <QuoteCard />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.12 }} className="md:col-span-2 xl:col-span-2">
          <TodayFocus />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.14 }} className="lg:col-span-2">
          <TodayTasks />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.16 }} className="space-y-4">
          <PomodoroMini />
          <MoodSelector />
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.18 }}>
          <UpcomingMeetings />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.2 }}>
          <CalendarPreview />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.22 }}>
          <StreaksXp />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.24 }} className="lg:col-span-2">
          <HabitHeatmap />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.26 }}>
          <QuickActions />
        </motion.div>
      </div>
    </div>
  );
}
