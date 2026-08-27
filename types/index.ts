export interface ScrapedContent {
  url: string;
  title: string;
  description: string;
  headings: string[];
  mainText: string;
  success: boolean;
  error?: string;
}

export interface ProductAnalysis {
  summary: string;
  targetUsers: string[];
  coreProblem: string;
  keyFeatures: string[];
  businessModel: string;
  suggestedImprovements: string[];
  proposedMVPFeatures: string[];
}

export interface BlueprintFeature {
  name: string;
  description: string;
  category?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BlueprintPage {
  path: string;
  title: string;
  description: string;
}

export interface UIDirection {
  style: string;
  colorScheme: string;
  typography: string;
  designKeywords: string[];
}

export interface ProjectFile {
  path: string;
  name: string;
  type: 'frontend' | 'backend' | 'config' | 'database';
  language: string;
  content: string;
}

export interface ProductBlueprint {
  productName: string;
  tagline: string;
  description: string;
  targetCustomer: string;
  features: BlueprintFeature[];
  navigation: string[];
  pages: BlueprintPage[];
  uiDirection: UIDirection;
  generatedFiles?: ProjectFile[];
}

// The concrete build plan: the exact file tree Build will generate code for,
// plus the surrounding architecture (routes, components, data entities,
// integrations). Produced after Strategy, reviewed/refined before Build —
// distinct from ProductBlueprint (which is lightweight product metadata:
// name, tagline, features) and from `generatedFiles` (the actual code,
// written later, one category at a time, from this plan).
export interface FileDirectoryEntry {
  path: string;
  name: string;
  type: 'frontend' | 'backend' | 'config' | 'database';
  language: string;
  purpose: string;
}

export interface FileDirectoryRoute {
  path: string;
  kind: 'page' | 'api';
  description: string;
}

export interface FileDirectoryDataEntity {
  name: string;
  description: string;
}

export interface ProductFileDirectory {
  files: FileDirectoryEntry[];
  routes: FileDirectoryRoute[];
  components: string[];
  dataEntities: FileDirectoryDataEntity[];
  externalIntegrations: string[];
}

// 'studio' = the Blueprint/Code AI Copilot chat (VSCodeEditor). 'strategy' =
// the Strategy Assistant chat (StrategyChat). 'blueprint' = the Product
// Blueprint assistant (name/features/nav/pages/UI direction). 'fileDirectory'
// = the file directory assistant chat. Kept in one table but separated by this
// discriminator so the conversations never mix.
export type ChatStage = 'studio' | 'strategy' | 'blueprint' | 'fileDirectory';

export interface ChatMessage {
  id: string;
  projectId: string;
  userId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  stage?: ChatStage;
  createdAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  websiteUrl: string;
  description: string;
  targetCustomer: string;
  analysis?: ProductAnalysis | null;
  scrapedInfo?: ScrapedContent | null;
  blueprint?: ProductBlueprint | null;
  uiCode?: string | null;
  generatedFiles?: ProjectFile[] | null;
  fileDirectory?: ProductFileDirectory | null;
  chatHistory?: ChatMessage[];
  strategyChatHistory?: ChatMessage[];
  blueprintChatHistory?: ChatMessage[];
  fileDirectoryChatHistory?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
