import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { getSavedAiReviewFixture } from "@/features/trailpack/data/ai-review-fixtures";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import {
  buildAiContractInput,
  buildGuardedAiReview,
  validateAiReviewDraft,
  type AiReviewDraft,
} from "@/features/trailpack/lib/ai-contract";
import {
  parseAiReviewDraft,
  parseAiReviewRequest,
} from "@/features/trailpack/lib/ai-contract-runtime";
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

function validDraft(): AiReviewDraft {
  return structuredClone(getSavedAiReviewFixture("jenny-lake-loop")!);
}

describe("guarded AI contract", () => {
  it("accepts a fixture draft that preserves the rule-based packing items and source labels", () => {
    const result = validateAiReviewDraft(buildInput(), validDraft());

    expect(result.status).toBe("accepted");
    expect(result.review.tripSummary).toMatch(/Jenny Lake Loop/);
    expect(result.validationReasons).toEqual([]);
  });

  it("rejects a draft that changes source labels for a rule-based item", () => {
    const draft = validDraft();
    draft.itemExplanationDrafts[0] = {
      ...draft.itemExplanationDrafts[0],
      sourceLabels: ["official", "inferred"],
    };

    const result = validateAiReviewDraft(buildInput(), draft);

    expect(result.status).toBe("rejected");
    expect(result.validationReasons.join(" ")).toMatch(/changed source labels/i);
  });

  it("rejects a draft that adds a packing item the rule engine did not create", () => {
    const draft = validDraft();
    draft.itemExplanationDrafts.push({
      itemName: "Emergency satellite beacon",
      explanation: "AI should not add packing items in the must-have path.",
      sourceLabels: ["inferred"],
    });

    const result = validateAiReviewDraft(buildInput(), draft);

    expect(result.status).toBe("rejected");
    expect(result.validationReasons.join(" ")).toMatch(/unknown packing item/i);
  });

  it("rejects a draft that rewrites or invents missing details", () => {
    const draft = validDraft();
    draft.missingDataReview = [
      ...draft.missingDataReview,
      "A user profile and hiker preferences were not provided.",
    ];

    const result = validateAiReviewDraft(buildInput(), draft);

    expect(result.status).toBe("rejected");
    expect(result.validationReasons.join(" ")).toMatch(
      /changed the rule-based missing-details list/i,
    );
  });

  it("rejects unsupported safety claims", () => {
    const draft = {
      ...validDraft(),
      tripSummary:
        "Jenny Lake Loop is guaranteed safe today, and hikers can rely on this list for safety.",
    };

    const result = validateAiReviewDraft(buildInput(), draft);

    expect(result.status).toBe("rejected");
    expect(result.validationReasons.join(" ")).toMatch(/unsupported safety claim/i);
  });

  it("rejects broader guarantees and risk-free language", () => {
    const draft = {
      ...validDraft(),
      tripSummary:
        "This packing review guarantees your safety and makes the hike risk-free.",
    };

    const result = validateAiReviewDraft(buildInput(), draft);

    expect(result.status).toBe("rejected");
    expect(result.validationReasons.join(" ")).toMatch(/unsupported safety claim/i);
  });

  it("rejects unsupported trail facts from another supported trail", () => {
    const draft = {
      ...validDraft(),
      tripSummary:
        "Jenny Lake Loop follows the Taggart Lake route and should be treated like the shorter Taggart profile.",
    };

    const result = validateAiReviewDraft(buildInput(), draft);

    expect(result.status).toBe("rejected");
    expect(result.validationReasons.join(" ")).toMatch(/unsupported trail fact/i);
  });

  it("uses template fallback text when a draft is rejected", () => {
    const draft = {
      ...validDraft(),
      tripSummary: "Jenny Lake Loop is guaranteed safe today.",
    };

    const result = buildGuardedAiReview(buildInput(), draft);

    expect(result.status).toBe("fallback");
    expect(result.review.tripSummary).toMatch(/rule-based packing list/i);
    expect(result.review.tripSummary).not.toMatch(/guaranteed safe/i);
    expect(result.validationReasons.join(" ")).toMatch(/unsupported safety claim/i);
  });

  it("does not expose unknown fixture item names in fallback validation copy", () => {
    const draft = validDraft();
    draft.itemExplanationDrafts.push({
      itemName: "Emergency satellite beacon",
      explanation: "AI should not add packing items in the must-have path.",
      sourceLabels: ["inferred"],
    });

    const result = buildGuardedAiReview(buildInput(), draft);

    expect(result.status).toBe("fallback");
    expect(result.validationReasons.join(" ")).toMatch(/outside the current rule-based packing list/i);
    expect(result.validationReasons.join(" ")).not.toMatch(/Emergency satellite beacon/i);
  });

  it("accepts the saved Jenny Lake fixture through the guarded review path", () => {
    const input = buildInput();
    const fixture = getSavedAiReviewFixture(input.trail.id);

    const result = buildGuardedAiReview(input, fixture);

    expect(result.status).toBe("accepted");
    expect(result.review.tripSummary).toMatch(/Jenny Lake Loop/);
    expect(result.review.itemExplanationDrafts).toContainEqual(
      expect.objectContaining({
        itemName: "Insect repellent",
        explanation: expect.not.stringMatching(/window described by NPS guidance/i),
      }),
    );
    expect(result.validationReasons).toEqual([]);
  });
});

describe("guarded AI runtime parser", () => {
  it("rejects unknown request fields at every contract boundary", () => {
    const input = buildInput();
    const baseRequest = {
      generationId: "3f9a1f5e-6144-4f20-b1ad-32f8cc77d4bc",
      input,
    };

    expect(parseAiReviewRequest({ ...baseRequest, unexpected: true })).toBeNull();
    expect(
      parseAiReviewRequest({
        ...baseRequest,
        input: { ...input, unexpected: true },
      }),
    ).toBeNull();
    expect(
      parseAiReviewRequest({
        ...baseRequest,
        input: {
          ...input,
          packing: {
            ...input.packing,
            essential: input.packing.essential.map((item, index) =>
              index === 0 ? { ...item, unexpected: true } : item,
            ),
          },
        },
      }),
    ).toBeNull();
  });

  it("rejects provider drafts containing fields outside the response contract", () => {
    const draft = validDraft();

    expect(parseAiReviewDraft({ ...draft, hidden: "provider detail" })).toBeNull();
    expect(
      parseAiReviewDraft({
        ...draft,
        itemExplanationDrafts: draft.itemExplanationDrafts.map((item, index) =>
          index === 0 ? { ...item, hidden: "provider detail" } : item,
        ),
      }),
    ).toBeNull();
  });
});
