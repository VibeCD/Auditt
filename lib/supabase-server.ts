import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface PersistPayload {
  sessionId: string;
  niche: string;
  cloudSave: boolean;
  languageMode: "single" | "bilingual";
  targetLanguageName: string;
  targetLanguageCode?: string;
  files: Array<{ name: string; type: string; size: number }>;
  pastedTextLength: number;
  stage: "gaps" | "final";
  pack: unknown;
}

export async function persistGeneration(payload: PersistPayload) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  // Note: table should be created by Supabase migration/admin setup.
  // Minimal schema suggestion:
  // generation_runs(session_id text primary key, niche text, cloud_save boolean,
  // language_mode text, target_language_name text, target_language_code text,
  // files jsonb, pasted_text_length int, stage text, pack jsonb, created_at timestamptz)
  const { error } = await supabase.from("generation_runs").upsert(
    {
      session_id: payload.sessionId,
      niche: payload.niche,
      cloud_save: payload.cloudSave,
      language_mode: payload.languageMode,
      target_language_name: payload.targetLanguageName,
      target_language_code: payload.targetLanguageCode || null,
      files: payload.files,
      pasted_text_length: payload.pastedTextLength,
      stage: payload.stage,
      pack: payload.pack,
      created_at: new Date().toISOString(),
    },
    { onConflict: "session_id" }
  );

  if (error) {
    throw new Error(`Supabase persist failed: ${error.message}`);
  }
}
