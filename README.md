# LifeOS

**Your personal operating system** — a premium productivity SaaS that combines Notion + Linear + Apple Calendar + TickTick energy into one elegant second brain.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8)

## Features

- **Dashboard** — greeting, live clock, focus, tasks, meetings, heatmap, pomodoro, mood, streaks, XP
- **Tasks** — nested subtasks, priorities, kanban/table/list, NL capture (`Finish report tomorrow 10 AM #work !high`)
- **Calendar** — month/week/day/agenda with events, meetings, and due tasks
- **Meetings** — agenda, participants, action items, templates, linked work
- **Notes** — markdown, folders, backlinks, pin/archive, import/export
- **Journal / Goals / Habits / Focus** — reflections, progress, streaks, heatmaps, timers
- **Projects / Finance / Health / Documents** — full module CRUD with charts
- **Analytics / AI / QA / Notifications / Settings** — charts, copilot capture, bug tracker, themes
- **Command palette** (`⌘K`) · dark/light/system · accent themes · PWA · Konami easter egg
- **Storage** — LocalStorage today; `StorageAdapter` ready for Supabase

## Tech stack

Next.js App Router · React 19 · TypeScript · Tailwind CSS v4 · Radix/shadcn-style UI · Framer Motion · Zustand · React Query · React Hook Form patterns · Zod-ready · TanStack Table · Recharts · date-fns · DND Kit · cmdk · Vitest · Playwright

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm start
```

## Architecture

```
src/
  app/(app)/          # Feature routes (dashboard, tasks, …)
  components/
    ui/               # Design system primitives
    layout/           # Shell, sidebar, command palette
    dashboard/        # Dashboard widgets
  stores/             # Zustand + persist (lifeos:v1)
  data/seed.ts        # Realistic demo dataset
  lib/                # utils, storage adapter, NL parser
  types/              # Shared domain types
```

UI never talks to storage directly — swap `LocalStorageAdapter` for `SupabaseAdapter` in `src/lib/storage.ts` when you add auth/cloud sync.

## Keyboard

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Command palette / quick capture |
| Konami code | Unlock secret achievement |

## Deployment

**Production:** [https://lifeos-manage.vercel.app](https://lifeos-manage.vercel.app)

```bash
npx vercel
```

Or connect the GitHub repo to Vercel for continuous deploys.

## Roadmap

- Supabase auth + realtime sync
- Google/Outlook calendar + GitHub issues
- Voice-to-task, OCR, email-to-task
- Knowledge graph, plugins, push notifications

## License

Private / proprietary unless otherwise noted.
