import { describe, expect, it, vi } from "vitest";
import type {
  AiContractInput,
  LiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract";
import { requestLiveAiReviewFromRoute } from "@/features/trailpack/lib/ai-review-client";

const INPUT: AiContractInput = {
  trail: {
    id: "test-trail",
    name: "Test Trail",
    park: "Test Park",
    state: "Wyoming",
    distanceMiles: 3,
    elevationGainFeet: 400,
    routeType: "loop",
    estimatedDuration: "2 hours",
    difficulty: "Moderate",
  },
  weather: {
    summary: "Clear",
    conditions: ["sun"],
    sourceLabel: "forecast-based",
  },
  alerts: {
    hasActiveAlerts: false,
    titles: [],
    sourceLabel: "unavailable",
  },
  userInput: {},
  packing: {
    essential: [
      {
        name: "Water",
        question: "How much water?",
        recommendation: "Bring water.",
        why: "The hike requires hydration.",
        answer: "Bring water.",
        reason: "The hike requires hydration.",
        sourceLabels: ["inferred"],
      },
    ],
    optional: [],
    missingDetails: [],
    confidenceNote: "Test confidence note.",
  },
};

function liveResult(
  outcome: LiveAiReviewResult["outcome"] = "accepted",
): LiveAiReviewResult {
  const accepted = outcome === "accepted";

  return {
    outcome,
    provider: {
      name: "gemini",
      model: "gemini-3.5-flash",
    },
    review: {
      status: accepted ? "accepted" : "fallback",
      review: {
        tripSummary: accepted
          ? "A validated live summary."
          : "TrailPack is using the rule-based packing list.",
        missingDataReview: ["No missing details were recorded."],
        itemExplanationDrafts: [
          {
            itemName: "Water",
            explanation: "Bring water for hydration.",
            sourceLabels: ["inferred"],
          },
        ],
      },
      validationReasons: accepted
        ? []
        : ["Live AI configuration is unavailable."],
    },
  };
}

function asFetch(response: Response): typeof fetch {
  return vi.fn(async () => response) as unknown as typeof fetch;
}

describe("live AI review client", () => {
  it("posts the structured contract and accepts a validated live result", async () => {
    const fetchImpl = asFetch(
      Response.json(liveResult(), {
        headers: { "Cache-Control": "no-store" },
      }),
    );

    const result = await requestLiveAiReviewFromRoute(INPUT, { fetchImpl });

    expect(result.outcome).toBe("accepted");
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url).toBe("/api/trailpack/ai-review");
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
    });
    expect(JSON.parse(String(init?.body))).toEqual(INPUT);
  });

  it("keeps a labeled provider fallback as a valid UI result", async () => {
    const fetchImpl = asFetch(Response.json(liveResult("missing-key")));

    const result = await requestLiveAiReviewFromRoute(INPUT, { fetchImpl });

    expect(result).toMatchObject({
      outcome: "missing-key",
      review: {
        status: "fallback",
      },
    });
  });

  it.each([
    { status: 401, outcome: "sign-in-required" as const },
    { status: 429, outcome: "rate-limited" as const },
  ])("keeps a structured $status fallback as a valid UI result", async ({
    status,
    outcome,
  }) => {
    const fetchImpl = asFetch(
      Response.json(liveResult(outcome), { status }),
    );

    const result = await requestLiveAiReviewFromRoute(INPUT, { fetchImpl });

    expect(result).toMatchObject({
      outcome,
      review: { status: "fallback" },
    });
  });

  it("rejects malformed success bodies with a generic client error", async () => {
    const fetchImpl = asFetch(
      Response.json({
        outcome: "accepted",
        internalProviderDetail: "do not expose this",
      }),
    );

    await expect(
      requestLiveAiReviewFromRoute(INPUT, { fetchImpl }),
    ).rejects.toThrow(
      "TrailPack could not complete the live AI review.",
    );
  });

  it("does not expose route error bodies to the UI", async () => {
    const fetchImpl = asFetch(
      new Response("private route detail", { status: 500 }),
    );

    await expect(
      requestLiveAiReviewFromRoute(INPUT, { fetchImpl }),
    ).rejects.not.toThrow(/private route detail/i);
  });
});
