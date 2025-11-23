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

## Docker Deployment

Multi-stage Dockerfile builds:

1. Development dependencies layer
2. Production dependencies layer (--omit=dev)
3. Build layer (runs build command)
4. Final runtime layer with only production deps and built artifacts

Note: The Dockerfile currently uses npm/package-lock.json but the project uses pnpm/pnpm-lock.yaml for local development.

The container exposes the app on port 3000 when running the start command.

## Reference Implementation Notes

The `references/slidegenius/` directory contains a working slide editor with:

- PDF upload and conversion to images
- Per-slide image editing with AI generation via Gemini
- Slide sidebar navigation
- PDF export functionality

Key patterns from the reference:

- Slide data structure with original/current/generated image candidates
- Integration with Google AI Studio environment for API key management
- Local browser-based PDF processing (no server upload)
