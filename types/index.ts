export type Niche = "restaurant" | "daycare" | "clinic";
export type GenerationMode = "guided" | "custom";
export type CustomAudience = "student" | "teacher" | "professional" | "general";
export type CustomTone = "simple" | "formal";

export interface NicheInfo {
  id: Niche;
  label: string;
  description: string;
  icon: string;
  color: string;
  accent: string;
  documents: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: "pdf" | "image" | "text" | "docx";
  size: number;
  content?: string;
}

export interface GeneratePackRequest {
  niche?: Niche;
  generationMode?: GenerationMode;
  customAudience?: CustomAudience;
  customPurposes?: string[];
  customTone?: CustomTone;
  files: UploadedFile[];
  pastedText?: string;
  sessionId: string;
  cloudSave?: boolean;
  languageMode?: "single" | "bilingual";
  targetLanguageName?: string;
  targetLanguageCode?: string;
}

export interface GapQuestion {
  id: string;
  question: string;
  type: "toggle" | "multiple_choice" | "number" | "text_short";
  options?: string[];
  required: boolean;
  section: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  type: "sop" | "checklist" | "form" | "policy" | "log" | "cover";
  content: string;
  isDraft: boolean;
  missingItems: string[];
}

export interface GeneratedPack {
  sessionId: string;
  niche: Niche | "custom";
  businessName: string;
  generatedAt: string;
  version: string;
  sections: DocumentSection[];
  gapQuestions: GapQuestion[];
  gapAnswers?: Record<string, string>;
  status: "draft" | "ready";
  warnings?: string[];
  languageMode?: "single" | "bilingual";
  targetLanguageName?: string;
  targetLanguageCode?: string;
  generationMode?: GenerationMode;
  customAudience?: CustomAudience;
  customPurposes?: string[];
  customTone?: CustomTone;
}

export interface GenerateResponse {
  success: boolean;
  pack?: GeneratedPack;
  error?: string;
}
