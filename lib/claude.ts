import Anthropic from '@anthropic-ai/sdk';
import { ProductAnalysis, ProductBlueprint, ScrapedContent, ProjectFile } from '@/types';
import { getDefaultStarterUICode } from '@/lib/openai';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
export const isClaudeConfigured = Boolean(anthropicApiKey && anthropicApiKey !== 'your_anthropic_api_key_here');

const anthropic = isClaudeConfigured ? new Anthropic({ apiKey: anthropicApiKey }) : null;

// Anthropic Claude 3.5 Sonnet Model identifier
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

export async function analyzeWebsiteWithClaude(
  websiteUrl: string,
  scraped: ScrapedContent,
  userDescription: string,
  targetCustomer: string
): Promise<ProductAnalysis> {
  if (anthropic) {
    try {
      const prompt = `You are a senior Claude Product Analyst Agent and SaaS Architect.
Analyze this website and user specification to transform it into a modern SaaS product.

WEBSITE URL: ${websiteUrl}
WEBSITE TITLE: ${scraped.title}
META DESCRIPTION: ${scraped.description}
HEADINGS: ${scraped.headings.join(' | ')}
EXTRACTED CONTENT:
${scraped.mainText.slice(0, 3000)}

USER VISION: ${userDescription}
TARGET CUSTOMER: ${targetCustomer}

Respond ONLY with valid JSON matching this schema:
{
  "summary": "Detailed summary of what the existing product does and how the new SaaS builds on it",
  "targetUsers": ["Target User 1", "Target User 2", "Target User 3"],
  "coreProblem": "The core operational problem solved",
  "keyFeatures": ["Key Feature 1", "Key Feature 2", "Key Feature 3", "Key Feature 4"],
  "businessModel": "Clear pricing & subscription model description",
  "suggestedImprovements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "proposedMVPFeatures": ["MVP Feature 1", "MVP Feature 2", "MVP Feature 3", "MVP Feature 4"]
}`;

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      return JSON.parse(text) as ProductAnalysis;
    } catch (err) {
      console.error('Claude Analysis Agent Error:', err);
    }
  }

  // Fallback preset
  const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const cleanName = domain.split('.')[0] || 'Product';
  const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    summary: `${capitalizedName} provides digital services. This Claude-analyzed SaaS transformation enables ${targetCustomer} to streamline operations, automate reporting, and access AI-driven telemetry.`,
    targetUsers: [`${targetCustomer} Owners`, 'Operations Directors', 'Team Leads'],
    coreProblem: `Operators spend hours manually managing workflows across fragmented tools without unified real-time analytics.`,
    keyFeatures: [
      'Real-time Operational Dashboard',
      'AI Insights & Anomaly Detection',
      'Automated Performance Reports',
      'Team & Permissions Workspace',
    ],
    businessModel: 'B2B Subscription SaaS ($29/mo Starter, $79/mo Growth, $199/mo Enterprise)',
    suggestedImprovements: [
      'Self-service automated onboarding wizard',
      'Weekly executive PDF summaries sent via AI schedule',
      'Granular role-based access control (RBAC)',
    ],
    proposedMVPFeatures: [
      'Interactive Smart Dashboard',
      'Analytics Telemetry',
      'Automated Reports Generator',
      'Team Workspace',
    ],
  };
}

export async function generateBlueprintWithClaude(
  analysis: ProductAnalysis,
  userDescription: string,
  targetCustomer: string
): Promise<ProductBlueprint> {
  if (anthropic) {
    try {
      const prompt = `You are an expert Claude SaaS Product Architect Agent.
Generate a complete Product Blueprint based on this analysis:

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

USER VISION: ${userDescription}
TARGET CUSTOMER: ${targetCustomer}

Respond ONLY with valid JSON matching this schema:
{
  "productName": "Product Name",
  "tagline": "Short Tagline",
  "description": "Comprehensive vision",
  "targetCustomer": "${targetCustomer}",
  "features": [
    { "name": "Feature 1", "description": "Details", "priority": "high" },
    { "name": "Feature 2", "description": "Details", "priority": "medium" }
  ],
  "navigation": ["Dashboard", "Analytics", "Settings"],
  "pages": [
    { "path": "/", "title": "Dashboard Page", "description": "Main Overview" },
    { "path": "/api/v1/metrics", "title": "API Service", "description": "REST Endpoint" }
  ],
  "uiDirection": {
    "style": "Minimalist Developer Slate",
    "colorScheme": "Deep Slate & Indigo",
    "typography": "Inter / Mono",
    "designKeywords": ["sleek", "modern"]
  }
}`;

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      return JSON.parse(text) as ProductBlueprint;
    } catch (err) {
      console.error('Claude Blueprint Error:', err);
    }
  }

  return {
    productName: 'ClaudeSaaS Architect',
    tagline: 'Autonomous AI Product Platform',
    description: analysis.summary,
    targetCustomer,
    features: [
      { name: 'Telemetry Dashboard', description: 'Real-time performance graphs and KPI metrics', priority: 'high' },
      { name: 'Backend API Service', description: 'Automated REST JSON endpoints', priority: 'high' },
      { name: 'Workspace Management', description: 'Granular user permission settings', priority: 'medium' },
    ],
    navigation: ['Dashboard', 'Analytics', 'Settings'],
    pages: [
      { path: '/', title: 'Dashboard', description: 'Main application metrics' },
      { path: '/api/v1/data', title: 'Backend API', description: 'REST service' },
    ],
    uiDirection: {
      style: 'Minimalist Developer Slate',
      colorScheme: 'Deep Slate',
      typography: 'Inter',
      designKeywords: ['sleek', 'fast'],
    },
  };
}

