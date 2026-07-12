import type { AiReviewDraft } from "@/features/trailpack/lib/ai-contract";

const JENNY_LAKE_REVIEW_FIXTURE: AiReviewDraft = {
  tripSummary:
    "Jenny Lake Loop is a longer Grand Teton day hike with forecast-based rain and sun signals, so the rule-based list emphasizes steady hydration, weather protection, bear safety, and basic mountain-hike backups.",
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
        "Grand Teton is bear country, so this item keeps official NPS bear-safety guidance visible while TrailPack adds group-sizing guidance.",
      sourceLabels: ["official", "inferred"],
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
        "NPS Hike Smart supports repellent for mosquitoes and ticks, while TrailPack treats the saved June date as inferred seasonal context.",
      sourceLabels: ["official", "inferred"],
    },
    {
      itemName: "Extra dry socks",
      explanation:
        "The forecast context includes wet weather, so a dry sock backup is useful for blister prevention.",
      sourceLabels: ["inferred"],
    },
    {
      itemName: "First-aid basics",
      explanation:
        "The rule-based list keeps a basic first-aid item for a longer day hike.",
      sourceLabels: ["supported-profile", "inferred"],
    },
    {
      itemName: "Navigation / offline map",
      explanation:
        "NPS Ten Essentials support carrying map, compass, or GPS navigation with offline access and battery backup.",
      sourceLabels: ["official", "inferred"],
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

const AI_REVIEW_FIXTURES: Record<string, AiReviewDraft> = {
  "jenny-lake-loop": JENNY_LAKE_REVIEW_FIXTURE,
};

export function getSavedAiReviewFixture(trailId: string): AiReviewDraft | null {
  return AI_REVIEW_FIXTURES[trailId] ?? null;
}
