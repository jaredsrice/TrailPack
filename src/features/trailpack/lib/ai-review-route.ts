import {
  buildGuardedAiFallback,
  type AiContractInput,
  type LiveAiOutcome,
  type LiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract";
import { parseAiContractInput } from "@/features/trailpack/lib/ai-contract-runtime";
import { requestLiveAiReview } from "@/features/trailpack/lib/ai-provider";
import {
  AI_REVIEW_LIMIT_PER_WINDOW,
  claimAiReviewQuota,
  type AiReviewQuotaAccess,
} from "@/features/trailpack/lib/ai-review-quota";
import { readTextWithinLimit } from "@/features/trailpack/lib/read-text-with-limit";

const MAX_REQUEST_BYTES = 64_000;
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export async function handleAiReviewPost(
  request: Request,
  dependencies: {
    claimQuota?: () => Promise<AiReviewQuotaAccess>;
    requestReview?: typeof requestLiveAiReview;
  } = {},
) {
  const bodyRead = await readTextWithinLimit(request, MAX_REQUEST_BYTES);
  if (bodyRead.status === "too-large") {
    return jsonResponse(
      { error: "AI review request is too large." },
      { status: 413 },
    );
  }
  if (bodyRead.status === "unreadable") {
    return jsonResponse(
      { error: "Unable to read AI review request." },
      { status: 400 },
    );
  }

  let requestValue: unknown;
  try {
    requestValue = JSON.parse(bodyRead.text);
  } catch {
    return jsonResponse(
      { error: "AI review request must be valid JSON." },
      { status: 400 },
    );
  }

  const input = parseAiContractInput(requestValue);
  if (!input) {
    return jsonResponse(
      { error: "AI review request does not match the supported contract." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  const requestReview = dependencies.requestReview ?? requestLiveAiReview;

  // A deployment without Gemini configured should keep the deterministic
  // experience without consuming a user's live-review allowance.
  if (!apiKey?.trim()) {
    const result = await requestReview(input, { apiKey, model });
    return jsonResponse(result);
  }

  const quota = await (dependencies.claimQuota ?? claimAiReviewQuota)();
  if (quota.status === "signed-out") {
    return jsonResponse(
      fallbackResult(
        input,
        "sign-in-required",
        "Sign in is required for automatic live AI review; the rule-based fallback remains active.",
        model,
      ),
      { status: 401 },
    );
  }
  if (quota.status === "unavailable") {
    return jsonResponse(
      { error: "Automatic AI review is temporarily unavailable." },
      { status: 503 },
    );
  }
  if (quota.status === "limited") {
    return jsonResponse(
      fallbackResult(
        input,
        "rate-limited",
        "The hourly live AI review limit was reached; the rule-based fallback remains active.",
        model,
      ),
      {
        status: 429,
        headers: quotaHeaders(quota),
      },
    );
  }

  const result = await requestReview(input, { apiKey, model });
  return jsonResponse(result, { headers: quotaHeaders(quota) });
}

function fallbackResult(
  input: AiContractInput,
  outcome: Extract<LiveAiOutcome, "rate-limited" | "sign-in-required">,
  reason: string,
  configuredModel?: string,
): LiveAiReviewResult {
  const model = configuredModel?.trim();
  return {
    outcome,
    provider: {
      name: "gemini",
      model:
        model && /^gemini-[a-z0-9.-]+$/.test(model)
          ? model
          : DEFAULT_GEMINI_MODEL,
    },
    review: buildGuardedAiFallback(input, [reason]),
  };
}

function quotaHeaders(
  quota: Extract<AiReviewQuotaAccess, { status: "allowed" | "limited" }>,
): HeadersInit {
  const headers = new Headers({
    "X-RateLimit-Limit": String(AI_REVIEW_LIMIT_PER_WINDOW),
    "X-RateLimit-Remaining": String(quota.remaining),
    "X-RateLimit-Reset": quota.resetAt,
  });
  if (quota.status === "limited") {
    headers.set("Retry-After", String(quota.retryAfterSeconds));
  }
  return headers;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}
