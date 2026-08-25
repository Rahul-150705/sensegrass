import OpenAI from 'openai';
import { ProductAnalysis, ProductBlueprint, ScrapedContent, ProjectFile } from '@/types';

const apiKey = process.env.OPENAI_API_KEY || '';
export const isOpenAIConfigured = Boolean(apiKey && apiKey !== 'your_openai_api_key_here');

const openai = isOpenAIConfigured ? new OpenAI({ apiKey }) : null;

export async function analyzeWebsiteWithAI(
  websiteUrl: string,
  scraped: ScrapedContent,
  userDescription: string,
  targetCustomer: string
): Promise<ProductAnalysis> {
  if (openai) {
    try {
      const prompt = `You are a senior product strategist and SaaS architect.
Analyze the following website information and user request to transform this concept into a modern B2B SaaS product.

WEBSITE URL: ${websiteUrl}
WEBSITE TITLE: ${scraped.title}
META DESCRIPTION: ${scraped.description}
HEADINGS: ${scraped.headings.join(' | ')}
EXTRACTED CONTENT SAMPLE:
${scraped.mainText}

USER REQUEST / VISION:
${userDescription}

TARGET CUSTOMER:
${targetCustomer}

Return a valid JSON object matching this strict schema:
{
  "summary": "Detailed summary of what the existing product/website does and how the new SaaS builds on it",
  "targetUsers": ["Target User Role 1", "Target User Role 2", "Target User Role 3"],
  "coreProblem": "The core operational or business problem being solved",
  "keyFeatures": ["Key Feature 1", "Key Feature 2", "Key Feature 3", "Key Feature 4"],
  "businessModel": "Clear monetization & pricing model description (e.g. Tiered subscription SaaS)",
  "suggestedImprovements": ["Suggested Improvement 1", "Suggested Improvement 2", "Suggested Improvement 3"],
  "proposedMVPFeatures": ["MVP Feature 1 (e.g. Smart Dashboard)", "MVP Feature 2 (e.g. Analytics)", "MVP Feature 3 (e.g. Automated Reports)", "MVP Feature 4 (e.g. Team Workspace)"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as ProductAnalysis;
    } catch (err) {
      console.error('OpenAI Analysis error:', err);
    }
  }

  // Fallback high-quality product analysis generator
  const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const cleanName = domain.split('.')[0] || 'Product';
  const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    summary: `${capitalizedName} provides core digital solutions. This modern SaaS transformation focuses on enabling ${targetCustomer} to streamline operations, gain data insights, and automate repetitive workflows through a unified cloud platform.`,
    targetUsers: [
      `${targetCustomer} Owners`,
      'Operations Managers',
      'Team Leads & Analysts',
      'Client Managers',
    ],
    coreProblem: `Small business operators lack unified visibility into operational metrics, spending hours manually compiling reports and managing team tasks across disconnected tools.`,
    keyFeatures: [
      'Real-time Operational Dashboard',
      'Automated Performance Analytics',
      'AI-Powered Insights Engine',
      'Customizable Business Reports',
      'Team & Client Management',
      'Instant Alerts & Notifications',
    ],
    businessModel: 'Subscription-based B2B SaaS with Tiered Plans (Starter $29/mo, Growth $79/mo, Enterprise $199/mo).',
    suggestedImprovements: [
      'Self-service onboarding wizard for fast setup',
      'AI auto-generated weekly summary emails for executive teams',
      'One-click CSV/PDF export for client reports',
      'Role-based granular access control for staff',
    ],
    proposedMVPFeatures: [
      'Interactive Smart Dashboard',
      'Analytics & Data Overview',
      'Automated Reports Generator',
      'Team Management Workspace',
      'Settings & Integration Controls',
    ],
  };
}

export async function generateBlueprintWithAI(
  analysis: ProductAnalysis,
  userDescription: string,
  targetCustomer: string
): Promise<ProductBlueprint> {
  if (openai) {
    try {
      const prompt = `You are an expert SaaS Product Architect.
Given this product analysis and user vision, generate a full SaaS Product Blueprint.

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

USER VISION: ${userDescription}
TARGET CUSTOMER: ${targetCustomer}

Return a valid JSON object with this schema:
{
  "productName": "Catchy modern SaaS name (e.g. FlowPulse, InsightHQ, OpsForge)",
  "tagline": "A punchy, professional single-sentence tagline",
  "description": "2-3 sentence comprehensive description of the SaaS platform",
  "targetCustomer": "${targetCustomer}",
  "features": [
    { "name": "Feature Name", "description": "Brief summary", "priority": "high" },
    { "name": "Feature Name", "description": "Brief summary", "priority": "high" },
    { "name": "Feature Name", "description": "Brief summary", "priority": "medium" }
  ],
  "navigation": ["Dashboard", "Analytics", "Reports", "Team", "Settings"],
  "pages": [
    { "path": "/", "title": "Landing Page", "description": "High-converting marketing landing page" },
    { "path": "/dashboard", "title": "Main Dashboard", "description": "Central metrics & activity overview" },
    { "path": "/analytics", "title": "Analytics Hub", "description": "Deep-dive charts and business telemetry" },
    { "path": "/reports", "title": "Automated Reports", "description": "Scheduled report generation & downloads" },
    { "path": "/team", "title": "Team & Access", "description": "Member invitations and permissions" },
    { "path": "/settings", "title": "Workspace Settings", "description": "API keys, billing, and profile" }
  ],
  "uiDirection": {
    "style": "Modern B2B SaaS, Premium Dark & Clean Light Accent",
    "colorScheme": "Deep Navy, Electric Indigo (#4F46E5), Emerald Accents",
    "typography": "Inter / Geist Sans, high readability data tables",
    "designKeywords": ["Data-focused", "Minimalist", "High-density metrics", "Responsive"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as ProductBlueprint;
    } catch (err) {
      console.error('OpenAI Blueprint error:', err);
    }
  }

  // Fallback high-quality blueprint generator
  return {
    productName: 'ExampleFlow',
    tagline: 'The AI-Powered Operational Platform for Growing Businesses',
    description: `An intelligent B2B SaaS platform designed specifically for ${targetCustomer}. ExampleFlow automates operational reporting, consolidates key metrics, and delivers real-time recommendations to accelerate revenue growth.`,
    targetCustomer: targetCustomer || 'Small Business Owners',
    features: [
      {
        name: 'Executive Dashboard',
        description: 'Single-pane-of-glass operational metrics, live revenue telemetry, and key performance indicators.',
        priority: 'high',
      },
      {
        name: 'AI Insights Engine',
        description: 'Automated anomaly detection and operational recommendations powered by machine learning.',
        priority: 'high',
      },
      {
        name: 'Smart Analytics Hub',
        description: 'Interactive chart drill-downs, conversion funnel tracking, and customer retention metrics.',
        priority: 'high',
      },
      {
        name: 'Automated Client Reports',
        description: 'Schedule automated PDF/CSV reports sent directly to stakeholders and clients.',
        priority: 'medium',
      },
      {
        name: 'Team Workspace & RBAC',
        description: 'Collaborative team management with granular permission roles (Admin, Analyst, Viewer).',
        priority: 'medium',
      },
    ],
    navigation: ['Dashboard', 'Analytics', 'Reports', 'Team', 'Settings'],
    pages: [
      { path: '/', title: 'Landing Page', description: 'High-converting marketing product showcase' },
      { path: '/dashboard', title: 'Main Dashboard', description: 'Real-time overview of key metrics & alerts' },
      { path: '/analytics', title: 'Analytics Hub', description: 'Interactive telemetry & breakdown charts' },
      { path: '/reports', title: 'Automated Reports', description: 'Scheduled PDF exports & client reporting' },
      { path: '/team', title: 'Team Workspace', description: 'Collaborative role management' },
      { path: '/settings', title: 'Settings & Billing', description: 'Subscription management & API keys' },
    ],
    uiDirection: {
      style: 'Modern B2B SaaS, Premium Dark slate & Clean Minimalist layout',
      colorScheme: 'Indigo primary (#4F46E5), Slate dark background, Emerald success accents',
      typography: 'Clean Sans-serif, bold high-contrast metric headers',
      designKeywords: ['Modern B2B', 'Premium', 'Minimal', 'Data-focused', 'Clean typography'],
    },
  };
}

export async function generateStarterUICodeWithAI(blueprint: ProductBlueprint): Promise<string> {
  if (openai) {
    try {
      const prompt = `You are a Principal Frontend React Developer.
Generate a complete, modern, interactive React component for the main SaaS Dashboard of "${blueprint.productName}".

TAGLINE: ${blueprint.tagline}
UI DIRECTION: ${JSON.stringify(blueprint.uiDirection)}
FEATURES TO SHOW: ${blueprint.features.map((f) => f.name).join(', ')}

Create clean, beautiful, dark/light modern React component code using Tailwind CSS styling and Lucide icons (standard JSX syntax).
Return JSON with format: { "code": "component code here" }`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = JSON.parse(response.choices[0]?.message?.content || '{}');
      if (content.code) return content.code;
    } catch (err) {
      console.error('OpenAI UI Code error:', err);
    }
  }

  // High quality default React UI starter code
  return getDefaultStarterUICode(blueprint.productName, blueprint.tagline);
}

export async function refineWithAI(
  currentBlueprint: ProductBlueprint,
  currentCode: string,
  userInstruction: string,
  chatHistory: { role: string; content: string }[],
  currentFiles?: ProjectFile[]
): Promise<{ updatedBlueprint: ProductBlueprint; updatedCode: string; updatedFiles?: ProjectFile[]; assistantMessage: string }> {
  if (openai) {
    try {
      const prompt = `You are a senior AI product architect and UI engineer.
The user wants to refine the product blueprint and live UI code.

CURRENT BLUEPRINT:
${JSON.stringify(currentBlueprint, null, 2)}

USER INSTRUCTION:
"${userInstruction}"

Respond ONLY with valid JSON:
{
  "updatedBlueprint": modified ProductBlueprint JSON object,
  "updatedCode": modified React UI code string,
  "assistantMessage": brief summary message explaining updates
}`;

      const formattedMessages = chatHistory.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...formattedMessages, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      if (result.updatedBlueprint && result.assistantMessage) {
        return {
          updatedBlueprint: result.updatedBlueprint,
          updatedCode: result.updatedCode || currentCode,
          updatedFiles: currentFiles,
          assistantMessage: result.assistantMessage,
        };
      }
    } catch (err) {
      console.error('OpenAI Refine error:', err);
    }
  }

  // Fallback intelligent refinement handler
  const lowerMsg = userInstruction.toLowerCase();
  const updatedBp = JSON.parse(JSON.stringify(currentBlueprint)) as ProductBlueprint;
  let summary = `Updated ${updatedBp.productName} blueprint and live UI preview based on your instructions.`;

  if (lowerMsg.includes('enterprise') || lowerMsg.includes('premium') || lowerMsg.includes('sso') || lowerMsg.includes('rbac')) {
    updatedBp.targetCustomer = 'Enterprise Organizations & Small Businesses';
    if (!updatedBp.features.some((f) => f.name.includes('SSO'))) {
      updatedBp.features.push(
        { name: 'Enterprise Single Sign-On (SSO)', description: 'SAML 2.0 & Okta authentication integration.', priority: 'high' },
        { name: 'Role-Based Access Control (RBAC)', description: 'Granular permission policies for enterprise teams.', priority: 'high' },
        { name: 'Audit Logs & Compliance', description: 'Comprehensive security audit logging and SOC2 readiness.', priority: 'medium' }
      );
    }
    updatedBp.uiDirection.style = 'Premium Enterprise SaaS, Dark Theme Slate & Gold Accents';
    summary = `Updated project positioning for Enterprise. Added SSO, RBAC, Audit Logs, and updated the live preview to a premium dark theme styling!`;
  } else if (lowerMsg.includes('dark') || lowerMsg.includes('theme')) {
    updatedBp.uiDirection.style = 'Ultra-modern Dark Mode SaaS';
    summary = `Switched UI Direction to Dark Mode with high-contrast metric visuals.`;
  } else if (lowerMsg.includes('chart') || lowerMsg.includes('analytics') || lowerMsg.includes('revenue')) {
    if (!updatedBp.features.some((f) => f.name.includes('Revenue'))) {
      updatedBp.features.unshift({
        name: 'Revenue Telemetry & Trend Charts',
        description: 'Real-time MRR, ARR, and cash flow forecasting visualizers.',
        priority: 'high',
      });
    }
    summary = `Added interactive Revenue Telemetry chart and updated the live preview dashboard.`;
  } else {
    updatedBp.features.push({
      name: userInstruction.slice(0, 30),
      description: `Custom capability: ${userInstruction}`,
      priority: 'high',
    });
  }

  return {
    updatedBlueprint: updatedBp,
    updatedCode: getDefaultStarterUICode(updatedBp.productName, updatedBp.tagline, lowerMsg.includes('enterprise') || lowerMsg.includes('premium')),
    updatedFiles: currentFiles,
    assistantMessage: summary,
  };
}

export function getDefaultStarterUICode(productName: string, tagline: string, isPremium: boolean = false): string {
  return `<div className="${isPremium ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-100'} p-6 rounded-xl border border-slate-800 shadow-2xl space-y-6">
  {/* Header Bar */}
  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30">
        ${productName.substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          ${productName}
          ${isPremium ? '<span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise Edition</span>' : ''}
        </h2>
        <p className="text-xs text-slate-400">${tagline}</p>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live System
      </span>
      <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-md">
        + New Workflow
      </button>
    </div>
  </div>

  {/* Metrics Grid */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-white">$48,290</span>
        <span className="text-xs font-bold text-emerald-400">+14.2%</span>
      </div>
      <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className="bg-indigo-500 h-full w-[78%]"></div>
      </div>
    </div>

    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Customers</span>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-white">1,420</span>
        <span className="text-xs font-bold text-emerald-400">+8.4%</span>
      </div>
      <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className="bg-emerald-500 h-full w-[65%]"></div>
      </div>
    </div>

    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Operations Saved</span>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-white">18.4 hrs/wk</span>
        <span className="text-xs font-bold text-indigo-400">Automated</span>
      </div>
      <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className="bg-cyan-500 h-full w-[90%]"></div>
      </div>
    </div>

    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Health</span>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-white">99.98%</span>
        <span className="text-xs font-bold text-emerald-400">Optimal</span>
      </div>
      <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className="bg-emerald-400 h-full w-[99%]"></div>
      </div>
    </div>
  </div>

  {/* Revenue & Telemetry Visualizer */}
  <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-lg space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-white">Revenue & Usage Telemetry</h3>
        <p className="text-xs text-slate-400">Automated growth metrics and forecasting chart</p>
      </div>
      <div className="flex items-center space-x-2 text-xs">
        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded font-medium">MRR Growth</span>
        <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded">Churn Rate</span>
      </div>
    </div>

    {/* CSS/SVG Visual Bar Chart */}
    <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-800">
      <div className="flex-1 bg-indigo-600/30 hover:bg-indigo-500/50 transition-all rounded-t h-[45%] group relative">
        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white">$24k</span>
      </div>
      <div className="flex-1 bg-indigo-600/40 hover:bg-indigo-500/60 transition-all rounded-t h-[60%] group relative">
        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white">$31k</span>
      </div>
      <div className="flex-1 bg-indigo-600/50 hover:bg-indigo-500/70 transition-all rounded-t h-[52%] group relative">
        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white">$28k</span>
      </div>
      <div className="flex-1 bg-indigo-600/70 hover:bg-indigo-500/80 transition-all rounded-t h-[75%] group relative">
        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white">$40k</span>
      </div>
      <div className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-t h-[88%] group relative">
        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white">$45k</span>
      </div>
      <div className="flex-1 bg-indigo-500 hover:bg-indigo-400 transition-all rounded-t h-[100%] group relative">
        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white shadow-lg">$48.2k</span>
      </div>
    </div>
    <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
      <span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span><span className="text-indigo-400 font-bold">AUG (CURRENT)</span>
    </div>
  </div>

  {/* Active Features Table */}
  <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
    <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
      <span>Operational Workflows</span>
      <span className="text-slate-500">4 Active Modules</span>
    </div>
    <div className="divide-y divide-slate-800 text-xs">
      <div className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium text-slate-200">AI Customer Retention Predictor</span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">Auto-Scheduled</span>
      </div>
      <div className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span className="font-medium text-slate-200">Automated Weekly Executive PDF Reports</span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">Every Monday at 08:00</span>
      </div>
      ${isPremium ? `<div className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors bg-indigo-950/20">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="font-medium text-amber-200">Okta / SAML 2.0 Single Sign-On Gateway</span>
        </div>
        <span className="text-amber-400/80 font-mono text-[11px]">Enterprise Enforced</span>
      </div>` : ''}
    </div>
  </div>
</div>`;
}
