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
  type: 'frontend' | 'backend' | 'config';
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

export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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
  chatHistory?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
