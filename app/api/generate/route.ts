import { NextRequest, NextResponse } from "next/server";
import { buildPack } from "@/lib/ai-pipeline";
import { GeneratePackRequest } from "@/types";

// Rate limiting: simple in-memory store (production should use Redis)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
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

  const { niche, files, pastedText, sessionId, gapAnswers } = body;

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
    const pack = await buildPack(
      niche,
      files || [],
      pastedText || "",
      sessionId,
      gapAnswers
    );

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
