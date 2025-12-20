# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SlideCraft is a React Router v7 application for editing and reconstructing AI-generated slides. Built on React Router's SSR framework with TypeScript, Vite, and TailwindCSS v4.

**Tech Stack:** React Router v7, shadcn/ui, TailwindCSS v4, better-auth, Kysely, Atlas, Turso, Google Gemini API

The `references/slidegenius` directory contains a reference implementation for inspiration.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server at http://localhost:5173
pnpm validate         # Format, lint, typecheck
pnpm typecheck        # Type check (generates route types first)
pnpm build            # Build for production
pnpm start            # Run production build
pnpm db:migrate       # Generate migration files (Atlas)
pnpm db:apply         # Apply migrations to local DB
pnpm db:codegen       # Generate types from DB schema (Kysely)
```

## Architecture

### React Router v7 Routing

Routes defined in `app/routes.ts` with auto-generated types in `.react-router/types/`.

- Route types: `app/+types/[route-name]` pattern
- Root layout: `app/root.tsx` (Layout + ErrorBoundary)
- Path alias: `~/*` → `./app/*`

SSR enabled by default. Build outputs: `build/client/` (static), `build/server/` (Node.js).

### Styling

TailwindCSS v4 via Vite plugin. Global styles in `app/app.css`.

### Database

- **Turso**: LibSQL database (SQLite-compatible, edge-ready)
- **Kysely**: Type-safe query builder with CamelCasePlugin (snake_case DB ↔ camelCase TS)
- **Atlas**: Schema migration tool (`db/schema.sql` → migrations)
- **better-auth**: Authentication with anonymous user support

Key files:

- `db/schema.sql`: Canonical schema definition
- `app/lib/db/kysely.ts`: Kysely client with CamelCasePlugin
- `app/lib/db/types.ts`: Auto-generated types (via `pnpm db:codegen`)
- `app/lib/auth/auth.ts`: better-auth configuration with field mappings

### React Router Auto Routes

Folder-based routing with react-router-auto-routes:

- `index.tsx`: route entry, `_layout.tsx`: layout
- `+/`: colocated helpers (`queries.ts`, `mutations.ts`, `components/`, `hooks/`)
- `_auth/`: pathless layout, `$param/`: dynamic segment, `$/index.tsx`: splat
- `/api/auth/*` → `app/routes/api/auth/$/index.tsx`
- Action dispatch: `ts-pattern` match in clientAction, logic in `+/mutations.ts`

### Route & Component Design

**Functional cohesion** (goal): all elements work together for a single purpose.
**Logical cohesion** (anti-pattern): elements grouped by category, not purpose.

Avoid: role-based conditionals (`{role === "buyer" && ...}`), create/edit/view mode flags. Instead: split routes by role/mode, keep each route focused on one function.

**Colocation & shared code:**

- Same route → `+/components/`
- Parent-child routes → `_shared/` in parent
- 3+ routes → `app/features/` (don't extract until 3+ uses)

**Route file cohesion:**

- Generic utilities → `lib/`, route-specific only in route files
- Loaders fetch only this route's data; analytics/logging → parent layouts
- Actions: validate → save → redirect (nothing else)

Test: "What does this file do?" One sentence = good cohesion.

## React Development Guidelines

### File Naming

Use kebab-case for all component files: `slide-editor.tsx`, `pdf-upload.tsx`

### useEffect Policy

Only for external system sync: API calls, WebSocket, browser APIs, timers.

Avoid: copying props to state, responding to flags, handling user actions (use event handlers), derived state updates. Always comment what external resource the effect syncs with.

## Documentation and Workflow

### Document Storage

All docs in `docs/journals/YYYY-MM-DD/`. Work journal: `journal.md`. File names: alphanumeric + Japanese.

### Technical Documentation

Write in natural Japanese prose: problem → reasoning → approach → implications. Minimize bullet points, tables, emojis. Tone: 質実剛健.

### Work Journal (Claude Code)

Record sessions in `docs/journals/YYYY-MM-DD/journal.md`.

**When:** Session end, after 2+ doc updates, after investigations, on request. Append per task.

**Structure:** User instruction (verbatim) → User intent (inferred, "wants to...") → Work done → Improvement suggestions (at session end)

### Decision Process

Human review required for critical decisions and user-facing deliverables.

## UI/UX Design Guidelines

Follow `docs/design-policy.md`. Prioritize usability over aesthetics. Users should never feel blocked, always get immediate feedback, and can recover from any state.

### Design Principles

**Non-blocking:** Background processing, cancel buttons, popovers over modals, ESC/click-outside closes dialogs.

**Immediate feedback:** Visual response for all interactions, clear loading/success/error states, optimistic UI with rollback.

**State recovery:** Back navigation, scroll position preservation (ScrollRestoration with getKey), form state persistence, confirmation for destructive actions.

**Predictable:** Consistent patterns, specific labels ("Save" not "OK"), clear link vs button distinction.

### Component Standards

**Colors:** Primary `slate-700`, Accent `blue-500`, Success `emerald-500`, Warning `amber-600`, Border `slate-200`

**Icons:** Lucide, outline style. Small `h-4 w-4`, Medium `h-5 w-5`, Large `h-6 w-6`

**Loading:** `Loader2` icon. Button: `h-4 w-4 text-blue-500`. Full page: centered `h-6 w-6`

**Spacing:** 8px system (xs=4px, sm=8px, md=16px, lg=24px, xl=32px)

**Buttons:** Primary `bg-slate-700`, Secondary `bg-white border-slate-200`, Accent `bg-blue-500`. Padding `px-6 py-3`, radius `rounded-md`

**Errors:** RouteErrorBoundary, user-friendly messages, recovery actions (retry, go back)

### Implementation Checklist

- [ ] Non-blocking operations with cancel buttons
- [ ] Immediate visual feedback, brand-colored loading states
- [ ] Error boundaries with recovery actions
- [ ] Scroll/form state preserved on navigation
- [ ] Specific button labels, consistent icon sizes, 8px spacing
- [ ] Destructive actions have confirmation or undo
