import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { getSavedAiReviewFixture } from "@/features/trailpack/data/ai-review-fixtures";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import {
  buildAiContractInput,
  buildGuardedAiFallback,
} from "@/features/trailpack/lib/ai-contract";
import type { AiReviewQuotaAccess } from "@/features/trailpack/lib/ai-review-quota";
import { generatePackingRecommendation } from "@/features/trailpack/lib/packing";
import { handleAiReviewPost } from "@/features/trailpack/lib/ai-review-route";
import { POST } from "./route";

const GENERATION_ID = "3f9a1f5e-6144-4f20-b1ad-32f8cc77d4bc";

function buildInput() {
  const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
  const userInput = {};
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

function request(body: string): Request {
  return new Request("http://localhost/api/trailpack/ai-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function validRequestBody(generationId = GENERATION_ID): string {
  return JSON.stringify({
    generationId,
    input: buildInput(),
  });
}

function generationIdFor(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
}

function createAtomicQuotaClaim(): (generationId: string) => Promise<AiReviewQuotaAccess> {
  const claimed = new Set<string>();

  return async (generationId) => {
    if (claimed.has(generationId)) {
      return {
        status: "duplicate",
        remaining: 5 - claimed.size,
        resetAt: "2026-08-29T18:00:00.000Z",
        retryAfterSeconds: 1_800,
      };
    }
    if (claimed.size >= 5) {
      return quota("limited");
    }

    claimed.add(generationId);
    return {
      status: "allowed",
      remaining: 5 - claimed.size,
      resetAt: "2026-08-29T18:00:00.000Z",
      retryAfterSeconds: 1_800,
    };
  };
}

function mockReview() {
  return vi.fn(async (input: ReturnType<typeof buildInput>) => ({
    outcome: "provider-error" as const,
    provider: { name: "gemini" as const, model: "gemini-3.5-flash" },
    review: buildGuardedAiFallback(input, ["Mocked provider response."]),
  }));
}

function quota(
  status: "allowed" | "duplicate" | "limited",
): AiReviewQuotaAccess {
  return {
    status,
    remaining: status === "allowed" ? 4 : status === "duplicate" ? 3 : 0,
    resetAt: "2026-08-29T18:00:00.000Z",
    retryAfterSeconds: 1_800,
  };
}

function oversizedStreamRequest(): {
  request: Request;
  getPullCount: () => number;
  chunkCount: number;
} {
  const chunkCount = 200;
  const chunk = new TextEncoder().encode("x".repeat(1_024));
  let pulls = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      if (pulls > chunkCount) {
        controller.close();
        return;
      }
      controller.enqueue(chunk);
    },
  });

  const streamedRequest = new Request("http://localhost/api/trailpack/ai-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream as unknown as BodyInit,
    duplex: "half",
  } as RequestInit);

  return {
    request: streamedRequest,
    getPullCount: () => pulls,
    chunkCount,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/trailpack/ai-review", () => {
  it("returns a controlled validation error for malformed JSON", async () => {
    const response = await POST(request("{"));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "AI review request must be valid JSON.",
    });
  });

  it("returns a controlled validation error for an unsupported contract", async () => {
    const response = await POST(request(JSON.stringify({ trail: {} })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "AI review request does not match the supported contract.",
    });
  });

  it("rejects oversized requests before provider work", async () => {
    const response = await POST(
      request(JSON.stringify({ padding: "x".repeat(65_000) })),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "AI review request is too large.",
    });
  });

  it("accepts exactly 64,000 bytes and rejects 64,001 bytes", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const body = validRequestBody();
    const exactBoundary = `${body}${" ".repeat(64_000 - Buffer.byteLength(body))}`;

    const accepted = await POST(request(exactBoundary));
    const rejected = await POST(request(`${exactBoundary} `));

    expect(Buffer.byteLength(exactBoundary)).toBe(64_000);
    expect(accepted.status).toBe(200);
    expect(rejected.status).toBe(413);
  });

  it("rejects unknown fields instead of widening the guarded contract", async () => {
    const value = JSON.parse(validRequestBody()) as Record<string, unknown>;
    value.unexpected = "must not be accepted";

    const response = await POST(request(JSON.stringify(value)));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("stops reading a streamed body after crossing the safety limit", async () => {
    const streamed = oversizedStreamRequest();
    const response = await POST(streamed.request);

    expect(response.status).toBe(413);
    expect(streamed.getPullCount()).toBeLessThan(streamed.chunkCount);
    await expect(response.json()).resolves.toEqual({
      error: "AI review request is too large.",
    });
  });

  it("returns a controlled error for malformed Content-Length metadata", async () => {
    const malformedLengthRequest = new Request(
      "http://localhost/api/trailpack/ai-review",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "not-a-number",
        },
        body: validRequestBody(),
      },
    );

    const response = await POST(malformedLengthRequest);

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Unable to read AI review request.",
    });
  });

  it("returns a controlled error when a streamed body fails", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("private stream detail"));
      },
    });
    const failedRequest = new Request(
      "http://localhost/api/trailpack/ai-review",
      {
        method: "POST",
        body: stream as unknown as BodyInit,
        duplex: "half",
      } as RequestInit,
    );

    const response = await POST(failedRequest);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to read AI review request.",
    });
  });

  it("returns a usable missing-key fallback for a valid contract", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const claimQuota = vi.fn();

    const response = await handleAiReviewPost(
      request(validRequestBody()),
      { claimQuota },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      outcome: "missing-key",
      review: {
        status: "fallback",
      },
    });
    expect(claimQuota).not.toHaveBeenCalled();
  });

  it("keeps live AI behind a signed-in account", async () => {
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");
    const requestReview = vi.fn();

    const response = await handleAiReviewPost(
      request(validRequestBody()),
      {
        claimQuota: async (generationId) => {
          expect(generationId).toBe(GENERATION_ID);
          return { status: "signed-out" };
        },
        requestReview,
      },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      outcome: "sign-in-required",
      review: { status: "fallback" },
    });
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("returns a structured hourly limit without provider work", async () => {
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");
    const requestReview = vi.fn();

    const response = await handleAiReviewPost(
      request(validRequestBody()),
      {
        claimQuota: async () => quota("limited"),
        requestReview,
      },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("1800");
    expect(response.headers.get("x-ratelimit-limit")).toBe("5");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    await expect(response.json()).resolves.toMatchObject({
      outcome: "rate-limited",
      review: { status: "fallback" },
    });
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("reports remaining counts 4 through 0 and rejects the sixth unique generation", async () => {
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");
    const claimQuota = createAtomicQuotaClaim();
    const requestReview = mockReview();
    const statuses: number[] = [];
    const remaining: string[] = [];

    for (let index = 1; index <= 6; index += 1) {
      const response = await handleAiReviewPost(
        request(validRequestBody(generationIdFor(index))),
        { claimQuota, requestReview },
      );
      statuses.push(response.status);
      remaining.push(response.headers.get("x-ratelimit-remaining") ?? "");
      await response.arrayBuffer();
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect(remaining).toEqual(["4", "3", "2", "1", "0", "0"]);
    expect(requestReview).toHaveBeenCalledTimes(5);
  });

  it("does not spend or repeat provider work for a duplicate list generation", async () => {
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");
    const requestReview = vi.fn();

    const response = await handleAiReviewPost(
      request(validRequestBody()),
      {
        claimQuota: async () => quota("duplicate"),
        requestReview,
      },
    );

    expect(response.status).toBe(409);
    expect(response.headers.get("x-ratelimit-remaining")).toBe("3");
    await expect(response.json()).resolves.toMatchObject({
      outcome: "duplicate-generation",
      review: { status: "fallback" },
    });
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("fails closed when the quota store is unavailable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");
    const requestReview = vi.fn();

    const response = await handleAiReviewPost(
      request(validRequestBody()),
      {
        claimQuota: async () => ({ status: "unavailable" }),
        requestReview,
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Automatic AI review is temporarily unavailable.",
    });
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("uses server-side provider configuration for an accepted response", async () => {
    const draft = getSavedAiReviewFixture("jenny-lake-loop");
    if (!draft) {
      throw new Error("Expected Jenny Lake AI review fixture.");
    }

    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
        );
        expect(init?.method).toBe("POST");

        return new Response(
          JSON.stringify({
            id: "interaction-route-test",
            status: "completed",
            steps: [
              {
                type: "model_output",
                content: [{ type: "text", text: JSON.stringify(draft) }],
              },
            ],
          }),
          { status: 200 },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash");

    const response = await handleAiReviewPost(
      request(validRequestBody()),
      { claimQuota: async () => quota("allowed") },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-ratelimit-limit")).toBe("5");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("4");
    expect(body).toMatchObject({
      outcome: "accepted",
      provider: {
        name: "gemini",
        model: "gemini-3.5-flash",
      },
      review: {
        status: "accepted",
      },
    });

    const requestInit = fetchMock.mock.calls[0][1];
    expect(new Headers(requestInit?.headers).get("x-goog-api-key")).toBe(
      "route-test-key",
    );
  });

  it.each([1, 10, 25, 50])(
    "keeps %i concurrent unique requests within the five-claim limit across three runs",
    async (parallelRequests) => {
      vi.stubEnv("GEMINI_API_KEY", "route-test-key");

      for (let run = 0; run < 3; run += 1) {
        const claimQuota = createAtomicQuotaClaim();
        const requestReview = mockReview();
        const responses = await Promise.all(
          Array.from({ length: parallelRequests }, (_, index) =>
            handleAiReviewPost(
              request(validRequestBody(generationIdFor(index + 1))),
              { claimQuota, requestReview },
            ),
          ),
        );

        expect(responses.filter((response) => response.status === 200)).toHaveLength(
          Math.min(parallelRequests, 5),
        );
        expect(responses.filter((response) => response.status === 429)).toHaveLength(
          Math.max(parallelRequests - 5, 0),
        );
        expect(requestReview).toHaveBeenCalledTimes(Math.min(parallelRequests, 5));
      }
    },
  );

  it("deduplicates 50 concurrent retries with one provider call across three runs", async () => {
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");

    for (let run = 0; run < 3; run += 1) {
      const claimQuota = createAtomicQuotaClaim();
      const requestReview = mockReview();
      const responses = await Promise.all(
        Array.from({ length: 50 }, () =>
          handleAiReviewPost(request(validRequestBody()), {
            claimQuota,
            requestReview,
          }),
        ),
      );

      expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
      expect(responses.filter((response) => response.status === 409)).toHaveLength(49);
      expect(requestReview).toHaveBeenCalledOnce();
    }
  });
});
