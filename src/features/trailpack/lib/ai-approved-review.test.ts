import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { JENNY_LAKE_LOOP, TRAIL_CATALOG } from "../data/supported-trails";
import { buildAiContractInput, buildGuardedAiFallback, validateAiReviewDraft } from "./ai-contract";
import { generatePackingRecommendation } from "./packing";
import { approvedReviewFacts } from "./ai-approved-review";
import { requestLiveAiReview } from "./ai-provider";

function input() {
  const { weather, alerts } = DEMO_CONTEXTS["jenny-lake-loop"];
  return buildAiContractInput({ trail: JENNY_LAKE_LOOP, weather, alerts,
    userInput: {}, recommendation: generatePackingRecommendation(JENNY_LAKE_LOOP, weather, alerts, {}) });
}

function completeInput() {
  const { weather, alerts } = DEMO_CONTEXTS["jenny-lake-loop"];
  const userInput = {
    startTime: "1 PM",
    expectedDuration: "4 hours",
    trailConditions: "dry",
  };
  return buildAiContractInput({
    trail: JENNY_LAKE_LOOP,
    weather,
    alerts,
    userInput,
    recommendation: generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      weather,
      alerts,
      userInput,
    ),
  });
}

function response(value: unknown) {
  return Response.json({ status: "completed", steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(value) }] }] });
}

