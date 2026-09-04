import { compileTrail, resolveTrailDefinition, type TrailDefinition } from "./trail-definition";
import type { DemoScenario } from "../data/demo-contexts";
import type { NpsSourceSnapshot } from "../data/nps-source-snapshots";
import type { ParkPhoto } from "../data/park-images";
import type { SupportedPark } from "../data/supported-trails";
import type { SourceConfidence, TrailProfile } from "../types";
import type { NpsIntegrityFieldName } from "./nps-source-integrity";

type DistanceMatch = "ok" | "strong_bridge" | "moderate_bridge";

/** Maintainer input only. A checked draft is not an approved catalog trail. */
export interface TrailDraft {
  schemaVersion: 1;
  trail: {
    id: string;
    name: string;
    parkId: string;
    coordinates: { lat: number; lng: number };
    coordinateSourceUrl: string;
    coordinateCheckedAt: string;
    coordinateNote: string;
  };
  official: {
    sourceUrl: string;
    checkedAt: string;
    distanceMiles: number;
    elevationGainFeet: number;
    estimatedDuration: string;
    difficulty: string;
    routeType: "loop" | "out-and-back" | "point-to-point";
    accessibility: string | null;
    additionalSources: Array<{ sourceUrl: string; checkedAt: string; note: string }>;
  };
  comparison: {
    sourceUrl: string;
    checkedAt: string;
    sourceRecordIds: string[];
    /** Only previously admitted trails may retain missing historical segment IDs. */
    recordIdNote?: string;
    distanceMiles: number;
    distanceMatch: DistanceMatch;
    elevationGainFeet: number | null;
    gainMatch: SourceConfidence["gainMatch"];
    note: string;
    gainNote: string | null;
    elevationSourceUrl?: string;
    elevationRangeFeet?: { min: number; max: number };
  };
  photo: {
    src: string;
    locationName: string;
    alt: string;
    credit: string;
    sourceUrl: string;
    permissionNote: string;
    focalPoint: { desktop: string; mobile: string };
  };
  sourceCheck: {
    aliases: string[];
    skipRouteTypeReason: string | null;
  };
}

export interface TrailDraftIssue {
  field: string;
  message: string;
}

export interface TrailDraftOptions {
  parks: readonly SupportedPark[];
  existingTrails: Readonly<Record<string, Pick<TrailProfile, "id" | "name">>>;
  today: string;
  allowExisting?: boolean;
}

export interface PreparedTrail {
  profile: TrailProfile;
  snapshot: NpsSourceSnapshot;
  photo: ParkPhoto;
  integrityPolicy: { aliases: string[]; checkedFields: NpsIntegrityFieldName[] };
  demo: DemoScenario;
}

export type TrailDraftCheck =
  | { ok: false; issues: TrailDraftIssue[]; warnings: string[] }
  | {
      ok: true;
      issues: [];
      warnings: string[];
      draft: TrailDraft;
      prepared: PreparedTrail;
    };

const SLUG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const LOCAL_JPEG = /^\/park-images\/[a-z0-9][a-z0-9-]*\.jpe?g$/;
const MATCHES = ["ok", "strong_bridge", "moderate_bridge"] as const;
// Frozen migration debt, not an admission option. New trails must retain IDs.
const HISTORICAL_GEOMETRY_GAPS = new Set(["jenny-lake-loop", "taggart-lake", "string-lake-loop"]);

export function isTrailDraftId(value: string): boolean {
  return value.length <= 80 && SLUG.test(value);
}

/** Run the same draft checks against an approved record and its managed facts. */
export function checkTrailDefinition(
  input: unknown,
  snapshots: Readonly<Record<string, NpsSourceSnapshot>>,
  options: TrailDraftOptions,
): TrailDraftCheck {
  if (!isRecord(input) || !isRecord(input.trail) || typeof input.trail.id !== "string" || !isRecord(input.official)) {
    return { ok: false, issues: [{ field: "definition", message: "Use an approved trail definition with trail and official objects." }], warnings: [] };
  }
  try {
    return checkTrailDraft(resolveTrailDefinition(input as TrailDefinition, snapshots), options);
  } catch (error) {
    return { ok: false, issues: [{ field: "definition", message: error instanceof Error ? error.message : "Invalid trail definition." }], warnings: [] };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function officialUrl(value: string, domains: readonly string[]): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.port && domains.some((domain) =>
        url.hostname === domain || url.hostname.endsWith("." + domain));
  } catch {
    return false;
  }
}

