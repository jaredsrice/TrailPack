import { describe, expect, it } from "vitest";
import example from "../../../../templates/trails/colter-bay.example.json";
import template from "../../../../templates/trails/trail.template.json";
import { SUPPORTED_PARKS, TRAIL_CATALOG } from "../data/supported-trails";
import { generatePackingRecommendation } from "./packing";
import { checkTrailDraft, type TrailDraft, type TrailDraftOptions } from "./trail-onboarding";

const options: TrailDraftOptions = {
  parks: SUPPORTED_PARKS,
  existingTrails: TRAIL_CATALOG,
  today: "2026-09-02",
};

function newDraft(): TrailDraft {
  const draft = structuredClone(example) as TrailDraft;
  draft.trail.id = "onboarding-test-loop";
  draft.trail.name = "Onboarding Test Loop";
  draft.sourceCheck.aliases = ["Onboarding Test Loop"];
  return draft;
}

function changed(field: string, value: unknown): unknown {
  const draft = newDraft() as unknown as Record<string, unknown>;
  const keys = field.split(".");
  let target = draft;
  for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[keys.at(-1)!] = value;
  return draft;
}

describe("trail onboarding interface", () => {
  it("keeps the blank template incomplete instead of inventing trail facts", () => {
    expect(template.official.distanceMiles).toBeNull();
    expect(template.trail.coordinates.lat).toBeNull();
    const result = checkTrailDraft(template, options);
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "official.distanceMiles" }),
      expect.objectContaining({ field: "trail.coordinates.lat" }),
      expect.objectContaining({ field: "photo.focalPoint.mobile" }),
    ]));
  });

  it("checks the documented example in explicit existing-trail mode", () => {
    const result = checkTrailDraft(example, { ...options, allowExisting: true });
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    const current = TRAIL_CATALOG["colter-bay-lakeshore-trail"];
    expect(result.prepared.profile.distanceMiles.value).toBe(example.official.distanceMiles);
    expect(result.prepared.profile.distanceMiles.source).toBe(current.distanceMiles.source);
    expect(result.prepared.profile.sourceConfidence.distanceMatch).toBe(current.sourceConfidence.distanceMatch);
    expect(result.prepared.profile.sourceRecords.find((record) => record.sourceRecordIds)?.sourceRecordIds)
      .toEqual(current.sourceRecords.find((record) => record.sourceRecordIds)?.sourceRecordIds);
  });

  it("prepares coordinated entries without mutating the draft or catalog", () => {
    const draft = newDraft();
    const before = structuredClone(draft);
    const catalogIds = Object.keys(TRAIL_CATALOG);
    const result = checkTrailDraft(draft, options);
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    const { profile, snapshot, photo, integrityPolicy, demo } = result.prepared;
    expect(profile.distanceMiles.value).toBe(snapshot.distanceMiles);
    expect(profile.distanceMiles.computedValue).toBe(draft.comparison.distanceMiles);
    expect(profile.npsSourceUrl).toBe(snapshot.sourceUrl);
    expect(profile.retrievedAt).toBe(snapshot.checkedAt);
    expect(photo.id).toBe(draft.trail.id + "-photo");
    expect(photo.focalPoint).toEqual(draft.photo.focalPoint);
    expect(profile.missingFields).toContain("accessibility");
    expect(integrityPolicy.aliases).toEqual(draft.sourceCheck.aliases);
    expect(integrityPolicy.checkedFields).not.toContain("routeType");
    expect(demo.weather).toMatchObject({ conditions: [], label: "unavailable", retrievalStatus: "unavailable" });
    expect(demo.alerts).toMatchObject({ alerts: [], label: "unavailable", retrievalStatus: "unavailable" });
    const packing = generatePackingRecommendation(profile, demo.weather, demo.alerts, {});
    expect(packing.essential.length).toBeGreaterThan(0);
    expect(packing.trailId).toBe(draft.trail.id);
    expect(draft).toEqual(before);
    expect(Object.keys(TRAIL_CATALOG)).toEqual(catalogIds);
    expect(TRAIL_CATALOG[draft.trail.id]).toBeUndefined();
  });

  it("keeps route-type checking on unless a reviewed exception is given", () => {
    const draft = newDraft();
    draft.sourceCheck.skipRouteTypeReason = null;
    const result = checkTrailDraft(draft, options);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.prepared.integrityPolicy.checkedFields).toContain("routeType");
  });

  it.each([
    ["https://nps.gov/trail", "NPS"],
    ["https://www.nps.gov/trail", "NPS"],
    ["https://www.usgs.gov/trail", "USGS"],
    ["https://carto.nationalmap.gov/trail", "USGS"],
  ])("labels coordinate evidence from the validated host %s", (sourceUrl, source) => {
    const draft = newDraft();
    draft.trail.coordinateSourceUrl = sourceUrl;
    const result = checkTrailDraft(draft, options);
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    expect(result.prepared.profile.sourceRecords.at(-1)).toMatchObject({ source, sourceUrl });
  });

  it("retains a sourced accessibility block when one is available", () => {
    const draft = newDraft();
    draft.official.accessibility = "The trail has a narrow dirt surface and exposed roots.";
    const result = checkTrailDraft(draft, options);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prepared.profile.accessibility).toMatchObject({
      value: draft.official.accessibility, source: "NPS", label: "official",
    });
    expect(result.prepared.snapshot.accessibility).toBe(draft.official.accessibility);
    expect(result.prepared.profile.missingFields).toEqual([]);
  });

  it("preserves official-source conflicts without substituting a computed value", () => {
    const draft = newDraft();
    draft.comparison.gainMatch = "conflict";
    draft.comparison.gainNote = "A second NPS page lists a different gain; retain the primary page's value and flag the conflict.";
    draft.official.additionalSources.push({
      sourceUrl: "https://www.nps.gov/grte/planyourvisit/hike.htm",
      checkedAt: "2026-08-03",
      note: "Test evidence for a conflicting official elevation value.",
    });
    const result = checkTrailDraft(draft, options);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prepared.profile.elevationGainFeet.value).toBe(draft.official.elevationGainFeet);
    expect(result.prepared.profile.elevationGainFeet.computedValue).toBeUndefined();
    expect(result.prepared.profile.sourceConfidence.status).toBe("official_nps_with_gain_conflict");
    expect(result.prepared.profile.sourceRecords).toContainEqual(expect.objectContaining({
      sourceUrl: draft.official.additionalSources[0].sourceUrl,
    }));
  });

  it("keeps a conflicting computed gain separate and explained", () => {
    const draft = newDraft();
    draft.comparison.elevationGainFeet = 145;
    draft.comparison.gainMatch = "conflict";
    draft.comparison.gainNote = "USGS computed estimate differs from the official NPS gain.";
    const result = checkTrailDraft(draft, options);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prepared.profile.elevationGainFeet).toMatchObject({
      value: 100, source: "NPS", computedValue: 145, computedSource: "USGS",
      computedNote: draft.comparison.gainNote,
    });
  });

  it("blocks duplicate identities and does not let --existing admit a new one", () => {
    expect(checkTrailDraft(example, options).issues).toContainEqual(expect.objectContaining({ field: "trail.id" }));
    const duplicateName = newDraft();
    duplicateName.trail.name = "  Colter Bay   Lakeshore Trail ";
    expect(checkTrailDraft(duplicateName, options).issues).toContainEqual(expect.objectContaining({ field: "trail.name" }));
    expect(checkTrailDraft(newDraft(), { ...options, allowExisting: true }).issues)
      .toContainEqual(expect.objectContaining({ field: "trail.id" }));
  });

  it("does not mistake an object prototype property for a registered trail", () => {
    const draft = newDraft();
    draft.trail.id = "constructor";
    expect(checkTrailDraft(draft, options).ok).toBe(true);
  });

  it("calls out a large distance mismatch for manual route reconciliation", () => {
    const draft = newDraft();
    draft.comparison.distanceMiles = 4.5;
    const result = checkTrailDraft(draft, options);
    expect(result.warnings.join(" ")).toContain("more than 15%");
  });

  it.each([null, [], 42, "not an object"])("reports malformed root input %s without throwing", (input) => {
    expect(() => checkTrailDraft(input, options)).not.toThrow();
    expect(checkTrailDraft(input, options).ok).toBe(false);
  });

  const invalidFields: Array<[string, unknown]> = [
    ["schemaVersion", 2],
    ["trail.id", "../../outside"],
    ["trail.id", "Upper Case"],
    ["trail.parkId", "yellowstone"],
    ["trail.coordinates.lat", -110.5],
    ["trail.coordinates.lng", 181],
    ["trail.coordinates.lat", "43.9"],
    ["trail.coordinates.lat", Number.NaN],
    ["trail.coordinateSourceUrl", "https://nps.gov.attacker.test/trail"],
    ["trail.coordinateSourceUrl", "https://attacker-nps.gov/trail"],
    ["trail.coordinateSourceUrl", "https://notnps.gov/trail"],
    ["trail.coordinateNote", ""],
    ["official.sourceUrl", "http://www.nps.gov/trail"],
    ["official.sourceUrl", "https://name:password@www.nps.gov/trail"],
    ["official.sourceUrl", "https://www.nps.gov:8443/trail"],
    ["official.sourceUrl", "https://www.alltrails.com/trail/example"],
    ["official.checkedAt", "2026-02-30"],
    ["official.checkedAt", "2027-01-01"],
    ["official.distanceMiles", null],
    ["official.distanceMiles", -1],
    ["official.distanceMiles", Number.POSITIVE_INFINITY],
    ["official.elevationGainFeet", 10.5],
    ["official.estimatedDuration", "easy afternoon"],
    ["official.estimatedDuration", "0 hours"],
    ["official.estimatedDuration", "4-2 hours"],
    ["official.routeType", "unknown"],
    ["official.accessibility", ""],
    ["official.additionalSources", null],
    ["comparison.sourceUrl", "https://usgs.gov.attacker.test/geometry"],
    ["comparison.sourceRecordIds", ["10", "10"]],
    ["comparison.distanceMatch", "unknown"],
    ["comparison.gainMatch", "ok"],
    ["comparison.gainMatch", "conflict"],
    ["comparison.note", "TODO"],
    ["photo.src", "/park-images/../private.jpg"],
    ["photo.src", "https://www.nps.gov/image.jpg"],
    ["photo.src", "/park-images/photo.png"],
    ["photo.permissionNote", ""],
    ["photo.focalPoint.mobile", "101% 50%"],
    ["photo.focalPoint.desktop", "center"],
    ["sourceCheck.aliases", ["Wrong Trail"]],
    ["sourceCheck.skipRouteTypeReason", ""],
  ];
  it.each(invalidFields)("explains invalid %s", (field, value) => {
    const result = checkTrailDraft(changed(field, value), options);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.field === field || issue.field.startsWith(field + ".") ||
      (field === "comparison.gainMatch" && issue.field.startsWith("comparison.")))).toBe(true);
  });

  it("rejects misspelled and unexpected fields rather than dropping their meaning", () => {
    const result = checkTrailDraft(changed("official.distanceMiels", 2.2), options);
    expect(result.issues).toContainEqual({
      field: "official.distanceMiels", message: "Unknown field; check its spelling against the template.",
    });
  });

  it("rejects incomplete nested objects and too many source records", () => {
    for (const field of ["trail.coordinates", "photo.focalPoint", "sourceCheck", "comparison"]) {
      expect(checkTrailDraft(changed(field, null), options).ok).toBe(false);
    }
    expect(checkTrailDraft(changed("comparison.sourceRecordIds", Array.from({ length: 101 }, (_, i) => String(i))), options).ok).toBe(false);
  });
});
