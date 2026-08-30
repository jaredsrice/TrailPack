import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { getSavedAiReviewFixture } from "@/features/trailpack/data/ai-review-fixtures";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import { buildAiContractInput } from "@/features/trailpack/lib/ai-contract";
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

function validRequestBody(): string {
  return JSON.stringify({
    generationId: GENERATION_ID,
    input: buildInput(),
  });
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

  it("stops reading a streamed body after crossing the safety limit", async () => {
    const streamed = oversizedStreamRequest();
    const response = await POST(streamed.request);

    expect(response.status).toBe(413);
    expect(streamed.getPullCount()).toBeLessThan(streamed.chunkCount);
    await expect(response.json()).resolves.toEqual({
      error: "AI review request is too large.",
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
});
