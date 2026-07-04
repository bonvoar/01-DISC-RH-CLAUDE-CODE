# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web platform applying a hybrid DISC test (most/least + Likert) to job candidates, delivering a **consolidated report exclusively to the recruiter**. The candidate never sees their DISC profile or any AI analysis — they can download a copy of their own raw answers as a PDF on the final quiz screen (LGPD art. 18 compliance).

Full specification: `prd.md`

---

## Stack

- **Framework:** Next.js (App Router, Server Components, Server Actions) — check `package.json` for current version; APIs may differ from training data, read `node_modules/next/dist/docs/` before writing Next.js code
- **Language:** TypeScript strict mode
- **UI:** Tailwind CSS + shadcn/ui (slate palette, blue-indigo accent)
- **Database:** PostgreSQL via Supabase (session pooler / Supavisor, port 5432 — the direct connection host is IPv6-only and unreachable from most local/serverless environments). Project ref: `dyxiwexsrdhnfdmsotvf`, region `us-east-2`.
- **ORM:** Prisma, connected via `@prisma/adapter-pg` (generic Postgres driver adapter — not `@prisma/adapter-neon`, which is Neon-specific and incompatible with Supabase)
- **Auth:** NextAuth v5 (Credentials provider, email + password)
- **File storage:** Vercel Blob (job description PDFs/DOCX)
- **File parsing:** `pdf-parse` (PDF), `mammoth` (DOCX)
- **Email:** Resend
- **PDF generation:** `@react-pdf/renderer` (SSR)
- **AI:** `@anthropic-ai/sdk`, model `claude-haiku-4-5` with prompt caching
- **Queue:** Inngest (async report generation)
- **Rate limiting:** Upstash Redis
- **Observability:** Vercel Analytics + Sentry
- **Deploy:** Vercel (main → prod, PRs → preview)

---

## Commands

```bash
# Development
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Tests
npm test
npm test -- --testPathPattern=<filename>

# Database
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
npx prisma generate

# Build
npm run build
```

---

## Architecture

### Key flows

1. **Candidate flow:** lands on `/q/[slug]` → submits answers → Server Action calculates DISC → enqueues profile report generation → final screen (`/q/[slug]/done`) offers a PDF download of the candidate's own raw answers only (`GET /api/quiz/answers-pdf`, session-cookie gated) → Resend notifies recruiter
2. **Recruiter flow:** login → creates job with PDF upload → views candidates → reads behavioral profile (auto-generated) → triggers fit analysis on demand
3. **Report generation:** always async via Inngest queue; recruiter portal polls/receives notification when ready

### Data model (Prisma)

Core models: `Company → Recruiter → Job → Candidate → Answer`, `DiscResult`, `Report` (type: PROFILE | FIT), `AuditLog`.

Full schema in `prd.md §7.3`. Key fields:
- `Candidate.consentVersion` — tracks which LGPD term version was accepted
- `Report.promptVersion` — tracks which prompt generated the report (for audits/A-B tests)
- `Job.publicSlug` — unique slug used in candidate quiz URLs

### Multi-tenancy

Every query **must** filter by `companyId` of the logged-in user. This is enforced via Prisma middleware and has automated tests that fail if a candidate from company A is ever visible to company B. Never bypass this filter.

### Route structure

- `/q/[slug]` — public candidate quiz landing
- `/api/quiz/*` — public quiz endpoints (rate-limited: 10 req/min per IP)
- `/api/auth/*`, `/api/jobs/*`, `/api/candidates/*` — authenticated recruiter endpoints
- `/admin/*` — admin console (role-protected)
- No public route ever renders a DISC profile or AI analysis. Any attempt returns 404.