function normalizedName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Offline, side-effect-free check and preparation through one interface.
 * File/image checks belong to the CLI; this never fetches, writes, or publishes.
 */
export function checkTrailDraft(input: unknown, options: TrailDraftOptions): TrailDraftCheck {
  const issues: TrailDraftIssue[] = [];
  const warnings: string[] = [];
  const add = (field: string, message: string) => issues.push({ field, message });
  const object = (value: unknown, field: string, keys: string[]) => {
    if (!isRecord(value)) {
      add(field || "$", "Use a JSON object with the fields from trail.template.json.");
      return {};
    }
    for (const key of Object.keys(value)) {
      if (!keys.includes(key)) add(field ? field + "." + key : key, "Unknown field; check its spelling against the template.");
    }
    return value;
  };
  const text = (value: unknown, field: string, min = 1, max = 2_000): value is string => {
    if (typeof value !== "string" || value.trim().length < min ||
        value.length > max || /^(?:todo|tbd|replace.*|your[- ].*)$/i.test(value.trim())) {
      add(field, "Enter " + min + "-" + max + " characters of reviewed information; do not leave a placeholder.");
      return false;
    }
    return true;
  };
  const number = (value: unknown, field: string, min: number, max: number, integer = false) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max ||
        (integer && !Number.isInteger(value))) {
      add(field, "Enter a " + (integer ? "whole " : "") + "number from " + min + " to " + max + "; check the units.");
    }
  };
  const choice = (value: unknown, field: string, values: readonly string[]) => {
    if (typeof value !== "string" || !values.includes(value)) {
      add(field, "Choose one of: " + values.join(", ") + ".");
    }
  };
  const url = (value: unknown, field: string, domains: readonly string[]) => {
    if (text(value, field, 1, 2_000) && !officialUrl(value, domains)) {
      add(field, "Use an HTTPS " + domains.join(" or ") + " source URL, without credentials or a custom port.");
    }
  };
  const date = (value: unknown, field: string) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value || value > options.today) {
      add(field, "Enter the actual source-review date as YYYY-MM-DD, no later than " + options.today + ".");
    }
  };
  const strings = (value: unknown, field: string, max = 100): string[] => {
    if (!Array.isArray(value) || value.length === 0 || value.length > max) {
      add(field, "Provide 1-" + max + " distinct reviewed values.");
      return [];
    }
    const valid = value.filter((entry, index): entry is string =>
      text(entry, field + "[" + index + "]", 1, 200));
    if (new Set(valid.map(normalizedName)).size !== valid.length) {
      add(field, "Remove duplicate values.");
    }
    return valid;
  };
  const nullableText = (value: unknown, field: string, min = 1, max = 2_000) => {
    if (value !== null) text(value, field, min, max);
  };

  const root = object(input, "", ["schemaVersion", "trail", "official", "comparison", "photo", "sourceCheck"]);
  if (root.schemaVersion !== 1) add("schemaVersion", "Use schemaVersion 1 from the current template.");
  const trail = object(root.trail, "trail", ["id", "name", "parkId", "coordinates", "coordinateSourceUrl", "coordinateCheckedAt", "coordinateNote"]);
  if (text(trail.id, "trail.id", 1, 80) && !isTrailDraftId(trail.id)) {
    add("trail.id", "Use a lowercase hyphenated ID, for example example-lake-loop. No spaces or path separators.");
  }
  text(trail.name, "trail.name", 1, 160);
  // Do not allow a new park to inherit Grand Teton's existing safety rules.
  if (trail.parkId !== "grand-teton") {
    add("trail.parkId", "Only grand-teton is supported by this intake. Review park-specific safety rules before adding another park.");
  }
  const park = options.parks.find((entry) => entry.id === trail.parkId);
  if (!park) add("trail.parkId", "Register the supported park before preparing a trail.");
  const existing = typeof trail.id === "string" && Object.hasOwn(options.existingTrails, trail.id)
    ? options.existingTrails[trail.id] : undefined;
  if (existing && !options.allowExisting) {
    add("trail.id", "This ID is already registered. Use a new ID, or --existing only to inspect an existing trail.");
  }
  if (options.allowExisting && !existing) {
    add("trail.id", "--existing requires an ID already in the catalog. Omit that flag for a new trail.");
  }
  if (typeof trail.name === "string" && Object.values(options.existingTrails).some((entry) =>
    normalizedName(entry.name) === normalizedName(trail.name as string) && entry.id !== trail.id)) {
    add("trail.name", "A trail with this name is already registered; resolve the route identity before adding a duplicate.");
  }
  const coordinates = object(trail.coordinates, "trail.coordinates", ["lat", "lng"]);
  number(coordinates.lat, "trail.coordinates.lat", -90, 90);
  number(coordinates.lng, "trail.coordinates.lng", -180, 180);
  if (coordinates.lat === 0 && coordinates.lng === 0) add("trail.coordinates", "0, 0 looks like a placeholder; use reviewed trail-area coordinates.");
  url(trail.coordinateSourceUrl, "trail.coordinateSourceUrl", ["nps.gov", "usgs.gov", "nationalmap.gov"]);
  date(trail.coordinateCheckedAt, "trail.coordinateCheckedAt");
  text(trail.coordinateNote, "trail.coordinateNote", 10);

  const official = object(root.official, "official", ["sourceUrl", "checkedAt", "distanceMiles", "elevationGainFeet", "estimatedDuration", "difficulty", "routeType", "accessibility", "additionalSources"]);
  url(official.sourceUrl, "official.sourceUrl", ["nps.gov"]);
  date(official.checkedAt, "official.checkedAt");
  number(official.distanceMiles, "official.distanceMiles", 0.01, 100);
  number(official.elevationGainFeet, "official.elevationGainFeet", 0, 30_000, true);
  if (text(official.estimatedDuration, "official.estimatedDuration", 1, 80)) {
    const match = official.estimatedDuration.match(/^(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?)$/i);
    if (!match || Number(match[1]) <= 0 || (match[2] && Number(match[2]) < Number(match[1]))) {
      add("official.estimatedDuration", 'Use an NPS-backed duration with units, such as "1-2 hours" or "45 minutes".');
    }
  }
  text(official.difficulty, "official.difficulty", 1, 80);
  choice(official.routeType, "official.routeType", ["loop", "out-and-back", "point-to-point"]);
  nullableText(official.accessibility, "official.accessibility", 10);
  if (official.accessibility === null) warnings.push("No official accessibility text supplied. It stays unknown, not 'accessible'.");
  if (!Array.isArray(official.additionalSources) || official.additionalSources.length > 5) {
    add("official.additionalSources", "Use an array of up to five additional official sources, or [] if none.");
  } else {
    const seen = new Set([official.sourceUrl]);
    official.additionalSources.forEach((entry: unknown, index: number) => {
      const field = "official.additionalSources[" + index + "]";
      const source = object(entry, field, ["sourceUrl", "checkedAt", "note"]);
      url(source.sourceUrl, field + ".sourceUrl", ["nps.gov"]);
      date(source.checkedAt, field + ".checkedAt");
      text(source.note, field + ".note", 10);
      if (seen.has(source.sourceUrl)) add(field + ".sourceUrl", "Use a distinct additional source, not a duplicate URL.");
      seen.add(source.sourceUrl);
    });
  }

  const comparison = object(root.comparison, "comparison", ["sourceUrl", "checkedAt", "sourceRecordIds", "recordIdNote", "distanceMiles", "distanceMatch", "elevationGainFeet", "gainMatch", "note", "gainNote", "elevationSourceUrl", "elevationRangeFeet"]);
  url(comparison.sourceUrl, "comparison.sourceUrl", ["usgs.gov", "nationalmap.gov"]);
  date(comparison.checkedAt, "comparison.checkedAt");
  if (Array.isArray(comparison.sourceRecordIds) && comparison.sourceRecordIds.length === 0 &&
      options.allowExisting && existing && HISTORICAL_GEOMETRY_GAPS.has(existing.id)) {
    text(comparison.recordIdNote, "comparison.recordIdNote", 20, 900);
    warnings.push("Historical geometry segment IDs are not retained. Preserve the review note; do not claim a newly verified route match.");
  } else {
    strings(comparison.sourceRecordIds, "comparison.sourceRecordIds");
    if (comparison.recordIdNote !== undefined) text(comparison.recordIdNote, "comparison.recordIdNote", 20, 900);
  }
  number(comparison.distanceMiles, "comparison.distanceMiles", 0.01, 100);
  choice(comparison.distanceMatch, "comparison.distanceMatch", MATCHES);
  if (comparison.elevationGainFeet !== null) number(comparison.elevationGainFeet, "comparison.elevationGainFeet", 0, 30_000);
  choice(comparison.gainMatch, "comparison.gainMatch", [...MATCHES, "conflict", "unknown"]);
  text(comparison.note, "comparison.note", 20, 900);
  nullableText(comparison.gainNote, "comparison.gainNote", 10, 900);
  if (comparison.elevationSourceUrl !== undefined) url(comparison.elevationSourceUrl, "comparison.elevationSourceUrl", ["usgs.gov", "nationalmap.gov"]);
  if (comparison.elevationRangeFeet !== undefined) {
    const range = object(comparison.elevationRangeFeet, "comparison.elevationRangeFeet", ["min", "max"]);
    number(range.min, "comparison.elevationRangeFeet.min", -1_500, 30_000);
    number(range.max, "comparison.elevationRangeFeet.max", -1_500, 30_000);
    if (typeof range.min === "number" && typeof range.max === "number" && range.min > range.max) {
      add("comparison.elevationRangeFeet", "Minimum elevation must not exceed maximum elevation.");
    }
    if (comparison.elevationSourceUrl === undefined) add("comparison.elevationSourceUrl", "Record the source of the computed elevation range.");
  }
  if ((comparison.elevationGainFeet !== null || comparison.gainMatch === "conflict") && comparison.gainNote === null) {
    add("comparison.gainNote", "Explain the computed gain or official-source conflict without replacing the NPS display value.");
  }
  if (MATCHES.includes(comparison.gainMatch as DistanceMatch) && comparison.elevationGainFeet === null) {
    add("comparison.gainMatch", "A gain match needs a computed comparison value. Use unknown when no comparison exists.");
  }
  if (comparison.gainMatch === "conflict" && comparison.elevationGainFeet === null &&
      (!Array.isArray(official.additionalSources) || official.additionalSources.length === 0)) {
    add("official.additionalSources", "Record the other NPS source that explains the gain conflict.");
  }
  if (typeof official.distanceMiles === "number" && typeof comparison.distanceMiles === "number" &&
      Math.abs(comparison.distanceMiles - official.distanceMiles) / official.distanceMiles > 0.15) {
    warnings.push("NPS and USGS distances differ by more than 15%. Recheck route boundaries; this tool cannot reconcile the geometry.");
  }

  const photo = object(root.photo, "photo", ["src", "locationName", "alt", "credit", "sourceUrl", "permissionNote", "focalPoint"]);
  if (text(photo.src, "photo.src", 1, 200) && !LOCAL_JPEG.test(photo.src)) {
    add("photo.src", "Use /park-images/name.jpg (or .jpeg). The local image must be at least 2000 x 1200 pixels.");
  }
  text(photo.locationName, "photo.locationName", 1, 160);
  text(photo.alt, "photo.alt", 10, 500);
  text(photo.credit, "photo.credit", 1, 200);
  url(photo.sourceUrl, "photo.sourceUrl", ["nps.gov"]);
  text(photo.permissionNote, "photo.permissionNote", 10);
  const focalPoint = object(photo.focalPoint, "photo.focalPoint", ["desktop", "mobile"]);
  for (const key of ["desktop", "mobile"]) {
    const value = focalPoint[key];
    const match = typeof value === "string" ? value.match(/^(\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/) : null;
    if (!match || Number(match[1]) > 100 || Number(match[2]) > 100) {
      add("photo.focalPoint." + key, 'Use two percentages from 0% to 100%, for example "50% 50%"; visually review the crop.');
    }
  }

  const sourceCheck = object(root.sourceCheck, "sourceCheck", ["aliases", "skipRouteTypeReason"]);
  const aliases = strings(sourceCheck.aliases, "sourceCheck.aliases", 10);
  if (typeof trail.name === "string" && !aliases.some((alias) => normalizedName(alias) === normalizedName(trail.name as string))) {
    add("sourceCheck.aliases", "Include the trail's display name, plus official page aliases used by the source checker.");
  }
  nullableText(sourceCheck.skipRouteTypeReason, "sourceCheck.skipRouteTypeReason", 10);
  if (typeof sourceCheck.skipRouteTypeReason === "string") {
    warnings.push("Route type will require manual source review: " + sourceCheck.skipRouteTypeReason);
  }
  if (issues.length || !park) return { ok: false, issues, warnings };
  const draft = input as TrailDraft;
  return { ok: true, issues: [], warnings, draft, prepared: compileTrail(draft, park) };
}
