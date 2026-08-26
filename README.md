# ProductForge

> **AI-Powered SaaS Blueprint & Full-Stack Code Studio**  
> Turn any public website into a complete, production-ready SaaS product using a multi-agent AI pipeline.

---

## What It Does

ProductForge is an autonomous multi-agent SaaS engine. You provide a public URL and a product vision — the system:

1. **Scrapes** the target website (server-side Cheerio HTML extraction)
2. **Analyzes** the extracted content using **Groq API (Llama 3.3 70B)** to generate a strategic product analysis and full-stack architecture file tree
3. **Generates code** for every frontend and backend file using **Claude Code Agent (Claude 3.5 Sonnet)**
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
│  llama-3.3-70b-versatile│  → Product Analysis JSON
│                         │  → Full-Stack File Tree Plan
└──────────┬──────────────┘
           │ fileTreePlan[]
           ▼
┌─────────────────────────┐
│  Claude Code Agent      │  lib/claude.ts
│  claude-3-5-sonnet      │  → Writes code for every file
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
| Primary AI (Analysis) | Groq API — `llama-3.3-70b-versatile` |
| Secondary AI (Code Gen) | Anthropic Claude — `claude-3-5-sonnet-20241022` |
| Fallback AI | OpenAI GPT-4o |
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
- A [Groq](https://console.groq.com) API key
- An [Anthropic](https://console.anthropic.com) API key (optional — for Claude Code agent)

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd productforge
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
| `GROQ_API_KEY` | ✅ Yes | Groq API key for Llama 3.3 70B (primary AI engine) |
| `ANTHROPIC_API_KEY` | ⚡ Recommended | Claude 3.5 Sonnet for full-stack code generation |
| `OPENAI_API_KEY` | Optional | OpenAI fallback if Claude is not configured |
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
| `llama-3.3-70b-versatile` | Groq | Analyzes scraped web text + user prompt → JSON product analysis + full-stack file tree plan |
| `claude-3-5-sonnet-20241022` | Anthropic | Writes production-quality code for every generated file (frontend + backend) |
| `gpt-4o` | OpenAI | Fallback if Claude key is not set |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analyze` | POST | Scrape website + Groq AI analysis + save project |
| `/api/build` | POST | Generate blueprint + Claude code for all files |
| `/api/refine` | POST | Copilot: edit files via AI on user request |
| `/api/projects` | GET | List current user's projects (auth required) |
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

- **Authentication**: Supabase Auth with JWT tokens. No fake/unsigned tokens.
- **Route Protection**: `middleware.ts` at the Next.js edge protects `/dashboard` and `/projects/*` — unauthenticated users are redirected to `/login`.
- **Data Isolation**: All project queries filter by `user_id` extracted from the JWT `sub` claim. Users cannot access other users' projects.
- **Session Cookie**: A `session_token` cookie (SameSite=Strict) is set on login for middleware to read.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/       # Step 1: Scrape + Groq analysis
│   │   ├── build/         # Step 2: Blueprint + Claude code gen
│   │   ├── refine/        # AI copilot file edit
│   │   ├── projects/      # User project listing (auth-gated)
│   │   ├── auth/          # Login + signup (Supabase)
│   │   └── health/        # System health check
│   ├── dashboard/         # Project dashboard (protected)
│   ├── login/             # Auth page
│   └── projects/[id]/     # VS Code Studio workspace (protected)
├── components/
│   ├── VSCodeEditor.tsx   # VS Code-style IDE with copilot + live preview
│   ├── Header.tsx
│   ├── AuthModal.tsx
│   └── ...
├── lib/
│   ├── groq.ts            # Groq API integration (Llama 3.3 70B)
│   ├── claude.ts          # Claude Code agent
│   ├── ai.ts              # Multi-agent orchestrator
│   ├── scraper.ts         # Server-side Cheerio scraper
│   ├── store.ts           # Supabase + file storage
│   ├── auth.ts            # Client auth helpers + session cookie
│   └── supabase.ts        # Supabase client
├── middleware.ts           # Edge route protection
├── types/index.ts          # TypeScript interfaces
├── supabase_schema.sql     # Database setup script
├── AI_PROMPT_LOG.md        # AI prompts used in development
└── DEBUGGING_LOG.md        # Bugs found and resolved
```

---

## Known Limitations

- **Live Preview**: The iframe sandbox renders static HTML/CSS only. React JSX is transpiled by string replacement (removing `className=` → `class=`) — complex components with hooks or state won't execute in preview.
- **Claude Code**: Requires a valid Anthropic API key. Without it, the app falls back to a deterministic mock file generator.
- **File Storage Fallback**: The `.data/` JSON file fallback works in local development only. It will silently fail on Vercel (serverless ephemeral filesystem). Always configure Supabase for deployed environments.
- **Scraper**: Works on public, server-rendered HTML pages. JavaScript-heavy SPAs (e.g., React apps without SSR) may return minimal content since Cheerio does not execute JS.
- **Rate Limits**: Groq free tier has rate limits. If you hit `429 Too Many Requests`, add a delay or upgrade your Groq plan.

---

## License

MIT
