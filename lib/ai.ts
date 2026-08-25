import { ProductAnalysis, ProductBlueprint, ScrapedContent } from '@/types';
import {
  isClaudeConfigured,
  analyzeWebsiteWithClaude,
  generateBlueprintWithClaude,
  generateStarterUICodeWithClaude,
  refineWithClaude,
} from '@/lib/claude';
import {
  isOpenAIConfigured,
  analyzeWebsiteWithAI,
  generateBlueprintWithAI,
  generateStarterUICodeWithAI,
  refineWithAI,
} from '@/lib/openai';

export const activeAIProvider = isClaudeConfigured
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
  if (isClaudeConfigured) {
    return generateBlueprintWithClaude(analysis, userDescription, targetCustomer);
  }
  return generateBlueprintWithAI(analysis, userDescription, targetCustomer);
}

export async function generateStarterUI(blueprint: ProductBlueprint): Promise<string> {
  if (isClaudeConfigured) {
    return generateStarterUICodeWithClaude(blueprint);
  }
  return generateStarterUICodeWithAI(blueprint);
}

export async function refineProduct(
  currentBlueprint: ProductBlueprint,
  currentCode: string,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
) {
  if (isClaudeConfigured) {
    return refineWithClaude(currentBlueprint, currentCode, userInstruction, chatHistory);
  }
  return refineWithAI(currentBlueprint, currentCode, userInstruction, chatHistory);
}
