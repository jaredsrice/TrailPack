import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { getSavedAiReviewFixture } from "@/features/trailpack/data/ai-review-fixtures";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import { buildAiContractInput } from "@/features/trailpack/lib/ai-contract";
import { generatePackingRecommendation } from "@/features/trailpack/lib/packing";
import { POST } from "./route";

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

  it("returns a usable missing-key fallback for a valid contract", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const response = await POST(request(JSON.stringify(buildInput())));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      outcome: "missing-key",
      review: {
        status: "fallback",
      },
    });
  });

  it("uses server-side provider configuration for an accepted response", async () => {
    const draft = getSavedAiReviewFixture("jenny-lake-loop");
    if (!draft) {
      throw new Error("Expected Jenny Lake AI review fixture.");
    }

    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toContain(":generateContent");
        expect(init?.method).toBe("POST");

        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(draft) }],
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("GEMINI_API_KEY", "route-test-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash-lite");

    const response = await POST(request(JSON.stringify(buildInput())));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      outcome: "accepted",
      provider: {
        name: "gemini",
        model: "gemini-3.5-flash-lite",
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
