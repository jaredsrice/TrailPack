import type { PreparedTrail } from "./trail-onboarding";
import type { PublicRouteComparison, TrailAccessRoute, TrailProfile } from "../types";

export type CatalogEntry = Omit<PreparedTrail, "snapshot" | "integrityPolicy"> &
  Partial<Pick<PreparedTrail, "snapshot" | "integrityPolicy">>;

export interface MixedAccessDefinition {
  schemaVersion: 1;
  groupId: string;
  walkingRouteId: string;
  shuttleRouteId: string;
  checkedAt: string;
  reviewedParents: {
    walkingDistanceMiles: number;
    walkingGainFeet: number;
    shuttleDistanceMiles: number;
    shuttleGainFeet: number;
  };
  distanceMiles: number;
  mappedDistanceMiles: number;
  sourceRecordIds: string[];
  distanceNote: string;
  transportSource: { sourceUrl: string; checkedAt: string; note: string };
  comparison: PublicRouteComparison;
  options: Array<{
    id: string;
    name: string;
    label: string;
    transport: "shuttle-out-walk-back" | "walk-out-shuttle-back";
    start: string;
    returnPlan: string;
  }>;
}

/** Reviewed land itineraries, not fabricated official NPS snapshots. */
export function compileMixedAccessRoutes(
  definition: MixedAccessDefinition,
  parents: Readonly<Record<string, PreparedTrail>>,
): Record<string, CatalogEntry> {
  const fail = (message: string): never => { throw new Error(`Mixed access route ${definition.groupId}: ${message}`); };
  const walk = parents[definition.walkingRouteId];
  const shuttle = parents[definition.shuttleRouteId];
  if (definition.schemaVersion !== 1 || !walk || !shuttle || walk === shuttle) fail("two admitted parent routes are required.");
  const w = walk.profile, s = shuttle.profile;
  if (w.accessRoute?.groupId !== definition.groupId || s.accessRoute?.groupId !== definition.groupId ||
      w.accessRoute?.transport !== "none" || s.accessRoute?.transport !== "round-trip-shuttle" ||
      w.park !== s.park || w.state !== s.state || w.npsSourceUrl !== s.npsSourceUrl ||
      w.routeType !== "out-and-back" || s.routeType !== "out-and-back") fail("parents must be matching walking and shuttle out-and-back approaches.");
  if (w.distanceMiles.computedSource !== "USGS" || !w.distanceMiles.computedSourceUrl ||
      s.distanceMiles.computedSourceUrl !== w.distanceMiles.computedSourceUrl || !w.coordinates || !s.coordinates) {
    fail("parents need the same USGS comparison source and reviewed start coordinates.");
  }
  const reviewed = definition.reviewedParents;
  if (w.distanceMiles.value !== reviewed.walkingDistanceMiles || w.elevationGainFeet.value !== reviewed.walkingGainFeet ||
      s.distanceMiles.value !== reviewed.shuttleDistanceMiles || s.elevationGainFeet.value !== reviewed.shuttleGainFeet) {
    fail("NPS parent facts changed; re-review the mixed itinerary evidence before publishing.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(definition.checkedAt) || !definition.distanceNote.trim() ||
      !Number.isFinite(definition.mappedDistanceMiles) || definition.mappedDistanceMiles <= 0 ||
      definition.distanceMiles !== Math.round(definition.mappedDistanceMiles * 10) / 10 ||
      !definition.sourceRecordIds.length || new Set(definition.sourceRecordIds).size !== definition.sourceRecordIds.length) {
    fail("retain dated, positive mapped mileage and unique source segment IDs.");
  }
  if (definition.transportSource.sourceUrl !== "https://www.nps.gov/places/jenny-lake-west-shore-boat-dock.htm" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(definition.transportSource.checkedAt) || !definition.transportSource.note.trim() ||
      definition.comparison.source !== "AllTrails" || definition.comparison.relationship !== "related" ||
      !definition.comparison.sourceUrl.startsWith("https://www.alltrails.com/trail/") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(definition.comparison.checkedAt) || !definition.comparison.summary.trim()) {
    fail("retain reviewed transport and related-route comparison evidence.");
  }
  const knownSegments = new Set([...w.sourceRecords, ...s.sourceRecords].flatMap((record) => record.sourceRecordIds ?? []));
  if (definition.sourceRecordIds.some((id) => !knownSegments.has(id))) fail("segment is absent from the reviewed parents.");
  if (definition.options.length !== 2 || new Set(definition.options.map((option) => option.transport)).size !== 2) fail("both directional mixed options are required.");
  const entries: Record<string, CatalogEntry> = {};
  const names = new Set(Object.values(parents).map((entry) => entry.profile.name.toLowerCase()));
  for (const option of definition.options) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(option.id) || option.id.length > 80 ||
        Object.hasOwn(parents, option.id) || Object.hasOwn(entries, option.id) || names.has(option.name.toLowerCase()) ||
        ![option.name, option.label, option.start, option.returnPlan].every((value) => value.trim().length > 0) ||
        !["shuttle-out-walk-back", "walk-out-shuttle-back"].includes(option.transport)) fail("invalid or duplicate mixed option.");
    const boatOut = option.transport === "shuttle-out-walk-back";
    const startProfile = boatOut ? s : w;
    const sourceUrl = w.distanceMiles.computedSourceUrl!;
    const profile: TrailProfile = {
      ...startProfile,
      id: option.id,
      name: option.name,
      retrievedAt: definition.checkedAt,
      accessRoute: {
        groupId: definition.groupId, groupName: w.accessRoute!.groupName,
        label: option.label, start: option.start, returnPlan: option.returnPlan,
        distanceScope: "One-way hiking via the viewpoint plus one boat crossing completes the trip. Hiking estimate excludes the optional Hidden Falls spur, boat travel and parking/dock connectors.",
        transport: option.transport,
        comparison: { ...definition.comparison },
      },
      routeCalculation: {
        officialFacts: `NPS publishes separate ${w.distanceMiles.value}-mile walking and ${s.distanceMiles.value}-mile round-trip shuttle hikes to Inspiration Point. NPS also documents that the Jenny Lake shuttle can be ridden one way in either direction.`,
        method: `TrailPack adds one mapped South Jenny Lake walking leg to one mapped west-dock leg, joining them at Inspiration Point. The retained USGS segments total ${definition.mappedDistanceMiles.toFixed(3)} miles and are rounded to about ${definition.distanceMiles.toFixed(1)} miles for planning.`,
        exclusions: "The hiking total excludes the boat crossing, parking-to-dock connectors, the approximately 49 m dock-to-land-geometry gap, and the optional Hidden Falls spur.",
        limitations: "NPS does not publish either mixed itinerary as a complete route. Elevation gain remains unknown because the retained geometry is two-dimensional. Duration and difficulty are planning estimates based on the published parent routes, not NPS ratings for the mixed route.",
        officialSourceUrl: w.npsSourceUrl,
        transportSourceUrl: definition.transportSource.sourceUrl,
        geometrySourceUrl: sourceUrl,
      },
      planningNote: "Mixed-route mileage is estimated. Elevation gain is unverified; it is not zero. The 2–4 hour NPS page-wide range is only a planning guide here. Allow extra time for the boat, queues and dock access; enter your expected time out for better packing guidance.",
      distanceMiles: { value: definition.distanceMiles, source: "USGS", sourceUrl, label: "inferred", computedNote: definition.distanceNote },
      elevationGainFeet: { value: null, source: "trailpack", label: "unavailable" },
      estimatedDuration: { value: "2–4 hours + boat time (estimate)", source: "trailpack", label: "inferred", sourceUrl: w.npsSourceUrl },
      difficulty: { value: "Moderate (planning estimate)", source: "trailpack", label: "inferred", sourceUrl: w.npsSourceUrl },
      routeType: "point-to-point",
      // Parent accessibility text includes totals/slopes for a different itinerary.
      accessibility: undefined,
      sourceConfidence: {
        status: "derived_route_estimate", summary: definition.distanceNote + " No mixed-route elevation gain is published in the reviewed sources; 2D geometry cannot supply it. Parent NPS difficulty and duration are planning context, not ratings for this mixed itinerary.",
        distanceMatch: "unknown", gainMatch: "unknown", lastChecked: definition.checkedAt,
      },
      sourceRecords: [
        { source: "NPS", role: "official-profile", sourceUrl: w.npsSourceUrl, retrievedAt: definition.checkedAt, note: "Published walking and round-trip-shuttle approaches, not mixed-route totals." },
        { source: "NPS", role: "official-profile", sourceUrl: definition.transportSource.sourceUrl, retrievedAt: definition.transportSource.checkedAt, note: definition.transportSource.note },
        { source: "USGS", role: "geometry-comparison", sourceUrl, retrievedAt: definition.checkedAt, sourceRecordIds: [...definition.sourceRecordIds], note: definition.distanceNote },
        ...startProfile.sourceRecords.filter((record) => record.note?.includes("forecast reference")),
      ],
      missingFields: ["elevationGainFeet", "accessibility"],
    };
    entries[option.id] = {
      profile,
      photo: { ...shuttle.photo, id: option.id + "-photo", locationName: option.name },
      demo: {
        weather: { ...shuttle.demo.weather, summary: "No saved forecast for " + option.name + ". Check live weather before leaving." },
        alerts: { ...shuttle.demo.alerts },
      },
    };
    names.add(option.name.toLowerCase());
  }
  return entries;
}

