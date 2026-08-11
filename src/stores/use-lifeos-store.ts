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
  Category,
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

  // Categories
  addCategory: (partial: Partial<Category> & { name: string; color: string }) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;

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
            categories: state.categories,
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
          const seed = createSeedData();
          set({
            ...seed,
            ...data,
            categories: data.categories?.length ? data.categories : seed.categories,
            settings: { ...seed.settings, ...data.settings },
            hydrated: true,
          });
          return true;
        } catch {
          return false;
        }
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setTodayFocus: (v) => set({ todayFocus: v }),
      setTodayMood: (v) => set({ todayMood: v }),

      addCategory: (partial) => {
        const cat: Category = {
          id: uid("cat"),
          order: get().categories.length,
          ...partial,
          name: partial.name,
          color: partial.color,
        };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },

      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          notes: s.notes.map((n) =>
            n.categoryId === id ? { ...n, categoryId: undefined } : n
          ),
          tasks: s.tasks.map((t) =>
            t.categoryId === id ? { ...t, categoryId: undefined } : t
          ),
          meetings: s.meetings.map((m) =>
            m.categoryId === id ? { ...m, categoryId: undefined } : m
          ),
        })),

      reorderCategories: (orderedIds) =>
        set((s) => ({
          categories: orderedIds
            .map((id, order) => {
              const c = s.categories.find((x) => x.id === id);
              return c ? { ...c, order } : null;
            })
            .filter(Boolean) as Category[],
        })),

      addTask: (partial) => {
        const taskId = partial.id ?? uid("task");
        const now = new Date().toISOString();
        let eventId = partial.eventId;
        let event: CalendarEvent | undefined;

        // Task with due date → calendar event
        if (partial.dueDate && !eventId) {
          eventId = uid("evt");
          const start = new Date(partial.dueDate);
          const end = new Date(start.getTime() + 30 * 60000);
          event = {
            id: eventId,
            title: partial.title,
            description: partial.description,
            start: start.toISOString(),
            end: end.toISOString(),
            color: "#f59e0b",
            calendar: "Tasks",
            taskId,
            reminder: true,
          };
        }

        const task: Task = {
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
              createdAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
          ...partial,
          id: taskId,
          eventId,
        };
        set((s) => ({
          tasks: [task, ...s.tasks],
          events: event ? [event, ...s.events] : s.events,
        }));
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
        set((s) => {
          const prev = s.tasks.find((t) => t.id === id);
          if (!prev) return s;
          const next: Task = { ...prev, ...patch, updatedAt: new Date().toISOString() };
          let events = s.events;

          if (patch.dueDate !== undefined) {
            if (patch.dueDate && next.eventId) {
              const start = new Date(patch.dueDate);
              events = events.map((e) =>
                e.id === next.eventId
                  ? {
                      ...e,
                      title: next.title,
                      start: start.toISOString(),
                      end: new Date(start.getTime() + 30 * 60000).toISOString(),
                    }
                  : e
              );
            } else if (patch.dueDate && !next.eventId) {
              const eventId = uid("evt");
              const start = new Date(patch.dueDate);
              next.eventId = eventId;
              events = [
                {
                  id: eventId,
                  title: next.title,
                  start: start.toISOString(),
                  end: new Date(start.getTime() + 30 * 60000).toISOString(),
                  color: "#f59e0b",
                  calendar: "Tasks",
                  taskId: id,
                  reminder: true,
                },
                ...events,
              ];
            } else if (!patch.dueDate && next.eventId) {
              events = events.filter((e) => e.id !== next.eventId);
              next.eventId = undefined;
            }
          } else if (patch.title && next.eventId) {
            events = events.map((e) =>
              e.id === next.eventId ? { ...e, title: patch.title! } : e
            );
          }

          return {
            tasks: s.tasks.map((t) => (t.id === id ? next : t)),
            events,
          };
        }),

      deleteTask: (id) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          return {
            tasks: s.tasks.filter((t) => t.id !== id),
            events: task?.eventId
              ? s.events.filter((e) => e.id !== task.eventId && e.taskId !== id)
              : s.events.filter((e) => e.taskId !== id),
            meetings: s.meetings.map((m) => ({
              ...m,
              linkedTaskIds: m.linkedTaskIds.filter((tid) => tid !== id),
              actionItems: m.actionItems.map((a) =>
                a.taskId === id ? { ...a, taskId: undefined } : a
              ),
            })),
            notes: s.notes.map((n) => ({
              ...n,
              taskIds: n.taskIds?.filter((tid) => tid !== id),
            })),
          };
        }),

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
        const meetingId = partial.id ?? uid("meet");
        const now = new Date().toISOString();
        const start = partial.start ?? now;
        const end = partial.end ?? new Date(Date.now() + 3600000).toISOString();
        let eventId = partial.eventId;
        let linkedNoteId = partial.linkedNoteId;
        let linkedTaskIds = [...(partial.linkedTaskIds ?? [])];

        let event: CalendarEvent | undefined;
        if (!eventId) {
          eventId = uid("evt");
          event = {
            id: eventId,
            title: partial.title,
            description: partial.notes,
            start,
            end,
            color: "#8b5cf6",
            calendar: "Meetings",
            meetingId,
            reminder: true,
          };
        }

        let note: Note | undefined;
        const minutes = partial.notes?.trim();
        if (minutes && !linkedNoteId) {
          linkedNoteId = uid("note");
          note = {
            id: linkedNoteId,
            title: `Minutes · ${partial.title}`,
            content: minutes,
            folderId: "fld_work",
            tags: ["minutes", "meeting"],
            backlinks: [],
            meetingId,
            taskIds: [],
            createdAt: now,
            updatedAt: now,
          };
        }

        // Promote action items without taskId into tasks
        const actionItems = (partial.actionItems ?? []).map((a) => {
          if (a.taskId) return a;
          const taskId = uid("task");
          linkedTaskIds = linkedTaskIds.includes(taskId)
            ? linkedTaskIds
            : [...linkedTaskIds, taskId];
          return { ...a, taskId };
        });

        const newTasks: Task[] = actionItems
          .filter((a) => a.taskId && !get().tasks.some((t) => t.id === a.taskId))
          .map((a) => ({
            id: a.taskId!,
            title: a.text,
            description: `From meeting: ${partial.title}`,
            status: (a.done ? "done" : "todo") as TaskStatus,
            priority: "medium" as const,
            tags: ["meeting-action"],
            meetingId,
            subtasks: [],
            dependencies: [],
            comments: [],
            activity: [
              {
                id: uid("a"),
                action: "created from meeting action",
                actor: get().settings.name,
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          }));

        const m: Meeting = {
          type: "internal",
          status: "scheduled",
          start,
          end,
          agenda: [],
          participants: [],
          followUps: [],
          createdAt: now,
          ...partial,
          id: meetingId,
          eventId,
          linkedNoteId,
          linkedTaskIds,
          actionItems,
        };

        set((s) => ({
          meetings: [m, ...s.meetings],
          events: event ? [event, ...s.events] : s.events,
          notes: note ? [note, ...s.notes] : s.notes,
          tasks: newTasks.length ? [...newTasks, ...s.tasks] : s.tasks,
        }));
      },

      updateMeeting: (id, patch) =>
        set((s) => {
          const prev = s.meetings.find((m) => m.id === id);
          if (!prev) return s;
          const next: Meeting = { ...prev, ...patch };
          let events = s.events;
          let notes = s.notes;
          let tasks = s.tasks;

          // Sync calendar event
          if (next.eventId) {
            events = events.map((e) =>
              e.id === next.eventId
                ? {
                    ...e,
                    title: next.title,
                    start: next.start,
                    end: next.end,
                    description: next.notes,
                  }
                : e
            );
          } else if (patch.start || patch.end || patch.title) {
            const eventId = uid("evt");
            next.eventId = eventId;
            events = [
              {
                id: eventId,
                title: next.title,
                description: next.notes,
                start: next.start,
                end: next.end,
                color: "#8b5cf6",
                calendar: "Meetings",
                meetingId: id,
                reminder: true,
              },
              ...events,
            ];
          }

          // Sync meeting minutes → notes
          if (patch.notes !== undefined) {
            const body = patch.notes.trim();
            if (body) {
              if (next.linkedNoteId) {
                notes = notes.map((n) =>
                  n.id === next.linkedNoteId
                    ? {
                        ...n,
                        title: `Minutes · ${next.title}`,
                        content: body,
                        meetingId: id,
                        updatedAt: new Date().toISOString(),
                      }
                    : n
                );
              } else {
                const noteId = uid("note");
                next.linkedNoteId = noteId;
                notes = [
                  {
                    id: noteId,
                    title: `Minutes · ${next.title}`,
                    content: body,
                    folderId: "fld_work",
                    tags: ["minutes", "meeting"],
                    backlinks: [],
                    meetingId: id,
                    taskIds: [...next.linkedTaskIds],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  ...notes,
                ];
              }
            }
          }

          // New action items → tasks
          if (patch.actionItems) {
            const linked = new Set(next.linkedTaskIds);
            const created: Task[] = [];
            next.actionItems = patch.actionItems.map((a) => {
              if (a.taskId) {
                linked.add(a.taskId);
                tasks = tasks.map((t) =>
                  t.id === a.taskId
                    ? {
                        ...t,
                        title: a.text,
                        status: a.done ? "done" : t.status === "done" ? "todo" : t.status,
                        meetingId: id,
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                );
                return a;
              }
              const taskId = uid("task");
              linked.add(taskId);
              const now = new Date().toISOString();
              created.push({
                id: taskId,
                title: a.text,
                description: `From meeting: ${next.title}`,
                status: a.done ? "done" : "todo",
                priority: "medium",
                tags: ["meeting-action"],
                meetingId: id,
                subtasks: [],
                dependencies: [],
                comments: [],
                activity: [
                  {
                    id: uid("a"),
                    action: "created from meeting action",
                    actor: s.settings.name,
                    createdAt: now,
                  },
                ],
                createdAt: now,
                updatedAt: now,
              });
              return { ...a, taskId };
            });
            next.linkedTaskIds = [...linked];
            if (created.length) tasks = [...created, ...tasks];
            // Keep minutes note taskIds in sync
            if (next.linkedNoteId) {
              notes = notes.map((n) =>
                n.id === next.linkedNoteId
                  ? { ...n, taskIds: next.linkedTaskIds }
                  : n
              );
            }
          }

          return {
            meetings: s.meetings.map((m) => (m.id === id ? next : m)),
            events,
            notes,
            tasks,
          };
        }),

      deleteMeeting: (id) =>
        set((s) => {
          const m = s.meetings.find((x) => x.id === id);
          return {
            meetings: s.meetings.filter((x) => x.id !== id),
            events: m?.eventId
              ? s.events.filter((e) => e.id !== m.eventId && e.meetingId !== id)
              : s.events.filter((e) => e.meetingId !== id),
            // Keep minutes note, but clear meetingId so it remains in Notes
            notes: s.notes.map((n) =>
              n.meetingId === id ? { ...n, meetingId: undefined } : n
            ),
          };
        }),

      addNote: (partial) => {
        const note: Note = {
          id: uid("note"),
          title: "Untitled",
          content: "",
          tags: [],
          backlinks: [],
          taskIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },

      updateNote: (id, patch) =>
        set((s) => {
          const prev = s.notes.find((n) => n.id === id);
          if (!prev) return s;
          const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
          let meetings = s.meetings;
          // If this is a meeting minutes note, mirror content back to meeting.notes
          if (next.meetingId && patch.content !== undefined) {
            meetings = meetings.map((m) =>
              m.id === next.meetingId ? { ...m, notes: patch.content, linkedNoteId: id } : m
            );
          }
          return {
            notes: s.notes.map((n) => (n.id === id ? next : n)),
            meetings,
          };
        }),

      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          meetings: s.meetings.map((m) =>
            m.linkedNoteId === id ? { ...m, linkedNoteId: undefined } : m
          ),
        })),

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

      addEvent: (e) => {
        const eventId = uid("evt");
        const asMeeting =
          !e.meetingId &&
          !e.taskId &&
          (/meet/i.test(e.calendar) || e.calendar === "Meetings" || e.calendar === "Work");

        // Only auto-create meetings for Meetings calendar (Work stays as event unless Meetings)
        const createMeeting = !e.meetingId && !e.taskId && /meet/i.test(e.calendar);

        let meetingId = e.meetingId;
        let meeting: Meeting | undefined;
        let note: Note | undefined;

        if (createMeeting) {
          meetingId = uid("meet");
          const now = new Date().toISOString();
          let linkedNoteId: string | undefined;
          if (e.description?.trim()) {
            linkedNoteId = uid("note");
            note = {
              id: linkedNoteId,
              title: `Minutes · ${e.title}`,
              content: e.description.trim(),
              folderId: "fld_work",
              tags: ["minutes", "meeting"],
              backlinks: [],
              meetingId,
              createdAt: now,
              updatedAt: now,
            };
          }
          meeting = {
            id: meetingId,
            title: e.title,
            type: "internal",
            status: "scheduled",
            start: e.start,
            end: e.end,
            agenda: [],
            notes: e.description,
            participants: [],
            actionItems: [],
            followUps: [],
            linkedTaskIds: [],
            linkedNoteId,
            eventId,
            createdAt: now,
          };
        }
        void asMeeting;

        const event: CalendarEvent = { ...e, id: eventId, meetingId };
        set((s) => ({
          events: [event, ...s.events],
          meetings: meeting ? [meeting, ...s.meetings] : s.meetings,
          notes: note ? [note, ...s.notes] : s.notes,
        }));
      },

      updateEvent: (id, patch) =>
        set((s) => {
          const prev = s.events.find((e) => e.id === id);
          if (!prev) return s;
          const next = { ...prev, ...patch };
          let meetings = s.meetings;
          if (next.meetingId) {
            meetings = meetings.map((m) =>
              m.id === next.meetingId
                ? {
                    ...m,
                    title: next.title,
                    start: next.start,
                    end: next.end,
                    notes: next.description ?? m.notes,
                    eventId: id,
                  }
                : m
            );
          }
          let tasks = s.tasks;
          if (next.taskId && (patch.title || patch.start)) {
            tasks = tasks.map((t) =>
              t.id === next.taskId
                ? {
                    ...t,
                    title: patch.title ?? t.title,
                    dueDate: patch.start ?? t.dueDate,
                    eventId: id,
                    updatedAt: new Date().toISOString(),
                  }
                : t
            );
          }
          return {
            events: s.events.map((e) => (e.id === id ? next : e)),
            meetings,
            tasks,
          };
        }),

      deleteEvent: (id) =>
        set((s) => {
          const ev = s.events.find((e) => e.id === id);
          return {
            events: s.events.filter((e) => e.id !== id),
            // Remove linked meeting when calendar meeting event is deleted
            meetings: ev?.meetingId
              ? s.meetings.filter((m) => m.id !== ev.meetingId)
              : s.meetings,
            tasks: ev?.taskId
              ? s.tasks.map((t) =>
                  t.id === ev.taskId ? { ...t, eventId: undefined } : t
                )
              : s.tasks,
          };
        }),

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
      name: "lifeos:v2",
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
          categories: rest.categories ?? [],
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
