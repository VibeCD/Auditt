import OpenAI from "openai";
import { DocumentSection, GapQuestion, GeneratedPack, Niche, UploadedFile } from "@/types";
import { generateVersion, formatDate } from "@/lib/utils";

// SECURITY: API key is ONLY used server-side via environment variable. Never exposed to client.
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

const MODEL = "moonshotai/kimi-k2-thinking";

async function callNim(prompt: string, systemPrompt: string): Promise<string> {
  const client = getNimClient();
  let result = "";

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
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

function safeParseJson<T>(text: string, fallback: T): T {
  // Try to extract JSON from response (model may wrap in markdown)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try to find raw JSON object/array
    const objMatch = jsonStr.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[1]) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

// Step 1: Extract structured facts from raw input
async function extractFacts(
  niche: Niche,
  rawContent: string
): Promise<Record<string, string[]>> {
  const systemPrompt = `You are a compliance documentation assistant. Extract structured facts from raw business notes/documents.
Return ONLY valid JSON with no markdown formatting. Extract arrays of facts for each category.`;

  const prompt = `Business type: ${niche}

Raw content from uploaded documents:
${rawContent.substring(0, 6000)}

Extract all facts into this JSON structure:
{
  "tasks": ["list of tasks mentioned"],
  "frequencies": ["cleaning frequencies, schedule items"],
  "roles": ["staff roles and responsibilities"],
  "locations": ["areas/zones mentioned"],
  "equipment": ["equipment and tools mentioned"],
  "chemicals": ["cleaning products, chemicals mentioned"],
  "procedures": ["specific procedures described"],
  "businessInfo": ["business name, hours, contact info"],
  "rules": ["specific rules or policies mentioned"],
  "incidents": ["any incident types or history mentioned"]
}`;

  const response = await callNim(prompt, systemPrompt);
  return safeParseJson(response, {
    tasks: [],
    frequencies: [],
    roles: [],
    locations: [],
    equipment: [],
    chemicals: [],
    procedures: [],
    businessInfo: [],
    rules: [],
    incidents: [],
  });
}

// Step 2: Detect gaps and generate questions
async function detectGaps(
  niche: Niche,
  facts: Record<string, string[]>
): Promise<GapQuestion[]> {
  const systemPrompt = `You are a compliance documentation assistant. Identify missing information needed for a complete compliance binder.
Return ONLY valid JSON array of gap questions. No markdown.`;

  const nicheRequirements: Record<Niche, string[]> = {
    restaurant: [
      "business name",
      "cleaning schedule (daily/weekly/monthly)",
      "temperature control procedures",
      "allergen management",
      "staff hygiene rules",
      "pest control frequency",
      "food storage zones",
      "incident reporting process",
    ],
    daycare: [
      "business name",
      "child drop-off/pickup procedures",
      "child safety protocols",
      "cleaning schedule",
      "incident reporting",
      "visitor sign-in procedures",
      "emergency procedures",
      "staff-to-child ratios",
    ],
    clinic: [
      "clinic name",
      "sterilisation procedures and frequency",
      "patient consent process",
      "infection control protocols",
      "equipment maintenance schedule",
      "waste disposal methods",
      "staff compliance procedures",
      "incident reporting",
    ],
  };

  const prompt = `Business type: ${niche}
Required information for a complete binder: ${JSON.stringify(nicheRequirements[niche])}

Already extracted facts:
${JSON.stringify(facts, null, 2)}

Identify UP TO 7 critical missing items. Return a JSON array of gap questions:
[
  {
    "id": "q1",
    "question": "What is your business name?",
    "type": "text_short",
    "options": null,
    "required": true,
    "section": "Business Info"
  },
  {
    "id": "q2",
    "question": "How often do you clean the kitchen floor?",
    "type": "multiple_choice",
    "options": ["Daily", "Twice daily", "Weekly", "After each shift"],
    "required": true,
    "section": "Cleaning SOP"
  }
]

Only ask about truly MISSING items not found in the extracted facts. Max 7 questions.`;

  const response = await callNim(prompt, systemPrompt);
  const questions = safeParseJson<GapQuestion[]>(response, []);
  return questions.slice(0, 7);
}

// Step 3: Generate individual document content
async function generateDocument(
  niche: Niche,
  docType: string,
  facts: Record<string, string[]>,
  gapAnswers: Record<string, string>,
  businessName: string
): Promise<{ content: string; isDraft: boolean; missingItems: string[] }> {
  const systemPrompt = `You are a professional compliance documentation writer. Generate clear, actionable business compliance documents.
Format output as clean HTML (use h2, h3, p, ul, li, table, tr, td tags). No markdown. Keep language simple and practical.
IMPORTANT: Never claim legal compliance guarantee. Mark uncertain items with [NEEDS REVIEW]. Do not invent laws.`;

  const prompts: Record<string, string> = {
    "cleaning-sop": `Generate a comprehensive Cleaning SOP and Daily Checklist for a ${niche} business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Cleaning SOP header with business name, version date, "Prepared on: ${formatDate(new Date())}"
2. Daily cleaning checklist (morning/during operations/closing)
3. Weekly deep-clean schedule
4. Staff responsibilities section
5. Record-keeping instructions
Mark any unclear items as [NEEDS REVIEW].`,

    "food-temperature-log": `Generate a Food Storage & Temperature Log Sheet for a restaurant/food business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with business name, version, date
2. Temperature monitoring schedule and required ranges
3. Daily temperature log table (date, time, location, reading, initials)
4. Action steps if temperature is out of range
5. Monthly review checklist
Mark any unclear items as [NEEDS REVIEW].`,

    "allergen-sop": `Generate an Allergen Handling SOP for a restaurant/food business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with business name, version, date
2. List of major allergens to manage
3. Staff responsibilities for allergen control
4. Customer communication procedures
5. Cross-contamination prevention steps
6. Training requirements
Mark any unclear items as [NEEDS REVIEW].`,

    "incident-report-form": `Generate an Incident/Complaint Report Form for a ${niche} business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with business name, version, date
2. Incident details section (date, time, location, type)
3. Description of incident (what happened)
4. People involved section
5. Immediate action taken
6. Follow-up required
7. Manager signature/review section
Mark any unclear items as [NEEDS REVIEW].`,

    "staff-hygiene-sop": `Generate a Staff Hygiene SOP and Training Sign-off Sheet for a ${niche} business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with business name, version, date
2. Personal hygiene standards (handwashing, uniform, illness policy)
3. Step-by-step handwashing procedure
4. When to report illness
5. Training sign-off table (staff name, date, trainer, signature)
Mark any unclear items as [NEEDS REVIEW].`,

    "pest-control-log": `Generate a Pest Control Record Sheet for a ${niche} business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with business name, version, date
2. Pest control contractor details section
3. Visit log table (date, time, contractor, areas treated, findings)
4. Action taken log
5. Next inspection date tracking
Mark any unclear items as [NEEDS REVIEW].`,

    "child-safety-sop": `Generate a Child Safety SOP for a daycare/childcare centre.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with centre name, version, date
2. Supervision and staff-to-child ratio policies
3. Safe environment check procedures
4. Child wellbeing monitoring
5. Reporting obligations
6. Staff responsibilities
Mark any unclear items as [NEEDS REVIEW].`,

    "pickup-authorization-form": `Generate a Child Pickup Authorization Form for a daycare.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with centre name, version, date
2. Child information section
3. Authorized persons list (up to 5)
4. Emergency contact details
5. Unauthorized persons restriction section
6. Parent/Guardian signature
Mark any unclear items as [NEEDS REVIEW].`,

    "visitor-log": `Generate a Visitor Log Sheet for a ${niche} business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with business name, version, date
2. Visitor log table (date, time in/out, name, purpose, host, signature)
3. Visitor rules/instructions
4. Emergency procedure note for visitors
Mark any unclear items as [NEEDS REVIEW].`,

    "emergency-drill-checklist": `Generate an Emergency Drill Checklist for a daycare/childcare centre.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with centre name, version, date
2. Fire drill procedure checklist
3. Evacuation route description
4. Drill record table (date, time, duration, issues, sign-off)
5. Post-drill review section
Mark any unclear items as [NEEDS REVIEW].`,

    "infection-control-sop": `Generate an Infection Control & Sterilisation SOP for a clinic/dental/physio practice.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with clinic name, version, date
2. Hand hygiene protocol (5 moments)
3. PPE usage guidelines
4. Sterilisation procedure steps
5. Surface disinfection schedule
6. Waste disposal categories
Mark any unclear items as [NEEDS REVIEW].`,

    "consent-form": `Generate a Patient Consent Form Template for a clinic/dental/physio practice.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with clinic name, version, date
2. Patient information section
3. Treatment description area
4. Risks and benefits summary (general)
5. Patient rights statement
6. Consent declaration and signature block
7. Disclaimer: "This template requires review by qualified legal/medical professional before use"
Mark any unclear items as [NEEDS REVIEW].`,

    "equipment-maintenance-log": `Generate an Equipment Maintenance Log for a ${niche} business.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with business name, version, date
2. Equipment register table
3. Maintenance schedule by equipment type
4. Maintenance record log (date, equipment, issue, action, technician, next service)
5. Sign-off section
Mark any unclear items as [NEEDS REVIEW].`,

    "waste-disposal-protocol": `Generate a Waste Disposal Protocol for a clinic/dental/physio practice.
Business Name: ${businessName || "Business Name"}
Known facts: ${JSON.stringify({ ...facts, ...gapAnswers })}

Create an HTML document with:
1. Header with clinic name, version, date
2. Waste categories (clinical, sharps, general, pharmaceutical)
3. Disposal procedures per category
4. Collection schedule and contractor details
5. Staff responsibilities
6. Record-keeping requirements
Mark any unclear items as [NEEDS REVIEW].`,
  };

  const promptText = prompts[docType] || `Generate a ${docType} compliance document for a ${niche} business named "${businessName}".
Use these facts: ${JSON.stringify({ ...facts, ...gapAnswers })}
Format as clean HTML. Include business name, version date, and "Prepared on: ${formatDate(new Date())}".
Mark any unclear items as [NEEDS REVIEW].`;

  try {
    const content = await callNim(promptText, systemPrompt);
    const missingItems = (content.match(/\[NEEDS REVIEW\]/g) || []).map(
      (_, i) => `Item ${i + 1} needs review`
    );
    return {
      content,
      isDraft: missingItems.length > 0,
      missingItems,
    };
  } catch {
    return {
      content: `<h2>${docType}</h2><p>[NEEDS REVIEW] Document generation failed. Please regenerate.</p>`,
      isDraft: true,
      missingItems: ["Generation failed - please retry"],
    };
  }
}

// Main pipeline: Build full pack
export async function buildPack(
  niche: Niche,
  files: UploadedFile[],
  pastedText: string,
  sessionId: string,
  gapAnswers?: Record<string, string>
): Promise<GeneratedPack> {
  // Combine all uploaded content
  const rawContent = [
    pastedText || "",
    ...files.map((f) => `[File: ${f.name}]\n${f.content || ""}`),
  ]
    .filter(Boolean)
    .join("\n\n");

  // Step 1: Extract facts
  const facts = await extractFacts(niche, rawContent);

  // Extract business name from facts or gap answers
  const businessName =
    gapAnswers?.business_name ||
    facts.businessInfo
      ?.find((i) => i.toLowerCase().includes("name"))
      ?.split(":")?.[1]
      ?.trim() ||
    "";

  // Step 2: Detect gaps (only if no answers provided yet)
  let gapQuestions: GapQuestion[] = [];
  if (!gapAnswers) {
    gapQuestions = await detectGaps(niche, facts);
  }

  // If gap answers provided, generate full documents
  const sections: DocumentSection[] = [];
  if (gapAnswers !== undefined) {
    const docSets: Record<Niche, Array<{ id: string; title: string; type: DocumentSection["type"]; docKey: string }>> = {
      restaurant: [
        { id: "cleaning", title: "Cleaning SOP & Daily Checklist", type: "checklist", docKey: "cleaning-sop" },
        { id: "temperature", title: "Food Storage & Temperature Log", type: "log", docKey: "food-temperature-log" },
        { id: "allergen", title: "Allergen Handling SOP", type: "sop", docKey: "allergen-sop" },
        { id: "incident", title: "Incident / Complaint Report Form", type: "form", docKey: "incident-report-form" },
        { id: "staff-hygiene", title: "Staff Hygiene SOP & Training Sign-off", type: "sop", docKey: "staff-hygiene-sop" },
        { id: "pest-control", title: "Pest Control Record Sheet", type: "log", docKey: "pest-control-log" },
      ],
      daycare: [
        { id: "child-safety", title: "Child Safety SOP", type: "sop", docKey: "child-safety-sop" },
        { id: "cleaning", title: "Daily Cleaning Checklist", type: "checklist", docKey: "cleaning-sop" },
        { id: "incident", title: "Incident Report Form", type: "form", docKey: "incident-report-form" },
        { id: "pickup-auth", title: "Pickup Authorization Form", type: "form", docKey: "pickup-authorization-form" },
        { id: "visitor-log", title: "Visitor Log Sheet", type: "log", docKey: "visitor-log" },
        { id: "staff-training", title: "Staff Training Sign-off", type: "policy", docKey: "staff-hygiene-sop" },
        { id: "emergency-drill", title: "Emergency Drill Checklist", type: "checklist", docKey: "emergency-drill-checklist" },
      ],
      clinic: [
        { id: "infection-control", title: "Infection Control & Sterilisation SOP", type: "sop", docKey: "infection-control-sop" },
        { id: "patient-safety", title: "Patient Safety Checklist", type: "checklist", docKey: "cleaning-sop" },
        { id: "consent-form", title: "Patient Consent Form Template", type: "form", docKey: "consent-form" },
        { id: "equipment-log", title: "Equipment Maintenance Log", type: "log", docKey: "equipment-maintenance-log" },
        { id: "staff-compliance", title: "Staff Compliance Sign-off", type: "policy", docKey: "staff-hygiene-sop" },
        { id: "incident-report", title: "Incident & Near-Miss Report Form", type: "form", docKey: "incident-report-form" },
        { id: "waste-disposal", title: "Waste Disposal Protocol", type: "policy", docKey: "waste-disposal-protocol" },
      ],
    };

    const docs = docSets[niche];
    for (const doc of docs) {
      const result = await generateDocument(niche, doc.docKey, facts, gapAnswers, businessName);
      sections.push({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        content: result.content,
        isDraft: result.isDraft,
        missingItems: result.missingItems,
      });
    }
  }

  const hasReviewItems = sections.some((s) => s.isDraft);

  return {
    sessionId,
    niche,
    businessName: businessName || "Your Business",
    generatedAt: new Date().toISOString(),
    version: generateVersion(),
    sections,
    gapQuestions,
    gapAnswers: gapAnswers || {},
    status: hasReviewItems ? "draft" : "ready",
  };
}
