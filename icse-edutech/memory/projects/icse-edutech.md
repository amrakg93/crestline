# ICSE Edutech

_Last updated: 2026-06-18_

## What it is
Educational platform for ICSE board students in Classes 8, 9, 10.
Covers 201 chapters across 7 subjects (Math, Physics, Chemistry, Biology, History, Civics, Geography, English).
Board: CISCE.

## Architecture

Monorepo with 4 packages:

### `apps/web` — Next.js frontend
- Next.js 15, React 19, Tailwind CSS, TypeScript
- Pages: home, dashboard, subject view, chapter guide, walkthrough
- Key components: ChapterCard, SubjectCard, ClassSelector, WalkthroughLevel, ProgressBar, TipCard

### `apps/api` — Express backend
- Node.js + TypeScript + Express
- Auth (JWT), syllabus serving, progress tracking
- Middleware: auth, errorHandler
- Routes: `/auth`, `/syllabus`, `/progress`, `/health`, `/graph/stats`

### `packages/graph-engine` — Go service
- Models the syllabus as a directed graph
- Exposes HTTP endpoints for graph stats and traversal
- Loads from `icse-syllabus-complete.json`
- Binary: `graph-engine.exe`

### `packages/shared` — shared TypeScript types/utilities

## Data
- `icse-syllabus-complete.json` — full syllabus as structured JSON
- `icse-syllabus-complete.md` — markdown version (scraped 2026-06-18)

## Status
Active development. Architecture and workflow docs exist (`icse-edutech-architecture.html`, `icse-edutech-workflow.html`).
