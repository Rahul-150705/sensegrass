import { ProductAnalysis, ProductBlueprint, ScrapedContent, ProjectFile, ProductFileDirectory } from '@/types';
import {
  isGroqConfigured,
  analyzeWebsiteWithGroq,
  generateBlueprintWithGroq,
  refineAnalysisWithGroq,
  StrategyRefineResult,
  refineBlueprintWithGroq,
  BlueprintRefineResult,
  refineProductPlanWithGroq,
  ProductPlanRefineResult,
  generateRunInstructionsWithGroq,
  generateStarterUICodeWithGroq,
  generateFullStackCodeWithGroq,
  refineWithGroq,
  generateFileDirectoryWithGroq,
  refineFileDirectoryWithGroq,
  FileDirectoryRefineResult,
} from '@/lib/groq';
import {
  isOpenAIConfigured,
  analyzeWebsiteWithAI,
  generateBlueprintWithAI,
  generateStarterUICodeWithAI,
  refineWithAI,
} from '@/lib/openai';
import { cached } from '@/lib/ai-cache';

// Groq (GPT-OSS 120B) is the only AI provider used for every stage —
// strategy analysis, blueprint planning, file directory planning, and
// full-stack code generation. OpenAI remains only as a last-resort fallback
// if GROQ_API_KEY is missing.
export const activeAIProvider = isGroqConfigured
  ? 'Groq LLM Engine (GPT-OSS 120B)'
  : isOpenAIConfigured
  ? 'OpenAI API (GPT-4o) — fallback, GROQ_API_KEY not set'
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
  return analyzeWebsiteWithAI(websiteUrl, scraped, userDescription, targetCustomer);
}

// Step 2: product metadata only (name, tagline, features, nav, pages, UI
// direction) — no file tree, no code. See generateFileDirectory below for
// the file tree, and buildFilesForCategory (called from /api/build) for code.
export async function generateBlueprint(
  analysis: ProductAnalysis,
  userDescription: string,
  targetCustomer: string
): Promise<ProductBlueprint> {
  return cached('blueprint', { analysis, userDescription, targetCustomer }, () => {
    if (isGroqConfigured) {
      return generateBlueprintWithGroq(analysis, userDescription, targetCustomer);
    }
    return generateBlueprintWithAI(analysis, userDescription, targetCustomer);
  });
}

// Step 3: the concrete, reviewable build plan — the exact file tree Build
// will later generate code for, plus routes/components/data entities/
// integrations. Groq only, per the strategy analyst/architect role.
export async function generateFileDirectory(
  analysis: ProductAnalysis,
  userDescription: string,
  targetCustomer: string
): Promise<ProductFileDirectory> {
  return cached('file-directory', { analysis, userDescription, targetCustomer }, () =>
    generateFileDirectoryWithGroq(analysis, userDescription, targetCustomer)
  );
}

// File Directory chat refine — distinct from refineStrategy (Stage A) and
// refineProduct (Stage B code). Never touches the strategy or the code.
export async function refineFileDirectory(
  current: ProductFileDirectory,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<FileDirectoryRefineResult> {
  return refineFileDirectoryWithGroq(current, userInstruction, chatHistory);
}

// Step 4: writes real code for a set of files (typically one category —
// frontend/backend/config/database — at a time, driven by the finalized
// file directory) so the Build UI can show real, incremental progress.
export async function buildFiles(
  blueprint: ProductBlueprint,
  filesToGenerate: ProjectFile[]
): Promise<ProjectFile[]> {
  // Groq is the only real code-gen path. generateFullStackCodeWithGroq throws
  // (GroqGenerationError / GroqRateLimitError) on any failure — including a
  // missing API key — so a failed build is never persisted as placeholder stubs.
  //
  // Cache key: the design-relevant slice of the blueprint + the exact file
  // list. Re-running Build with the same plan reuses the generated code
  // instead of spending Groq quota. (Errors throw, so nothing bad is cached.)
  const keyInput = {
    bp: {
      productName: blueprint.productName,
      tagline: blueprint.tagline,
      features: blueprint.features,
      pages: blueprint.pages,
      navigation: blueprint.navigation,
      uiDirection: blueprint.uiDirection,
    },
    files: filesToGenerate.map((f) => ({ path: f.path, type: f.type, language: f.language })),
  };
  return cached('build-file', keyInput, () => generateFullStackCodeWithGroq(blueprint, filesToGenerate));
}

export async function generateStarterUI(blueprint: ProductBlueprint): Promise<string> {
  // Check if main app/page.tsx is already written in generatedFiles
  const mainPageFile = blueprint.generatedFiles?.find((f) => f.path === 'app/page.tsx');
  if (mainPageFile && mainPageFile.content && !mainPageFile.content.includes('Placeholder')) {
    return mainPageFile.content;
  }

  if (isGroqConfigured) {
    return generateStarterUICodeWithGroq(blueprint);
  }
  return generateStarterUICodeWithAI(blueprint);
}

// Stage A (Strategy) refine — distinct from refineProduct below, which is
// Stage B (Blueprint + Code). This never touches the blueprint or code.
export async function refineStrategy(
  currentAnalysis: ProductAnalysis,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<StrategyRefineResult> {
  return refineAnalysisWithGroq(currentAnalysis, userInstruction, chatHistory);
}

// Conversational "modify the proposed product" step — edits the ProductBlueprint
// metadata (name, tagline, features, navigation, pages, UI direction) from
// natural-language instructions. Distinct from refineStrategy (analysis JSON),
// refineFileDirectory (file tree), and refineProduct (blueprint + code).
export async function refineBlueprint(
  current: ProductBlueprint,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<BlueprintRefineResult> {
  return refineBlueprintWithGroq(current, userInstruction, chatHistory);
}

// One assistant for the whole product plan — edits the blueprint, the file
// directory, or both from a single instruction, keeping them consistent.
export async function refineProductPlan(
  currentBlueprint: ProductBlueprint,
  currentFileDirectory: ProductFileDirectory,
  userInstruction: string,
  chatHistory: { role: string; content: string }[]
): Promise<ProductPlanRefineResult> {
  return refineProductPlanWithGroq(currentBlueprint, currentFileDirectory, userInstruction, chatHistory);
}

// A short Markdown runbook for getting the generated project running locally.
export async function generateRunInstructions(
  blueprint: ProductBlueprint,
  files: ProjectFile[]
): Promise<string> {
  return generateRunInstructionsWithGroq(blueprint, files);
}

export async function refineProduct(
  currentBlueprint: ProductBlueprint,
  currentCode: string,
  userInstruction: string,
  chatHistory: { role: string; content: string }[],
  currentFiles?: ProjectFile[]
) {
  if (isGroqConfigured) {
    return refineWithGroq(currentBlueprint, currentCode, userInstruction, chatHistory, currentFiles);
  }
  return refineWithAI(currentBlueprint, currentCode, userInstruction, chatHistory);
}
