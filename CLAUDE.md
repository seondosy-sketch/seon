# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack, port 3000)
npm run build    # production build
npm run lint     # ESLint
vercel deploy --prod   # deploy to Vercel
```

No test suite exists in this project.

## Architecture

**Stack**: Next.js 16.2.6 (App Router) · React 19 · Supabase (PostgreSQL) · Tailwind CSS v4 · TypeScript

### Data flow

`app/page.tsx` is a single `'use client'` component that owns all state (`weeks`, `projects`, `selectedWeekId`). Child components receive data as props and write directly to Supabase on mutation — no server actions, no global store. Mutations follow an optimistic pattern: local state is updated first, then `supabase.from(...).update/insert/delete` fires.

### Database schema (Supabase)

```
weeks(id, label, start_date, end_date, memo_education, memo_other, created_at)
projects(id, week_id FK→weeks, status CHECK('개찰'|'진행중'), seq INT,
         name, director, submitted_at TEXT, presentation_at TEXT,
         bidding_at TEXT, confirmed_bidding_at DATE|null,
         fee_billion NUMERIC|null, note TEXT, created_at, updated_at)
```

- `bidding_at` — free-text display string (e.g. `"6/17"`, `"추후"`)
- `confirmed_bidding_at` — ISO date or null; **the only field used for KPI date logic**
- Deleting a week cascades to its projects
- `seq` controls display order within each status group; drag-reorder in `ProjectsTable` updates it

### HWPX export (`/api/export-hwpx`)

`GET /api/export-hwpx?week_id=<id>` — fetches week + projects from Supabase, builds a Markdown table, converts to `.hwpx` via `kordoc.markdownToHwpx()`, and streams the binary back. The route is `force-dynamic`.

### Design system

All visual tokens are CSS custom properties in `app/globals.css` (prefix `--ps-`). Reusable utility classes defined there: `.ps-btn-primary`, `.ps-btn-commerce`, `.ps-btn-secondary-dark`, `.ps-btn-secondary-light`, `.ps-input`, `.ps-select-sm`, `.ps-card`, `.cell-input`.

**Critical**: Google Fonts must remain as `<link>` tags in `app/layout.tsx`, not as `@import url(...)` in `globals.css`. PostCSS expands `@import "tailwindcss"` before CSS rules, making any subsequent `@import` a spec violation that breaks the build.

### Component responsibilities

| Component | Responsibility |
|---|---|
| `WeekSelector` | Dropdown to switch/create/delete weeks; dark-canvas styling |
| `KpiCards` | 4 stat cards computed from `projects` + `week`; date math via `date-fns` |
| `ProjectsTable` | Full table with inline `EditableCell`, `@dnd-kit` drag-reorder, add/edit/delete |
| `ProjectModal` | Slide-over panel (500 px, right edge) for add/edit form |
| `TextSection` | Auto-save textarea for `memo_education` / `memo_other` on blur |

### Environment variables

Required in `.env.local` (and in Vercel project settings):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
