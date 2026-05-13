# Puppies QA — AI compliance validation for pet food packaging

> 🎯 **Live demo:** [qa-validator-puppies.vercel.app](https://qa-validator-puppies.vercel.app) · click **"Try the demo"** on the login page (no signup needed)
>
> 📦 **Sample assets to try:** [Google Drive folder](https://drive.google.com/drive/folders/1HILlJM96yHv_NYbH0Bd_xeVyqc24_wzX) — 5 fictional Puppies products, each with 1 reference PDF + 3 packaging artworks (front/back/side). Each artwork has 2-3 deliberate compliance errors planted — see the README inside the folder for what to expect.
>
> Portfolio project — fictional pet food brand. Built with the same architecture as a real production system delivered to a Nestlé Argentina business unit.

---

## What it does

Packaging compliance review is a painful manual process. A QA team has to read the back of every product label, compare every ingredient and every nutritional value against a master reference document, check that regulatory codes (SENASA, EAN, SAP) are present and correct, and verify that mandatory legal text and italic formatting are applied. It takes **2-3 weeks per artwork** and humans miss things.

**Puppies QA** validates a packaging artwork (PDF or image) against its reference documents in **30 seconds**. It uses multimodal AI vision to read the artwork word-by-word, compares it against the brand guidelines + nutritional data + SENASA Argentina rules, and surfaces every discrepancy — critical, warning, or informational — with a suggestion for the fix. Past validations feed a vector knowledge base so the AI learns from previously-flagged issues on similar products.

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19 · Vite 6 · TanStack Router · TanStack Query · Tailwind v4 · Zustand |
| Backend | Express 5 · TypeScript · ES Modules |
| Database | PostgreSQL (Supabase) + Prisma 6 + **pgvector** for RAG |
| AI | Google Gemini 2.0 Flash (vision) + `text-embedding-004` for embeddings |
| Auth & Storage | Supabase (email/password + Google OAuth + Storage buckets) |
| Email | SendGrid (approval emails with PDF attachment) |
| Containers | Docker + docker-compose (one-command deploy) |
| Hosting | Vercel (web) + Fly.io (api) |

---

## Features

- **Multimodal validation** — AI reads the artwork pixel by pixel: ingredients letter-by-letter, nutritional values, SENASA codes, EAN/SAP, mandatory legal text, italic enforcement for allergens
- **RAG knowledge base** — every completed validation is embedded with pgvector. Future runs on similar products receive past issues as context, improving precision over time
- **Per-validation document snapshot** — historical reports stay accurate even when product documents are added or removed later
- **Multi-provider AI architecture** — swappable AI providers via env var
- **Real-time notifications** — per-user bell that refreshes every 15s and instantly when a validation completes
- **Shared team dashboard** — global KPIs, score distribution, recurring issues, AI insights on top failure categories
- **PDF reports** — exportable compliance report; can be emailed to an approver with one click
- **Dark mode** — persisted per user, modern coral/violet accents
- **i18n** — Spanish (Argentina) and English
- **Role-based access** — `admin`, `manager`, `reviewer`, `viewer`. Admin invites users via Supabase magic-link
- **Docker** — `docker compose up` brings up the full stack pulling pre-built private images

---

## Architecture

```
┌────────────────┐         ┌────────────────┐
│  Vercel SPA    │────────▶│  Fly.io API    │
│  (React+Vite)  │  /api/* │  (Express+TS)  │
└────────────────┘         └────────┬───────┘
                                    │
            ┌───────────────────────┼─────────────────────┐
            ▼                       ▼                     ▼
     ┌─────────────┐        ┌─────────────┐      ┌──────────────┐
     │  Supabase   │        │   Google    │      │   SendGrid   │
     │ Postgres +  │        │  Gemini API │      │  email API   │
     │  pgvector   │        │  (vision +  │      │              │
     │  + Auth +   │        │  embeddings)│      │              │
     │  + Storage  │        └─────────────┘      └──────────────┘
     └─────────────┘
```

The web SPA never talks directly to the API across origins — Vercel rewrites `/api/*` to the Fly.io backend. Same-origin = no CORS, no extra latency for OPTIONS preflight.

The validation worker is an in-process async queue (BullMQ-compatible API) — when a validation is created it returns 201 immediately and the actual AI call + RAG indexing happens in the background. The status endpoint is polled at 2s intervals until `completed` or `failed`.

---

## Demo data

The repo includes a seed script that populates a clean Supabase project with:

- 5 fictional **Puppies** products across pet food categories
- 1 SENASA-style technical reference document per product (PDF generated programmatically with `pdfkit`)
- 3 packaging artworks per product (front / back / side panel, generated with `node-canvas`)
- Artworks have deliberate compliance issues injected — typos in legal text, mismatched nutritional values, wrong SENASA registration format — so the AI surfaces real findings
- 8-10 pre-run validations so the dashboard loads with real metrics and the RAG knowledge base is already seeded

```bash
pnpm seed:demo
```

---

## Local development

```bash
pnpm install
cp apps/api/.env.example apps/api/.env  # fill in Supabase + Gemini + SendGrid creds
cp apps/web/.env.example apps/web/.env
pnpm dev
# Frontend: http://localhost:5176
# Backend:  http://localhost:3001
```

Or all-in-one with Docker:

```bash
cp .env.docker.example .env  # fill in creds
docker compose up -d
# Browse to http://localhost
```

---

## What I built

This project showcases:

- A non-trivial **AI vision pipeline** with structured output (Zod schema) and prompt engineering specific to regulatory compliance
- A **RAG system from scratch** — pgvector setup, embedding model selection, retrieval strategy, knowledge base curation per-product
- **Auth + invitations** with Supabase magic-link and role-based access control
- **Production-ready Docker delivery** — multistage builds, private registry, nginx reverse proxy, healthchecks
- **End-to-end PDF generation** — `pdfkit` on the server, React PDF for client-side preview, base64 embedding in email
- **Modern UX details** — dark mode that doesn't break, optimistic updates with TanStack Query, real-time notifications via polling with smart invalidation, drag-and-drop upload with preview cleanup, i18n

The original of this project was delivered to a real Nestlé Argentina business unit. This portfolio fork keeps the architecture identical but swaps the branding to a fictional pet food company so it can be shared publicly.
