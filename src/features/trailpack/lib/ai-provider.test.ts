import { describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { getSavedAiReviewFixture } from "@/features/trailpack/data/ai-review-fixtures";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import {
  buildAiContractInput,
  type AiReviewDraft,
} from "@/features/trailpack/lib/ai-contract";
import {
  DEFAULT_GEMINI_MODEL,
  requestLiveAiReview,
} from "@/features/trailpack/lib/ai-provider";
import {
  generatePackingRecommendation,
  type UserHikeInput,
} from "@/features/trailpack/lib/packing";

function buildInput(userInput: UserHikeInput = {}) {
  const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
  const recommendation = generatePackingRecommendation(
    JENNY_LAKE_LOOP,
    scenario.weather,
    scenario.alerts,
    userInput,
  );

  return buildAiContractInput({
    trail: JENNY_LAKE_LOOP,
    weather: scenario.weather,
    alerts: scenario.alerts,
    userInput,
    recommendation,
  });
}

function savedDraft(): AiReviewDraft {
  const draft = getSavedAiReviewFixture("jenny-lake-loop");
  if (!draft) {
    throw new Error("Expected Jenny Lake AI review fixture.");
  }

  return structuredClone(draft);
}

function geminiResponse(draft: unknown, status = 200): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(draft) }],
            role: "model",
          },
        },
      ],
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function asFetch(
  implementation: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
): typeof fetch {
  return vi.fn(implementation) as unknown as typeof fetch;
}

describe("live AI provider boundary", () => {
  it("accepts a structured response only after the existing guardrails pass", async () => {
    const fetchImpl = asFetch(async () => geminiResponse(savedDraft()));

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("accepted");
    expect(result.review.status).toBe("accepted");
    expect(result.provider).toEqual({
      name: "gemini",
      model: DEFAULT_GEMINI_MODEL,
    });
    expect(result.review.review.tripSummary).toMatch(/Jenny Lake Loop/);
  });

  it("rejects a structurally valid response that changes baseline source labels", async () => {
    const draft = savedDraft();
    draft.itemExplanationDrafts[0].sourceLabels = ["official"];
    const fetchImpl = asFetch(async () => geminiResponse(draft));

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("rejected");
    expect(result.review.status).toBe("fallback");
    expect(result.review.validationReasons.join(" ")).toMatch(
      /changed source labels/i,
    );
    expect(result.review.review.tripSummary).toMatch(/rule-based packing list/i);
  });

  it("times out through an abort signal and preserves the rule-based fallback", async () => {
    const fetchImpl = asFetch(
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
      timeoutMs: 5,
    });

    expect(result.outcome).toBe("timed-out");
    expect(result.review.status).toBe("fallback");
    expect(result.review.validationReasons.join(" ")).toMatch(/timed out/i);
  });

  it("maps provider quota responses to a labeled fallback", async () => {
    const fetchImpl = asFetch(
      async () => new Response("quota exceeded", { status: 429 }),
    );

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("quota-limited");
    expect(result.review.status).toBe("fallback");
    expect(result.review.validationReasons.join(" ")).toMatch(/quota/i);
  });

  it("uses the fallback without making a provider request when the key is missing", async () => {
    const fetchImpl = asFetch(async () => geminiResponse(savedDraft()));

    const result = await requestLiveAiReview(buildInput(), { fetchImpl });

    expect(result.outcome).toBe("missing-key");
    expect(result.review.status).toBe("fallback");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects malformed provider output without exposing provider details", async () => {
    const fetchImpl = asFetch(async () =>
      geminiResponse("not a TrailPack review"),
    );

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("invalid-response");
    expect(result.review.status).toBe("fallback");
    expect(JSON.stringify(result)).not.toContain("test-key");
  });

  it("maps provider failures to a generic fallback without returning the error body", async () => {
    const fetchImpl = asFetch(
      async () =>
        new Response("upstream internal details", {
          status: 500,
        }),
    );

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("provider-error");
    expect(result.review.status).toBe("fallback");
    expect(JSON.stringify(result)).not.toContain("upstream internal details");
  });

  it("omits unrestricted notes from the minimized provider request", async () => {
    const privateNote = "private transportation and medical note";
    const fetchImpl = asFetch(async () => geminiResponse(savedDraft()));

    await requestLiveAiReview(buildInput({ notes: privateNote }), {
      apiKey: "test-key",
      fetchImpl,
    });

    const requestInit = vi.mocked(fetchImpl).mock.calls[0][1];
    const requestBody = JSON.parse(String(requestInit?.body));
    const prompt = requestBody.contents[0].parts[0].text;
    expect(prompt).not.toContain(privateNote);
    expect(prompt).not.toContain('"notes"');
    expect(prompt).toContain('"tripDetails"');
    expect(requestBody.generationConfig.responseFormat.text).toMatchObject({
      mimeType: "application/json",
      schema: {
        type: "object",
        required: [
          "tripSummary",
          "missingDataReview",
          "itemExplanationDrafts",
        ],
      },
    });
    expect(requestBody.generationConfig).not.toHaveProperty("temperature");
  });
});
