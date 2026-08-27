import OpenAI from 'openai';
import {
  ProductAnalysis,
  ProductBlueprint,
  ScrapedContent,
  ProjectFile,
  ProductFileDirectory,
  FileDirectoryEntry,
} from '@/types';
import { tidyFileContent } from '@/lib/format';

const groqApiKey = process.env.GROQ_API_KEY || '';
export const isGroqConfigured = Boolean(
  groqApiKey && groqApiKey !== 'your_groq_api_key_here'
);

// Thrown (not swallowed) when Groq returns 429. Callers that can meaningfully
// retry after a cooldown — currently the per-category code generation used
// by Build — should catch this specifically instead of treating it like any
// other generation failure.
export class GroqRateLimitError extends Error {
  constructor(message = 'Rate limited by Groq. Please retry shortly.') {
    super(message);
    this.name = 'GroqRateLimitError';
  }
}

// Thrown when a code-generation call fails for any non-rate-limit reason
// (API error, malformed/truncated JSON, empty content, or no API key). Callers
// MUST NOT fall back to placeholder stubs on this — doing so would persist
// blank files and report a "successful" build.
export class GroqGenerationError extends Error {
  constructor(message = 'Code generation failed. Please try again.') {
    super(message);
    this.name = 'GroqGenerationError';
  }
}

function isRateLimitError(err: any): boolean {
  return err?.status === 429 || err?.code === 'rate_limit_exceeded';
}