describe("approved AI explanation selection", () => {
  it("rejects unapproved prose through the saved-fixture guard too", () => {
    const contract = input();
    const draft = buildGuardedAiFallback(contract, ["fixture"]).review;
    draft.missingDataReview = contract.packing.missingDetails;
    draft.tripSummary = "Jenny Lake Loop is 99 miles long.";
    expect(validateAiReviewDraft(contract, draft).status).toBe("rejected");
  });
  it("renders approved trip facts selected by ID without changing the packing baseline", async () => {
    const contract = input();
    const before = structuredClone(contract);
    const result = await requestLiveAiReview(contract, { apiKey: "fake", fetchImpl: async () => response({ summaryIds: ["profile", "forecast-rain"] }) });
    expect(result.outcome).toBe("accepted");
    expect(result.review.review.tripSummary).toContain("Jenny Lake Loop");
    expect(result.review.review.tripSummary).toMatch(/forecast.*rain/i);
    expect(result.review.review.itemExplanationDrafts.map(item => item.itemName)).toEqual([
      ...contract.packing.essential, ...contract.packing.optional,
    ].map(item => item.name));
    expect(contract).toEqual(before);
  });

  it("turns a complete profile into a substantial assessment before selected highlights", async () => {
    const result = await requestLiveAiReview(completeInput(), {
      apiKey: "fake",
      fetchImpl: async () => response({
        summaryIds: ["forecast-rain", "forecast-wind"],
      }),
    });

    expect(result.outcome).toBe("accepted");
    expect(result.review.review.tripSummary).toMatch(
      /^Jenny Lake Loop is a Moderate 7\.1-mile loop with 1,040 feet of elevation gain\. NPS estimates 3-5 hours, so plan for a sustained half-day effort\./,
    );
    expect(result.review.review.tripSummary).toContain(
      "A 1:00 PM start and four-hour estimate put the planned finish around 5:00 PM.",
    );
    expect(result.review.review.tripSummary).toMatch(/rain protection and grippy footwear/i);
    expect(result.review.review.tripSummary).toMatch(/wind/i);
    expect(result.review.review.missingDataReview).toEqual([]);
  });

  it("keeps the required profile assessment within the three-highlight limit", async () => {
    const result = await requestLiveAiReview(completeInput(), {
      apiKey: "fake",
      fetchImpl: async () => response({
        summaryIds: ["forecast-rain", "forecast-wind", "forecast-sun"],
      }),
    });

    expect(result.outcome).toBe("accepted");
    expect(result.review.review.tripSummary).toMatch(/^Jenny Lake Loop is a Moderate/);
    expect(result.review.review.tripSummary).toMatch(/rain protection and grippy footwear/i);
    expect(result.review.review.tripSummary).toMatch(/wind-blocking layer/i);
    expect(result.review.review.tripSummary).not.toMatch(/sun protection and water/i);
  });

  it("labels a calculated finish that crosses midnight", async () => {
    const contract = completeInput();
    contract.userInput.startTime = "11 PM";
    const result = await requestLiveAiReview(contract, {
      apiKey: "fake",
      fetchImpl: async () => response({ summaryIds: ["forecast-rain"] }),
    });

    expect(result.review.review.tripSummary).toContain(
      "A 11:00 PM start and four-hour estimate put the planned finish around 3:00 AM the next day.",
    );
  });

  it("does not describe a short easy route as a sustained half-day effort", () => {
    const { weather, alerts } = DEMO_CONTEXTS["jenny-lake-loop"];
    const trail = TRAIL_CATALOG["lunch-tree-hill"];
    const userInput = {
      startTime: "10 AM",
      expectedDuration: "45 minutes",
      trailConditions: "dry",
    };
    const contract = buildAiContractInput({
      trail,
      weather,
      alerts,
      userInput,
      recommendation: generatePackingRecommendation(
        trail,
        weather,
        alerts,
        userInput,
      ),
    });

    expect(approvedReviewFacts(contract).profile).toMatch(/^Lunch Tree Hill is an Easy/);
    expect(approvedReviewFacts(contract).profile).toContain(
      "NPS estimates 20-45 Minutes, so this is a shorter outing rather than a half-day route.",
    );
    expect(approvedReviewFacts(contract).profile).toContain("45-minute estimate");
    expect(approvedReviewFacts(contract).profile).not.toMatch(/sustained half-day/i);
  });

  it.each([
    "Jenny Lake Loop is closed due to a grizzly bear and avalanche danger, but you will be safe on this hike.",
    "You can leave your bear spray at home for this trip.",
    "Jenny Lake Loop is 99 miles long.",
  ])("rejects provider-authored prose: %s", async tripSummary => {
    const contract = input();
    const draft = buildGuardedAiFallback(contract, ["fixture"]).review;
    draft.tripSummary = tripSummary;
    draft.missingDataReview = contract.packing.missingDetails;
    const result = await requestLiveAiReview(contract, { apiKey: "fake", fetchImpl: async () => response(draft) });
    expect(result.outcome).not.toBe("accepted");
    expect(result.review.status).toBe("fallback");
    expect(result.review.review.tripSummary).not.toContain(tripSummary);
  });

  it.each([
    { summaryIds: ["invented-closure"] },
    { summaryIds: ["profile", "profile"] },
    { summaryIds: [] },
    { summaryIds: ["forecast-snow"] },
    { summaryIds: ["profile"], tripSummary: "injected prose" },
    { summaryIds: ["profile", "forecast-rain", "forecast-wind", "missing-details"] },
  ])("rejects an invalid or inapplicable selection %j", async selection => {
    const result = await requestLiveAiReview(input(), { apiKey: "fake", fetchImpl: async () => response(selection) });
    expect(result.outcome).not.toBe("accepted");
    expect(result.review.status).toBe("fallback");
    expect(result.review.validationReasons.length).toBeGreaterThan(0);
  });

  it("does not forward arbitrary client strings through any contract field", async () => {
    const contract = input();
    const marker = "SYNTHETIC_PRIVATE_MARKER";
    contract.userInput = { startTime: marker, expectedDuration: marker, trailConditions: marker, notes: marker };
    contract.trail.name = marker;
    contract.weather.summary = marker;
    contract.alerts.titles = [marker];
    contract.packing.confidenceNote = marker;
    contract.packing.missingDetails = [marker];
    contract.packing.essential[0].why = marker;
    contract.packing.essential[0].name = marker;
    let body = "";
    await requestLiveAiReview(contract, { apiKey: "fake", fetchImpl: async (_url, init) => {
      body = String(init?.body);
      return response({ summaryIds: ["profile"] });
    } });
    expect(body).not.toContain(marker);
    expect(body).not.toContain("userInput");
    expect(body).toContain("summaryIds");
  });
});
