export type Priority = "urgent" | "high" | "medium" | "low" | "none";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "cancelled";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
export type MeetingType =
  | "internal"
  | "client"
  | "personal"
  | "interview"
  | "standup"
  | "sprint"
  | "retro"
  | "one_on_one"
  | "hr"
  | "training";
export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type GoalCategory =
  | "life"
  | "career"
  | "learning"
  | "finance"
  | "fitness"
  | "travel"
  | "reading"
  | "custom";
export type HabitFrequency = "daily" | "weekly" | "monthly";
export type ThemeMode = "light" | "dark" | "system";
export type AccentColor =
  | "blue"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "orange";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  subtasks?: Subtask[];
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  effort?: number;
  estimateMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  category?: string;
  projectId?: string;
  milestoneId?: string;
  parentId?: string;
  subtasks: Subtask[];
  dependencies: string[];
  dueDate?: string;
  reminderAt?: string;
  recurring?: string;
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  comments: Comment[];
  activity: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string;
  calendar: string;
  recurring?: string;
  taskId?: string;
  meetingId?: string;
  reminder?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  start: string;
  end: string;
  location?: string;
  agenda: string[];
  notes?: string;
  participants: string[];
  actionItems: { id: string; text: string; done: boolean; assignee?: string }[];
  followUps: string[];
  linkedTaskIds: string[];
  linkedProjectId?: string;
  template?: string;
  createdAt: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tags: string[];
  pinned?: boolean;
  favorite?: boolean;
  archived?: boolean;
  backlinks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  type: "morning" | "evening" | "gratitude" | "free";
  mood: number;
  energy: number;
  stress: number;
  sleepHours?: number;
  gratitude: string[];
  wins: string[];
  challenges: string[];
  body: string;
  prompt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  color: string;
  milestones: Milestone[];
  tags: string[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  progress: number;
  target: number;
  unit: string;
  deadline?: string;
  milestones: Milestone[];
  vision?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  color: string;
  targetPerPeriod: number;
  completions: string[];
  streak: number;
  bestStreak: number;
  reminder?: string;
  notes?: string;
  createdAt: string;
}

export interface FinanceTxn {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
  recurring?: boolean;
}

export interface HealthEntry {
  id: string;
  date: string;
  steps?: number;
  waterMl?: number;
  sleepHours?: number;
  exerciseMinutes?: number;
  weightKg?: number;
  mood?: number;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  folder?: string;
  tags: string[];
  updatedAt: string;
  favorite?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "reminder";
  read: boolean;
  createdAt: string;
  href?: string;
}

export interface Bug {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved" | "wontfix";
  assignee?: string;
  steps?: string;
  createdAt: string;
}

export interface TestCase {
  id: string;
  title: string;
  module: string;
  status: "pass" | "fail" | "pending" | "blocked";
  priority: Priority;
}

export interface Release {
  id: string;
  version: string;
  status: "planned" | "in_progress" | "released";
  date?: string;
  notes: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  xp: number;
}

export interface UserSettings {
  name: string;
  email: string;
  theme: ThemeMode;
  accent: AccentColor;
  timezone: string;
  focusMinutes: number;
  breakMinutes: number;
  dailyGoalTasks: number;
  wallpaper?: string;
  notifications: boolean;
  compactMode: boolean;
}

export interface FocusSession {
  id: string;
  mode: "pomodoro" | "deep" | "custom";
  durationMinutes: number;
  completedAt: string;
  taskId?: string;
}

export interface LifeOSData {
  tasks: Task[];
  events: CalendarEvent[];
  meetings: Meeting[];
  notes: Note[];
  folders: NoteFolder[];
  journal: JournalEntry[];
  projects: Project[];
  goals: Goal[];
  habits: Habit[];
  finance: FinanceTxn[];
  health: HealthEntry[];
  documents: DocumentItem[];
  notifications: NotificationItem[];
  bugs: Bug[];
  testCases: TestCase[];
  releases: Release[];
  achievements: Achievement[];
  focusSessions: FocusSession[];
  settings: UserSettings;
  xp: number;
  level: number;
  dailyStreak: number;
  lastActiveDate?: string;
  todayFocus?: string;
  todayMood?: number;
}
