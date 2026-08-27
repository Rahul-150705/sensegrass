# AI Development Process — Recast

> How this project went from an empty folder to a working, multi-stage AI product,
> and exactly where each AI coding agent was used.

**Agents used**
- **Antigravity (Gemini/Claude-backed IDE agent)** — initial scaffold, first UI pass, first Groq wiring.
- **Claude Code (Claude Sonnet, CLI)** — full-codebase review, the security/reliability hardening pass, the Product Blueprint chat feature, the persistence root-cause + fix, the product rename, and this document.
- **Groq (`openai/gpt-oss-120b`)** — the *runtime* LLM inside the product itself (analysis, blueprint, file-directory planning, code generation, and all chat refinement). Not a coding agent — it's the product's engine.

---

## Step 0 — Framing the product before any code

Rather than "build a website cloner", the product was framed as a **staged pipeline** the
user can inspect and steer:

```
URL + vision  →  Analyze  →  Strategy (chat)  →  Blueprint (chat)  →  File Directory (chat)  →  Build  →  VS Code studio + live preview
```

Every stage produces a reviewable artifact and has its own natural-language chat, so the
human is always in the loop and no stage silently overwrites another. This decision drove
the whole data model (`ProductAnalysis` / `ProductBlueprint` / `ProductFileDirectory` /
`generatedFiles`, plus a `stage` discriminator on chat messages).

## Step 1 — Scaffold (Antigravity)

Next.js 14 App Router + TypeScript + Tailwind scaffold, Supabase client, Cheerio scraper,
route handlers for `analyze` / `build` / `refine`, and a first pass at the dashboard,
login, and studio pages. Prompt style: describe the whole flow in one paragraph, let the
agent lay out files, then iterate per file.

## Step 2 — Runtime LLM: Groq as the single provider (Antigravity)

Initial design had a second Anthropic call for code generation. That was collapsed to
**Groq only** for cost and latency: one provider, `openai/gpt-oss-120b`, via the OpenAI
SDK pointed at `https://api.groq.com/openai/v1`. OpenAI (`gpt-4o-mini`) remains a
last-resort fallback for analysis/blueprint only. `lib/claude.ts` and the Anthropic SDK
were removed entirely.

## Step 3 — Prompt engineering for structured output

Each pipeline stage uses `response_format: { type: 'json_object' }` and an explicit JSON
schema embedded in the prompt, plus a **"question vs instruction"** protocol for the chat
refiners (`applied: true/false`) so an exploratory question never mutates the artifact.
See `AI_PROMPT_LOG.md` §3–§5.

## Step 4 — UI: the VS Code studio + live preview (Antigravity, then Claude Code)

A file-explorer / line-numbered editor / copilot-sidebar / preview layout. The preview
was later moved (Claude Code) from `dangerouslySetInnerHTML` in the main document to a
fully sandboxed `<iframe>` — see `DEBUGGING_LOG.md`.

## Step 5 — Auth + data model (Antigravity, hardened by Claude Code)

Supabase Auth (email/password), edge `middleware.ts` for route protection, JWT verified
server-side on every API route via the service-role client, per-user data isolation on
every query. Schema in `supabase_schema.sql` (idempotent, re-runnable).

## Step 6 — Full-codebase review (Claude Code)

Prompt: *"analyse this project first fully"*. Produced an architecture write-up and a
ranked list of 12 correctness / security / data-loss issues. See `AI_PROMPT_LOG.md` §6.

## Step 7 — Hardening pass (Claude Code)

Prompt: *"fix everything one by one … don't break anything"*. All 12 issues fixed with
per-file edits, each followed by `npx tsc --noEmit` and `npx next build`. Highlights:
generation now fails loudly instead of persisting placeholder stubs; per-file code gen;
per-user isolation in the file-store fallback; sandboxed preview iframe; connect-time
SSRF re-validation; in-memory rate limiting; CSP + security headers. See
`DEBUGGING_LOG.md` §1–§5.

## Step 8 — Product Blueprint chat (Claude Code)

New capability matching the rubric's exact examples ("make the design more premium",
"add a dashboard", "remove the pricing page", "make it enterprise-ready"). Built by
cloning the existing strategy/file-directory chat pattern: new `stage`, new
`/api/blueprint/refine` + `/clear`, new `BlueprintChat` component, `refineBlueprintWithGroq`.

## Step 9 — Persistence bug, root-caused against the live DB (Claude Code)

User report: generated code disappears after navigating away. Claude Code introspected the
live Supabase schema via the REST API, found two missing columns, traced why a single
failed `upsert` silently dropped the *entire* write, and shipped a self-healing fix plus
the migration. Full story in `DEBUGGING_LOG.md` §4.

## Step 10 — Rename & docs (Claude Code)

`ProductForge` → `Recast` across the codebase; this document and the prompt/debug logs.

## Step 11 — Deploy

Vercel, env vars from `.env.example`, `supabase_schema.sql` run once against the project
DB, email confirmation disabled for reviewer access.

---

## What AI did well vs. what needed human correction

| AI was strong at | Needed human correction |
|---|---|
| Scaffolding boilerplate, wiring SDKs, laying out route handlers | Over-eager "helpful" fallbacks that hid failures (placeholder stubs, code-clobbering refine) — had to be told to fail loudly |
| Mirroring an existing pattern to add a parallel feature (blueprint chat) | Cross-cutting invariants (every read path, both storage backends) — needed an explicit "check every call site" instruction |
| Structured-output prompting and JSON schema design | Model-id drift in comments/docs vs. actual code — caught only by review |
| Root-causing once pointed at the right evidence (live DB introspection) | Choosing *what* evidence to gather — the human framed "check the actual schema" |
