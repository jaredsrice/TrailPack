import { describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { getSavedAiReviewFixture } from "@/features/trailpack/data/ai-review-fixtures";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import {
  buildAiContractInput,
  type AiReviewDraft,
} from "@/features/trailpack/lib/ai-contract";
import {
  DEFAULT_AI_TIMEOUT_MS,
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

function geminiResponseBody(draft: unknown): string {
  return JSON.stringify({
      id: "interaction-test",
      status: "completed",
      steps: [
        {
          type: "model_output",
          content: [{ type: "text", text: JSON.stringify(draft) }],
        },
      ],
    });
}

function geminiResponse(draft: unknown, status = 200): Response {
  return new Response(
    geminiResponseBody(draft),
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

function oversizedProviderResponse(status: number): {
  response: Response;
  getPullCount: () => number;
  wasCancelled: () => boolean;
  chunkCount: number;
} {
  const chunkCount = 400;
  const chunk = new TextEncoder().encode("x".repeat(1_024));
  let pulls = 0;
  let cancelled = false;

  const response = new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls > chunkCount) {
          controller.close();
          return;
        }
        controller.enqueue(chunk);
      },
      cancel() {
        cancelled = true;
      },
    }),
    { status },
  );

  return {
    response,
    getPullCount: () => pulls,
    wasCancelled: () => cancelled,
    chunkCount,
  };
}

