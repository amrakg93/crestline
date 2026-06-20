# Memory

_Last updated: 2026-06-18_

## Me
KG (amrakg93@gmail.com) — building ICSE Edutech.

## Project: Crestline (formerly ICSE Edutech)

A global educational platform for secondary school students (equivalent to IGCSE/O-level — Classes 8, 9, 10) (Classes 8, 9, 10) covering 201 chapters/topics across 7 subjects: Math, Physics, Chemistry, Biology, History, Civics, Geography, English. Board: CISCE.

### Stack
| Layer | Tech |
|-------|------|
| Frontend (`apps/web`) | Next.js 15, React 19, Tailwind CSS |
| Backend (`apps/api`) | Node.js, TypeScript, Express |
| Graph engine (`packages/graph-engine`) | Go |
| Shared (`packages/shared`) | TypeScript |

### Key paths
| What | Where |
|------|-------|
| Web app | `apps/web/src/` |
| API | `apps/api/src/` |
| Graph engine | `packages/graph-engine/` |
| Syllabus data (JSON) | `apps/api/src/data/icse-syllabus-complete.json` |
| Syllabus data (MD) | `icse-syllabus/icse-syllabus-complete.md` |

### API routes
- `/health`
- `/graph/stats`
- `/auth/*` — auth routes
- `/syllabus/*` — syllabus routes
- `/progress/*` — progress tracking

### Web pages
- `/` — home
- `/dashboard` — student dashboard
- `/subjects/[class]/[subject]` — subject view
- `/guide/[class]/[subject]/[chapterId]` — chapter guide
- `/walkthrough/[class]/[subject]/[chapterId]` — chapter walkthrough

## Terms
| Term | Meaning |
|------|---------|
| ICSE | Indian Certificate of Secondary Education |
| CISCE | Council for the Indian School Certificate Examinations (the board) |
| graph-engine | Go service that models syllabus as a graph for traversal/relationships |
| dogfood-output | Output from internal testing runs |

## Preferences
- Save all work to `D:\Claude_Projects\icse-edutech`
- Monorepo structure — keep concerns separated by app/package
