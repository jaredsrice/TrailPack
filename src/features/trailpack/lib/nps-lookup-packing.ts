import type { PackingItem } from "../types";
import type { NpsLookupTrail } from "./nps-lookup";
import { generateManualEntryRecommendation, type UserHikeInput } from "./packing";

export function seedLookupInput(trail: NpsLookupTrail): UserHikeInput {
  return { expectedDuration: `${trail.durationHours} hours` };
}
export type LookupDurationSource = "nps" | "user-provided";

export function generateLookupRecommendation(trail: NpsLookupTrail, input: UserHikeInput, durationSource: LookupDurationSource) {
  const recommendation = generateManualEntryRecommendation(input);
  const usingSourceDuration = durationSource === "nps" && input.expectedDuration === seedLookupInput(trail).expectedDuration;
  const withoutDuration = generateManualEntryRecommendation({ ...input, expectedDuration: undefined });
  const sourceNote = `NPS lists ${trail.duration}; TrailPack uses its upper duration of ${trail.durationHours} hours. This is a planning estimate, not a completion guarantee.`;
  const annotate = (item: PackingItem): PackingItem => {
    const previous = [...withoutDuration.essential, ...withoutDuration.optional].find((entry) => entry.name === item.name);
    if (!usingSourceDuration || JSON.stringify(previous) === JSON.stringify(item)) return item;
    const hasOtherInputs = Boolean(input.distanceMiles || input.elevationGainFeet ||
      input.trailConditions || input.startTime || input.plannedDate);
    return {
      ...item,
      sourceLabels: Array.from(new Set([
        ...item.sourceLabels.filter((label) => label !== "user-provided" || hasOtherInputs),
        "official" as const,
      ])),
      sourceUrl: item.sourceUrl ?? trail.sourceUrl,
      links: [...(item.links ?? []), { label: "NPS duration source", url: trail.sourceUrl }],
      contextNotes: [...(item.contextNotes ?? []), { label: "NPS duration input", text: sourceNote }],
    };
  };
  return {
    ...recommendation,
    trailId: `nps-lookup:${trail.id}`,
    trailName: trail.title,
    essential: recommendation.essential.map(annotate),
    optional: recommendation.optional.map(annotate),
    confidenceNote: `Partial live NPS hiking record for ${trail.park}. ` +
      (usingSourceDuration ? sourceNote : "User-provided time out replaces the NPS duration for this list.") +
      " Distance, elevation, and route type are not verified by this lookup. Any added details are user-provided. Weather, daylight, and alerts were not retrieved. Check official conditions before leaving.",
  };
}
