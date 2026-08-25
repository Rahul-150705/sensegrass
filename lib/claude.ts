import Anthropic from '@anthropic-ai/sdk';
import { ProductAnalysis, ProductBlueprint, ScrapedContent } from '@/types';
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
${scraped.mainText}

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
  "productName": "Catchy SaaS name (e.g. FlowPulse, InsightHQ)",
  "tagline": "Single sentence punchy tagline",
  "description": "Comprehensive 2-3 sentence product overview",
  "targetCustomer": "${targetCustomer}",
  "features": [
    { "name": "Feature Name", "description": "Summary", "priority": "high" },
    { "name": "Feature Name", "description": "Summary", "priority": "high" },
    { "name": "Feature Name", "description": "Summary", "priority": "medium" }
  ],
  "navigation": ["Dashboard", "Analytics", "Reports", "Team", "Settings"],
  "pages": [
    { "path": "/", "title": "Landing Page", "description": "Marketing showcase" },
    { "path": "/dashboard", "title": "Main Dashboard", "description": "Central metrics overview" },
    { "path": "/analytics", "title": "Analytics Hub", "description": "Data charts & telemetry" },
    { "path": "/reports", "title": "Automated Reports", "description": "Scheduled exports" },
    { "path": "/team", "title": "Team Workspace", "description": "Member invitations" },
    { "path": "/settings", "title": "Settings", "description": "Billing & API keys" }
  ],
  "uiDirection": {
    "style": "Modern B2B SaaS, Premium Dark Slate & Indigo Accents",
    "colorScheme": "Indigo primary (#4F46E5), Slate background",
    "typography": "Inter / Geist Sans",
    "designKeywords": ["Data-focused", "Minimalist", "High-density metrics"]
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
      console.error('Claude Blueprint Agent Error:', err);
    }
  }

  // Fallback
  return {
    productName: 'ClaudeFlow',
    tagline: 'The AI-Powered Operational Platform for Growing Businesses',
    description: `An intelligent B2B SaaS platform designed specifically for ${targetCustomer}. ClaudeFlow automates operational reporting, consolidates key metrics, and delivers real-time recommendations.`,
    targetCustomer: targetCustomer || 'Small Business Owners',
    features: [
      { name: 'Executive Dashboard', description: 'Real-time metrics, revenue telemetry, and live KPIs.', priority: 'high' },
      { name: 'AI Insights Engine', description: 'Anomaly detection and automated recommendations powered by Claude.', priority: 'high' },
      { name: 'Smart Analytics Hub', description: 'Interactive chart drill-downs and retention metrics.', priority: 'high' },
      { name: 'Automated Reports', description: 'Schedule automated PDF/CSV reports sent directly to stakeholders.', priority: 'medium' },
    ],
    navigation: ['Dashboard', 'Analytics', 'Reports', 'Team', 'Settings'],
    pages: [
      { path: '/', title: 'Landing Page', description: 'High-converting marketing product showcase' },
      { path: '/dashboard', title: 'Main Dashboard', description: 'Real-time overview of key metrics' },
      { path: '/analytics', title: 'Analytics Hub', description: 'Interactive telemetry & breakdown charts' },
      { path: '/reports', title: 'Automated Reports', description: 'Scheduled PDF exports & client reporting' },
      { path: '/team', title: 'Team Workspace', description: 'Collaborative role management' },
      { path: '/settings', title: 'Settings & Billing', description: 'Subscription management & API keys' },
    ],
    uiDirection: {
      style: 'Modern B2B SaaS, Premium Dark slate & Clean Minimalist layout',
      colorScheme: 'Indigo primary (#4F46E5), Slate dark background, Emerald success accents',
      typography: 'Clean Sans-serif, bold high-contrast metric headers',
      designKeywords: ['Modern B2B', 'Claude AI Powered', 'Minimal', 'Data-focused'],
    },
  };
}

export async function generateStarterUICodeWithClaude(blueprint: ProductBlueprint): Promise<string> {
  if (anthropic) {
    try {
      const prompt = `You are a Principal Frontend React Coding Agent.
Generate a complete, modern React component for the main SaaS Dashboard of "${blueprint.productName}".

TAGLINE: ${blueprint.tagline}
UI DIRECTION: ${JSON.stringify(blueprint.uiDirection)}

Create clean, beautiful React component code using Tailwind CSS styling (standard JSX format).
Respond ONLY with JSON format: { "code": "component code string here" }`;

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 3500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      const parsed = JSON.parse(text);
      if (parsed.code) return parsed.code;
    } catch (err) {
      console.error('Claude Coding Agent Error:', err);
    }
  }

  return getDefaultStarterUICode(blueprint.productName, blueprint.tagline);
}

export async function refineWithClaude(
  currentBlueprint: ProductBlueprint,
  currentCode: string,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<{ updatedBlueprint: ProductBlueprint; updatedCode: string; assistantMessage: string }> {
  if (anthropic) {
    try {
      const prompt = `You are a Claude AI Product Architect & Coding Agent.
The user wants to modify the product blueprint and live UI code.

CURRENT BLUEPRINT:
${JSON.stringify(currentBlueprint, null, 2)}

USER INSTRUCTION:
"${userInstruction}"

Respond ONLY with valid JSON:
{
  "updatedBlueprint": modified ProductBlueprint JSON,
  "updatedCode": modified React UI code string,
  "assistantMessage": brief summary message explaining updates
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
    assistantMessage: `Updated ${updatedBp.productName} blueprint and live UI preview with Claude Agent.`,
  };
}
