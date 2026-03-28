import OpenAI from "openai";
import {
  DocumentSection,
  GapQuestion,
  GeneratedPack,
  Niche,
  UploadedFile,
} from "@/types";
import { formatDate, generateVersion } from "@/lib/utils";
import {
  GLOBAL_SYSTEM_PROMPT,
  INVALID_JSON_RETRY_PROMPT,
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
  buildStage4Prompt,
} from "@/lib/ai-prompts";
import { MAX_GAP_QUESTIONS, MAX_INPUT_CHARS, NIM_MODEL } from "@/lib/constants";

function getNimClient(): OpenAI {
  const apiKey = process.env.NIM_API_KEY;
  if (!apiKey) {
    throw new Error("NIM_API_KEY environment variable is not set");
  }

  return new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey,
  });
}

async function callNim(prompt: string, systemPrompt: string): Promise<string> {
  const client = getNimClient();
  let result = "";

  const stream = await client.chat.completions.create({
    model: NIM_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 8192,
    stream: true,
  });

  for await (const chunk of stream) {
    if (!chunk.choices?.length) continue;
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      result += delta.content;
    }
  }

  return result.trim();
}

function parseJsonStrict<T>(raw: string): T {
  const trimmed = raw.trim();
  return JSON.parse(trimmed) as T;
}

async function callNimJson<T>(prompt: string): Promise<T> {
  const first = await callNim(prompt, GLOBAL_SYSTEM_PROMPT);
  try {
    return parseJsonStrict<T>(first);
  } catch {
    const retryPrompt = `${INVALID_JSON_RETRY_PROMPT}\n\nOriginal task:\n${prompt}`;
    const second = await callNim(retryPrompt, GLOBAL_SYSTEM_PROMPT);
    return parseJsonStrict<T>(second);
  }
}

type Stage1Facts = {
  business_profile?: {
    business_name?: string;
    address?: string;
    city?: string;
    country?: string;
    hours?: string;
    staff_count?: number | null;
  };
  facts?: Array<{
    id: string;
    category:
      | "cleaning"
      | "safety"
      | "food_handling"
      | "incident"
      | "training"
      | "visitor"
      | "privacy"
      | "equipment"
      | "other";
    fact: string;
    frequency: "daily" | "weekly" | "monthly" | "per_shift" | "as_needed" | "unknown";
    role: string;
    evidence_hint: string;
    source_snippet: string;
  }>;
  entities?: {
    roles?: string[];
    areas?: string[];
    tools_or_chemicals?: string[];
    logs_or_records?: string[];
  };
  missing_info?: string[];
  warnings?: string[];
  confidence?: number;
};

type Stage2Sections = {
  niche: string;
  sections?: Array<{
    section_id: string;
    title: string;
    intent: string;
    bullets: string[];
    checklist_items: Array<{
      text: string;
      frequency: "daily" | "weekly" | "per_shift" | "as_needed";
      role: string;
      evidence: string;
    }>;
    linked_fact_ids: string[];
  }>;
  missing_info?: string[];
  warnings?: string[];
  confidence?: number;
};

type Stage3Questions = {
  questions?: Array<{
    id: string;
    priority: "critical" | "recommended";
    question: string;
    type: "yes_no" | "multiple_choice" | "number" | "short_text";
    options?: string[];
    default?: string;
    maps_to: string;
    why_needed: string;
  }>;
  warnings?: string[];
  confidence?: number;
};

type Stage4Documents = {
  niche: string;
  // "kn" = Kannada language code used by product requirements.
  language: "en" | "kn" | "mixed" | "unknown";
  binder?: {
    title?: string;
    version?: string;
    prepared_date?: string;
    business_name?: string;
    warnings_banner?: string;
  };
  documents?: Array<{
    doc_id: string;
    title: string;
    doc_type: "cover_index" | "policy" | "checklist" | "form" | "log_sheet";
    markdown: string;
    linked_section_ids: string[];
  }>;
  warnings?: string[];
  confidence?: number;
};

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inTable = false;

  const closeUl = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      out.push("</table>");
      inTable = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      closeUl();
      closeTable();
      continue;
    }

    if (line.startsWith("### ")) {
      closeUl();
      closeTable();
      out.push(`<h3>${line.substring(4)}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeUl();
      closeTable();
      out.push(`<h2>${line.substring(3)}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeUl();
      closeTable();
      out.push(`<h2>${line.substring(2)}</h2>`);
      continue;
    }

    if (line.startsWith("- [ ] ")) {
      closeTable();
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li><input type="checkbox" disabled /> ${line.substring(6)}</li>`);
      continue;
    }

    if (line.startsWith("- ")) {
      closeTable();
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${line.substring(2)}</li>`);
      continue;
    }

    if (line.includes("|") && line.startsWith("|") && line.endsWith("|")) {
      closeUl();
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      if (cells.every((c) => /^:?-{3,}:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        out.push("<table>");
        inTable = true;
      }

      out.push(
        `<tr>${cells
          .map((c) => `<td>${c || "&nbsp;"}</td>`)
          .join("")}</tr>`
      );
      continue;
    }

    closeUl();
    closeTable();
    out.push(`<p>${line}</p>`);
  }

  closeUl();
  closeTable();

  return out.join("\n");
}

