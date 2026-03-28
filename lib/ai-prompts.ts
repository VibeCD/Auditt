import { Niche } from "@/types";

export const GLOBAL_SYSTEM_PROMPT = `You are a structured data engine for a documentation generator app.

CRITICAL OUTPUT RULES:
- Output MUST be valid JSON only. No markdown fences. No explanations.
- Do NOT add keys not present in the schema.
- Use double quotes for all strings. No trailing commas.
- Do not invent laws/regulations. Do not claim legal compliance. Do not hallucinate facts.

LANGUAGE RULES:
- You will receive:
  - mode: "single" or "bilingual"
  - primary_language_name (e.g., "Kannada", "Spanish", "Arabic")
  - primary_language_tag (optional BCP-47 like "kn", "es", "ar")
  - secondary_language_name (only if bilingual; usually "English")
- If mode="single": ALL user-facing text must be written ONLY in primary_language_name.
- If mode="bilingual": Provide both languages using *_primary and *_secondary fields. Do not mix languages in one field.
- If you cannot write well in the requested language, still attempt best-effort but add a warning.

QUALITY:
- Keep content simple, practical, and suitable for small businesses.
- When uncertain, lower confidence and add to "warnings".`;

export const INVALID_JSON_RETRY_PROMPT =
  "Your previous output was invalid JSON. Output valid JSON only.";

export function buildStage0Prompt(sourceText: string): string {
  return `Task: Detect the most likely business niche and input language from the source text.

Return JSON matching this schema:
{
  "detected_niche": "restaurant" | "daycare" | "clinic" | "unknown",
  "detected_language": "en" | "kn" | "mixed" | "unknown",
  "confidence": 0.0,
  "signals": ["..."],
  "warnings": ["..."]
}

source_text:
${sourceText}`;
}

export function buildStage1Prompt(sourceText: string): string {
  return `Task: Extract concrete operational facts from source_text. Convert messy notes into normalized facts.

Return JSON matching this schema:
{
  "business_profile": {
    "business_name": "",
    "address": "",
    "city": "",
    "country": "",
    "hours": "",
    "staff_count": null
  },
  "facts": [
    {
      "id": "F001",
      "category": "cleaning" | "safety" | "food_handling" | "incident" | "training" | "visitor" | "privacy" | "equipment" | "other",
      "fact": "",
      "frequency": "daily" | "weekly" | "monthly" | "per_shift" | "as_needed" | "unknown",
      "role": "",
      "evidence_hint": "",
      "source_snippet": ""
    }
  ],
  "entities": {
    "roles": ["..."],
    "areas": ["..."],
    "tools_or_chemicals": ["..."],
    "logs_or_records": ["..."]
  },
  "missing_info": ["..."],
  "warnings": ["..."],
  "confidence": 0.0
}

Rules:
- facts[].source_snippet must be an exact short quote copied from source_text (max 20 words).
- Do not invent roles/frequencies. If missing, set "unknown" or "" and add to missing_info.
- Prefer many small facts over a few big facts.

source_text:
${sourceText}`;
}

