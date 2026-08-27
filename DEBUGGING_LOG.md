# Debugging Log — Recast

Five bugs where AI-generated code failed, each as
**Problem → AI prompt → first solution → debugging → final solution → verification**.
The last three were found and fixed with **Claude Code**.

---

## Bug #1 — Login accepted any email/password (fake unsigned JWT fallback)

**Problem.** Signing in with a wrong password still succeeded. `/api/auth/login` had a
"resilience" fallback that, when Supabase wasn't reachable, minted a token with
`btoa(JSON.stringify({ email, ... }))` and treated it as a session. It was an
authentication bypass — any credentials worked, and the "token" was an unsigned,
forgeable blob.

**AI prompt.**
> "The login route has a local fallback that creates a fake JWT when Supabase fails.
> Remove it. Login must go through Supabase `signInWithPassword` only. A wrong password
> must return a real 401. Server routes must cryptographically verify the token, not
> decode it."

**First solution.** The agent removed the fallback from the login route and had API
routes base64-decode the JWT payload and read the `sub` claim for the user id.

**Debugging.** Decoding is not verifying — a forged token with any `sub` would still be
"accepted". Confirmed by hand-crafting a token with a fake `sub` and hitting
`/api/projects`: it returned 200.

**Final solution.** `lib/supabase-admin.ts` `verifyJWT()` calls
`supabaseAdmin.auth.getUser(token)` (real signature verification) and **fails closed** if
`SUPABASE_SERVICE_ROLE_KEY` is absent. Every protected route goes through
`getAuthenticatedUser()`. The forged-token request now returns 401.

**Verification.** Wrong password → 401. Forged `sub` → 401. Valid session → 200.

---

## Bug #2 — Every user saw every project (file-store fallback ignored `userId`)

**Problem.** With Supabase unset (local dev, or a misconfigured deploy), `GET /api/projects`
returned *all* projects in the store to any logged-in user.

**AI prompt.**
> "`getAllProjects(userId)` filters by user in the Supabase branch but the JSON-file
> fallback returns `Object.values(store)` unfiltered. Make the fallback enforce the same
> per-user isolation, and add the same ownership check to `getProjectById`."

**First solution.** Added `.filter(p => p.userId === userId)` to the fallback in
`getAllProjects`.

**Debugging.** `getProjectById` had the same class of bug — the fallback returned any row
by id with no ownership check. The route-layer `project.userId !== user.id` check saved
the single-project endpoint, but relying on callers is fragile.

**Final solution.** `getProjectById(id, userId?)` now returns `null` for a mismatched
owner in **both** the Supabase and file paths; all 10 call sites pass `user.id`.
`getAllProjects` filters in both paths.

**Verification.** Two accounts, Supabase disabled: each sees only its own projects;
cross-account `GET /api/projects/{id}` → 404.

---

## Bug #3 — A failed code-gen call reported a "successful" build of empty files

**Problem.** If Groq returned malformed/truncated JSON (easy to hit — the old code asked
for *every file in a category* in one response), `generateFullStackCodeWithGroq` swallowed
the error and returned the caller's placeholder stubs unchanged. `/api/build` then saved
`// Placeholder generated for app/page.tsx` to the project and returned
`{ success: true }`. The user saw a finished build made of stub comments.

**AI prompt.**
> "Non-429 Groq failures in `generateFullStackCodeWithGroq` return the stub files and
> `/api/build` persists them as `success: true`. Make generation fail loudly instead —
> never save placeholder content. Also split generation to one request per file so one
> bad response doesn't sink the whole category."

**First solution.** Added a `GroqGenerationError`, thrown on parse failure / empty content
/ missing API key; `/api/build` catches it and returns `502` without saving.

**Debugging.** The single-request-per-category shape was still the root fragility — a
large category still truncated. And the rate-limit path (`GroqRateLimitError`, which the
client retries with a 60s countdown) had to keep working *through* the new per-file loop.

