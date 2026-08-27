# AI Prompt Log — Recast

Nine prompts that shaped the project, with the reasoning behind each and what had to be
fixed afterward. Two kinds of prompt appear here:

- **Build prompts** — given to a coding agent (Antigravity early on, then **Claude Code** /
  Claude Sonnet) to write or change the codebase.
- **Runtime prompts** — the prompts the product itself sends to **Groq (`openai/gpt-oss-120b`)**
  at each pipeline stage. These live in `lib/groq.ts` and are the actual production text.

---

## 1. Build prompt — one-paragraph pipeline spec (Antigravity)

> "After extracting the website, give the text to the Groq API. It processes the text plus
> the user's prompt and generates the files needed. Another agent then writes the code for
> those files, frontend and backend, and shows it like VS Code — file explorer on the left,
> an AI assistant in the sidebar that can edit files on request, and a live preview pane."

**Why structured this way:** describe the *entire* flow and the *UI shape* in one pass so
the agent lays out a coherent file structure instead of a pile of disconnected components.
Naming the panes ("file explorer", "sidebar assistant", "live preview") pins the component
boundaries up front.

**Produced:** `lib/groq.ts`, `lib/ai.ts` (orchestrator), `components/VSCodeEditor.tsx`,
and the `analyze` / `build` / `refine` route handlers.

**Changed afterward:** the second "another agent" was collapsed into Groq (§2). The live
preview's naive JSX→HTML string replacement was later sandboxed (`DEBUGGING_LOG.md` §3).

---

## 2. Build prompt — collapse to a single runtime LLM (Antigravity)

> "Use the Groq API as the only LLM. Remove the separate Anthropic call. Point the OpenAI
> SDK at Groq's base URL and use `openai/gpt-oss-120b`. Keep OpenAI only as a fallback if
> `GROQ_API_KEY` is missing."

**Why:** one provider = one rate-limit budget, one failure mode, lower latency, simpler
env. The OpenAI SDK already speaks Groq's API, so no new dependency.

**Produced:** `isGroqConfigured`, the Groq client in `lib/groq.ts`, deletion of
`lib/claude.ts` and `@anthropic-ai/sdk`.

**Changed afterward:** later verified against `GET https://api.groq.com/openai/v1/models`
that `openai/gpt-oss-120b` is actually served on the account (it is). A self-contradicting
"model retired" comment was cleaned up in the hardening pass.

---

## 3. Runtime prompt — website analysis (in `lib/groq.ts`)

**Role:** "Groq AI Product Analyst Agent". **Config:** `response_format: json_object`,
`temperature: 0.5`.

```
Analyze this extracted website data and user vision to design a high-growth B2B SaaS product.
WEBSITE URL / TITLE / META / HEADINGS / EXTRACTED TEXT SAMPLE (first 3000 chars)
USER VISION / TARGET CUSTOMER
Respond ONLY with valid JSON matching this schema:
{ summary, targetUsers[], coreProblem, keyFeatures[], businessModel,
  suggestedImprovements[], proposedMVPFeatures[] }
```

**Why structured this way:** the schema keys map 1:1 to the rubric's required analyzer
outputs and to the `ProductAnalysis` TypeScript type, so the UI can render fields directly
with no post-processing. Truncating the scrape to 3000 chars keeps token cost bounded and
focuses the model on above-the-fold positioning.

**Produced:** clean structured analyses for real sites (Stripe, Linear, Notion, Loom).

**Changed afterward:** added a deterministic fallback object for when Groq errors, so the
analyze step degrades instead of 500-ing.

---

## 4. Runtime prompt — blueprint + file directory (in `lib/groq.ts`)

Two calls run in parallel from `/api/file-directory/generate`:

- **Blueprint:** "Groq AI Product Architect Agent … product metadata only — no file
  structure": `{ productName, tagline, description, targetCustomer, features[],
  navigation[], pages[], uiDirection{} }`.
- **File directory:** "Plan the concrete build directory … the exact file tree that will be
  generated, WITHOUT writing any code yet": `{ files[]{path,name,type,language,purpose},
  routes[], components[], dataEntities[], externalIntegrations[] }`, `type ∈
  {frontend,backend,config,database}`.

**Why split:** the blueprint is the human-readable "proposed product" the user edits by
chat; the file directory is the concrete, reviewable contract that **Build** then generates
code against — one file per planned entry, no invented files. Keeping them separate means
"change the pricing page" and "add a webhooks route" are different conversations that can't
clobber each other.

**Produced:** the two artifacts shown side by side on the studio's stage 3.

**Changed afterward:** every planned `file.type` is now clamped to the allowed set on
parse; Build stubs exactly the planned files and never a different list.

---

## 5. Runtime prompt — the "question vs instruction" refine protocol (in `lib/groq.ts`)

Used by all three chat refiners (strategy / blueprint / file-directory), e.g. the blueprint one:

```
You ONLY read and modify the Product Blueprint JSON below … never write code, never touch
the strategy analysis or the file directory.
1. If the user gives a clear instruction, apply it and return the COMPLETE updated blueprint
   (every field, including untouched ones copied over). Keep navigation consistent with pages.