export function buildStage2Prompt(niche: Niche, factsJson: string): string {
  const restaurant = `Task: Organize extracted facts into the Restaurant Binder section schema.
You must only use the facts provided. Do not invent new facts.

Return JSON matching this schema:
{
  "niche": "restaurant",
  "sections": [
    {
      "section_id": "S1",
      "title": "",
      "intent": "",
      "bullets": ["..."],
      "checklist_items": [
        {
          "text": "",
          "frequency": "daily" | "weekly" | "per_shift" | "as_needed",
          "role": "",
          "evidence": ""
        }
      ],
      "linked_fact_ids": ["F001"]
    }
  ],
  "missing_info": ["..."],
  "warnings": ["..."],
  "confidence": 0.0
}

Use exactly these sections in this order (do not add/remove):
S1 Cleaning & Sanitation
S2 Food Storage & Temperature Logs
S3 Staff Hygiene & Training
S4 Allergen Handling
S5 Incident / Complaint Handling
S6 Pest Control & Waste Management (can be minimal if no facts)
S7 Roles & Responsibilities (derive from roles/entities; if missing, note)

Inputs:
facts_json:
${factsJson}`;

  const daycare = `Task: Organize extracted facts into the Daycare Binder section schema.
You must only use the facts provided. Do not invent new facts.

Return JSON matching this schema:
{
  "niche": "daycare",
  "sections": [
    {
      "section_id": "S1",
      "title": "",
      "intent": "",
      "bullets": ["..."],
      "checklist_items": [
        {
          "text": "",
          "frequency": "daily" | "weekly" | "per_shift" | "as_needed",
          "role": "",
          "evidence": ""
        }
      ],
      "linked_fact_ids": ["F001"]
    }
  ],
  "missing_info": ["..."],
  "warnings": ["..."],
  "confidence": 0.0
}

Use exactly these sections in this order (do not add/remove):
S1 Child Safety
S2 Daily Cleaning & Sanitization
S3 Incident Reporting
S4 Pickup Authorization
S5 Visitor Log & Access
S6 Staff Training & Hygiene
S7 Emergency Drill & Preparedness

Inputs:
facts_json:
${factsJson}`;

  const clinic = `Task: Organize extracted facts into the Clinic Binder section schema.
You must only use the facts provided. Do not invent new facts.

Return JSON matching this schema:
{
  "niche": "clinic",
  "sections": [
    {
      "section_id": "S1",
      "title": "",
      "intent": "",
      "bullets": ["..."],
      "checklist_items": [
        {
          "text": "",
          "frequency": "daily" | "weekly" | "per_shift" | "as_needed",
          "role": "",
          "evidence": ""
        }
      ],
      "linked_fact_ids": ["F001"]
    }
  ],
  "missing_info": ["..."],
  "warnings": ["..."],
  "confidence": 0.0
}

Use exactly these sections in this order (do not add/remove):
S1 Infection Control & Sterilization
S2 Patient Safety Checklist
S3 Consent Process
S4 Equipment Maintenance
S5 Staff Compliance & Training
S6 Incident / Near-Miss Handling
S7 Waste Disposal

Inputs:
facts_json:
${factsJson}`;

  const generic = `Task: Organize extracted facts into the ${niche} Binder section schema.
You must only use the facts provided. Do not invent new facts.

Return JSON matching this schema:
{
  "niche": "${niche}",
  "sections": [
    {
      "section_id": "S1",
      "title": "",
      "intent": "",
      "bullets": ["..."],
      "checklist_items": [
        {
          "text": "",
          "frequency": "daily" | "weekly" | "per_shift" | "as_needed",
          "role": "",
          "evidence": ""
        }
      ],
      "linked_fact_ids": ["F001"]
    }
  ],
  "missing_info": ["..."],
  "warnings": ["..."],
  "confidence": 0.0
}

Use 7 practical sections relevant to ${niche} operations. Keep section order stable.

Inputs:
facts_json:
${factsJson}`;

  if (niche === "restaurant") return restaurant;
  if (niche === "daycare") return daycare;
  if (niche === "clinic") return clinic;
  return generic;
}

export function buildStage3Prompt(
  mode: "single" | "bilingual",
  primaryLanguageName: string,
  primaryLanguageTag: string,
  sectionsJson: string,
  missingInfo: string[]
): string {
  if (mode === "bilingual") {
    return `Task: Create the minimum tap-based questions needed to complete a usable pack.
Return bilingual questions.

Return JSON:
{
  "mode": "bilingual",
  "primary_language_name": "",
  "primary_language_tag": "",
  "secondary_language_name": "English",
  "questions": [
    {
      "id": "Q1",
      "priority": "critical" | "recommended",
      "question_primary": "",
      "question_secondary": "",
      "type": "yes_no" | "multiple_choice" | "number" | "short_text",
      "options_primary": ["..."],
      "options_secondary": ["..."],
      "default": "",
      "maps_to": "",
      "why_needed_primary": "",
      "why_needed_secondary": ""
    }
  ],
  "warnings": ["..."],
  "confidence": 0.0
}

Inputs:
mode: ${mode}
primary_language_name: ${primaryLanguageName}
primary_language_tag: ${primaryLanguageTag}
secondary_language_name: English
sections_json: ${sectionsJson}
missing_info: ${JSON.stringify(missingInfo)}`;
  }

  return `Task: Identify the minimum missing information required to generate a usable binder pack.
Questions must be in the primary language only.

Return JSON:
{
  "mode": "single",
  "primary_language_name": "",
  "primary_language_tag": "",
  "questions": [
    {
      "id": "Q1",
      "priority": "critical" | "recommended",
      "question": "",
      "type": "yes_no" | "multiple_choice" | "number" | "short_text",
      "options": ["..."],
      "default": "",
      "maps_to": "business_profile.staff_count",
      "why_needed": ""
    }
  ],
  "warnings": ["..."],
  "confidence": 0.0
}

Inputs:
mode: ${mode}
primary_language_name: ${primaryLanguageName}
primary_language_tag: ${primaryLanguageTag}
sections_json: ${sectionsJson}
missing_info: ${JSON.stringify(missingInfo)}`;
}

