import type {
  AiContractInput,
  LiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract";
import { parseLiveAiReviewResult } from "@/features/trailpack/lib/ai-contract-runtime";

const AI_REVIEW_ROUTE = "/api/trailpack/ai-review";
const REQUEST_ERROR_MESSAGE =
  "TrailPack could not complete the live AI review. The rule-based list remains available.";

interface RequestLiveAiReviewOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export async function requestLiveAiReviewFromRoute(
  input: AiContractInput,
  options: RequestLiveAiReviewOptions = {},
): Promise<LiveAiReviewResult> {
  let response: Response;

  try {
    response = await (options.fetchImpl ?? fetch)(AI_REVIEW_ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: options.signal,
    });
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  const result = parseLiveAiReviewResult(responseBody);
  if (!result) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  return result;
}