function sectionTypeFromDocType(
  docType: "cover_index" | "policy" | "checklist" | "form" | "log_sheet"
): DocumentSection["type"] {
  if (docType === "checklist") return "checklist";
  if (docType === "form") return "form";
  if (docType === "log_sheet") return "log";
  if (docType === "cover_index") return "cover";
  return "policy";
}

function mapQuestionsToGapQuestions(input: Stage3Questions): GapQuestion[] {
  const questions = input.questions || [];
  return questions.slice(0, MAX_GAP_QUESTIONS).map((q, index) => ({
    id: q.id || `Q${index + 1}`,
    question: q.question,
    type:
      q.type === "yes_no"
        ? "toggle"
        : q.type === "multiple_choice"
          ? "multiple_choice"
          : q.type === "number"
            ? "number"
            : "text_short",
    options: q.type === "yes_no" ? ["Yes", "No"] : q.options || [],
    required: q.priority === "critical",
    section: q.maps_to || "General",
  }));
}

function toShortDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildSourceText(files: UploadedFile[], pastedText: string): string {
  return [
    pastedText || "",
    ...files.map((f) => `[File: ${f.name}]\n${f.content || ""}`),
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_INPUT_CHARS);
}

export interface BuildPackResult {
  pack: GeneratedPack;
  telemetry: {
    sourceText: string;
    stage1: Stage1Facts;
    stage2: Stage2Sections;
    stage3?: Stage3Questions;
    stage4?: Stage4Documents;
  };
}

export async function buildPack(
  niche: Niche,
  files: UploadedFile[],
  pastedText: string,
  sessionId: string,
  gapAnswers?: Record<string, string>
): Promise<BuildPackResult> {
  const sourceText = buildSourceText(files, pastedText);

  const stage1 = await callNimJson<Stage1Facts>(buildStage1Prompt(sourceText));
  const stage2 = await callNimJson<Stage2Sections>(
    buildStage2Prompt(niche, JSON.stringify(stage1))
  );

  const combinedWarnings: string[] = [
    ...(stage1.warnings || []),
    ...(stage2.warnings || []),
  ];

  const businessName =
    gapAnswers?.business_name || stage1.business_profile?.business_name || "Your Business";

  if (gapAnswers === undefined) {
    const stage3 = await callNimJson<Stage3Questions>(
      buildStage3Prompt(
        JSON.stringify(stage2),
        [
          ...(stage1.missing_info || []),
          ...(stage2.missing_info || []),
        ]
      )
    );

    const pack: GeneratedPack = {
      sessionId,
      niche,
      businessName,
      generatedAt: new Date().toISOString(),
      version: generateVersion(),
      sections: [],
      gapQuestions: mapQuestionsToGapQuestions(stage3),
      gapAnswers: {},
      status: "draft",
      warnings: [...combinedWarnings, ...(stage3.warnings || [])],
    };

    return {
      pack,
      telemetry: { sourceText, stage1, stage2, stage3 },
    };
  }

  const stage4 = await callNimJson<Stage4Documents>(
    buildStage4Prompt(
      niche,
      JSON.stringify(stage2),
      JSON.stringify(gapAnswers || {}),
      toShortDate(new Date())
    )
  );

  const sections: DocumentSection[] = (stage4.documents || []).map((doc, index) => {
    const content = markdownToHtml(doc.markdown || "");
    const missingItems =
      (doc.markdown || "")
        .split(/\r?\n/)
        .filter((line) => line.includes("TODO"))
        .map((line) => line.trim()) || [];

    return {
      id: doc.doc_id || `doc-${index + 1}`,
      title: doc.title || `Document ${index + 1}`,
      type: sectionTypeFromDocType(doc.doc_type),
      content,
      isDraft: missingItems.length > 0,
      missingItems,
    };
  });

  const pack: GeneratedPack = {
    sessionId,
    niche,
    businessName: stage4.binder?.business_name || businessName,
    generatedAt: new Date().toISOString(),
    version: stage4.binder?.version || generateVersion(),
    sections,
    gapQuestions: [],
    gapAnswers: gapAnswers || {},
    status: sections.some((s) => s.isDraft) ? "draft" : "ready",
    warnings: [...combinedWarnings, ...(stage4.warnings || [])],
  };

  return {
    pack,
    telemetry: { sourceText, stage1, stage2, stage4 },
  };
}

export async function runTransformAction(
  _action: "shorten" | "checklist" | "formal",
  content: string
): Promise<string> {
  // Reserved for future API endpoint integration in results actions.
  // Keep consistent with strict JSON prompt pack strategy.
  return content;
}

export function humanPreparedDate(isoDate: string): string {
  return formatDate(isoDate);
}