describe("live AI provider boundary", () => {
  it("keeps the default live-provider wait bounded", () => {
    expect(DEFAULT_AI_TIMEOUT_MS).toBe(25_000);
  });

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

  it("accepts an otherwise valid provider response at exactly 256 KB", async () => {
    const responseBody = geminiResponseBody(savedDraft());
    const paddingLength = 256_000 - Buffer.byteLength(responseBody);
    const exactBoundary = `${responseBody}${" ".repeat(paddingLength)}`;
    const fetchImpl = asFetch(async () => new Response(exactBoundary));

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(Buffer.byteLength(exactBoundary)).toBe(256_000);
    expect(result.outcome).toBe("accepted");
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

  it.each([408, 504])(
    "maps provider HTTP %i to the bounded timeout fallback",
    async (status) => {
      const fetchImpl = asFetch(
        async () => new Response("private timeout detail", { status }),
      );

      const result = await requestLiveAiReview(buildInput(), {
        apiKey: "test-key",
        fetchImpl,
      });

      expect(result.outcome).toBe("timed-out");
      expect(JSON.stringify(result)).not.toContain("private timeout detail");
    },
  );

  it("maps a provider network failure to the generic fallback", async () => {
    const fetchImpl = asFetch(async () => {
      throw new Error("private network detail");
    });

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("provider-error");
    expect(JSON.stringify(result)).not.toContain("private network detail");
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

  it("rejects provider output that widens the strict response contract", async () => {
    const fetchImpl = asFetch(async () =>
      geminiResponse({ ...savedDraft(), hidden: "private provider detail" }),
    );

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("invalid-response");
    expect(JSON.stringify(result)).not.toContain("private provider detail");
  });

  it("cancels an oversized streamed provider success response", async () => {
    const streamed = oversizedProviderResponse(200);
    const fetchImpl = asFetch(async () => streamed.response);

    const result = await requestLiveAiReview(buildInput(), {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.outcome).toBe("invalid-response");
    expect(streamed.wasCancelled()).toBe(true);
    expect(streamed.getPullCount()).toBeLessThan(streamed.chunkCount);
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

  it("logs only bounded provider status codes in Vercel", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchImpl = asFetch(
      async () =>
        Response.json(
          {
            error: {
              code: 400,
              message: "private upstream details",
              status: "INVALID_ARGUMENT",
              details: [
                {
                  "@type": "type.googleapis.com/google.rpc.BadRequest",
                  fieldViolations: [
                    {
                      field:
                        "response_format.schema.type",
                      description: "private field description",
                    },
                  ],
                },
                {
                  "@type": "type.googleapis.com/google.rpc.ErrorInfo",
                  reason: "API_KEY_INVALID",
                  domain: "googleapis.com",
                },
              ],
            },
          },
          { status: 400 },
        ),
    );

    try {
      const result = await requestLiveAiReview(buildInput(), {
        apiKey: "test-key",
        fetchImpl,
      });

      expect(result.outcome).toBe("provider-error");
      expect(warn).toHaveBeenCalledWith(
        "TrailPack Gemini provider request failed.",
        {
          httpStatus: 400,
          providerEnvelope: "nested-error",
          providerStatus: "INVALID_ARGUMENT",
          providerReason: "API_KEY_INVALID",
          invalidFields: ["response_format.schema.type"],
        },
      );
      expect(JSON.stringify(warn.mock.calls)).not.toContain(
        "private upstream details",
      );
      expect(JSON.stringify(warn.mock.calls)).not.toContain(
        "private field description",
      );
      expect(JSON.stringify(warn.mock.calls)).not.toContain("test-key");
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it("classifies and cancels an oversized streamed provider error", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const streamed = oversizedProviderResponse(500);
    const fetchImpl = asFetch(async () => streamed.response);

    try {
      const result = await requestLiveAiReview(buildInput(), {
        apiKey: "test-key",
        fetchImpl,
      });

      expect(result.outcome).toBe("provider-error");
      expect(streamed.wasCancelled()).toBe(true);
      expect(streamed.getPullCount()).toBeLessThan(streamed.chunkCount);
      expect(warn).toHaveBeenCalledWith(
        "TrailPack Gemini provider request failed.",
        { httpStatus: 500, providerEnvelope: "oversized" },
      );
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it("accepts exactly 8 KB of provider diagnostics and classifies 8 KB plus one byte as oversized", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const diagnostic = JSON.stringify({ error: "API_KEY_INVALID" });
    const exactBoundary = `${diagnostic}${" ".repeat(8_192 - Buffer.byteLength(diagnostic))}`;
    const oversized = `${exactBoundary} `;

    try {
      expect(Buffer.byteLength(exactBoundary)).toBe(8_192);
      expect(Buffer.byteLength(oversized)).toBe(8_193);

      await requestLiveAiReview(buildInput(), {
        apiKey: "test-key",
        fetchImpl: asFetch(async () =>
          new Response(exactBoundary, { status: 500 }),
        ),
      });
      expect(warn).toHaveBeenLastCalledWith(
        "TrailPack Gemini provider request failed.",
        expect.objectContaining({
          httpStatus: 500,
          providerEnvelope: "flat-error",
          providerReason: "API_KEY_INVALID",
        }),
      );

      await requestLiveAiReview(buildInput(), {
        apiKey: "test-key",
        fetchImpl: asFetch(async () => new Response(oversized, { status: 500 })),
      });
      expect(warn).toHaveBeenLastCalledWith(
        "TrailPack Gemini provider request failed.",
        { httpStatus: 500, providerEnvelope: "oversized" },
      );
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it("classifies an array-wrapped API-key error without logging its message", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const privateMessage =
      "API key not valid. Private provider details must stay hidden.";
    const fetchImpl = asFetch(async () =>
      Response.json(
        [{ error: { code: "api_key_invalid", message: privateMessage } }],
        { status: 400 },
      ),
    );

    try {
      const result = await requestLiveAiReview(buildInput(), {
        apiKey: "test-key",
        fetchImpl,
      });

      expect(result.outcome).toBe("provider-error");
      expect(warn).toHaveBeenCalledWith(
        "TrailPack Gemini provider request failed.",
        {
          httpStatus: 400,
          providerEnvelope: "json-array",
          providerReason: "API_KEY_INVALID",
        },
      );
      expect(JSON.stringify(warn.mock.calls)).not.toContain(privateMessage);
      expect(JSON.stringify(warn.mock.calls)).not.toContain("test-key");
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
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
    const prompt = requestBody.input;
    expect(prompt).not.toContain(privateNote);
    expect(prompt).not.toContain('"notes"');
    expect(prompt).toContain('"tripDetails"');
    expect(prompt).toContain(
      "Copy packing.missingDetails exactly into missingDataReview",
    );
    expect(requestBody).toMatchObject({
      model: DEFAULT_GEMINI_MODEL,
      store: false,
      response_format: {
        type: "text",
        mime_type: "application/json",
      },
    });
    expect(requestBody.response_format).toMatchObject({
      schema: {
        type: "object",
        required: [
          "tripSummary",
          "missingDataReview",
          "itemExplanationDrafts",
        ],
      },
    });
    expect(requestBody).not.toHaveProperty("generation_config");
  });
});
