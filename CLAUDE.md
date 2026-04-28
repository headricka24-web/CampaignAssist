# CampaignAssist — Project Spec

## Overview

CampaignAssist is a 24/7 AI-powered platform that ingests news, blogs, press releases, social content, and legislative briefs; classifies and summarizes items; and exports ready-to-use briefs and content templates for political campaign teams.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite (dev) → PostgreSQL (prod)
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`)
- **Export**: Markdown, CSV, JSON

## Core Workflows

1. **News Tracking** — Ingest sources, bucket into `CandidateCoverage | OpponentCoverage | GeneralRace | HotButtons`, produce item-level summaries (200–350 words) and per-bin digests (200–300 words).
2. **Media Tracking** — Aggregate traditional + social outlets, summarize sentiment/topics, surface top outlets and themes per bucket.
3. **Briefing Studio** — Auto-generate `DailyDigest`, `IssueBrief`, `NeedToKnow` briefs; produce templates for newsletters, emails, social posts, and event requests.
4. **Handoff/Export** — Package per-candidate "bins" with sorted articles, digest, and metadata; export as Markdown, CSV/JSON, or plain text.

## Architecture — Five Claude Layers

| Layer | Purpose | Output |
|---|---|---|
| Ingestion | Fetch + normalize sources | `Article` records |
| Classification | Bucket + tag + sentiment | `article.bucket`, `.tags`, `.sentiment` |
| Summarization | Item & bin summaries | `article.summary`, `bin.digest` |
| Content Generation | Draft briefs + templates | `DraftText` per type |
| Packaging | Assemble bins + exports | `Bin` object + export files |

All Claude calls live in `src/layers/`. Prompts are in `src/lib/prompts.ts`.

## Data Model

### Candidate
```
id, name, race, state, party, incumbent: boolean
```

### Outlet
```
id, name, type: News|Blog|Social|TV|Radio|Other, reach, leaning?
```

### Article
```
id, title, url, date_published, outlet_id, author?, language, region?,
source_type: News|Blog|Social|PressRelease, raw_text,
summary, bucket, topics: string[], sentiment: Positive|Neutral|Negative, confidence: float
```

### Bucket
```
id, name  // CandidateCoverage | OpponentCoverage | GeneralRace | HotButtons
```

### Bin (per candidate)
```
id, candidate_id, name, date_created, items: Article[], digest
```

### Digest / Brief
```
id, bin_id, type: DailyDigest|IssueBrief|NeedToKnow, content, template_id, created_at
```

### Template
```
id, name, type, structure (sections + placeholders), default_content
```

### User
```
id, email, role: Admin|Editor|Viewer, permissions, last_login
```

### Export
```
id, bin_id, format: CSV|JSON|Markdown, generated_at, status
```

## Pages

| Route | Description |
|---|---|
| `/` | Campaign Overview Dashboard — stats, sentiment trend, filters |
| `/news` | News Tracker — article list with bucket/sentiment/actions |
| `/media` | Media Tracker — outlet aggregation, social + traditional |
| `/briefing` | Briefing Studio — generate/export DailyDigest, IssueBrief, NeedToKnow |
| `/legislative` | Legislative Briefs — bills, status, layman explanations |
| `/settings` | Candidate setup, scan cadence, outlet sources |

## Roles (RBAC)

- **Admin** — full access, export, audit log
- **Editor** — ingest, classify, summarize, generate drafts, export
- **Viewer** — read-only dashboards and briefs

## Accessibility

- All outputs WCAG 2.1 AA compliant
- Semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`)
- `aria-label` on all interactive elements
- Screen-reader-friendly brief templates (clear heading hierarchy)

## Environment Variables

```
ANTHROPIC_API_KEY=
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_APP_NAME=CampaignAssist
```

## Development Commands

```bash
npm run dev        # start dev server
npm run build      # production build
npx prisma studio  # browse database
npx prisma migrate dev  # run migrations
```

## MVP Scope (Phase 1)

- [ ] News ingestion (manual URL paste + RSS)
- [ ] Classification + summarization via Claude
- [ ] Dashboard with bucket view
- [ ] Bin creation + export (Markdown + CSV)
- [ ] DailyDigest brief generation

## Out of Scope for MVP

- Real-time collaboration UI
- Full RBAC enforcement (UI only, no auth middleware)
- Multi-language support beyond English
- Social media OAuth integrations
