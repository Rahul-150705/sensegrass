import { ProductAnalysis, ProductBlueprint, ScrapedContent, ProjectFile } from '@/types';
import {
  isGroqConfigured,
  analyzeWebsiteWithGroq,
  generateBlueprintWithGroq,
  getDefaultFullStackFiles,
} from '@/lib/groq';
import {
  isClaudeConfigured,
  analyzeWebsiteWithClaude,
  generateBlueprintWithClaude,
  generateStarterUICodeWithClaude,
  generateFullStackCodeWithClaude,
  refineWithClaude,
} from '@/lib/claude';
import {
  isOpenAIConfigured,
  analyzeWebsiteWithAI,
  generateBlueprintWithAI,
  generateStarterUICodeWithAI,
  refineWithAI,
} from '@/lib/openai';

export const activeAIProvider = isGroqConfigured && isClaudeConfigured
  ? 'Groq LLM Engine (Llama 3.3 70B) + Claude Code Agent'
  : isGroqConfigured
  ? 'Groq LLM Engine (Llama 3.3 70B)'
  : isClaudeConfigured
  ? 'Anthropic Claude Agent (Claude 3.5 Sonnet)'
  : isOpenAIConfigured
  ? 'OpenAI API (GPT-4o)'
  : 'Smart Agent Engine (Built-in Demo)';

export async function analyzeWebsite(
  websiteUrl: string,
  scraped: ScrapedContent,
  userDescription: string,
  targetCustomer: string
): Promise<ProductAnalysis> {
  // Step 1: Give extracted website text + user prompt to Groq API
  if (isGroqConfigured) {
    return analyzeWebsiteWithGroq(websiteUrl, scraped, userDescription, targetCustomer);
  }
  if (isClaudeConfigured) {
    return analyzeWebsiteWithClaude(websiteUrl, scraped, userDescription, targetCustomer);
  }
  return analyzeWebsiteWithAI(websiteUrl, scraped, userDescription, targetCustomer);
}

export async function generateBlueprint(
  analysis: ProductAnalysis,
  userDescription: string,
  targetCustomer: string
): Promise<ProductBlueprint> {
  // Step 2: Groq API generates blueprint & full-stack project file structure
  let blueprint: ProductBlueprint;
  if (isGroqConfigured) {
    blueprint = await generateBlueprintWithGroq(analysis, userDescription, targetCustomer);
  } else if (isClaudeConfigured) {
    blueprint = await generateBlueprintWithClaude(analysis, userDescription, targetCustomer);
  } else {
    blueprint = await generateBlueprintWithAI(analysis, userDescription, targetCustomer);
  }

  // Ensure default full-stack file tree is populated if needed
  if (!blueprint.generatedFiles || blueprint.generatedFiles.length === 0) {
    blueprint.generatedFiles = getDefaultFullStackFiles(blueprint.productName);
  }

  // Step 3: Claude Code Agent writes implementation code for generated files
  if (isClaudeConfigured && blueprint.generatedFiles) {
    blueprint.generatedFiles = await generateFullStackCodeWithClaude(blueprint, blueprint.generatedFiles);
  }

  return blueprint;
}

export async function generateStarterUI(blueprint: ProductBlueprint): Promise<string> {
  // Check if main app/page.tsx is already written in generatedFiles
  const mainPageFile = blueprint.generatedFiles?.find((f) => f.path === 'app/page.tsx');
  if (mainPageFile && mainPageFile.content && !mainPageFile.content.includes('Placeholder')) {
    return mainPageFile.content;
  }

  if (isClaudeConfigured) {
    return generateStarterUICodeWithClaude(blueprint);
  }
  return generateStarterUICodeWithAI(blueprint);
}

export async function refineProduct(
  currentBlueprint: ProductBlueprint,
  currentCode: string,
  userInstruction: string,
  chatHistory: { role: string; content: string }[],
  currentFiles?: ProjectFile[]
) {
  if (isClaudeConfigured) {
    return refineWithClaude(currentBlueprint, currentCode, userInstruction, chatHistory, currentFiles);
  }
  return refineWithAI(currentBlueprint, currentCode, userInstruction, chatHistory);
}