export function buildStage4Prompt(
  mode: "single" | "bilingual",
  primaryLanguageName: string,
  primaryLanguageTag: string,
  sectionsJson: string,
  userAnswersJson: string,
  preparedDate: string
): string {
  if (mode === "bilingual") {
    return `Task: Generate the final binder document pack bilingually.
Use only sections_json and user_answers. Do not invent facts.

Return JSON:
{
  "mode": "bilingual",
  "primary_language_name": "",
  "primary_language_tag": "",
  "secondary_language_name": "English",
  "binder": {
    "title_primary": "",
    "title_secondary": "",
    "version": "v1",
    "prepared_date": "",
    "business_name": "",
    "warnings_banner_primary": "",
    "warnings_banner_secondary": ""
  },
  "documents": [
    {
      "doc_id": "D1",
      "title_primary": "",
      "title_secondary": "",
      "doc_type": "cover_index" | "policy" | "checklist" | "form" | "log_sheet",
      "markdown_primary": "",
      "markdown_secondary": ""
    }
  ],
  "warnings": ["..."],
  "confidence": 0.0
}

Inputs:
mode: ${mode}
primary_language_name: ${primaryLanguageName}
primary_language_tag: ${primaryLanguageTag}
secondary_language_name: English
sections_json: ${sectionsJson}
user_answers: ${userAnswersJson}
prepared_date: ${preparedDate}`;
  }

  return `Task: Generate the final binder document pack in the primary language.
Use only sections_json and user_answers. Do not invent facts.

Return JSON:
{
  "mode": "single",
  "primary_language_name": "",
  "primary_language_tag": "",
  "binder": {
    "title": "",
    "version": "v1",
    "prepared_date": "",
    "business_name": "",
    "warnings_banner": ""
  },
  "documents": [
    {
      "doc_id": "D1",
      "title": "",
      "doc_type": "cover_index" | "policy" | "checklist" | "form" | "log_sheet",
      "markdown": ""
    }
  ],
  "warnings": ["..."],
  "confidence": 0.0
}

Inputs:
mode: ${mode}
primary_language_name: ${primaryLanguageName}
primary_language_tag: ${primaryLanguageTag}
sections_json: ${sectionsJson}
user_answers: ${userAnswersJson}
prepared_date: ${preparedDate}`;
}

export function buildTransformPrompt(
  action: "shorten" | "checklist" | "formal",
  content: string
): string {
  if (action === "shorten") {
    return `Task: Rewrite the given content to be shorter while keeping all obligations, frequencies, and safety-critical details.
Return JSON: { "result": "" }

content:
${content}`;
  }

  if (action === "checklist") {
    return `Task: Convert the given content into a checklist. Use short imperative tasks.
Return JSON:
{
  "checklist_items": [
    { "text": "", "frequency": "daily" | "weekly" | "per_shift" | "as_needed", "role": "", "evidence": "" }
  ]
}

content:
${content}`;
  }

  return `Task: Rewrite the given content in a more formal, policy tone without adding new facts.
Return JSON: { "result": "" }

content:
${content}`;
}
