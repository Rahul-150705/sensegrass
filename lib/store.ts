// Server-only storage module — DO NOT import from client components
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import { Project, ChatMessage, ChatStage } from '@/types';
import fs from 'fs';
import path from 'path';

// Row Level Security policies require auth.uid() = user_id, but server routes
// never attach an end-user Supabase session — they authenticate the caller
// themselves via verifyJWT() and enforce ownership in the route handlers.
// Querying with the anon key here would therefore have auth.uid() = NULL and
// RLS would silently return/write zero rows. Use the service-role client
// (which bypasses RLS) whenever it's configured.
const db = isAdminConfigured ? supabaseAdmin : supabase;
const isDbConfigured = isAdminConfigured || isSupabaseConfigured;

// Columns added by later migrations that an out-of-date Supabase schema may
// not have yet (e.g. projects.file_directory). The first time an upsert hits a
// 42703 "column does not exist" for one of these, we remember it and stop
// sending it — so the rest of the write still lands in Supabase instead of the
// whole thing silently falling back to the local JSON file store. Run
// supabase_schema.sql to add the columns for real and make this a no-op.
const knownMissingProjectColumns = new Set<string>();

function missingColumnFromError(err: any): string | null {
  if (!err || err.code !== '42703') return null;
  const m = /column\s+(?:[\w".]+\.)?"?([a-z_]+)"?\s+.*does not exist/i.exec(err.message || '');
  return m ? m[1] : null;
}

// ─── Persistent JSON File Fallback (when Supabase is offline) ───────────────
const DATA_DIR = path.join(process.cwd(), '.data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');

function ensureDataDir() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '⚠️ [STORAGE WARNING] Using local filesystem fallback in PRODUCTION. ' +
      'This is NOT persistent on serverless platforms (Vercel, AWS Lambda). ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase instead.'
    );
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readProjectsFile(): Record<string, Project> {
  ensureDataDir();
  if (!fs.existsSync(PROJECTS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8')); } catch { return {}; }
}

function writeProjectsFile(data: Record<string, Project>) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Never throws — used by the read paths to overlay mirrored fields when the
// Supabase schema is out of date. On a read-only serverless FS this just
// returns {} (the correct fix there is to run supabase_schema.sql).
function safeReadProjectsFile(): Record<string, Project> {
  try {
    return readProjectsFile();
  } catch {
    return {};
  }
}

function readChatsFile(): Record<string, ChatMessage[]> {
  ensureDataDir();
  if (!fs.existsSync(CHATS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8')); } catch { return {}; }
}

function writeChatsFile(data: Record<string, ChatMessage[]>) {
  ensureDataDir();
  fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Save Project ───────────────────────────────────────────────────────────────
export async function saveProject(project: Partial<Project> & { id: string }): Promise<Project> {
  const now = new Date().toISOString();

  if (isDbConfigured && db) {
    try {
      // saveProject is routinely called with a PARTIAL project (e.g. just
      // { id, analysis } from the strategy refine endpoint). Fetch the
      // existing row first so fields the caller didn't pass are preserved
      // instead of being clobbered with empty-string/null defaults.
      const { data: existingRow } = await db
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();

      const fullRow: Record<string, any> = {
        id: project.id,
        user_id: project.userId ?? existingRow?.user_id ?? null,
        name: project.name ?? existingRow?.name ?? 'Untitled SaaS Project',
        website_url: project.websiteUrl ?? existingRow?.website_url ?? '',
        description: project.description ?? existingRow?.description ?? '',
        target_customer: project.targetCustomer ?? existingRow?.target_customer ?? '',
        analysis: project.analysis !== undefined ? project.analysis : existingRow?.analysis ?? null,
        blueprint: project.blueprint !== undefined ? project.blueprint : existingRow?.blueprint ?? null,
        ui_code: project.uiCode !== undefined ? project.uiCode : existingRow?.ui_code ?? null,
        scraped_info: project.scrapedInfo !== undefined ? project.scrapedInfo : existingRow?.scraped_info ?? null,
        generated_files: project.generatedFiles !== undefined ? project.generatedFiles : existingRow?.generated_files ?? null,
        file_directory: project.fileDirectory !== undefined ? project.fileDirectory : existingRow?.file_directory ?? null,
        updated_at: now,
      };

      // Send everything the schema is known to accept; retry-strip any column
      // the DB reports as missing so a stale schema still persists the rest.
      const row: Record<string, any> = {};
      for (const [k, v] of Object.entries(fullRow)) {
        if (!knownMissingProjectColumns.has(k)) row[k] = v;
      }

      let data: any = null;
      let lastError: any = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await db.from('projects').upsert(row).select().single();
        if (!res.error) { data = res.data; break; }
        lastError = res.error;
        const missing = missingColumnFromError(res.error);
        if (missing && missing in row && missing !== 'id') {
          knownMissingProjectColumns.add(missing);
          delete row[missing];
          console.warn(
            `[STORAGE] projects.${missing} is missing from the Supabase schema — run supabase_schema.sql. ` +
            `Persisting the rest to Supabase and mirroring "${missing}" to the local file store.`
          );
          continue;
        }
        break;
      }

      if (data) {
        // If any column was stripped, mirror the COMPLETE record (including the
        // stripped fields) to the file store so getProjectById can overlay them
        // back — otherwise e.g. generated_files would read back as null forever.
        if (knownMissingProjectColumns.size > 0) {
          try {
            const store = readProjectsFile();
            store[project.id] = {
              id: project.id,
              userId: fullRow.user_id ?? undefined,
              name: fullRow.name,
              websiteUrl: fullRow.website_url,
              description: fullRow.description,
              targetCustomer: fullRow.target_customer,
              analysis: fullRow.analysis,
              blueprint: fullRow.blueprint,
              uiCode: fullRow.ui_code,
              scrapedInfo: fullRow.scraped_info,
              generatedFiles: fullRow.generated_files,
              fileDirectory: fullRow.file_directory,
              chatHistory: store[project.id]?.chatHistory || [],
              createdAt: data.created_at || store[project.id]?.createdAt || now,
              updatedAt: now,
            };
            writeProjectsFile(store);
          } catch (e: any) {
            console.warn('[STORAGE] could not mirror project to file store:', e?.message);
          }
        }

        return {
          id: data.id,
          userId: data.user_id ?? fullRow.user_id ?? undefined,
          name: data.name,
          websiteUrl: data.website_url,
          description: data.description,
          targetCustomer: data.target_customer,
          analysis: data.analysis,
          blueprint: data.blueprint,
          uiCode: data.ui_code,
          scrapedInfo: data.scraped_info,
          generatedFiles: data.generated_files ?? fullRow.generated_files ?? null,
          fileDirectory: data.file_directory ?? fullRow.file_directory ?? null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
      console.warn('Supabase saveProject fallback:', lastError?.message);
    } catch (err: any) {
      console.warn('Supabase saveProject error, using file fallback:', err?.message);
    }
  }

  // Persistent file fallback
  const store = readProjectsFile();
  const existing = store[project.id];
  const updatedProject: Project = {
    id: project.id,
    userId: project.userId || existing?.userId,
    name: project.name || existing?.name || 'Untitled SaaS Project',
    websiteUrl: project.websiteUrl || existing?.websiteUrl || '',
    description: project.description || existing?.description || '',
    targetCustomer: project.targetCustomer || existing?.targetCustomer || '',
    analysis: project.analysis !== undefined ? project.analysis : existing?.analysis,
    blueprint: project.blueprint !== undefined ? project.blueprint : existing?.blueprint,
    uiCode: project.uiCode !== undefined ? project.uiCode : existing?.uiCode,
    scrapedInfo: project.scrapedInfo !== undefined ? project.scrapedInfo : existing?.scrapedInfo,
    generatedFiles: project.generatedFiles !== undefined ? project.generatedFiles : existing?.generatedFiles,
    fileDirectory: project.fileDirectory !== undefined ? project.fileDirectory : existing?.fileDirectory,
    chatHistory: existing?.chatHistory || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  store[project.id] = updatedProject;
  writeProjectsFile(store);
  return updatedProject;
}

// ─── Get Project By ID ──────────────────────────────────────────────────────────
// When `userId` is supplied, a project owned by a different user is treated as
// "not found" here — defence in depth so ownership isn't only enforced at the
// route layer (and so the JSON-file fallback can't return another user's row).
export async function getProjectById(id: string, userId?: string): Promise<Project | null> {
  if (isDbConfigured && db) {
    try {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        if (userId && data.user_id && data.user_id !== userId) return null;

        // A stale schema returns rows without newer columns (undefined, not
        // null). saveProject mirrors those fields to the file store — overlay
        // them here so generated code / the file directory survive a reload.
        const needsOverlay = data.generated_files === undefined || data.file_directory === undefined;
        const mirrored = needsOverlay ? safeReadProjectsFile()[id] : undefined;

        const { data: chatData } = await db
          .from('chat_messages')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: true });

        let allMessages: ChatMessage[] = (chatData || []).map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          role: c.role,
          content: c.content,
          // Rows written before the `stage` column existed default to
          // 'studio' at the DB level, which is correct — they were always
          // Blueprint/Code copilot messages.
          stage: (c.stage || 'studio') as ChatStage,
          createdAt: c.created_at,
        }));

        // When chat_messages.stage is missing, addChatMessage inserts fail and
        // fall back to the file store — so the strategy / blueprint / file-
        // directory transcripts only exist there. Merge them in (dedupe by id).
        const chatStaleSchema = (chatData || []).some((c: any) => c.stage === undefined) || (chatData || []).length === 0;
        if (chatStaleSchema) {
          try {
            const fileChats = readChatsFile()[id] || [];
            if (fileChats.length) {
              const seen = new Set(allMessages.map((m) => m.id));
              allMessages = [...allMessages, ...fileChats.filter((m) => !seen.has(m.id))].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            }
          } catch {
            // read-only FS or no file store — nothing to merge.
          }
        }

        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          websiteUrl: data.website_url,
          description: data.description,
          targetCustomer: data.target_customer,
          analysis: data.analysis,
          blueprint: data.blueprint,
          uiCode: data.ui_code,
          scrapedInfo: data.scraped_info,
          generatedFiles: data.generated_files ?? mirrored?.generatedFiles ?? null,
          fileDirectory: data.file_directory ?? mirrored?.fileDirectory ?? null,
          chatHistory: allMessages.filter((m) => m.stage === 'studio' || !m.stage),
          strategyChatHistory: allMessages.filter((m) => m.stage === 'strategy'),
          blueprintChatHistory: allMessages.filter((m) => m.stage === 'blueprint'),
          fileDirectoryChatHistory: allMessages.filter((m) => m.stage === 'fileDirectory'),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err: any) {
      console.warn('Supabase getProjectById error, using file fallback:', err?.message);
    }
  }

  const store = readProjectsFile();
  const project = store[id];
  if (project && userId && project.userId && project.userId !== userId) return null;
  if (project) {
    const chats = readChatsFile();
    const allMessages = chats[id] || project.chatHistory || [];
    project.chatHistory = allMessages.filter((m) => m.stage === 'studio' || !m.stage);
    project.strategyChatHistory = allMessages.filter((m) => m.stage === 'strategy');
    project.blueprintChatHistory = allMessages.filter((m) => m.stage === 'blueprint');
    project.fileDirectoryChatHistory = allMessages.filter((m) => m.stage === 'fileDirectory');
  }
  return project || null;
}

// ─── Get All Projects ───────────────────────────────────────────────────────────
export async function getAllProjects(userId?: string): Promise<Project[]> {
  if (isDbConfigured && db) {
    try {
      let query = db
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Overlay file-store mirror for columns a stale schema doesn't return
        // (see getProjectById for why).
        const needsOverlay = data.some(
          (d: any) => d.generated_files === undefined || d.file_directory === undefined
        );
        const mirror: Record<string, Project> = needsOverlay ? safeReadProjectsFile() : {};
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          websiteUrl: d.website_url,
          description: d.description,
          targetCustomer: d.target_customer,
          analysis: d.analysis,
          blueprint: d.blueprint,
          uiCode: d.ui_code,
          scrapedInfo: d.scraped_info,
          generatedFiles: d.generated_files ?? mirror[d.id]?.generatedFiles ?? null,
          fileDirectory: d.file_directory ?? mirror[d.id]?.fileDirectory ?? null,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (err: any) {
      console.warn('Supabase getAllProjects error, using file fallback:', err?.message);
    }
  }

  const store = readProjectsFile();
  return Object.values(store)
    // Same per-user isolation the Supabase query above enforces — without this
    // the JSON-file fallback would hand every caller every user's projects.
    .filter((p) => !userId || p.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// ─── Add Chat Message ───────────────────────────────────────────────────────────
export async function addChatMessage(
  projectId: string,
  role: 'user' | 'assistant',
  content: string,
  stage: ChatStage = 'studio',
  userId?: string
): Promise<ChatMessage> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  if (isDbConfigured && db) {
    try {
      // `user_id` is what the chat_messages RLS policy checks (auth.uid() =
      // user_id). The service-role client bypasses RLS, but persisting it keeps
      // the row correct if RLS is ever enforced with the anon key, and links
      // the message to its author rather than only to the project.
      const { data } = await db
        .from('chat_messages')
        .insert({ id, project_id: projectId, user_id: userId ?? null, role, content, stage, created_at: now })
        .select()
        .single();

      if (data) {
        return {
          id: data.id,
          projectId: data.project_id,
          userId: data.user_id ?? undefined,
          role: data.role,
          content: data.content,
          stage: (data.stage || 'studio') as ChatStage,
          createdAt: data.created_at,
        };
      }
    } catch (err: any) {
      console.warn('Supabase addChatMessage error, using file fallback:', err?.message);
    }
  }

  const msg: ChatMessage = { id, projectId, userId, role, content, stage, createdAt: now };
  const chats = readChatsFile();
  if (!chats[projectId]) chats[projectId] = [];
  chats[projectId].push(msg);
  writeChatsFile(chats);

  const store = readProjectsFile();
  if (store[projectId]) {
    store[projectId].chatHistory = chats[projectId].filter((m) => m.stage === 'studio' || !m.stage);
    store[projectId].strategyChatHistory = chats[projectId].filter((m) => m.stage === 'strategy');
    store[projectId].blueprintChatHistory = chats[projectId].filter((m) => m.stage === 'blueprint');
    store[projectId].fileDirectoryChatHistory = chats[projectId].filter((m) => m.stage === 'fileDirectory');
    writeProjectsFile(store);
  }

  return msg;
}

// ─── Clear Chat Messages (per project, per stage) ────────────────────────────────
export async function clearChatMessages(projectId: string, stage: ChatStage): Promise<void> {
  if (isDbConfigured && db) {
    try {
      const { error } = await db
        .from('chat_messages')
        .delete()
        .eq('project_id', projectId)
        .eq('stage', stage);
      if (!error) return;
      console.warn('Supabase clearChatMessages fallback:', error.message);
    } catch (err: any) {
      console.warn('Supabase clearChatMessages error, using file fallback:', err?.message);
    }
  }

  const chats = readChatsFile();
  if (chats[projectId]) {
    chats[projectId] = chats[projectId].filter((m) => m.stage !== stage);
    writeChatsFile(chats);
  }

  const store = readProjectsFile();
  if (store[projectId]) {
    if (stage === 'strategy') store[projectId].strategyChatHistory = [];
    else if (stage === 'blueprint') store[projectId].blueprintChatHistory = [];
    else if (stage === 'fileDirectory') store[projectId].fileDirectoryChatHistory = [];
    else store[projectId].chatHistory = [];
    writeProjectsFile(store);
  }
}
