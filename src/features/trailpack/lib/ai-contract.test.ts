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
  return {
    tripSummary:
      "Jenny Lake Loop is a longer Grand Teton day hike with forecast-based rain and wind signals, so the rule-based list emphasizes steady hydration, weather protection, and basic safety items.",
    missingDataReview: [
      "Current trail surface conditions are not known from official data alone.",
      "Expected time out was not provided.",
    ],
    itemExplanationDrafts: [
      {
        itemName: "Trail footwear",
        explanation:
          "The supported trail profile lists a moderate route with enough gain to justify supportive footwear.",
        sourceLabels: ["supported-profile", "forecast-based", "inferred"],
      },
      {
        itemName: "Water",
        explanation:
          "The rule engine sizes water from the supported trail distance and elevation gain.",
        sourceLabels: ["supported-profile"],
      },
      {
        itemName: "Food",
        explanation:
          "The supported trail profile indicates a longer effort where food is useful.",
        sourceLabels: ["supported-profile"],
      },
      {
        itemName: "Bear spray",
        explanation:
          "Grand Teton is bear country, and this item keeps the official NPS bear-safety source visible.",
        sourceLabels: ["official"],
      },
      {
        itemName: "Rain shell",
        explanation:
          "The saved forecast context includes rain risk, so weather protection stays visible.",
        sourceLabels: ["forecast-based"],
      },
      {
        itemName: "Sun protection",
        explanation:
          "The saved forecast context includes sun exposure, so sunscreen or a hat remains useful.",
        sourceLabels: ["forecast-based", "inferred"],
      },
      {
        itemName: "Insect repellent",
        explanation:
          "The saved June date falls in the regional mosquito and tick window described by NPS guidance.",
        sourceLabels: ["official", "inferred"],
      },
      {
        itemName: "First-aid basics",
        explanation:
          "The rule-based list keeps a basic first-aid item for a longer day hike.",
        sourceLabels: ["supported-profile", "inferred"],
      },
      {
        itemName: "Offline map",
        explanation:
          "The rule engine keeps navigation as an inferred backup for mountain areas.",
        sourceLabels: ["inferred"],
      },
      {
        itemName: "Trekking poles",
        explanation:
          "The supported trail profile includes enough elevation gain for poles to be useful on descent.",
        sourceLabels: ["supported-profile", "inferred"],
      },
      {
        itemName: "Light jacket or warm layer",
        explanation:
          "The supported profile reaches mountain elevation where temperatures can feel cooler.",
        sourceLabels: ["supported-profile", "inferred"],
      },
    ],
  };
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
      sourceLabels: ["official"],
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
    expect(result.validationReasons).toEqual([]);
  });
});
