# AI Prompt Log — ProductForge

This document records all significant AI prompts, inputs, and outputs used during the development of ProductForge.
Required deliverable per project rubric.

---

## 1. UI Redesign — Clean Minimalist Developer SaaS Theme

**Agent**: Antigravity (Gemini / Claude)
**Prompt**:
> "Redesign my UI page"
> → Selected: "Entire application (Cohesive UI redesign across all pages)"
> → Selected: "Clean Minimalist Developer SaaS (Sleek slate theme, high readability, crisp borders, subtle hover interactions)"

**Output**:
- Redesigned `app/globals.css` — deep slate background (`#090d16`), linear grid background, `.card-slate` components, custom scrollbars
- Redesigned `components/Header.tsx` — brand badge "v0.1 Engine", status pill, project count
- Redesigned `app/page.tsx` — generator hero with quick-reference inspiration pills (Stripe, Linear, Notion, Loom)
- Redesigned `app/dashboard/page.tsx` — SaaS project cards with status badges, search filter
- Redesigned `app/login/page.tsx` — developer login with feature pill badges
- Redesigned `components/AuthModal.tsx`, `components/AnalysisView.tsx`, `components/BlueprintView.tsx`, `components/LivePreview.tsx`, `components/ChatEditor.tsx`, `components/PipelineStepper.tsx`, `components/TerminalWidget.tsx`

---

## 2. Groq API Integration Planning

**Agent**: Antigravity
**Prompt**:
> "I need to use groq api as llm here after extracting the website it should give the text to Groq API. It will process the text and include the prompt given by the user. It will generate the files needed. After generating the file, we will be having another agent, Claude Code, which will be writing the code for the generated files for both frontend and backend. It will be showing the code like how it will look in VS Code. In the sidebar, it should have an AI assistant. If they are asking to edit something, then it should also edit that. And the next bar should have a live preview."

**Architecture planned**:
```
Website URL → Cheerio Scraper → Raw Text
→ Groq API (llama-3.3-70b-versatile) — Text Analysis + File Tree Planning
→ Claude Code Agent (claude-3-5-sonnet-20241022) — Multi-file Code Generation
→ VS Code Studio UI — File Explorer + Line Numbers + Copilot Sidebar + Live Preview
```

**Output**:
- `lib/groq.ts` — Groq API client (OpenAI SDK pointing to `https://api.groq.com/openai/v1`)
  - `analyzeWebsiteWithGroq()` — Sends scraped text + user prompt → structured JSON `ProductAnalysis`
  - `generateBlueprintWithGroq()` — Sends analysis → full-stack `fileTreePlan` JSON
- `lib/claude.ts` — Claude Code agent
  - `generateFullStackCodeWithClaude()` — Takes Groq file tree → writes complete code for each file
  - `refineWithClaude()` — Copilot-style multi-file edits on user request
- `lib/ai.ts` — Orchestrator connecting all agents in sequence
- `components/VSCodeEditor.tsx` — VS Code-style IDE component
  - Left sidebar: file tree explorer (Frontend / Backend / Config categories)
  - Copilot tab: AI assistant for live edits
  - Editor pane: line numbers, file tabs, breadcrumb paths
  - Preview pane: iframe sandbox with live rendering

---

## 3. Groq Prompt — Website Analysis (Production Prompt)

**Model**: `llama-3.3-70b-versatile` via Groq API
**System Role**: Groq AI Product Analyst Agent
**Input**:
```
WEBSITE URL: <user-provided URL>
WEBSITE TITLE: <scraped title>
META DESCRIPTION: <scraped description>
HEADINGS: <H1, H2, H3 list>
EXTRACTED TEXT SAMPLE: <first 3000 chars of body text>
USER VISION: <user product description>
TARGET CUSTOMER: <user-specified persona>
```
**Expected Output**:
```json
{
  "summary": "...",
  "targetUsers": ["...", "..."],
  "coreProblem": "...",
  "keyFeatures": ["...", "..."],
  "businessModel": "...",
  "suggestedImprovements": ["...", "..."],
  "proposedMVPFeatures": ["...", "..."]
}
```

---

## 4. Groq Prompt — Full-Stack File Tree Architecture

**Model**: `llama-3.3-70b-versatile` via Groq API
**System Role**: Groq AI Product Architect Agent
**Input**: Structured `ProductAnalysis` JSON + user vision + target customer
**Expected Output**:
```json
{
  "productName": "...",
  "tagline": "...",
  "fileTreePlan": [
    { "path": "app/page.tsx", "name": "page.tsx", "type": "frontend", "language": "typescript" },
    { "path": "app/api/analytics/route.ts", "name": "route.ts", "type": "backend", "language": "typescript" },
    { "path": "package.json", "name": "package.json", "type": "config", "language": "json" }
  ]
}
```

---

## 5. Claude Code Agent Prompt — Multi-File Code Generation

**Model**: `claude-3-5-sonnet-20241022` via Anthropic API
**System Role**: Claude Code full-stack developer agent
**Input**: Groq-planned `fileTreePlan[]` + product context
**Task**: Write complete, production-ready code for every file in the tree
**Output**: Array of `{ path, content, language }` objects with full implementation code

---

## 6. Claude Copilot Prompt — File Edit Refinement

**Model**: `claude-3-5-sonnet-20241022`
**Input**: User natural language edit request + current file contents
**Example**: `"Add a dark mode toggle to the navbar"`
**Output**: Updated file contents for all affected files

---

## 7. Security Audit Fixes (Critical Issues Resolved)

**Identified by**: External code review
**Issues fixed with AI assistance**:

1. **Authentication bypass** — Removed fake unsigned JWT fallback from login/signup routes. Real Supabase `signInWithPassword` is now enforced. Wrong password → genuine `401`.
2. **Missing middleware** — Created `middleware.ts` to protect `/dashboard` and `/projects/*` at the Next.js edge layer.
3. **User data isolation** — Fixed `/api/projects` and `/api/analyze` to extract `userId` from JWT and filter/tag projects per user.
4. **Production storage** — Added explicit `console.error` warning when file-based storage fallback runs in production.
5. **Cookie-based session** — Added `session_token` cookie management to `lib/auth.ts` so middleware can read it server-side.
