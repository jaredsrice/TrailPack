import type { RouteType, TrailProfile } from "@/features/trailpack/types";
import rawSnapshots from "./nps-source-snapshots.json";

export interface NpsSourceSnapshot {
  sourceUrl: string;
  checkedAt: string;
  distanceMiles: number;
  elevationGainFeet: number;
  estimatedDuration: string;
  difficulty: string;
  routeType: RouteType;
  accessibility?: string;
}

export interface NpsSourceSnapshotDocument {
  schemaVersion: 1;
  updatedAt: string;
  trails: Record<string, NpsSourceSnapshot>;
}

export const NPS_SOURCE_SNAPSHOTS =
  rawSnapshots as unknown as NpsSourceSnapshotDocument;

export function applyNpsSourceSnapshot(profile: TrailProfile): TrailProfile {
  const snapshot = NPS_SOURCE_SNAPSHOTS.trails[profile.id];
  if (!snapshot) {
    throw new Error(`Missing managed NPS snapshot for ${profile.id}.`);
  }
  if (snapshot.sourceUrl !== profile.npsSourceUrl) {
    throw new Error(`NPS snapshot URL does not match ${profile.id}.`);
  }

  return {
    ...profile,
    retrievedAt: snapshot.checkedAt,
    distanceMiles: {
      ...profile.distanceMiles,
      value: snapshot.distanceMiles,
    },
    elevationGainFeet: {
      ...profile.elevationGainFeet,
      value: snapshot.elevationGainFeet,
    },
    estimatedDuration: {
      ...profile.estimatedDuration,
      value: snapshot.estimatedDuration,
    },
    difficulty: {
      ...profile.difficulty,
      value: snapshot.difficulty,
    },
    routeType: snapshot.routeType,
    accessibility: snapshot.accessibility
      ? {
          value: snapshot.accessibility,
          source: "NPS",
          sourceUrl: snapshot.sourceUrl,
          label: "official",
        }
      : undefined,
    sourceConfidence: {
      ...profile.sourceConfidence,
      lastChecked: snapshot.checkedAt,
    },
    sourceRecords: profile.sourceRecords.map((record) =>
      record.source === "NPS" && record.sourceUrl === snapshot.sourceUrl
        ? { ...record, retrievedAt: snapshot.checkedAt }
        : record,
    ),
  };
}
