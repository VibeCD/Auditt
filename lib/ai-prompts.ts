import { Niche } from "@/types";

export const GLOBAL_SYSTEM_PROMPT = `You are a structured data engine for a documentation generator app.

CRITICAL OUTPUT RULES:
- Output MUST be valid JSON only.
- Do NOT wrap JSON in markdown code fences.
- Do NOT include explanations, comments, or extra keys not in the schema.
- Use double quotes for all strings.
- Never output trailing commas.
- If information is missing, use null or an empty string as specified, and add it to "missing_info".
- Do not invent laws/regulations. Do not claim legal compliance. Do not hallucinate facts.
- Keep content practical, simple, and suitable for small businesses.
- When you are uncertain, set "confidence" low and add a note in "warnings".

SAFETY & ACCURACY:
- Only use the provided source_text and user_answers.
- If source_text conflicts internally, note the conflict in "warnings" and choose the safest interpretation.

LANGUAGE:
- Generate content in the requested language(s) exactly as specified in the schema.`;

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
  sectionsJson: string,
  missingInfo: string[]
): string {
  return `Task: Identify the minimum missing information required to generate a usable binder pack.
Output a short list of tap-based questions suitable for non-technical users.

Return JSON matching this schema:
{
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

Constraints:
- Ask at most 7 questions.
- Prefer yes_no or multiple_choice.
- short_text only if unavoidable; keep it optional when possible.
- If the binder can still be generated without an answer, mark priority as "recommended".

Inputs:
sections_json:
${sectionsJson}
missing_info_from_previous_steps:
${JSON.stringify(missingInfo)}`;
}

export function buildStage4Prompt(
  niche: Niche,
  sectionsJson: string,
  userAnswersJson: string,
  preparedDate: string
): string {
  const docsByNiche: Record<Niche, string> = {
    restaurant: `Generate exactly these documents:
D1 Cover + Index + Revision History (single markdown doc)
D2 Cleaning & Sanitation SOP + Daily Checklist
D3 Temperature Log Sheet (table)
D4 Allergen Handling SOP (1 page)
D5 Incident / Complaint Report Form
D6 Roles & Responsibilities (short)`,
    daycare: `Generate exactly these documents:
D1 Cover + Index + Revision History (single markdown doc)
D2 Child Safety SOP
D3 Daily Cleaning Checklist
D4 Incident Report Form
D5 Pickup Authorization Form
D6 Emergency Drill Checklist`,
    clinic: `Generate exactly these documents:
D1 Cover + Index + Revision History (single markdown doc)
D2 Infection Control & Sterilization SOP
D3 Patient Safety Checklist
D4 Consent Form Template
D5 Incident / Near-Miss Report Form
D6 Waste Disposal Protocol`,
  };

  return `Task: Generate the final document pack in Markdown for a ${niche} Binder.
Use only the provided sections_json and user_answers. Do not invent facts.
If something is missing, include a clearly marked "TODO" line in the document and add it to warnings.

Return JSON matching this schema:
{
  "niche": "${niche}",
  "language": "en",
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
      "markdown": "",
      "linked_section_ids": ["S1"]
    }
  ],
  "warnings": ["..."],
  "confidence": 0.0
}

${docsByNiche[niche]}

Formatting requirements:
- Use short headings.
- Checklists must be Markdown checkboxes: "- [ ] item".
- Tables must be Markdown tables.
- Keep each doc under ~2 pages worth of text when rendered.

Inputs:
sections_json:
${sectionsJson}

user_answers (may be empty):
${userAnswersJson}

prepared_date (YYYY-MM-DD):
${preparedDate}`;
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
