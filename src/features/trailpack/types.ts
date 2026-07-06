export type SourceLabel =
  | "supported-profile"
  | "user-provided"
  | "forecast-based"
  | "official"
  | "inferred"
  | "missing"
  | "unavailable"
  | "future-work";

export type DataSource = "NPS" | "USGS" | "user" | "open-meteo" | "trailpack";

export type RetrievalStatus = "live" | "saved-fixture" | "unavailable";

export type ConfidenceStatus =
  | "official_nps_with_usgs_geometry_ok"
  | "official_nps_with_strong_usgs_bridge"
  | "official_nps_with_moderate_usgs_bridge"
  | "official_nps_with_gain_conflict"
  | "need_to_fill";

export type RouteType = "loop" | "out-and-back" | "point-to-point" | "unknown";

export interface SourcedValue<T> {
  value: T;
  source: DataSource;
  sourceUrl?: string;
  label: SourceLabel;
  computedValue?: T;
  computedSource?: DataSource;
  computedSourceUrl?: string;
  /**
   * Human-readable note for a computed value, e.g. an estimate range. Used when
   * the computed (USGS) value should not be presented as a single exact match to
   * the official (NPS) value.
   */
  computedNote?: string;
}

export interface SourceConfidence {
  status: ConfidenceStatus;
  summary: string;
  distanceMatch: "ok" | "strong_bridge" | "moderate_bridge" | "conflict" | "unknown";
  gainMatch: "ok" | "strong_bridge" | "moderate_bridge" | "conflict" | "unknown";
  lastChecked: string;
}

export interface TrailProfile {
  id: string;
  name: string;
  park: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceMiles: SourcedValue<number>;
  elevationGainFeet: SourcedValue<number>;
  estimatedDuration: SourcedValue<string>;
  difficulty: SourcedValue<string>;
  routeType: RouteType;
  elevationMinFeet?: number;
  elevationMaxFeet?: number;
  sourceConfidence: SourceConfidence;
  npsSourceUrl: string;
}

export interface WeatherContext {
  plannedDate?: string;
  summary: string;
  temperatureF?: {
    high?: number;
    low?: number;
    current?: number;
  };
  precipitationChance?: number;
  windMph?: number;
  conditions: Array<"heat" | "cold" | "rain" | "wind" | "snow" | "sun">;
  source: DataSource;
  label: SourceLabel;
  retrievalStatus?: RetrievalStatus;
  statusReason?: string;
}

export interface AlertContext {
  hasActiveAlerts: boolean;
  alerts: Array<{
    title: string;
    description: string;
    severity?: "info" | "caution" | "closure";
    source: DataSource;
    sourceUrl?: string;
  }>;
  label: SourceLabel;
  retrievalStatus?: RetrievalStatus;
  statusReason?: string;
}

export interface PackingItem {
  name: string;
  reason: string;
  sourceLabels: SourceLabel[];
  /**
   * Official source URL backing this item. Required for any item that carries an
   * "official" label so provenance can be displayed to the user.
   */
  sourceUrl?: string;
}

export interface PackingRecommendation {
  trailId: string;
  trailName: string;
  generatedAt: string;
  essential: PackingItem[];
  optional: PackingItem[];
  missingDetails: string[];
  confidenceNote: string;
}
