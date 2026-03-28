import { NextRequest, NextResponse } from "next/server";
import { buildPack } from "@/lib/ai-pipeline";
import { GeneratePackRequest } from "@/types";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";
import { persistGeneration } from "@/lib/supabase-server";

// Rate limiting: simple in-memory store (production should use a shared store like Redis/Vercel KV)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  let body: GeneratePackRequest & { gapAnswers?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const {
    niche,
    files,
    pastedText,
    sessionId,
    gapAnswers,
    cloudSave,
    languageMode,
    targetLanguageName,
    targetLanguageCode,
  } = body;

  if (!niche || !["restaurant", "daycare", "clinic"].includes(niche)) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing niche" },
      { status: 400 }
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Missing sessionId" },
      { status: 400 }
    );
  }

  const hasContent =
    (files && files.length > 0) || (pastedText && pastedText.trim().length > 0);
  if (!hasContent) {
    return NextResponse.json(
      { success: false, error: "Please upload at least one file or paste some text" },
      { status: 400 }
    );
  }

  try {
    const { pack, telemetry } = await buildPack(
      niche,
      files || [],
      pastedText || "",
      sessionId,
      gapAnswers,
      languageMode || "single",
      targetLanguageName || "English",
      targetLanguageCode || "en"
    );

    if (cloudSave) {
      try {
        await persistGeneration({
          sessionId,
          niche,
          cloudSave: true,
          languageMode: languageMode || "single",
          targetLanguageName: targetLanguageName || "English",
          targetLanguageCode: targetLanguageCode || "en",
          files: (files || []).map((f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
          })),
          pastedTextLength: (pastedText || "").length,
          stage: gapAnswers ? "final" : "gaps",
          pack: {
            ...pack,
            telemetry,
          },
        });
      } catch (persistError) {
        const message =
          persistError instanceof Error
            ? persistError.message
            : "Cloud save failed";
        pack.warnings = [...(pack.warnings || []), `Cloud save warning: ${message}`];
      }
    }

    return NextResponse.json({ success: true, pack });
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