export function buildAccessRouteCatalog(
  parents: Readonly<Record<string, PreparedTrail>>,
  definitions: readonly MixedAccessDefinition[],
): Record<string, CatalogEntry> {
  const entries: Record<string, CatalogEntry> = { ...parents };
  const names = new Set(Object.values(parents).map((entry) => entry.profile.name.toLowerCase()));
  for (const definition of definitions) {
    for (const [id, entry] of Object.entries(compileMixedAccessRoutes(definition, parents))) {
      if (Object.hasOwn(entries, id) || names.has(entry.profile.name.toLowerCase())) throw new Error(`Duplicate mixed route identity: ${id}.`);
      entries[id] = entry;
      names.add(entry.profile.name.toLowerCase());
    }
  }
  return entries;
}

export const SHUTTLE_HOURS_URL = "https://jennylakeboating.com/boat-trips/shuttle-service/";

/** Shared by the selected itinerary and its saved packing item. */
export function transportReminder(transport?: TrailAccessRoute["transport"]): string | null {
  switch (transport) {
    case "round-trip-shuttle": return "Boat required both ways. Confirm seasonal service and the last return boat; a missed boat means a longer walk that this list does not cover.";
    case "shuttle-out-walk-back": return "Boat required outbound only. Confirm it is operating before crossing. Your planned return is on foot via the south lakeshore; no return boat is needed.";
    case "walk-out-shuttle-back": return "Return boat required. Check seasonal service and the last west-dock departure before setting off. A missed or cancelled boat adds walking beyond this itinerary; choose the full walking option and regenerate if your plan changes.";
    default: return null;
  }
}
