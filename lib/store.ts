// Server-only storage module — DO NOT import from client components
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Project, ChatMessage } from '@/types';
import fs from 'fs';
import path from 'path';

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

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .upsert({
          id: project.id,
          user_id: project.userId || null,
          name: project.name || 'Untitled SaaS Project',
          website_url: project.websiteUrl || '',
          description: project.description || '',
          target_customer: project.targetCustomer || '',
          analysis: project.analysis || null,
          blueprint: project.blueprint || null,
          ui_code: project.uiCode || null,
          scraped_info: project.scrapedInfo || null,
          updated_at: now,
        })
        .select()
        .single();

      if (!error && data) {
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
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
      console.warn('Supabase saveProject fallback:', error?.message);
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
    chatHistory: existing?.chatHistory || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  store[project.id] = updatedProject;
  writeProjectsFile(store);
  return updatedProject;
}

// ─── Get Project By ID ──────────────────────────────────────────────────────────
export async function getProjectById(id: string): Promise<Project | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        const { data: chatData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: true });

        const chatHistory: ChatMessage[] = (chatData || []).map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          role: c.role,
          content: c.content,
          createdAt: c.created_at,
        }));

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
          chatHistory,
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
  if (project) {
    const chats = readChatsFile();
    project.chatHistory = chats[id] || project.chatHistory || [];
  }
  return project || null;
}

// ─── Get All Projects ───────────────────────────────────────────────────────────
export async function getAllProjects(userId?: string): Promise<Project[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (!error && data) {
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
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (err: any) {
      console.warn('Supabase getAllProjects error, using file fallback:', err?.message);
    }
  }

  const store = readProjectsFile();
  return Object.values(store).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ─── Add Chat Message ───────────────────────────────────────────────────────────
export async function addChatMessage(
  projectId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .insert({ id, project_id: projectId, role, content, created_at: now })
        .select()
        .single();

      if (data) {
        return {
          id: data.id,
          projectId: data.project_id,
          role: data.role,
          content: data.content,
          createdAt: data.created_at,
        };
      }
    } catch (err: any) {
      console.warn('Supabase addChatMessage error, using file fallback:', err?.message);
    }
  }

  const msg: ChatMessage = { id, projectId, role, content, createdAt: now };
  const chats = readChatsFile();
  if (!chats[projectId]) chats[projectId] = [];
  chats[projectId].push(msg);
  writeChatsFile(chats);

  const store = readProjectsFile();
  if (store[projectId]) {
    store[projectId].chatHistory = chats[projectId];
    writeProjectsFile(store);
  }

  return msg;
}