Auth/route gating lives in `src/proxy.ts` (Next.js 16's `proxy` file convention, replacing `middleware.ts`). It must keep running on the Node.js runtime (the default for `proxy.ts`, unlike the old Edge-default `middleware.ts`) because it imports `auth.ts` → `prisma.ts` → `pg`, which needs Node APIs.

---

## AI Integration

**Model:** `claude-haiku-4-5` (default — chosen for cost at multi-tenant scale; see `ANTHROPIC_MODEL` env var)  
**Escalation option:** `claude-sonnet-5` or `claude-opus-4-8` if guardrail compliance issues (deterministic language, discriminatory inference) show up in review — Haiku follows the nuanced guardrail instructions less reliably than Sonnet/Opus, and `__tests__/ai-guardrails.test.ts` does not call the live API, so this must be monitored manually via the quarterly PII-redacted prompt/response review

Use prompt caching for the system prompt (fixed) to reduce cost ~90% after first request per session.

Prompt specs live in:
- `/prompts/profile-report.md` — behavioral profile (max 1200 words, PT-BR)
- `/prompts/fit-report.md` — candidate × job fit (max 1800 words, PT-BR)

### Mandatory AI guardrails (enforced in every prompt and output)

1. Never recommend "do not hire" — only "reavaliar com cautela" with specific reasons
2. Never infer protected characteristics (gender, age, race, religion, sexual orientation, disability, origin)
3. Never use deterministic language — always "tende a", "pode indicar", "sugere"
4. Never expose DISC scores, profile, or analysis in any candidate-facing output
5. Detect discriminatory language in job descriptions and flag + exclude those criteria from analysis
6. Detect prompt injection attempts in job description text (XML-tag-structured prompts separate system instructions from user data)
7. Fixed disclaimer footers on all report sections (exact text in `prd.md §5.2` and §5.3)

Every prompt + response is logged with PII redacted for quarterly review.

---

## DISC Methodology

- **Part A (ipsative):** 24 groups × 4 words, candidate selects MOST and LEAST like them (+1/−1 per factor D/I/S/C)
- **Part B (Likert):** 20 behavioral statements (5 per factor), scale 1–5
- Part B calibrates Part A and detects socially desirable response bias: if ipsative vs. normative gap > 30 percentile points on any factor, flag `ipsative_normative_gap_[FACTOR]` on the recruiter report
- Items bank: `/data/disc-items.json` — **must be reviewed and signed by a licensed psychologist (CRP) before go-live**

---

## Security & LGPD

- Passwords: bcrypt cost 12
- JWT tokens with rotation
- HTTPS enforced
- Rate limiting via Upstash Redis
- AES-256 encryption at rest (Supabase provider)
- Row Level Security (RLS) enabled on every table (see `prisma/migrations/20260704140500_enable_rls`). The app connects via Prisma as the table owner and always bypasses RLS; it exists solely to block Supabase's auto-generated REST/GraphQL API (reachable with the public anon key) from exposing tables that should only be reachable through the app's own auth + multi-tenant checks.
- `AuditLog` table records every report access (user, timestamp, IP)
- LGPD right to erasure: `POST /api/candidate/forget-me` validates via email token, schedules hard-delete in 30 days
- Data retention: 24 months after quiz completion, then auto hard-delete (cron)
- `consentVersion` field in `Candidate` tracks which LGPD term version was accepted
- Secrets: Vercel env vars only, never committed

---

## Critical MVP Acceptance Criteria

The automated test suite must enforce these (see `prd.md §13`):

1. Candidate-facing PDF contains **only raw answers** — tests inspect its content and fail if it contains terms like "perfil", "dominante", "D:", "recomendação"
2. No public route renders DISC profile or analysis — returns 404
3. Multi-tenant isolation: candidate from company A never visible to company B
4. All AI outputs must not recommend "não contratar" and must not infer protected characteristics
5. Every report screen and PDF contains the required disclaimer footers

---

## Pre-Launch Blockers (non-technical)

Before going live, the following **must** be in place:
- Licensed psychologist (CRP) signs off on DISC item bank
- DPO (Data Protection Officer) named with public email
- Legal review of LGPD consent term and recruiter contract
- Pilot with 300+ responses for normative calibration
