export type Niche = "restaurant" | "daycare" | "clinic";

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
  niche: Niche;
  files: UploadedFile[];
  pastedText?: string;
  sessionId: string;
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
  niche: Niche;
  businessName: string;
  generatedAt: string;
  version: string;
  sections: DocumentSection[];
  gapQuestions: GapQuestion[];
  gapAnswers?: Record<string, string>;
  status: "draft" | "ready";
}

export interface GenerateResponse {
  success: boolean;
  pack?: GeneratedPack;
  error?: string;
}
