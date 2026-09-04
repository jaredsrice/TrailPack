import type { TrailDraft, PreparedTrail } from "./trail-onboarding";
import type { SupportedPark } from "../data/supported-trails";
import type { SourceConfidence, TrailProfile } from "../types";
import type { NpsIntegrityFieldName } from "./nps-source-integrity";
import type { NpsSourceSnapshot } from "../data/nps-source-snapshots";

type DistanceMatch = TrailDraft["comparison"]["distanceMatch"];

/** Approved template metadata; official values have one managed snapshot source. */
export type TrailDefinition = Omit<TrailDraft, "official"> & {
  profileKind: TrailProfile["profileKind"];
  official: Pick<TrailDraft["official"], "sourceUrl" | "additionalSources">;
};

export function resolveTrailDefinition(definition: TrailDefinition, snapshots: Readonly<Record<string, NpsSourceSnapshot>>): TrailDraft {
  const { profileKind, official, ...metadata } = definition;
  if (!["curated", "public-source-import"].includes(profileKind)) {
    throw new Error("Invalid catalog group for " + definition.trail.id + ".");
  }
  for (const key of Object.keys(official)) {
    if (!["sourceUrl", "additionalSources"].includes(key)) {
      throw new Error("Unexpected official." + key + "; keep official facts only in the managed NPS snapshot.");
    }
  }
  const snapshot = snapshots[definition.trail.id];
  if (!snapshot) throw new Error("Missing managed NPS snapshot for " + definition.trail.id + ".");
  if (snapshot.sourceUrl !== definition.official.sourceUrl) {
    throw new Error("NPS snapshot URL does not match " + definition.trail.id + ".");
  }
  if (snapshot.routeType === "unknown") {
    throw new Error("Review the official route type before admitting " + definition.trail.id + ".");
  }
  return {
    ...metadata,
    official: { ...snapshot, routeType: snapshot.routeType, accessibility: snapshot.accessibility ?? null, additionalSources: official.additionalSources },
  };
}

export function defineTrail(draft: TrailDraft, profileKind: TrailProfile["profileKind"] = "public-source-import"): TrailDefinition {
  return { ...draft, profileKind, official: { sourceUrl: draft.official.sourceUrl, additionalSources: draft.official.additionalSources } };
}

export const TRAIL_SOURCE_FIELDS: NpsIntegrityFieldName[] = [
  "distanceMiles", "elevationGainFeet", "estimatedDuration",
  "difficulty", "routeType", "accessibility",
];

export function compileTrail(draft: TrailDraft, park: Pick<SupportedPark, "name" | "state">, profileKind: TrailProfile["profileKind"] = "public-source-import"): PreparedTrail {
  const { trail, official, comparison } = draft;
  const sourced = <T>(value: T) => ({
    value, source: "NPS" as const, sourceUrl: official.sourceUrl, label: "official" as const,
  });
  const statuses: Record<DistanceMatch, SourceConfidence["status"]> = {
    ok: "official_nps_with_usgs_geometry_ok",
    strong_bridge: "official_nps_with_strong_usgs_bridge",
    moderate_bridge: "official_nps_with_moderate_usgs_bridge",
  };
  const profile: TrailProfile = {
    id: trail.id,
    name: trail.name,
    park: park.name,
    state: park.state,
    profileKind,
    retrievalStatus: "saved-fixture",
    retrievedAt: official.checkedAt,
    coordinates: { ...trail.coordinates },
    distanceMiles: {
      ...sourced(official.distanceMiles),
      computedValue: comparison.distanceMiles,
      computedSource: "USGS",
      computedSourceUrl: comparison.sourceUrl,
      computedNote: comparison.note,
    },
    elevationGainFeet: {
      ...sourced(official.elevationGainFeet),
      ...(comparison.elevationGainFeet === null ? {} : {
        computedValue: comparison.elevationGainFeet,
        computedSource: "USGS" as const,
        computedSourceUrl: comparison.elevationSourceUrl ?? comparison.sourceUrl,
      }),
      ...(comparison.gainNote === null ? {} : { computedNote: comparison.gainNote }),
    },
    estimatedDuration: sourced(official.estimatedDuration),
    difficulty: sourced(official.difficulty),
    routeType: official.routeType,
    ...(comparison.elevationRangeFeet ? {
      elevationMinFeet: comparison.elevationRangeFeet.min,
      elevationMaxFeet: comparison.elevationRangeFeet.max,
    } : {}),
    ...(official.accessibility === null ? {} : { accessibility: sourced(official.accessibility) }),
    sourceConfidence: {
      status: comparison.gainMatch === "conflict" ? "official_nps_with_gain_conflict" : statuses[comparison.distanceMatch],
      summary: "NPS values remain authoritative. " + comparison.note + (comparison.gainNote ? " " + comparison.gainNote : ""),
      distanceMatch: comparison.distanceMatch,
      gainMatch: comparison.gainMatch,
      lastChecked: official.checkedAt,
    },
    npsSourceUrl: official.sourceUrl,
    sourceRecords: [
      { source: "NPS", role: "official-profile", sourceUrl: official.sourceUrl, retrievedAt: official.checkedAt },
      ...official.additionalSources.map((source) => ({
        source: "NPS" as const, role: "official-profile" as const,
        sourceUrl: source.sourceUrl, retrievedAt: source.checkedAt, note: source.note,
      })),
      { source: "USGS", role: "geometry-comparison", sourceUrl: comparison.sourceUrl,
        retrievedAt: comparison.checkedAt,
        ...(comparison.sourceRecordIds.length ? { sourceRecordIds: [...comparison.sourceRecordIds] } : {}),
        note: comparison.note + (comparison.recordIdNote ? " " + comparison.recordIdNote : "") },
      { source: new URL(trail.coordinateSourceUrl).hostname.endsWith("nps.gov") ? "NPS" : "USGS",
        role: "geometry-comparison", sourceUrl: trail.coordinateSourceUrl,
        retrievedAt: trail.coordinateCheckedAt,
        note: trail.coordinateNote },
    ],
    missingFields: official.accessibility === null ? ["accessibility"] : [],
  };
  return {
    profile,
    snapshot: {
      sourceUrl: official.sourceUrl, checkedAt: official.checkedAt,
      distanceMiles: official.distanceMiles, elevationGainFeet: official.elevationGainFeet,
      estimatedDuration: official.estimatedDuration, difficulty: official.difficulty,
      routeType: official.routeType,
      ...(official.accessibility === null ? {} : { accessibility: official.accessibility }),
    },
    photo: {
      id: trail.id + "-photo", src: draft.photo.src, parkName: park.name,
      locationName: draft.photo.locationName, alt: draft.photo.alt, credit: draft.photo.credit,
      sourceUrl: draft.photo.sourceUrl, focalPoint: { ...draft.photo.focalPoint },
    },
    integrityPolicy: {
      aliases: [...draft.sourceCheck.aliases],
      checkedFields: TRAIL_SOURCE_FIELDS.filter((field) => field !== "routeType" || draft.sourceCheck.skipRouteTypeReason === null),
    },
    demo: {
      weather: {
        summary: "No saved forecast for " + trail.name + ". Check live weather before leaving.",
        conditions: [], source: "trailpack", label: "unavailable", retrievalStatus: "unavailable",
        statusReason: "No weather is assumed from this trail's onboarding data.",
      },
      alerts: {
        hasActiveAlerts: false, alerts: [], label: "unavailable", retrievalStatus: "unavailable",
        statusReason: "No saved live-alert evidence. Check current official NPS alerts before leaving.",
      },
    },
  };
}
