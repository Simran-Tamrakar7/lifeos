import type { LifeOSData, UserSettings } from "@/types";

export function defaultSettings(): UserSettings {
  return {
    name: "",
    email: "",
    theme: "dark",
    accent: "blue",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    focusMinutes: 25,
    breakMinutes: 5,
    dailyGoalTasks: 5,
    notifications: true,
    compactMode: false,
    daylightMode: false,
    weekStartsOn: 1,
    defaultView: "today",
    reducedMotion: false,
    highContrast: false,
    displayFont: "fraunces",
    bodyFont: "public-sans",
    monoFont: "ibm-plex-mono",
    fontScale: "md",
    motion: "full",
    pageTransitions: true,
    radius: "soft",
    wallpaper: "blobs",
    glassEffects: true,
  };
}

/** Fresh empty workspace — no demo clutter */
export function createEmptyData(): LifeOSData {
  return {
    settings: defaultSettings(),
    categories: [
      { id: "cat_work", name: "Work", color: "#5C7A99", order: 0 },
      { id: "cat_personal", name: "Personal", color: "#6B8F71", order: 1 },
    ],
    folders: [
      { id: "fld_inbox", name: "Inbox", parentId: undefined },
      { id: "fld_archive", name: "Archive", parentId: undefined },
    ],
    tasks: [],
    events: [],
    meetings: [],
    notes: [],
    journal: [],
    projects: [],
    goals: [],
    habits: [],
    finance: [],
    health: [],
    documents: [],
    notifications: [],
    bugs: [],
    testCases: [],
    releases: [],
    achievements: [
      {
        id: "ach_first_task",
        title: "First step",
        description: "Complete your first task",
        icon: "✓",
        xp: 50,
      },
      {
        id: "ach_streak7",
        title: "Week warrior",
        description: "7-day streak",
        icon: "🔥",
        xp: 100,
      },
      {
        id: "ach_konami",
        title: "Secret agent",
        description: "Enter the Konami code",
        icon: "🎮",
        xp: 500,
      },
    ],
    focusSessions: [],
    xp: 0,
    level: 1,
    dailyStreak: 0,
    todayFocus: "",
    todayMood: undefined,
  };
}