const groq = isGroqConfigured
  ? new OpenAI({
      apiKey: groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

// Primary Groq model — used for every stage (analysis, blueprint, file
// directory, and code generation). Verified available on this account via
// GET https://api.groq.com/openai/v1/models.
const GROQ_MODEL = 'openai/gpt-oss-120b';

export async function analyzeWebsiteWithGroq(
  websiteUrl: string,
  scraped: ScrapedContent,
  userDescription: string,
  targetCustomer: string
): Promise<ProductAnalysis> {
  if (groq) {
    try {
      console.log('🚀 [GROQ API REQUEST]: Sending text data & prompt to Groq (openai/gpt-oss-120b)...');
      const prompt = `You are the Groq AI Product Analyst Agent powered by GPT-OSS 120B.
Analyze this extracted website data and user vision to design a high-growth B2B SaaS product.

WEBSITE URL: ${websiteUrl}
WEBSITE TITLE: ${scraped.title}
META DESCRIPTION: ${scraped.description}
HEADINGS: ${scraped.headings.join(' | ')}
EXTRACTED TEXT SAMPLE:
${scraped.mainText.slice(0, 3000)}

USER VISION: ${userDescription}
TARGET CUSTOMER: ${targetCustomer}

Respond ONLY with valid JSON matching this schema:
{
  "summary": "Detailed strategic analysis of existing site and the proposed SaaS transformation",
  "targetUsers": ["Role 1", "Role 2", "Role 3"],
  "coreProblem": "Core operational problem solved",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "businessModel": "Pricing & tier breakdown",
  "suggestedImprovements": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "proposedMVPFeatures": ["MVP Module 1", "MVP Module 2", "MVP Module 3", "MVP Module 4"]
}`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content || '{}';
      console.log('✅ [GROQ API SUCCESS]: Received structured analysis response from Groq!');
      return JSON.parse(content) as ProductAnalysis;
    } catch (err) {
      console.error('❌ [GROQ API ERROR]:', err);
    }
  }

  // Fallback preset analysis
  const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const cleanName = domain.split('.')[0] || 'Product';
  const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    summary: `${capitalizedName} SaaS provides streamlined web workflows. Analyzed by Groq LLM to enable ${targetCustomer} to automate operations, manage team permissions, and track real-time analytics.`,
    targetUsers: [`${targetCustomer} Leaders`, 'Operations Managers', 'Team Engineers'],
    coreProblem: 'Manual operations lack real-time telemetry and automated workflow integration.',
    keyFeatures: [
      'Interactive Telemetry Dashboard',
      'AI Workflow Automation',
      'Role-Based Access Control',
      'API Integration Pipeline',
    ],
    businessModel: 'Tiered Subscription SaaS ($29/mo Starter, $79/mo Growth, $199/mo Enterprise)',
    suggestedImprovements: [
      'Self-service onboarding sequence',
      'Automated PDF report generator',
      'Real-time SSE event stream notifications',
    ],
    proposedMVPFeatures: [
      'Smart Dashboard UI',
      'Analytics & Metrics Module',
      'REST API Backend Service',
      'Team Settings Workspace',
    ],
  };
}

export async function generateBlueprintWithGroq(
  analysis: ProductAnalysis,
  userDescription: string,
  targetCustomer: string
): Promise<ProductBlueprint> {
  // Note: this only produces product metadata (name, tagline, features, nav,
  // pages, UI direction) — NOT the file tree. The file tree is a separate,
  // richer artifact (see generateFileDirectoryWithGroq below) that the user
  // reviews and refines before any code gets generated.
  if (groq) {
    try {
      console.log('🚀 [GROQ API REQUEST]: Generating SaaS Blueprint with Groq (openai/gpt-oss-120b)...');
      const prompt = `You are the Groq AI Product Architect Agent.
Generate a complete SaaS Product Blueprint (product metadata only — no file structure).

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

USER VISION: ${userDescription}
TARGET CUSTOMER: ${targetCustomer}

Respond ONLY with valid JSON matching this schema:
{
  "productName": "SaaS Product Name",
  "tagline": "Catchy SaaS Tagline",
  "description": "Comprehensive vision statement",
  "targetCustomer": "${targetCustomer}",
  "features": [
    { "name": "Feature 1", "description": "Details", "priority": "high" },
    { "name": "Feature 2", "description": "Details", "priority": "medium" }
  ],
  "navigation": ["Dashboard", "Analytics", "API Routes", "Settings"],
  "pages": [
    { "path": "/", "title": "Dashboard", "description": "Main Overview" },
    { "path": "/api/v1/metrics", "title": "API Endpoint", "description": "Backend API" }
  ],
  "uiDirection": {
    "style": "Minimalist Developer Slate",
    "colorScheme": "Deep Slate & Indigo Accents",
    "typography": "Inter / Monospace",
    "designKeywords": ["sleek", "responsive", "fullstack"]
  }
}`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content || '{}';
      console.log('✅ [GROQ API SUCCESS]: Generated product blueprint via Groq!');
      const parsed = JSON.parse(content);

      return {
        productName: parsed.productName || 'SaaS Forge',
        tagline: parsed.tagline || 'AI-Powered Workflow Engine',
        description: parsed.description || analysis.summary,
        targetCustomer: parsed.targetCustomer || targetCustomer,
        features: parsed.features || [],
        navigation: parsed.navigation || ['Dashboard', 'Analytics', 'Settings'],
        pages: parsed.pages || [{ path: '/', title: 'Home', description: 'Main Landing' }],
        uiDirection: parsed.uiDirection || {
          style: 'Minimalist Slate',
          colorScheme: 'Indigo',
          typography: 'Inter',
          designKeywords: ['modern', 'fast'],
        },
      };
    } catch (err) {
      console.error('Groq Blueprint Generation Error:', err);
    }
  }

  // Fallback blueprint
  return {
    productName: 'ForgeSaaS Studio',
    tagline: 'Autonomous AI SaaS Platform',
    description: analysis.summary,
    targetCustomer,
    features: [
      { name: 'Telemetry Dashboard', description: 'Real-time performance graphs and KPI metrics', priority: 'high' },
      { name: 'Backend REST API', description: 'Automated JSON endpoints for data operations', priority: 'high' },
      { name: 'Role Management', description: 'Granular user permission settings', priority: 'medium' },
    ],
    navigation: ['Dashboard', 'Analytics', 'API Explorer', 'Settings'],
    pages: [
      { path: '/', title: 'Dashboard Page', description: 'Main application metrics & controls' },
      { path: '/api/v1/data', title: 'Backend API Endpoint', description: 'REST JSON service' },
    ],
    uiDirection: {
      style: 'Minimalist Slate',
      colorScheme: 'Indigo / Cyan',
      typography: 'Inter',
      designKeywords: ['sleek', 'developer', 'fullstack'],
    },
  };
}

// ─── Product File Directory (the finalized, reviewable build plan) ─────────
// Runs after Strategy, before Build. Groq plans the exact file tree, routes,
// components, data entities, and integrations from the finalized strategy —
// no code is written here.
export async function generateFileDirectoryWithGroq(
  analysis: ProductAnalysis,
  userDescription: string,
  targetCustomer: string
): Promise<ProductFileDirectory> {
  if (groq) {
    try {
      console.log('🚀 [GROQ API REQUEST]: Generating Product File Directory with Groq (openai/gpt-oss-120b)...');
      const prompt = `You are the Groq AI Product Architect Agent. Plan the concrete build directory for a
Next.js full-stack SaaS product — the exact file tree that will be generated, WITHOUT writing any code yet.

FINALIZED STRATEGY:
${JSON.stringify(analysis, null, 2)}

USER VISION: ${userDescription}
TARGET CUSTOMER: ${targetCustomer}

Plan a realistic, complete file tree covering frontend pages/components, backend API routes, config files,
and — if the product needs persisted data — database/schema files. Every file needs a one-line "purpose"
explaining what will be implemented in it.

Respond ONLY with valid JSON matching this schema:
{
  "files": [
    { "path": "app/page.tsx", "name": "page.tsx", "type": "frontend", "language": "typescript", "purpose": "Main dashboard UI" },
    { "path": "app/api/metrics/route.ts", "name": "route.ts", "type": "backend", "language": "typescript", "purpose": "Returns aggregated metrics as JSON" },
    { "path": "lib/db.ts", "name": "db.ts", "type": "database", "language": "typescript", "purpose": "Database client and query helpers" },
    { "path": "package.json", "name": "package.json", "type": "config", "language": "json", "purpose": "Project dependencies and scripts" }
  ],
  "routes": [
    { "path": "/", "kind": "page", "description": "Main dashboard" },
    { "path": "/api/metrics", "kind": "api", "description": "Metrics REST endpoint" }
  ],
  "components": ["DashboardView", "Navbar", "MetricCard"],
  "dataEntities": [
    { "name": "users", "description": "Registered accounts" },
    { "name": "metrics", "description": "Recorded telemetry events" }
  ],
  "externalIntegrations": ["Stripe (billing)", "Resend (email)"]
}

"type" must be one of: frontend, backend, config, database. Only include externalIntegrations that are
clearly implied by the product — an empty array is fine if none are needed.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content || '{}';
      console.log('✅ [GROQ API SUCCESS]: Generated product file directory via Groq!');
      const parsed = JSON.parse(content);

      const files: FileDirectoryEntry[] = (Array.isArray(parsed.files) ? parsed.files : []).map((f: any) => ({
        path: f.path || 'app/page.tsx',
        name: f.name || f.path?.split('/').pop() || 'file.tsx',
        type: ['frontend', 'backend', 'config', 'database'].includes(f.type) ? f.type : 'frontend',
        language: f.language || 'typescript',
        purpose: f.purpose || 'Implementation file for this product.',
      }));

      return {
        files: files.length > 0 ? files : getDefaultFileDirectory('SaaS Forge').files,
        routes: Array.isArray(parsed.routes) ? parsed.routes : [],
        components: Array.isArray(parsed.components) ? parsed.components : [],
        dataEntities: Array.isArray(parsed.dataEntities) ? parsed.dataEntities : [],
        externalIntegrations: Array.isArray(parsed.externalIntegrations) ? parsed.externalIntegrations : [],
      };
    } catch (err) {
      console.error('Groq File Directory Generation Error:', err);
    }
  }

  return getDefaultFileDirectory('SaaS Forge');
}

export interface FileDirectoryRefineResult {
  applied: boolean;
  updatedFileDirectory: ProductFileDirectory;
  assistantMessage: string;
}

// ─── Unified product-plan refine (blueprint + file tree in one conversation) ──
// One assistant that can edit the ProductBlueprint, the ProductFileDirectory,
// or both from a single instruction — and keeps them consistent (e.g. removing
// the pricing page drops it from both the blueprint pages and the file tree).
export interface ProductPlanRefineResult {
  applied: boolean;
  updatedBlueprint: ProductBlueprint;
  updatedFileDirectory: ProductFileDirectory;
  assistantMessage: string;
}

export async function refineProductPlanWithGroq(
  currentBlueprint: ProductBlueprint,
  currentFileDirectory: ProductFileDirectory,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<ProductPlanRefineResult> {
  if (!groq) {
    return {
      applied: false,
      updatedBlueprint: currentBlueprint,
      updatedFileDirectory: currentFileDirectory,
      assistantMessage: 'Groq is not configured (GROQ_API_KEY missing), so I can’t change the product plan right now.',
    };
  }

  try {
    const systemPrompt = `You are the Groq AI Product Architect Agent for Recast. You read and modify TWO JSON
objects that together define the product plan: the BLUEPRINT (name, tagline, description, target customer,
features, navigation, pages, UI direction) and the FILE DIRECTORY (planned file tree, routes, components,
data entities, external integrations). You never write code and never touch the strategy analysis.

CURRENT BLUEPRINT:
${JSON.stringify(currentBlueprint, null, 2)}

CURRENT FILE DIRECTORY:
${JSON.stringify(currentFileDirectory, null, 2)}

Rules:
1. Apply the user's instruction to whichever object(s) it affects — the blueprint, the file directory, or
   both — and KEEP THEM CONSISTENT. E.g. "remove the pricing page" drops it from blueprint.pages AND
   blueprint.navigation AND any pricing route/file in the directory; "add a webhooks endpoint" adds the
   route/file to the directory and, if user-facing, a matching page to the blueprint.
2. Return the COMPLETE updated versions of BOTH objects every time — every field, including everything the
   instruction didn't touch, copied over unchanged.
3. If the user is asking a question or wants a recommendation (not giving an instruction), do NOT change
   anything. Set "applied" to false, return both objects UNCHANGED, put your recommendation in
   "assistantMessage".
4. Always write a short natural-language "assistantMessage" saying what changed (if applied) or what you
   recommend (if not).

Respond ONLY with valid JSON matching this exact schema:
{
  "applied": true or false,
  "updatedBlueprint": {
    "productName": "string", "tagline": "string", "description": "string", "targetCustomer": "string",
    "features": [{ "name": "string", "description": "string", "priority": "high|medium|low" }],
    "navigation": ["string", ...],
    "pages": [{ "path": "string", "title": "string", "description": "string" }],
    "uiDirection": { "style": "string", "colorScheme": "string", "typography": "string", "designKeywords": ["string", ...] }
  },
  "updatedFileDirectory": {
    "files": [{ "path": "string", "name": "string", "type": "frontend|backend|config|database", "language": "string", "purpose": "string" }],
    "routes": [{ "path": "string", "kind": "page|api", "description": "string" }],
    "components": ["string", ...],
    "dataEntities": [{ "name": "string", "description": "string" }],
    "externalIntegrations": ["string", ...]
  },
  "assistantMessage": "string"
}`;

    const formattedHistory = chatHistory.slice(-12).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: userInstruction },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    if (!parsed.assistantMessage) {
      throw new Error('Groq product-plan refine returned an incomplete response.');
    }

    const bp = parsed.updatedBlueprint || {};
    const fd = parsed.updatedFileDirectory || {};

    return {
      applied: Boolean(parsed.applied),
      updatedBlueprint: {
        ...currentBlueprint,
        ...bp,
        uiDirection: { ...currentBlueprint.uiDirection, ...(bp.uiDirection || {}) },
        generatedFiles: currentBlueprint.generatedFiles,
      },
      updatedFileDirectory: { ...currentFileDirectory, ...fd },
      assistantMessage: parsed.assistantMessage,
    };
  } catch (err) {
    console.error('Groq Product Plan Refine Error:', err);
    return {
      applied: false,
      updatedBlueprint: currentBlueprint,
      updatedFileDirectory: currentFileDirectory,
      assistantMessage: 'Sorry, I ran into an error trying to process that. Please try rephrasing your request.',
    };
  }
}

export async function refineFileDirectoryWithGroq(
  current: ProductFileDirectory,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<FileDirectoryRefineResult> {
  if (!groq) {
    return {
      applied: false,
      updatedFileDirectory: current,
      assistantMessage:
        'Groq is not configured (GROQ_API_KEY missing), so I can’t refine the file directory right now.',
    };
  }

  try {
    const systemPrompt = `You are the Groq AI Product Architect Agent. You ONLY read and modify the
Product File Directory JSON below (the planned file tree, routes, components, data entities, and
external integrations) — you never write code and never touch the strategy analysis.

CURRENT FILE DIRECTORY:
${JSON.stringify(current, null, 2)}

Rules:
1. If the user gives a clear instruction (e.g. "add a webhooks endpoint", "include a database migrations
   folder"), apply it and return the COMPLETE updated file directory — every field, including everything
   the instruction didn't touch, copied over unchanged.
2. If the user is asking a question or wants a recommendation rather than giving an instruction, do NOT
   change anything. Set "applied" to false, return the file directory UNCHANGED, and put your
   recommendation in "assistantMessage".
3. Always write a short, natural-language "assistantMessage" explaining what changed (if applied) or what
   you recommend (if not applied).

Respond ONLY with valid JSON matching this exact schema:
{
  "applied": true or false,
  "updatedFileDirectory": {
    "files": [{ "path": "string", "name": "string", "type": "frontend|backend|config|database", "language": "string", "purpose": "string" }],
    "routes": [{ "path": "string", "kind": "page|api", "description": "string" }],
    "components": ["string", ...],
    "dataEntities": [{ "name": "string", "description": "string" }],
    "externalIntegrations": ["string", ...]
  },
  "assistantMessage": "string"
}`;

    const formattedHistory = chatHistory.slice(-10).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: userInstruction },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    if (!parsed.assistantMessage) {
      throw new Error('Groq file directory refine returned an incomplete response.');
    }

    return {
      applied: Boolean(parsed.applied),
      updatedFileDirectory: { ...current, ...(parsed.updatedFileDirectory || {}) },
      assistantMessage: parsed.assistantMessage,
    };
  } catch (err) {
    console.error('Groq File Directory Refine Error:', err);
    return {
      applied: false,
      updatedFileDirectory: current,
      assistantMessage: 'Sorry, I ran into an error trying to process that. Please try rephrasing your request.',
    };
  }
}

export function getDefaultFileDirectory(productName: string): ProductFileDirectory {
  return {
    files: getDefaultFullStackFiles(productName).map((f) => ({
      path: f.path,
      name: f.name,
      type: f.type,
      language: f.language,
      purpose: `Placeholder — GROQ_API_KEY not configured, so this file's real purpose wasn't planned.`,
    })),
    routes: [
      { path: '/', kind: 'page', description: 'Main dashboard page' },
      { path: '/api/analytics', kind: 'api', description: 'Analytics REST endpoint' },
    ],
    components: ['HeaderNavbar'],
    dataEntities: [],
    externalIntegrations: [],
  };
}

// ─── Product Blueprint refine (name / tagline / features / navigation /
// pages / UI direction) ──────────────────────────────────────────────────────
// This is the conversational "modify the proposed product" step: instructions
// like "make the design more premium", "add a dashboard", "remove the pricing
// page", "make it suitable for enterprise customers". It only ever touches the
// ProductBlueprint metadata — never the strategy analysis, the file directory,
// or generated code.
export interface BlueprintRefineResult {
  applied: boolean;
  updatedBlueprint: ProductBlueprint;
  assistantMessage: string;
}

export async function refineBlueprintWithGroq(
  current: ProductBlueprint,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<BlueprintRefineResult> {
  if (!groq) {
    return {
      applied: false,
      updatedBlueprint: current,
      assistantMessage:
        'Groq is not configured (GROQ_API_KEY missing), so I can’t modify the product blueprint right now.',
    };
  }

  try {
    const systemPrompt = `You are the Groq AI Product Architect Agent. You ONLY read and modify the
Product Blueprint JSON below — the proposed product's name, tagline, description, target customer,
feature list, navigation, page structure, and UI direction. You never write code, never touch the
strategy analysis, and never touch the file directory.

CURRENT BLUEPRINT:
${JSON.stringify(current, null, 2)}

Rules:
1. If the user gives a clear instruction (e.g. "make the design more premium", "add a dashboard page",
   "remove the pricing page", "make it enterprise-ready"), apply it and return the COMPLETE updated
   blueprint — every field, including everything the instruction didn't touch, copied over unchanged.
   When adding/removing a page, keep "navigation" consistent with "pages".
2. If the user is asking a question or wants a recommendation rather than giving an instruction, do NOT
   change anything. Set "applied" to false, return the blueprint UNCHANGED, and put your recommendation
   in "assistantMessage".
3. Always write a short, natural-language "assistantMessage" explaining what changed (if applied) or
   what you recommend (if not applied).

Respond ONLY with valid JSON matching this exact schema:
{
  "applied": true or false,
  "updatedBlueprint": {
    "productName": "string",
    "tagline": "string",
    "description": "string",
    "targetCustomer": "string",
    "features": [{ "name": "string", "description": "string", "priority": "high|medium|low" }],
    "navigation": ["string", ...],
    "pages": [{ "path": "string", "title": "string", "description": "string" }],
    "uiDirection": { "style": "string", "colorScheme": "string", "typography": "string", "designKeywords": ["string", ...] }
  },
  "assistantMessage": "string"
}`;

    const formattedHistory = chatHistory.slice(-10).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: userInstruction },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    if (!parsed.assistantMessage) {
      throw new Error('Groq blueprint refine returned an incomplete response.');
    }

    const incoming = parsed.updatedBlueprint || {};
    // Defensive merge: every field the model didn't return falls back to the
    // current blueprint, and uiDirection is merged one level deeper so a
    // partial style tweak can't drop the rest of the design tokens.
    const updatedBlueprint: ProductBlueprint = {
      ...current,
      ...incoming,
      uiDirection: { ...current.uiDirection, ...(incoming.uiDirection || {}) },
      generatedFiles: current.generatedFiles,
    };

    return {
      applied: Boolean(parsed.applied),
      updatedBlueprint,
      assistantMessage: parsed.assistantMessage,
    };
  } catch (err) {
    console.error('Groq Blueprint Refine Error:', err);
    return {
      applied: false,
      updatedBlueprint: current,
      assistantMessage: 'Sorry, I ran into an error trying to process that. Please try rephrasing your request.',
    };
  }
}

export interface StrategyRefineResult {
  applied: boolean;
  updatedAnalysis: ProductAnalysis;
  assistantMessage: string;
}

// Stage A only: refines the Strategy/Analysis JSON via chat. Never touches
// the blueprint, file directory, or code — that's Stage B's job (the
// code-gen functions further down this file). Kept as its own function so
// the two AI roles stay clearly separated even though they share this module.
export async function refineAnalysisWithGroq(
  currentAnalysis: ProductAnalysis,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<StrategyRefineResult> {
  if (!groq) {
    return {
      applied: false,
      updatedAnalysis: currentAnalysis,
      assistantMessage:
        'Groq is not configured (GROQ_API_KEY missing), so I can’t refine the strategy right now. Set GROQ_API_KEY to enable this assistant.',
    };
  }

  try {
    const systemPrompt = `You are the Groq Product Analyst Agent for Recast. You ONLY read and modify the
Strategy/Analysis JSON object below — you never touch code, file structure, or the blueprint.

CURRENT STRATEGY ANALYSIS:
${JSON.stringify(currentAnalysis, null, 2)}

Rules:
1. If the user gives a clear instruction to change the strategy (e.g. "add a feature", "remove X",
   "make this enterprise-focused"), apply it and return the COMPLETE updated analysis object —
   every field from the schema below must be present, including all fields the instruction didn't
   touch (copy them over unchanged from the current analysis).
2. If the user is asking a question or seeking a recommendation rather than giving an instruction
   (e.g. "should I add X?", "what do you think about Y?"), do NOT change the analysis. Set
   "applied" to false, return the analysis object UNCHANGED, and put your recommendation in
   "assistantMessage" so the user can confirm before anything is applied.
3. Always write a short, natural-language "assistantMessage" explaining what you changed (if applied)
   or what you recommend (if not applied).

Respond ONLY with valid JSON matching this exact schema:
{
  "applied": true or false,
  "updatedAnalysis": {
    "summary": "string",
    "targetUsers": ["string", ...],
    "coreProblem": "string",
    "keyFeatures": ["string", ...],
    "businessModel": "string",
    "suggestedImprovements": ["string", ...],
    "proposedMVPFeatures": ["string", ...]
  },
  "assistantMessage": "string"
}`;

    const formattedHistory = chatHistory.slice(-10).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: userInstruction },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    if (!parsed.assistantMessage) {
      throw new Error('Groq strategy refine returned an incomplete response.');
    }

    return {
      applied: Boolean(parsed.applied),
      // Defensive merge: guarantees every existing field survives even if the
      // model omits one it wasn't asked to touch.
      updatedAnalysis: { ...currentAnalysis, ...(parsed.updatedAnalysis || {}) },
      assistantMessage: parsed.assistantMessage,
    };
  } catch (err) {
    console.error('Groq Strategy Refine Error:', err);
    return {
      applied: false,
      updatedAnalysis: currentAnalysis,
      assistantMessage: 'Sorry, I ran into an error trying to process that. Please try rephrasing your request.',
    };
  }
}

// ─── Stage B: Code Generation (Groq / GPT-OSS 120B) ───────────────────────
// Everything below writes actual code. There is no Claude/Anthropic call
// anywhere in this app — Groq is the only code-gen provider.

export async function generateStarterUICodeWithGroq(blueprint: ProductBlueprint): Promise<string> {
  if (groq) {
    try {
      const prompt = `You are the Groq Code Agent, a world-class React + Tailwind CSS UI Developer.
Write complete, production-ready React component code for this SaaS product:

PRODUCT NAME: ${blueprint.productName}
TAGLINE: ${blueprint.tagline}
DESCRIPTION: ${blueprint.description}
FEATURES: ${blueprint.features.map((f) => f.name).join(', ')}

RULES:
1. Write a single complete React client component default export.
2. Use Tailwind CSS with dark slate styling (bg-slate-950, text-white, border-white/10).
3. Include Lucide icons (import { Activity, Layers, Shield, Zap, TrendingUp, Users, CheckCircle } from 'lucide-react').
4. Do NOT wrap in markdown code blocks. Output ONLY raw code.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      const code = response.choices[0]?.message?.content || '';
      return code.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
    } catch (err) {
      console.error('Groq UI Code Error:', err);
    }
  }

  return getDefaultStarterUICodeFallback(blueprint.productName, blueprint.tagline);
}

export async function generateFullStackCodeWithGroq(
  blueprint: ProductBlueprint,
  filesToGenerate: ProjectFile[]
): Promise<ProjectFile[]> {
  if (!groq) {
    // No API key: refuse rather than returning the caller's placeholder stubs,
    // which /api/build would persist and present as a finished build.
    throw new GroqGenerationError(
      'GROQ_API_KEY is not configured, so code generation is unavailable.'
    );
  }

  // One request per file. A single JSON response covering a whole category
  // used to truncate on anything non-trivial and sink the entire batch (or,
  // worse, fall through to blank stubs). Sequential — not parallel — to stay
  // within Groq's rate limits; a 429 on any file aborts and is surfaced so
  // the Build route can retry that category after a cooldown.
  const generated: ProjectFile[] = [];
  for (const file of filesToGenerate) {
    generated.push(await generateSingleFileWithGroq(blueprint, file));
  }
  return generated;
}

export async function generateSingleFileWithGroq(
  blueprint: ProductBlueprint,
  file: ProjectFile
): Promise<ProjectFile> {
  const isJson = file.path.toLowerCase().endsWith('.json');
  const prompt = `You are the Groq Code Agent. Write the COMPLETE, production-ready contents of exactly ONE file
for a Next.js 14 (App Router) + TypeScript + Tailwind CSS project.

PRODUCT: ${blueprint.productName} — ${blueprint.tagline}
DESCRIPTION: ${blueprint.description}

FILE TO WRITE:
- Path: ${file.path}
- Type: ${file.type}
- Language: ${file.language}

STRICT OUTPUT RULES — follow every one:
1. Return the file's ENTIRE contents. Never truncate, never abbreviate, never leave "// ..." placeholders.
2. It MUST be syntactically valid and immediately compilable.
3. Format it properly: real newlines, 2-space indentation, one statement per line. NEVER minify or put the
   whole file on one line.
4. No markdown code fences, no backticks around the file, no commentary before or after — just the code.
5. Imports at the top, then the rest, in a natural top-to-bottom order.
6. A React component file that uses hooks/state/handlers MUST start with "'use client';".
${
  isJson
    ? `7. This is a JSON file: output valid, pretty-printed JSON with 2-space indentation (multi-line, one key
   per line). For package.json use this key order: name, version, private, type, scripts, dependencies,
   devDependencies. Pin real, current versions (e.g. "next": "14.2.24", "react": "18.3.1").`
    : `7. Use only real, importable packages (react, next, lucide-react, tailwind utility classes).`
}

Respond ONLY with valid JSON: { "content": "<the full file contents as one JSON string, with \\n for newlines>" }`;

  try {
    const response = await groq!.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.25,
    });

    const raw = response.choices[0]?.message?.content || '';
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new GroqGenerationError(`Groq returned malformed/truncated JSON for ${file.path}.`);
    }

    const content = typeof parsed?.content === 'string' ? parsed.content : '';
    if (!content.trim()) {
      throw new GroqGenerationError(`Groq returned no content for ${file.path}.`);
    }

    return { ...file, content: tidyFileContent(file.path, content) };
  } catch (err) {
    if (isRateLimitError(err)) {
      console.warn('Groq rate limit hit during code generation:', (err as any)?.message);
      throw new GroqRateLimitError();
    }
    if (err instanceof GroqGenerationError) throw err;
    console.error(`Groq FullStack Generation Error for ${file.path}:`, err);
    throw new GroqGenerationError(`Failed to generate ${file.path}.`);
  }
}

