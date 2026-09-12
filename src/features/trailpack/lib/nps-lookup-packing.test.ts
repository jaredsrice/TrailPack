import { expect, it } from "vitest";
import { normalizeNpsLookup } from "./nps-lookup";
import { generateLookupRecommendation, seedLookupInput } from "./nps-lookup-packing";
import { generateManualEntryRecommendation } from "./packing";
const trail = normalizeNpsLookup({ data: [{
  id: "6E21CE5C-45E4-4B66-9445-8764E89BCEC5", title: "Fairyland Loop",
  url: "https://www.nps.gov/thingstodo/fairyland-loop.htm",
  relatedParks: [{ parkCode: "brca", fullName: "Bryce Canyon National Park", states: "UT" }],
  activities: [{ name: "Hiking" }], duration: "4-5 Hours",
}] }, { q: "Fairyland", parkCode: "brca" })![0];
it("uses NPS's upper duration without inventing other facts and improves packing", () => {
  const input = seedLookupInput(trail);
  expect(input).toEqual({ expectedDuration: "5 hours" });
  const result = generateLookupRecommendation(trail, input, "nps");
  const baseline = generateManualEntryRecommendation({});
  expect(result.essential.find((item) => item.name === "Water")?.recommendation)
    .not.toBe(baseline.essential.find((item) => item.name === "Water")?.recommendation);
  const water = result.essential.find((item) => item.name === "Water")!;
  expect(water.sourceLabels).toContain("official");
  expect(water.sourceLabels).not.toContain("user-provided");
  expect(water.links).toContainEqual({ label: "NPS duration source", url: trail.sourceUrl });
  expect(result.confidenceNote).toContain("not retrieved");
  expect(result.missingDetails.some((detail) => detail.includes("distance"))).toBe(true);
});
it("does not label an edited duration or entered distance as an NPS fact", () => {
  const result = generateLookupRecommendation(trail, { expectedDuration: "8 hours", distanceMiles: "10" }, "user-provided");
  expect(result.confidenceNote).toContain("User-provided");
  const water = result.essential.find((item) => item.name === "Water")!;
  expect(water.sourceLabels).toContain("user-provided");
  expect(water.links ?? []).not.toContainEqual({ label: "NPS duration source", url: trail.sourceUrl });
  expect(trail.distanceMiles).toBeNull();
});