export async function generateStarterUICodeWithClaude(blueprint: ProductBlueprint): Promise<string> {
  if (anthropic) {
    try {
      const prompt = `You are Claude Code Agent, a world-class React + Tailwind CSS UI Developer.
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

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const code = response.content[0]?.type === 'text' ? response.content[0].text : '';
      return code.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
    } catch (err) {
      console.error('Claude UI Code Error:', err);
    }
  }

  return getDefaultStarterUICode(blueprint.productName, blueprint.tagline);
}

export async function generateFullStackCodeWithClaude(
  blueprint: ProductBlueprint,
  filesToGenerate: ProjectFile[]
): Promise<ProjectFile[]> {
  if (anthropic) {
    try {
      const prompt = `You are Claude Code Agent. You write full-stack code for modern web applications.
Generate full, complete production implementation code for these frontend and backend files:

PRODUCT NAME: ${blueprint.productName}
TAGLINE: ${blueprint.tagline}
DESCRIPTION: ${blueprint.description}

FILES TO CODE:
${filesToGenerate.map((f) => `- Path: ${f.path} (${f.type}, ${f.language})`).join('\n')}

Respond ONLY with valid JSON matching this schema:
{
  "files": [
    {
      "path": "file/path.tsx",
      "content": "Full complete code string"
    }
  ]
}`;

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      const parsed = JSON.parse(text);

      if (parsed.files && Array.isArray(parsed.files)) {
        return filesToGenerate.map((origFile) => {
          const generated = parsed.files.find((f: any) => f.path === origFile.path);
          return {
            ...origFile,
            content: generated?.content || origFile.content,
          };
        });
      }
    } catch (err) {
      console.error('Claude FullStack Generation Error:', err);
    }
  }

  return filesToGenerate;
}

export async function refineWithClaude(
  currentBlueprint: ProductBlueprint,
  currentCode: string,
  userInstruction: string,
  chatHistory: { role: string; content: string }[],
  currentFiles?: ProjectFile[]
): Promise<{ updatedBlueprint: ProductBlueprint; updatedCode: string; updatedFiles?: ProjectFile[]; assistantMessage: string }> {
  if (anthropic) {
    try {
      const prompt = `You are Claude Code Agent & AI Copilot.
The user wants to modify the product blueprint, full-stack files, and live UI code.

CURRENT BLUEPRINT:
${JSON.stringify(currentBlueprint, null, 2)}

USER INSTRUCTION:
"${userInstruction}"

Respond ONLY with valid JSON:
{
  "updatedBlueprint": modified ProductBlueprint JSON,
  "updatedCode": modified main React UI code string,
  "updatedFiles": optional array of modified ProjectFile objects [{ "path": "app/page.tsx", "content": "..." }],
  "assistantMessage": brief friendly summary explaining updates
}`;

      const formattedMessages = chatHistory.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [...formattedMessages, { role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      const result = JSON.parse(text);

      if (result.updatedBlueprint && result.assistantMessage) {
        return {
          updatedBlueprint: result.updatedBlueprint,
          updatedCode: result.updatedCode || currentCode,
          updatedFiles: result.updatedFiles || currentFiles,
          assistantMessage: result.assistantMessage,
        };
      }
    } catch (err) {
      console.error('Claude Refine Agent Error:', err);
    }
  }

  const updatedBp = JSON.parse(JSON.stringify(currentBlueprint)) as ProductBlueprint;
  const isEnterprise = userInstruction.toLowerCase().includes('enterprise');

  if (isEnterprise) {
    updatedBp.features.push(
      { name: 'Enterprise Single Sign-On (SSO)', description: 'Okta & SAML 2.0 gateway.', priority: 'high' },
      { name: 'Role-Based Access Control (RBAC)', description: 'Granular team permissions.', priority: 'high' }
    );
  }

  return {
    updatedBlueprint: updatedBp,
    updatedCode: getDefaultStarterUICode(updatedBp.productName, updatedBp.tagline, isEnterprise),
    updatedFiles: currentFiles,
    assistantMessage: `Updated ${updatedBp.productName} blueprint and files with Claude Code Agent.`,
  };
}