2. If the user is asking a question / wants a recommendation, do NOT change anything.
   Set "applied": false, return the blueprint UNCHANGED, put the recommendation in
   "assistantMessage".
Respond ONLY with: { "applied": bool, "updatedBlueprint": {...full schema...}, "assistantMessage": str }
```

**Why structured this way:** LLMs love to "helpfully" rewrite things when you only asked a
question. The explicit `applied` flag plus "return the COMPLETE object" turns the refiner
into a safe, idempotent transform: the server only persists when `applied === true`, and a
defensive field-level merge guarantees no field is dropped even if the model omits one.

**Produced:** `refineAnalysisWithGroq`, `refineBlueprintWithGroq`,
`refineFileDirectoryWithGroq` and their `/api/*/refine` routes.

**Changed afterward:** added a deeper merge for nested `uiDirection` so a partial style
tweak can't drop the other design tokens; `generatedFiles` is explicitly preserved across
a blueprint edit.

---

## 6. Build prompt — full-codebase review (Claude Code)

> "analyse this project first fully"

**Why so open-ended:** wanted an unprimed read of the whole repo — architecture, data
flow, and whatever the model considered the real risks — before deciding what to fix.

**Produced:** an architecture summary (stack, the 5-stage pipeline, data model, auth
model, repo state) and a **ranked list of 12 issues**: file-store data leak across users,
"successful" builds that silently persisted placeholder stubs, copilot refine clobbering
user code on a transient error, an XSS-capable preview, single-request-per-category
fragility, non-HttpOnly session cookie, unpopulated `chat_messages.user_id`, a DNS-rebind
TOCTOU in the scraper, local-only tools that pretend to work on serverless, no rate
limiting, doc/code drift, and a bare `next.config.mjs`.

**Changed afterward:** nothing in the analysis itself — it became the work list for §7.

---

## 7. Build prompt — fix all 12 issues without regressions (Claude Code)

> "fix everything one by one … you have all the permission … just fix all the issues and
> make sure you don't break anything"

**Why structured this way:** an explicit, numbered backlog + a hard "don't break anything"
constraint pushes the agent toward small, verifiable edits instead of a rewrite. "One by
one" keeps each change reviewable.

**Produced (per issue, each followed by `npx tsc --noEmit` + `npx next build`):**
per-user filter in the file-store fallback; `GroqGenerationError` thrown instead of
returning stubs, with `/api/build` returning `502` and saving nothing; **one Groq request
per file**; refine paths that throw instead of overwriting `uiCode`; preview moved to
`<iframe sandbox="" srcDoc=…>`; `user_id` written on every `chat_messages` row; an
undici `Agent` that re-checks every resolved IP at TCP-connect time; `501` from
`write-files` / `verify-app` on serverless; `Secure` on the session cookie over HTTPS;
`lib/rate-limit.ts` (in-memory, per-user, per-scope) on all AI endpoints; CSP + security
headers in `next.config.mjs`; README/comment corrections.

**Changed afterward:** one `tsc` error (a `dns.lookup` overload) fixed with an explicit
cast; the SSRF `lookup` made exception-safe.

---

## 8. Build prompt — add the Product Blueprint chat (Claude Code)

> Add a natural-language editor for the `ProductBlueprint` matching the rubric examples —
> "make the design more premium", "add a dashboard", "remove the pricing page", "make it
> suitable for enterprise customers".

**Why structured this way:** the codebase already had two parallel chat refiners
(strategy, file-directory). The instruction was explicitly "mirror that existing pattern"
so the new one is consistent and low-risk.

**Produced:** new `stage: 'blueprint'` (type + schema `CHECK` + `store.ts` filters),
`refineBlueprintWithGroq`, `/api/blueprint/refine` + `/clear`, `components/BlueprintChat.tsx`,
and a `BlueprintView` with a navigation row so nav edits are visible. `tsc` + `build` clean;
26 routes.

**Changed afterward:** `BlueprintView` made display-only (optional `onGenerateUI`) so it
could be reused as a pure panel on stage 3.

---

## 9. Build prompt — "generated code doesn't persist" (Claude Code)

> "after building the product … once I move to some other page and come back to the coding
> part it's not there. make it stay until I close the project."

**Why structured this way:** a plain symptom report with the expected behavior. No guess at
the cause — the agent was left to investigate.

**Produced:** Claude Code queried the **live Supabase REST API** with the service-role key,
found `projects.file_directory` and `chat_messages.stage` missing, and traced that
`saveProject` sent `file_directory` in the *same* `upsert` as `generated_files` — so
Postgres rejected the whole write with `42703` and it fell back to a local file store that
`getProjectById` never reads when Supabase is configured. Fix: retry-strip unknown columns
so everything storable still reaches Supabase, mirror the rest to the file store, and
overlay those fields on read; plus the one-line migration. Full narrative in
`DEBUGGING_LOG.md` §4.

**Changed afterward:** overlay reads made exception-safe for a read-only serverless FS;
the user ran `supabase_schema.sql` so both columns now exist for real.
