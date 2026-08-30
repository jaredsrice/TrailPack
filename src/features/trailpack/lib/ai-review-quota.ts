import { getSupabaseServerClient } from "@/features/trailpack/lib/supabase/server";
import { isAiReviewGenerationId } from "@/features/trailpack/lib/ai-contract-runtime";

export const AI_REVIEW_LIMIT_PER_WINDOW = 5;
export const AI_REVIEW_WINDOW_SECONDS = 60 * 60;

export type AiReviewQuotaAccess =
  | { status: "signed-out" }
  | { status: "unavailable" }
  | {
      status: "allowed" | "duplicate" | "limited";
      remaining: number;
      resetAt: string;
      retryAfterSeconds: number;
    };

interface AiReviewQuotaRow {
  allowed: boolean;
  duplicate: boolean;
  remaining: number;
  reset_at: string;
}

export async function claimAiReviewQuota(
  generationId: string,
): Promise<AiReviewQuotaAccess> {
  if (!isAiReviewGenerationId(generationId)) {
    return { status: "unavailable" };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { status: "unavailable" };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { status: "signed-out" };
  }

  const { data, error } = await supabase.rpc("claim_ai_review_quota", {
    review_generation_id: generationId,
  });
  const row = parseAiReviewQuotaRow(data);
  if (error || !row) {
    return { status: "unavailable" };
  }

  return {
    status: row.allowed ? "allowed" : row.duplicate ? "duplicate" : "limited",
    remaining: row.remaining,
    resetAt: row.reset_at,
    retryAfterSeconds: getRetryAfterSeconds(row.reset_at),
  };
}

export function parseAiReviewQuotaRow(
  value: unknown,
): AiReviewQuotaRow | null {
  if (!Array.isArray(value) || value.length !== 1) {
    return null;
  }

  const row: unknown = value[0];
  if (
    !row ||
    typeof row !== "object" ||
    !("allowed" in row) ||
    typeof row.allowed !== "boolean" ||
    !("duplicate" in row) ||
    typeof row.duplicate !== "boolean" ||
    (row.allowed && row.duplicate) ||
    !("remaining" in row) ||
    typeof row.remaining !== "number" ||
    !Number.isInteger(row.remaining) ||
    row.remaining < 0 ||
    row.remaining > AI_REVIEW_LIMIT_PER_WINDOW ||
    !("reset_at" in row) ||
    typeof row.reset_at !== "string" ||
    !Number.isFinite(Date.parse(row.reset_at))
  ) {
    return null;
  }

  return {
    allowed: row.allowed,
    duplicate: row.duplicate,
    remaining: row.remaining,
    reset_at: row.reset_at,
  };
}

export function getRetryAfterSeconds(
  resetAt: string,
  nowMs: number = Date.now(),
): number {
  const retryAfter = Math.ceil((Date.parse(resetAt) - nowMs) / 1_000);
  return Math.max(1, Math.min(AI_REVIEW_WINDOW_SECONDS, retryAfter));
}
