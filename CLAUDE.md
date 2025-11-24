# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SlideCraft is a React Router v7 application for editing and reconstructing AI-generated slides. Built on React Router's SSR framework with TypeScript, Vite, and TailwindCSS v4.

**Tech Stack:**

- **Frontend:** React Router v7, shadcn/ui, TailwindCSS v4, Conform
- **AI:** Vercel AI SDK with nano banana pro model

The `references/slidegenius` directory contains a reference implementation of a PDF slide editor with AI-powered features. This serves as inspiration for features to build into the main application.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server with HMR at http://localhost:5173
pnpm dev

# Validate code (format, lint, typecheck) - use this for regular checks
pnpm validate

# Type check (generates route types first, then runs tsc)
pnpm typecheck

# Build for production
pnpm build

# Run production build locally
pnpm start
```

## Architecture

### React Router v7 Routing

Routes are defined in `app/routes.ts` using React Router's type-safe route configuration. The framework automatically generates TypeScript types in `.react-router/types/` based on the route definitions.

- **Route Types**: Each route gets auto-generated types via `app/+types/[route-name]` pattern
- **Root Layout**: `app/root.tsx` provides the HTML shell with `Layout` component and `ErrorBoundary`
- **File-based Routes**: Route components live in `app/routes/` directory
- **Path Aliases**: `~/*` maps to `./app/*` (configured in tsconfig.json)

### Server-Side Rendering

SSR is enabled by default (`react-router.config.ts` sets `ssr: true`). The build process creates:

- `build/client/`: Static assets for browser
- `build/server/`: Node.js server code

The app uses `@react-router/node` for server runtime and `@react-router/serve` for production serving.

### Styling

TailwindCSS v4 is configured via Vite plugin (`@tailwindcss/vite`). Global styles are imported in `app/root.tsx` from `app/app.css`.

### Type Generation Workflow

Before running TypeScript compiler, run `react-router typegen` to generate route types. The `typecheck` script handles this automatically.

## React Development Guidelines

### File Naming Conventions

**React Components**: Use kebab-case for all React component files.

- ✅ `slide-editor.tsx`, `pdf-upload.tsx`, `sidebar-thumbnail.tsx`
- ❌ `SlideEditor.tsx`, `PdfUpload.tsx`, `SidebarThumbnail.tsx`

This convention applies to:

- Page components in `routes/`
- Reusable UI components in `components/`
- Feature-specific components colocated with routes (using `+` prefix)

### useEffect Policy

`useEffect` is **only** for synchronizing with external systems: API calls, WebSocket, browser APIs, external stores, timers.

**Avoid:**

- Copying props/state to local state
- Responding to flag changes
- Handling user actions (use event handlers)
- Updating derived/validation state
- One-time initialization (use `useMemo` instead)

**Rules:**

1. Derive values during render from props/state
2. Handle user actions in event handlers
3. Always add a comment explaining what external resource the effect synchronizes with

### Technical Documentation (docs/)

Write design docs and specifications in natural Japanese prose focused on "why" and "what". Build logical narratives that flow: problem → reasoning → approach → implications. Explain technical terms within context. Minimize bullet points, tables, and emojis. Keep the tone professional (質実剛健).

## Documentation and Workflow

### Document Storage

All documentation is stored in date-based directories under `docs/journals/`:

- **Location**: `docs/journals/YYYY-MM-DD/`
- **Work Journal**: `docs/journals/YYYY-MM-DD/journal.md`
- **Other documents**: Research notes, analysis reports, guides in the same directory
- **File names**: Use alphanumeric + Japanese for clarity (e.g., `editor-mutation-action-migration-report.md`)

### Work Journal (Claude Code)

Record development sessions in `docs/journals/YYYY-MM-DD/journal.md`.

**When to record:**

- Session end indicators ("thanks", "done for today", etc.)
- After creating/updating 2+ documents
- After completing technical investigations or design documents
- On explicit user request
- **Per task**: Append each new task instruction as received

**Content structure:**

- **User instruction**: Quote user's request verbatim, add 1-2 sentence context
- **User intent (inferred)**: 2-3 sentences inferring user's goal in "wants to..." format
- **Work done**: Prose for complex work, bullets for simple tasks
- **Improvement suggestions**: At session end, note 2-3 ways user could have requested more efficiently (focus on request process, not AI reflection)

**Update method**: Append to existing journal for same date

### Decision Process

For critical decisions and user-facing deliverables, human review is required before finalization.

## UI/UX Design Guidelines

Follow the principles outlined in `docs/design-policy.md`. Prioritize **usability over visual aesthetics**. The core philosophy is that users should never feel blocked, always receive immediate feedback, and can easily recover from any state.

### Design Principles

**Operations Should Not Block Users**

- Background processing when possible
- Provide cancel buttons for long operations
- Minimize modal dialogs; prefer popovers/toasts
- ESC key and background click must close dialogs

**Immediate Feedback**

- Visual feedback for all interactions (clicks, inputs)
- Clear loading, success, and error states
- Progressive rendering to avoid layout shift
- Optimistic UI where appropriate (with rollback handling)

**Easy State Recovery**

- Always provide back navigation
- Preserve scroll position on navigation (use React Router's ScrollRestoration with getKey)
- Maintain form input state across navigation
- Confirmation or undo for destructive actions

**Predictable Behavior**

- Consistent UI patterns throughout the app
- Specific button labels ("Save", "Delete" not "OK")
- Clear visual distinction for links vs buttons
- Disable states are clearly distinguishable

### Brand-Aligned Component Standards

**Colors** (from `docs/brand-guidelines.md`)

- Primary: `#334155` (Slate Gray) - text-slate-700, bg-slate-700
- Accent: `#3B82F6` (Blue) - text-blue-500, bg-blue-500
- Success: `#10B981` (Green) - text-emerald-500
- Warning: `#F59E0B` (Amber) - text-amber-600
- Border: `#E2E8F0` (Border Gray) - border-slate-200

**Loading Indicators**

- Button loading: `h-4 w-4` (16px) with `text-blue-500`
- Inline loading: `h-4 w-4 animate-spin` with context-appropriate color
- Full page loading: centered, `h-6 w-6` (24px)
- Use Lucide's `Loader2` icon for consistency

**Icons** (Lucide Icons)

- Small: `h-4 w-4` (16px) - inline with text, button icons
- Medium: `h-5 w-5` (20px) - standalone icons
- Large: `h-6 w-6` (24px) - feature icons, headers
- Style: Outline (not filled)
- Color: Match surrounding text color

**Spacing** (8px system)

- xs: 4px (`gap-1`, `p-1`)
- sm: 8px (`gap-2`, `p-2`)
- md: 16px (`gap-4`, `p-4`)
- lg: 24px (`gap-6`, `p-6`)
- xl: 32px (`gap-8`, `p-8`)

**Buttons**

- Primary: `bg-slate-700 text-white hover:bg-slate-600`
- Secondary: `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`
- Accent: `bg-blue-500 text-white hover:bg-blue-600`
- Padding: `px-6 py-3` (24px horizontal, 12px vertical)
- Border radius: `rounded-md` (6px)

**Error Handling**

- Implement comprehensive error boundaries with `RouteErrorBoundary`
- Display user-friendly error messages
- Provide recovery actions (retry, go back)
- Log errors for debugging but don't expose technical details to users

**Navigation**

- Breadcrumb navigation always available
- Use React Router's `ScrollRestoration` with custom `getKey` for scroll position management
- Preserve list position when returning from detail views

### Implementation Checklist

Before shipping a new feature, verify:

- [ ] Operations don't block users unnecessarily
- [ ] Long operations have cancel buttons
- [ ] All interactions provide immediate visual feedback
- [ ] Loading states use brand colors (blue-500) and correct sizes
- [ ] Error boundaries catch and display errors appropriately
- [ ] Navigation preserves scroll position and form state
- [ ] Buttons have specific, predictive labels
- [ ] Icons use Lucide with consistent sizes
- [ ] Spacing follows 8px system
- [ ] Destructive actions have confirmation or undo
