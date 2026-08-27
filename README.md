# Recast

> **AI-Powered SaaS Blueprint & Full-Stack Code Studio**  
> Turn any public website into a complete, production-ready SaaS product using a multi-agent AI pipeline.

---

## What It Does

Recast is an autonomous multi-agent SaaS engine. You provide a public URL and a product vision — the system:

1. **Scrapes** the target website (server-side Cheerio HTML extraction)
2. **Analyzes** the extracted content using **Groq API (GPT-OSS 120B)** to generate a strategic product analysis and full-stack architecture file tree
3. **Generates code** for every frontend and backend file — also on **Groq (GPT-OSS 120B)**
4. Presents the output in a **VS Code-style multi-file IDE** with:
   - File Explorer (Frontend / Backend / Config tabs)
   - Line-numbered code viewer with file tabs and breadcrumbs
   - Sidebar AI Copilot for real-time code edits
   - Live Preview sandbox (iframe rendering)
5. Exports the full project to disk via the CLI terminal panel

---

## Architecture

```
User Input (URL + Vision Prompt)
        │
        ▼
┌─────────────────────────┐
│  Cheerio Web Scraper    │  lib/scraper.ts
│  (Server-side HTML)     │
└──────────┬──────────────┘
           │ Raw Text
           ▼
┌─────────────────────────┐
│  Groq API               │  lib/groq.ts
│  openai/gpt-oss-120b   │  → Product Analysis JSON
│                         │  → Full-Stack File Tree Plan
│                         │  → Writes code for every file
└──────────┬──────────────┘
           │ generatedFiles[]
           ▼
┌─────────────────────────┐
│  VS Code Studio UI      │  components/VSCodeEditor.tsx
│  + AI Copilot Sidebar   │
│  + Live Preview Frame   │
└─────────────────────────┘
           │
           ▼
    Supabase (PostgreSQL)  ←→  lib/store.ts
    projects + chat_messages
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI Provider (Analysis + Code Gen) | Groq API — `openai/gpt-oss-120b` |
| Fallback AI (if Groq unset) | OpenAI `gpt-4o-mini` |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Web Scraping | Cheerio (server-side) |
| Icons | Lucide React |

---

## Setup & Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key — required; this is the only AI provider the app uses

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd recast
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual keys (see Environment Variables below).

### 4. Set up Supabase database
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **SQL Editor** → **New Query**
3. Copy and paste the contents of [`supabase_schema.sql`](./supabase_schema.sql)
4. Click **Run**

> **Important**: In Supabase Dashboard → **Authentication → Settings**, toggle **"Enable email confirmations" → OFF** for local development so users can log in immediately after signup.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous public key |
| `GROQ_API_KEY` | ✅ Yes | Groq API key for GPT-OSS 120B — the only AI provider (analysis, blueprint, and code generation) |
| `OPENAI_API_KEY` | Optional | Last-resort fallback if Groq is not configured |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes (if using Supabase) | Verifies user JWTs server-side and bypasses RLS for authorized API access. Without it, all authenticated routes reject requests. |

---

## Database Schema

```sql
-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                    -- FK to auth.users (data isolation per user)
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  analysis JSONB,                  -- Groq product analysis output
  blueprint JSONB,                 -- Full product blueprint
  ui_code TEXT,                    -- Legacy single-file UI code
  generated_files JSONB,           -- Multi-file full-stack code array
  scraped_info JSONB,              -- Raw scraped website content
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Chat messages (AI copilot history per project)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ
);
```

Run [`supabase_schema.sql`](./supabase_schema.sql) to create both tables.

---

## AI Models Used

| Model | Provider | Role |
|-------|----------|------|
| `openai/gpt-oss-120b` | Groq | Analyzes scraped web text + user prompt → JSON product analysis + full-stack file tree plan; also writes production code for every generated file (frontend + backend) |
| `gpt-4o-mini` | OpenAI | Fallback if `GROQ_API_KEY` is not set (analysis, blueprint, and starter UI only — not category code generation) |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analyze` | POST | Scrape website + Groq AI analysis + save project |
| `/api/strategy/refine` | POST | Strategy-only chat refine (Groq, analysis JSON only) |
| `/api/file-directory/generate` | POST | Generate the product blueprint + the reviewable file tree |
| `/api/blueprint/refine` | POST | "Modify the proposed product" chat — name / features / navigation / pages / UI direction only |
| `/api/file-directory/refine` | POST | Chat refine of the planned file tree / routes only |
| `/api/build` | POST | Generate Groq code for the finalized file tree, one category at a time |
| `/api/refine` | POST | Studio copilot: edit blueprint + generated code via AI on user request |
| `/api/projects` | GET | List current user's projects (auth required) |
| `/api/projects/[id]` | GET | Fetch a single project (auth + ownership required) |
| `/api/auth/login` | POST | Sign in with Supabase |
| `/api/auth/signup` | POST | Create account with Supabase |
| `/api/health` | GET | System health check (Supabase + storage status) |

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example` in Vercel project settings
4. Deploy

> **Critical**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel. Without them, the app will fall back to local file storage which is **ephemeral** on serverless and will not persist data between requests.

---

## Security

- **Authentication**: Supabase Auth with JWT tokens, cryptographically verified server-side on every API route (`supabaseAdmin.auth.getUser`). No fake/unsigned tokens.
- **Route Protection**: `middleware.ts` at the Next.js edge protects `/dashboard`, `/projects/*`, and `/new` — unauthenticated users are redirected to `/login`. This is a routing hint only; the API routes are the real enforcement point.
- **Data Isolation**: Project and chat queries filter by the `user_id` from the verified JWT — in the Supabase path *and* the JSON-file fallback. `getProjectById`/`getAllProjects` treat another user's rows as "not found".
- **Session Cookie**: A `session_token` cookie (`SameSite=Strict`, `Secure` on HTTPS) is set client-side for middleware to read.
- **Security Headers**: `next.config.mjs` sends `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS (production).
- **SSRF**: User-supplied scrape URLs are DNS-resolved and rejected if they point at private/internal ranges, re-validated at TCP connect time (DNS-rebinding safe), and redirects are followed through the same guard.
- **Rate Limiting**: Per-user, per-minute in-memory limits on the AI endpoints.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/       # Step 1: Scrape + Groq analysis
│   │   ├── strategy/      # Strategy-only chat refine (Groq)
│   │   ├── build/         # Step 2: Blueprint + Groq code gen
│   │   ├── refine/        # AI copilot file edit
│   │   ├── projects/      # User project listing (auth-gated)
│   │   ├── auth/          # Login + signup (Supabase)
│   │   └── health/        # System health check
│   ├── dashboard/         # Project dashboard (protected)
│   ├── login/             # Auth page
│   └── projects/[id]/     # VS Code Studio workspace (protected)
├── components/
│   ├── VSCodeEditor.tsx   # VS Code-style IDE with copilot + live preview
│   ├── Header.tsx         # App nav + profile dropdown
│   ├── LandingPage.tsx    # Public marketing page (WebGL shader backdrop)
│   └── ...
├── lib/
│   ├── groq.ts            # Groq API integration (GPT-OSS 120B) — analysis + code gen
│   ├── ai.ts              # Provider orchestrator (Groq primary, OpenAI fallback)
│   ├── scraper.ts         # Server-side Cheerio scraper
│   ├── store.ts           # Supabase + file storage
│   ├── auth.ts            # Client auth helpers + session cookie
│   └── supabase.ts        # Supabase client
├── middleware.ts           # Edge route protection
├── types/index.ts          # TypeScript interfaces
├── supabase_schema.sql     # Database setup script
├── AI_DEVELOPMENT_PROCESS.md # Blank folder → deployed: which AI agent did what
├── AI_PROMPT_LOG.md          # 9 key prompts, the reasoning, and post-fixes
└── DEBUGGING_LOG.md          # 5 AI-code failures: problem → prompt → debug → fix
```

---

## Known Limitations

- **Live Preview**: Renders inside a fully sandboxed `<iframe>` (no scripts, opaque origin) as a rough *static structural approximation* only. The generated file is TSX, not HTML — imports, JSX expressions, hooks, and state do not execute.
- **Code Generation**: Requires a valid `GROQ_API_KEY`. If it is missing or a generation call fails (bad/truncated response, API error), the build **fails with an error and saves nothing** — it never persists placeholder stub files as a finished build. Files are generated one request per file to avoid whole-category truncation.
- **File Storage Fallback**: The `.data/` JSON file fallback works in local development only. It will silently fail on Vercel (serverless ephemeral filesystem). Always configure Supabase for deployed environments.
- **Scraper**: Works on public, server-rendered HTML pages. JavaScript-heavy SPAs (e.g., React apps without SSR) may return minimal content since Cheerio does not execute JS. Requests that resolve to private/internal addresses are blocked (checked again at connection time to defeat DNS rebinding).
- **Disk Export / Verifier**: `/api/write-files` and `/api/verify-app` are local-only dev tools; they return `501` when running on a serverless host.
- **Rate Limits**: Groq free tier has rate limits. If you hit `429 Too Many Requests`, add a delay or upgrade your Groq plan. The app also applies its own per-user, per-minute in-memory rate limit to the AI endpoints (a per-instance abuse speed bump, not a hard quota).

---

## License


