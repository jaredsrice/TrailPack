import type { RouteType } from "@/features/trailpack/types";
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
