import type {
  AiContractInput,
  LiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract";
import {
  isAiReviewGenerationId,
  parseLiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract-runtime";
import {
  discardBody,
  readTextWithinLimit,
} from "@/features/trailpack/lib/read-text-with-limit";

const AI_REVIEW_ROUTE = "/api/trailpack/ai-review";
const REQUEST_ERROR_MESSAGE =
  "TrailPack could not complete the live AI review. The rule-based list remains available.";
const MAX_RESPONSE_BYTES = 256_000;

interface RequestLiveAiReviewOptions {
  generationId: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export async function requestLiveAiReviewFromRoute(
  input: AiContractInput,
  options: RequestLiveAiReviewOptions,
): Promise<LiveAiReviewResult> {
  if (!isAiReviewGenerationId(options.generationId)) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  let response: Response;

  try {
    response = await (options.fetchImpl ?? fetch)(AI_REVIEW_ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationId: options.generationId,
        input,
      }),
      cache: "no-store",
      signal: options.signal,
    });
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  if (
    !response.ok &&
    response.status !== 401 &&
    response.status !== 409 &&
    response.status !== 429
  ) {
    await discardBody(response);
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  let responseBody: unknown;
  try {
    const responseRead = await readTextWithinLimit(response, MAX_RESPONSE_BYTES);
    if (responseRead.status !== "ok") {
      throw new Error(REQUEST_ERROR_MESSAGE);
    }
    responseBody = JSON.parse(responseRead.text);
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  const result = parseLiveAiReviewResult(responseBody);
  if (!result) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  return result;
}