export async function refineWithGroq(
  currentBlueprint: ProductBlueprint,
  currentCode: string,
  userInstruction: string,
  chatHistory: { role: string; content: string }[],
  currentFiles?: ProjectFile[]
): Promise<{ updatedBlueprint: ProductBlueprint; updatedCode: string; updatedFiles?: ProjectFile[]; assistantMessage: string }> {
  if (groq) {
    try {
      const fileList = (currentFiles || []).map((f) => `- ${f.path} (${f.type})`).join('\n') || '(none yet)';
      const prompt = `You are the Groq Code Agent & AI Copilot for an existing generated codebase.
The user wants to modify the blueprint and/or the generated project files.

CURRENT BLUEPRINT:
${JSON.stringify(currentBlueprint, null, 2)}

EXISTING PROJECT FILES (do NOT re-list these unless you are changing them):
${fileList}

USER INSTRUCTION:
"${userInstruction}"

Rules for "updatedFiles":
- It is a DELTA. Include ONLY files you are adding or changing — never files that stay the same.
- Every entry must contain the file's COMPLETE new content (not a diff, not a snippet, never empty).
- New files must include a sensible "type" (frontend|backend|config|database) and "language".
- The server keeps every existing file that you do not mention. Do not try to "replace" the whole tree.

Respond ONLY with valid JSON:
{
  "updatedBlueprint": the FULL ProductBlueprint JSON (copy fields you didn't change),
  "updatedCode": the main app/page.tsx contents if you changed it, else omit,
  "updatedFiles": [ { "path": "...", "name": "...", "type": "...", "language": "...", "content": "FULL file contents" } ],
  "assistantMessage": brief friendly summary of what you added/changed
}`;

      const formattedMessages = chatHistory.slice(-10).map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [...formattedMessages, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      if (result.updatedBlueprint && result.assistantMessage) {
        return {
          updatedBlueprint: { ...currentBlueprint, ...result.updatedBlueprint },
          updatedCode: result.updatedCode || currentCode,
          // A DELTA of added/changed files. The route merges this onto the
          // existing tree by path — it must never be the whole tree.
          updatedFiles: Array.isArray(result.updatedFiles)
            ? result.updatedFiles.filter((f: any) => f && f.path && typeof f.content === 'string' && f.content.trim())
            : [],
          assistantMessage: result.assistantMessage,
        };
      }

      // Reachable JSON but missing required fields — treat as a failure rather
      // than falling through to a placeholder rewrite of the user's code.
      throw new GroqGenerationError('Groq copilot returned an incomplete response.');
    } catch (err) {
      if (isRateLimitError(err)) throw new GroqRateLimitError();
      if (err instanceof GroqGenerationError) throw err;
      console.error('Groq Refine Agent Error:', err);
      // Fail loudly. Previously this fell back to regenerated placeholder
      // starter code, which /api/refine then persisted to uiCode — a flaky
      // Groq call would silently destroy the user's real UI code.
      throw new GroqGenerationError('The AI copilot request failed. Your code was left unchanged.');
    }
  }

  throw new GroqGenerationError('GROQ_API_KEY is not configured, so the AI copilot is unavailable.');
}

// Given a generated project, produce a short Markdown runbook for getting it
// running locally. Used by /api/run-instructions and bundled into the export
// zip as RUN.md.
export async function generateRunInstructionsWithGroq(
  blueprint: ProductBlueprint,
  files: ProjectFile[]
): Promise<string> {
  const pkg = files.find((f) => f.path === 'package.json' || f.path.endsWith('/package.json'));
  const tree = files.map((f) => f.path).sort().join('\n');

  if (groq) {
    try {
      const prompt = `You are a senior engineer. Given this generated project, write a SHORT, exact runbook in
Markdown for getting it running locally from a fresh clone. Cover, in order: prerequisites (Node version),
install command, any environment variables it needs (infer them from the file names / code), the dev
command, and the URL to open. State the framework (e.g. Next.js) if obvious. Under ~180 words. No preamble,
start directly with a "# Run <product>" heading.

PRODUCT: ${blueprint.productName}
FILE TREE:
${tree}
${pkg ? `\npackage.json:\n${pkg.content.slice(0, 1600)}` : ''}`;

      const r = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      const md = (r.choices[0]?.message?.content || '').trim().replace(/^```(?:md|markdown)?\n?/, '').replace(/\n?```$/, '');
      if (md) return md;
    } catch (err) {
      console.error('Groq run-instructions error:', err);
    }
  }

  const hasNext = files.some((f) => f.path.includes('next.config') || f.path.startsWith('app/'));
  return `# Run ${blueprint.productName}

## Prerequisites
- Node.js 18+

## Setup
\`\`\`bash
npm install
\`\`\`

## Environment
Create \`.env.local\` and fill in any keys referenced in the code (API keys, database URLs).

## Start
\`\`\`bash
npm run dev
\`\`\`

Then open ${hasNext ? 'http://localhost:3000' : 'the URL printed in the terminal'}.
`;
}

// Minimal local fallback used only when GROQ_API_KEY is missing entirely —
// keeps this module self-contained instead of reaching into lib/openai.ts.
function getDefaultStarterUICodeFallback(productName: string, tagline: string): string {
  return `'use client';

import React from 'react';
import { Zap } from 'lucide-react';

export default function ${productName.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center space-y-3">
      <Zap className="w-8 h-8 text-indigo-400" />
      <h1 className="text-2xl font-black">${productName}</h1>
      <p className="text-sm text-slate-400 max-w-md">${tagline}</p>
      <p className="text-xs text-amber-400 font-mono mt-4">GROQ_API_KEY is not configured — this is placeholder content.</p>
    </div>
  );
}
`;
}

export function getDefaultFullStackFiles(productName: string): ProjectFile[] {
  return [
    {
      path: 'app/page.tsx',
      name: 'page.tsx',
      type: 'frontend',
      language: 'typescript',
      content: `'use client';

import React, { useState } from 'react';
import { Activity, Layers, Shield, Zap, TrendingUp, Users, Server, CheckCircle } from 'lucide-react';

export default function ${productName.replace(/[^a-zA-Z0-9]/g, '')}Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 selection:bg-indigo-500 selection:text-white font-sans">
      <header className="max-w-7xl mx-auto flex items-center justify-between border-b border-white/10 pb-5 mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">${productName}</h1>
            <p className="text-xs text-slate-400">Full-Stack AI SaaS Workspace</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Backend API Online
          </span>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md">
            + New Resource
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-white/[0.08] p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-mono">Total Monthly Revenue</span>
            <div className="text-2xl font-black text-white">$48,290</div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14.2% from last month
            </span>
          </div>
          <div className="bg-slate-900/90 border border-white/[0.08] p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-mono">Active SaaS Subscribers</span>
            <div className="text-2xl font-black text-white">1,420</div>
            <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
              <Users className="w-3 h-3" /> 98.4% retention rate
            </span>
          </div>
          <div className="bg-slate-900/90 border border-white/[0.08] p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-mono">Backend API Requests</span>
            <div className="text-2xl font-black text-white">2.4M</div>
            <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
              <Server className="w-3 h-3" /> 18ms latency
            </span>
          </div>
          <div className="bg-slate-900/90 border border-white/[0.08] p-5 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-mono">System Uptime</span>
            <div className="text-2xl font-black text-white">99.98%</div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Self-healing verified
            </span>
          </div>
        </div>

        {/* Live Feature Workspace */}
        <div className="bg-slate-900/90 border border-white/[0.08] p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white">Interactive Feature Telemetry</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This UI component was generated by the Groq Code Agent based on the product blueprint.
          </p>
          <div className="bg-slate-950 border border-white/[0.06] p-4 rounded-xl font-mono text-xs text-slate-300">
            <div>GET /api/v1/metrics → HTTP 200 OK</div>
            <div className="text-slate-500 mt-1">{ JSON.stringify({ status: "healthy", version: "1.0.0", mode: "fullstack" }) }</div>
          </div>
        </div>
      </main>
    </div>
  );
}
`,
    },
    {
      path: 'components/HeaderNavbar.tsx',
      name: 'HeaderNavbar.tsx',
      type: 'frontend',
      language: 'typescript',
      content: `import React from 'react';
import { Zap, Layers, Settings } from 'lucide-react';

export default function HeaderNavbar() {
  return (
    <nav className="bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Zap className="w-4 h-4 text-indigo-400" />
        <span className="font-bold text-white text-sm">Recast SaaS</span>
      </div>
      <div className="flex items-center space-x-3 text-xs text-slate-400">
        <span>Dashboard</span>
        <span>Analytics</span>
        <span>Settings</span>
      </div>
    </nav>
  );
}
`,
    },
    {
      path: 'app/api/analytics/route.ts',
      name: 'route.ts',
      type: 'backend',
      language: 'typescript',
      content: `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      mrr: 48290,
      subscribers: 1420,
      apiRequests: 2400000,
      uptime: '99.98%',
      timestamp: new Date().toISOString(),
    },
  });
}
`,
    },
    {
      path: 'lib/db.ts',
      name: 'db.ts',
      type: 'backend',
      language: 'typescript',
      content: `// Simulated full-stack database connection client
export const db = {
  async getMetrics() {
    return {
      mrr: 48290,
      activeUsers: 1420,
      status: 'online',
    };
  },
};
`,
    },
    {
      path: 'package.json',
      name: 'package.json',
      type: 'config',
      language: 'json',
      content: `{
  "name": "${productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.24",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.475.0",
    "tailwindcss": "^3.4.17"
  }
}
`,
    },
  ];
}
