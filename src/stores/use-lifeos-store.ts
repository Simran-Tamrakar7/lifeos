"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { formatISO, startOfDay } from "date-fns";
import type {
  Task,
  Meeting,
  Note,
  JournalEntry,
  Project,
  Goal,
  Habit,
  FinanceTxn,
  HealthEntry,
  DocumentItem,
  NotificationItem,
  Bug,
  TestCase,
  CalendarEvent,
  FocusSession,
  UserSettings,
  LifeOSData,
  TaskStatus,
} from "@/types";
import { createSeedData } from "@/data/seed";
import { uid } from "@/lib/utils";
import { parseNaturalLanguage } from "@/lib/nl-parse";

type LifeOSState = LifeOSData & {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  resetData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;

  // Settings
  updateSettings: (patch: Partial<UserSettings>) => void;
  setTodayFocus: (v: string) => void;
  setTodayMood: (v: number) => void;

  // Tasks
  addTask: (partial: Partial<Task> & { title: string }) => Task;
  captureTask: (nl: string) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Meetings
  addMeeting: (partial: Partial<Meeting> & { title: string }) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;

  // Notes
  addNote: (partial?: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Journal
  addJournal: (entry: Omit<JournalEntry, "id">) => void;
  updateJournal: (id: string, patch: Partial<JournalEntry>) => void;
  deleteJournal: (id: string) => void;

  // Projects
  addProject: (partial: Partial<Project> & { name: string }) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Goals
  addGoal: (partial: Partial<Goal> & { title: string }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Habits
  addHabit: (partial: Partial<Habit> & { name: string }) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitToday: (id: string) => void;

  // Finance
  addFinance: (txn: Omit<FinanceTxn, "id">) => void;
  deleteFinance: (id: string) => void;

  // Health
  upsertHealth: (entry: Omit<HealthEntry, "id"> & { id?: string }) => void;

  // Documents
  addDocument: (doc: Omit<DocumentItem, "id">) => void;
  updateDocument: (id: string, patch: Partial<DocumentItem>) => void;
  deleteDocument: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;

  // QA
  addBug: (b: Omit<Bug, "id" | "createdAt">) => void;
  updateBug: (id: string, patch: Partial<Bug>) => void;
  updateTestCase: (id: string, patch: Partial<TestCase>) => void;

  // Calendar
  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Focus / XP
  completeFocusSession: (session: Omit<FocusSession, "id" | "completedAt">) => void;
  addXp: (amount: number) => void;
  unlockAchievement: (id: string) => void;
  bumpStreak: () => void;
};

const seed = createSeedData();

export const useLifeOSStore = create<LifeOSState>()(
  persist(
    (set, get) => ({
      ...seed,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      resetData: () => set({ ...createSeedData(), hydrated: true }),

      exportData: () => {
        const state = get();
        return JSON.stringify(
          {
            tasks: state.tasks,
            events: state.events,
            meetings: state.meetings,
            notes: state.notes,
            folders: state.folders,
            journal: state.journal,
            projects: state.projects,
            goals: state.goals,
            habits: state.habits,
            finance: state.finance,
            health: state.health,
            documents: state.documents,
            notifications: state.notifications,
            bugs: state.bugs,
            testCases: state.testCases,
            releases: state.releases,
            achievements: state.achievements,
            focusSessions: state.focusSessions,
            settings: state.settings,
            xp: state.xp,
            level: state.level,
            dailyStreak: state.dailyStreak,
            lastActiveDate: state.lastActiveDate,
            todayFocus: state.todayFocus,
            todayMood: state.todayMood,
          },
          null,
          2
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json) as Partial<LifeOSData>;
          set({ ...createSeedData(), ...data, hydrated: true });
          return true;
        } catch {
          return false;
        }
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setTodayFocus: (v) => set({ todayFocus: v }),
      setTodayMood: (v) => set({ todayMood: v }),

      addTask: (partial) => {
        const task: Task = {
          id: uid("task"),
          description: "",
          status: "todo",
          priority: "medium",
          tags: [],
          subtasks: [],
          dependencies: [],
          comments: [],
          activity: [
            {
              id: uid("a"),
              action: "created task",
              actor: get().settings.name,
              createdAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        get().addXp(10);
        return task;
      },

      captureTask: (nl) => {
        const parsed = parseNaturalLanguage(nl);
        return get().addTask({
          title: parsed.title,
          dueDate: parsed.dueDate,
          priority: parsed.priority ?? "medium",
          tags: parsed.tags,
          estimateMinutes: parsed.estimateMinutes,
          activity: [
            {
              id: uid("a"),
              action: "created via AI capture",
              actor: "LifeOS AI",
              createdAt: new Date().toISOString(),
            },
          ],
        });
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      moveTask: (id, status) => {
        get().updateTask(id, { status });
        if (status === "done") get().addXp(25);
      },

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const toggle = (subs: typeof t.subtasks): typeof t.subtasks =>
              subs.map((st) => {
                if (st.id === subtaskId) return { ...st, completed: !st.completed };
                if (st.subtasks) return { ...st, subtasks: toggle(st.subtasks) };
                return st;
              });
            return { ...t, subtasks: toggle(t.subtasks), updatedAt: new Date().toISOString() };
          }),
        })),

      addMeeting: (partial) => {
        const m: Meeting = {
          id: uid("meet"),
          type: "internal",
          status: "scheduled",
          start: new Date().toISOString(),
          end: new Date(Date.now() + 3600000).toISOString(),
          agenda: [],
          participants: [],
          actionItems: [],
          followUps: [],
          linkedTaskIds: [],
          createdAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({ meetings: [m, ...s.meetings] }));
      },

      updateMeeting: (id, patch) =>
        set((s) => ({
          meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      deleteMeeting: (id) =>
        set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) })),

      addNote: (partial) => {
        const note: Note = {
          id: uid("note"),
          title: "Untitled",
          content: "",
          tags: [],
          backlinks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
          ),
        })),

      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      addJournal: (entry) =>
        set((s) => ({
          journal: [{ ...entry, id: uid("j") }, ...s.journal],
        })),

      updateJournal: (id, patch) =>
        set((s) => ({
          journal: s.journal.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        })),

      deleteJournal: (id) =>
        set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),

      addProject: (partial) => {
        const p: Project = {
          id: uid("proj"),
          description: "",
          status: "planning",
          priority: "medium",
          progress: 0,
          color: "#3b82f6",
          milestones: [],
          tags: [],
          createdAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({ projects: [p, ...s.projects] }));
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      addGoal: (partial) => {
        const g: Goal = {
          id: uid("goal"),
          category: "custom",
          progress: 0,
          target: 100,
          unit: "%",
          milestones: [],
          createdAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({ goals: [g, ...s.goals] }));
      },

      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addHabit: (partial) => {
        const h: Habit = {
          id: uid("hab"),
          frequency: "daily",
          color: "#3b82f6",
          targetPerPeriod: 1,
          completions: [],
          streak: 0,
          bestStreak: 0,
          createdAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({ habits: [h, ...s.habits] }));
      },

      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),

      deleteHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      toggleHabitToday: (id) => {
        const today = formatISO(startOfDay(new Date()), { representation: "date" });
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const has = h.completions.includes(today);
            const completions = has
              ? h.completions.filter((c) => c !== today)
              : [today, ...h.completions];
            const streak = has ? Math.max(0, h.streak - 1) : h.streak + 1;
            return {
              ...h,
              completions,
              streak,
              bestStreak: Math.max(h.bestStreak, streak),
            };
          }),
        }));
        get().addXp(15);
      },

      addFinance: (txn) =>
        set((s) => ({ finance: [{ ...txn, id: uid("fin") }, ...s.finance] })),

      deleteFinance: (id) =>
        set((s) => ({ finance: s.finance.filter((f) => f.id !== id) })),

      upsertHealth: (entry) =>
        set((s) => {
          const existing = s.health.find((h) => h.date === entry.date);
          if (existing) {
            return {
              health: s.health.map((h) =>
                h.date === entry.date ? { ...h, ...entry, id: h.id } : h
              ),
            };
          }
          return { health: [{ ...entry, id: uid("hlt") }, ...s.health] };
        }),

      addDocument: (doc) =>
        set((s) => ({ documents: [{ ...doc, id: uid("doc") }, ...s.documents] })),

      updateDocument: (id, patch) =>
        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      deleteDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid("n"), read: false, createdAt: new Date().toISOString() },
            ...s.notifications,
          ],
        })),

      addBug: (b) =>
        set((s) => ({
          bugs: [{ ...b, id: uid("bug"), createdAt: new Date().toISOString() }, ...s.bugs],
        })),

      updateBug: (id, patch) =>
        set((s) => ({
          bugs: s.bugs.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      updateTestCase: (id, patch) =>
        set((s) => ({
          testCases: s.testCases.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      addEvent: (e) =>
        set((s) => ({ events: [{ ...e, id: uid("evt") }, ...s.events] })),

      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      completeFocusSession: (session) => {
        set((s) => ({
          focusSessions: [
            {
              ...session,
              id: uid("fs"),
              completedAt: new Date().toISOString(),
            },
            ...s.focusSessions,
          ],
        }));
        get().addXp(session.durationMinutes);
      },

      addXp: (amount) =>
        set((s) => {
          const xp = s.xp + amount;
          const level = Math.floor(xp / 200) + 1;
          return { xp, level };
        }),

      unlockAchievement: (id) =>
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id && !a.unlockedAt
              ? { ...a, unlockedAt: new Date().toISOString() }
              : a
          ),
        })),

      bumpStreak: () => {
        const today = formatISO(startOfDay(new Date()), { representation: "date" });
        const s = get();
        if (s.lastActiveDate === today) return;
        const yesterday = formatISO(startOfDay(new Date(Date.now() - 86400000)), {
          representation: "date",
        });
        const dailyStreak =
          s.lastActiveDate === yesterday ? s.dailyStreak + 1 : 1;
        set({ dailyStreak, lastActiveDate: today });
        if (dailyStreak >= 7) get().unlockAchievement("ach_streak7");
      },
    }),
    {
      name: "lifeos:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const {
          hydrated: _h,
          setHydrated: _sh,
          // strip actions
          ...rest
        } = s as LifeOSState & Record<string, unknown>;
        void _h;
        void _sh;
        // Keep only data fields — zustand persist will still serialize functions unless we pick
        return {
          tasks: rest.tasks,
          events: rest.events,
          meetings: rest.meetings,
          notes: rest.notes,
          folders: rest.folders,
          journal: rest.journal,
          projects: rest.projects,
          goals: rest.goals,
          habits: rest.habits,
          finance: rest.finance,
          health: rest.health,
          documents: rest.documents,
          notifications: rest.notifications,
          bugs: rest.bugs,
          testCases: rest.testCases,
          releases: rest.releases,
          achievements: rest.achievements,
          focusSessions: rest.focusSessions,
          settings: rest.settings,
          xp: rest.xp,
          level: rest.level,
          dailyStreak: rest.dailyStreak,
          lastActiveDate: rest.lastActiveDate,
          todayFocus: rest.todayFocus,
          todayMood: rest.todayMood,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        state?.bumpStreak();
      },
    }
  )
);