**Final solution.** `generateSingleFileWithGroq` — one request per file, sequential (to
respect rate limits); a 429 on any file still throws `GroqRateLimitError`; any other
failure throws `GroqGenerationError`. `/api/build` maps them to `429 {rateLimited}` and
`502 {generationFailed}` respectively and saves nothing on failure.

**Verification.** Forced a parse error → `502`, project `generated_files` unchanged,
category shows red in `BuildProgress`. Forced a 429 → client counts down and retries.

---

## Bug #4 — Generated code vanished after leaving and reopening a project

**Problem.** Build a product, navigate to the dashboard, reopen the project → the VS Code
tab is empty / locked. In-memory it worked; across a refetch it was gone.

**AI prompt.**
> "After building the product it is not persistent — the files are gone once I move to
> another page and come back. Make it stay until I close the project."

**First solution / hypothesis.** The obvious guesses were "Build isn't calling
`saveProject`" or "the client isn't refetching". Both were wrong — `/api/build` does save,
and the studio page does refetch on mount.

**Debugging.** Claude Code introspected the **live Supabase schema** via the REST API with
the service-role key:

```
GET /rest/v1/projects?select=file_directory     → 400  column projects.file_directory does not exist
GET /rest/v1/projects?select=generated_files     → 200
GET /rest/v1/chat_messages?select=stage          → 400  column chat_messages.stage does not exist
```

The deployed DB was on an **older schema**. `saveProject` built one `upsert` object
containing *both* `generated_files` and `file_directory`. Because `file_directory` didn't
exist, Postgres rejected the **entire** statement with `42703` — so `generated_files`
never persisted either. The catch then wrote to `.data/projects.json`… which
`getProjectById` never reads when Supabase is configured. The code was written to a
dead-end and read back as `null`.

**Final solution.**
1. `saveProject` retry-strips any column the DB reports missing (`42703`), so everything
   the schema *can* take still lands in Supabase; the full record (incl. stripped fields)
   is mirrored to the file store.
2. `getProjectById` / `getAllProjects` overlay `generated_files` / `file_directory` from
   that mirror when the row doesn't return them; `getProjectById` also merges file-store
   chat messages when `stage` is absent. All overlay reads are exception-safe (no-op on a
   read-only serverless FS).
3. The real fix: run `supabase_schema.sql` (idempotent) to add the two columns. Verified
   afterward — both now return `200`.

**Verification.** Pre-migration (mirror path): build → dashboard → reopen → code present.
Post-migration: `generated_files` and `file_directory` persist directly in Postgres; the
mirror path never triggers.

---

## Bug #5 — The AI copilot destroyed the user's real code on a transient failure

**Problem.** In the VS Code studio, sending the copilot a message when Groq hiccuped
replaced `project.uiCode` with regenerated *placeholder starter code*. A flaky network
call silently wiped work the user had iterated on.

**AI prompt.**
> "`refineWithGroq`'s fallback regenerates `updatedCode` with
> `getDefaultStarterUICodeFallback(...)` and `/api/refine` persists it to `uiCode`. On any
> failure it must throw and leave the existing code untouched — never substitute
> placeholder content."

**First solution.** Made `refineWithGroq` throw `GroqGenerationError` on API error and on
a response missing required fields, instead of returning the placeholder rewrite.

**Debugging.** The OpenAI fallback path (`refineWithAI`, used when `GROQ_API_KEY` is
unset) had the identical anti-pattern — a deterministic "helpful" rewrite at the end.
`/api/refine` also needed to not persist on the throw: confirmed it already saves *after*
the refine call, so an exception leaves the row untouched.

**Final solution.** Both refiners throw on failure. `/api/refine` returns the error and
writes nothing. The user gets an alert; their code is exactly as they left it.

**Verification.** Simulated a Groq 500 during a copilot edit → alert shown, `uiCode`
unchanged on the next refetch.
