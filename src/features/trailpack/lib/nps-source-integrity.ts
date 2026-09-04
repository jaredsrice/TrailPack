import { TRAIL_CATALOG_ENTRIES } from "../data/trail-catalog";
import type { RouteType, TrailProfile } from "@/features/trailpack/types";

export type NpsIntegrityFieldName =
  | "distanceMiles"
  | "elevationGainFeet"
  | "estimatedDuration"
  | "difficulty"
  | "routeType"
  | "accessibility";

export type NpsIntegrityFieldStatus =
  | "match"
  | "changed"
  | "missing"
  | "not-checked";

export type NpsIntegrityTrailStatus =
  | "unchanged"
  | "changed"
  | "parse-error"
  | "fetch-error"
  | "configuration-error";

export interface NpsPageSnapshot {
  trailId: string;
  sourceUrl: string;
  finalUrl?: string;
  httpStatus?: number;
  html?: string;
  error?: string;
}

export interface NpsIntegrityFieldCheck {
  field: NpsIntegrityFieldName;
  status: NpsIntegrityFieldStatus;
  expected: string;
  observed?: string;
}

export interface NpsIntegrityTrailResult {
  trailId: string;
  trailName: string;
  sourceUrl: string;
  finalUrl?: string;
  httpStatus?: number;
  status: NpsIntegrityTrailStatus;
  fields: NpsIntegrityFieldCheck[];
  observed: NpsObservedFields;
  evidence?: string;
  message?: string;
}

export interface NpsIntegrityReport {
  checkedAt: string;
  overallStatus: "pass" | "needs-review";
  summary: {
    total: number;
    unchanged: number;
    needsReview: number;
  };
  results: NpsIntegrityTrailResult[];
}

interface IntegrityPolicy {
  aliases: string[];
  checkedFields: NpsIntegrityFieldName[];
}

export interface NpsObservedFields {
  distanceMiles?: number;
  elevationGainFeet?: number;
  estimatedDuration?: string;
  difficulty?: string;
  routeType?: RouteType;
  accessibility?: string;
  evidence?: string;
}

interface MetricCandidate {
  index: number;
  text: string;
  distanceMiles: number;
  elevationGainFeet?: number;
  score: number;
}

const ALL_FIELDS: NpsIntegrityFieldName[] = [
  "distanceMiles",
  "elevationGainFeet",
  "estimatedDuration",
  "difficulty",
  "routeType",
  "accessibility",
];

const POLICIES: Record<string, IntegrityPolicy> = Object.fromEntries(
  Object.entries(TRAIL_CATALOG_ENTRIES).map(([id, entry]) => [id, entry.integrityPolicy]),
);

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
  };

  return value.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, token: string) => {
      if (token.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(token.slice(2), 16));
      }
      if (token.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(token.slice(1), 10));
      }
      return namedEntities[token.toLowerCase()] ?? entity;
    },
  );
}

function htmlToLines(html: string): string[] {
  return decodeHtmlEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:div|p|li|dd|dt|h[1-6]|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/\*+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseDistance(value: string): number | undefined {
  const match = value.match(/\b(\d+(?:\.\d+)?)\s*(?:mi\b|miles?\b)/i);
  return match ? Number.parseFloat(match[1]) : undefined;
}

function parseElevationGain(value: string): number | undefined {
  const forward = value.match(
    /\b([\d,]+)\s*(?:ft|feet)\b(?:\s*\([^)]*\))?\s*(?:of\s+)?(?:elevation\s+gain|total\s+climbing)\b/i,
  );
  const reverse = value.match(
    /\b(?:elevation\s+gain|total\s+climbing)\b[^\d]{0,32}([\d,]+)\s*(?:ft|feet)\b/i,
  );
  const rawValue = forward?.[1] ?? reverse?.[1];
  return rawValue ? Number.parseInt(rawValue.replaceAll(",", ""), 10) : undefined;
}

function parseDuration(value: string): string | undefined {
  const match = value.match(/\b(\d+(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)?)\s*(hours?|minutes?)\b/i);
  if (!match) return undefined;
  const amount = match[1].replace(/\s*[-–—]\s*/g, "-");
  const unit = match[2].toLowerCase().startsWith("minute") ? "minute" : "hour";
  return `${amount} ${unit}${Number(amount) === 1 ? "" : "s"}`;
}

function parseDifficulty(value: string): string | undefined {
  const match = value.match(
    /\b(easy|moderately\s+strenuous|moderate(?:\s*[-–—]\s*strenuous)?|strenuous)\b/i,
  );
  if (!match) {
    return undefined;
  }
  return match[1]
    .replace(/\s*[-–—]\s*/g, "-")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseRouteType(value: string): RouteType | undefined {
  if (/\bout\s*(?:and|&)\s*back\b/i.test(value)) {
    return "out-and-back";
  }
  if (/\bpoint\s*[-–—]?\s*to\s*[-–—]?\s*point\b/i.test(value)) {
    return "point-to-point";
  }
  if (/\bloop(?:\s+(?:hike|trail))?\b/i.test(value) || /\bcircle\s+(?:the\s+)?lake\b/i.test(value)) {
    return "loop";
  }
  return undefined;
}

function parseAccessibility(html: string): string | undefined {
  const match = html.match(
    /<div\b[^>]*class=["'][^"']*AccessibilityInfo__Body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  );
  if (!match) {
    return undefined;
  }

  const value = htmlToLines(match[1]).join(" ").trim();
  return value.length >= 20 && value.length <= 1_200 ? value : undefined;
}

function parseAliasedRoute(
  lines: string[],
  policy: IntegrityPolicy,
): RouteType | undefined {
  const normalizedAliases = policy.aliases.map(normalizeForMatch);

  for (const line of lines) {
    const normalizedLine = normalizeForMatch(line);
    if (!normalizedAliases.some((alias) => normalizedLine.includes(alias))) {
      continue;
    }

    const routeType = parseRouteType(line);
    if (routeType) {
      return routeType;
    }
  }

  return undefined;
}

function metricCandidates(
  lines: string[],
  profile: TrailProfile,
  policy: IntegrityPolicy,
): MetricCandidate[] {
  const normalizedAliases = policy.aliases.map(normalizeForMatch);
  const candidates: MetricCandidate[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const text = lines.slice(index, index + 4).join(" ");
    const distanceMiles = parseDistance(text);
    if (distanceMiles === undefined || parseElevationGain(text) === undefined) {
      continue;
    }

    let score = Math.max(
      0,
      25 - Math.abs(distanceMiles - profile.distanceMiles.value) * 5,
    );
    const candidateText = normalizeForMatch(text);

    for (const alias of normalizedAliases) {
      if (candidateText.includes(alias)) {
        score += 100;
      }

      for (let offset = -4; offset <= 2; offset += 1) {
        const nearbyLine = lines[index + offset];
        if (nearbyLine && normalizeForMatch(nearbyLine).includes(alias)) {
          score += 60 - Math.abs(offset) * 5;
          break;
        }
      }
    }

    candidates.push({
      index,
      text,
      distanceMiles,
      elevationGainFeet: parseElevationGain(text),
      score,
    });
  }

  return candidates.sort((left, right) => right.score - left.score);
}

function parseNpsPage(
  profile: TrailProfile,
  policy: IntegrityPolicy,
  html: string,
): NpsObservedFields {
  const lines = htmlToLines(html);
  const candidate = metricCandidates(lines, profile, policy)[0];
  if (!candidate) {
    return {};
  }

  const context = lines
    .slice(Math.max(0, candidate.index - 5), candidate.index + 10)
    .join(" ");
  const pageText = lines.join(" ");
  const difficulty =
    parseDifficulty(context) ??
    parseDifficulty(
      lines
        .filter((line) => /\b(?:easy|moderately\s+strenuous|moderate(?:\s*[-–—]\s*strenuous)?|strenuous)\s+hike\b/i.test(line))
        .join(" "),
    );

  return {
    distanceMiles: candidate.distanceMiles,
    elevationGainFeet: candidate.elevationGainFeet,
    estimatedDuration: parseDuration(context) ?? parseDuration(pageText),
    difficulty,
    routeType: parseRouteType(context) ?? parseAliasedRoute(lines, policy),
    accessibility: parseAccessibility(html),
    evidence: candidate.text.slice(0, 600),
  };
}

function expectedValue(
  profile: TrailProfile,
  field: NpsIntegrityFieldName,
): number | string | undefined {
  switch (field) {
    case "distanceMiles":
      return profile.distanceMiles.value;
    case "elevationGainFeet":
      return profile.elevationGainFeet.value;
    case "estimatedDuration":
      return profile.estimatedDuration.value;
    case "difficulty":
      return profile.difficulty.value;
    case "routeType":
      return profile.routeType;
    case "accessibility":
      return profile.accessibility?.value;
  }
}

function observedValue(
  parsed: NpsObservedFields,
  field: NpsIntegrityFieldName,
): number | string | undefined {
  return parsed[field];
}

function normalizeComparable(field: NpsIntegrityFieldName, value: number | string): string {
  if (typeof value === "number") {
    return value.toString();
  }

  if (field === "estimatedDuration") {
    return value.toLowerCase().replace(/\s*[-–—]\s*/g, "-").replace(/\s+/g, " ").trim();
  }

  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function displayValue(
  field: NpsIntegrityFieldName,
  value: number | string | undefined,
): string {
  if (value === undefined) {
    return "Not published";
  }

  switch (field) {
    case "distanceMiles":
      return `${value} mi`;
    case "elevationGainFeet":
      return `${Number(value).toLocaleString("en-US")} ft`;
    default:
      return String(value);
  }
}

function compareFields(
  profile: TrailProfile,
  policy: IntegrityPolicy,
  parsed: NpsObservedFields,
): NpsIntegrityFieldCheck[] {
  return ALL_FIELDS.map((field) => {
    const expected = expectedValue(profile, field);
    if (!policy.checkedFields.includes(field)) {
      return {
        field,
        status: "not-checked",
        expected: displayValue(field, expected),
      };
    }

    const observed = observedValue(parsed, field);
    if (field === "accessibility" && expected === undefined && observed === undefined) {
      return {
        field,
        status: "not-checked",
        expected: displayValue(field, expected),
      };
    }
    if (observed === undefined) {
      return {
        field,
        status: "missing",
        expected: displayValue(field, expected),
      };
    }

    if (expected === undefined) {
      return {
        field,
        status: "changed",
        expected: displayValue(field, expected),
        observed: displayValue(field, observed),
      };
    }

    return {
      field,
      status:
        normalizeComparable(field, expected) === normalizeComparable(field, observed)
          ? "match"
          : "changed",
      expected: displayValue(field, expected),
      observed: displayValue(field, observed),
    };
  });
}

function failedResult(
  profile: TrailProfile,
  snapshot: NpsPageSnapshot | undefined,
  status: Extract<NpsIntegrityTrailStatus, "fetch-error" | "configuration-error">,
  message: string,
): NpsIntegrityTrailResult {
  return {
    trailId: profile.id,
    trailName: profile.name,
    sourceUrl: profile.npsSourceUrl,
    finalUrl: snapshot?.finalUrl,
    httpStatus: snapshot?.httpStatus,
    status,
    fields: ALL_FIELDS.map((field) => ({
      field,
      status: "not-checked",
      expected: displayValue(field, expectedValue(profile, field)),
    })),
    observed: {},
    message,
  };
}

export function checkNpsSourceIntegrity(
  profiles: TrailProfile[],
  snapshots: NpsPageSnapshot[],
  checkedAt: string,
): NpsIntegrityReport {
  const snapshotsByTrailId = new Map(
    snapshots.map((snapshot) => [snapshot.trailId, snapshot]),
  );

  const results = profiles.map((profile): NpsIntegrityTrailResult => {
    const policy = POLICIES[profile.id];
    const snapshot = snapshotsByTrailId.get(profile.id);

    if (!policy) {
      return failedResult(
        profile,
        snapshot,
        "configuration-error",
        "No source-integrity policy is configured for this supported trail.",
      );
    }

    if (!snapshot?.html || snapshot.error) {
      return failedResult(
        profile,
        snapshot,
        "fetch-error",
        snapshot?.error ?? "No NPS page content was returned.",
      );
    }

    const parsed = parseNpsPage(profile, policy, snapshot.html);
    const fields = compareFields(profile, policy, parsed);
    const hasMissingField = fields.some((field) => field.status === "missing");
    const hasChangedField = fields.some((field) => field.status === "changed");

    return {
      trailId: profile.id,
      trailName: profile.name,
      sourceUrl: profile.npsSourceUrl,
      finalUrl: snapshot.finalUrl,
      httpStatus: snapshot.httpStatus,
      status: hasMissingField
        ? "parse-error"
        : hasChangedField
          ? "changed"
          : "unchanged",
      fields,
      observed: parsed,
      evidence: parsed.evidence,
      message: hasMissingField
        ? "One or more expected NPS fields could not be parsed; review the page before changing TrailPack data."
        : hasChangedField
          ? "One or more NPS values differ from the saved TrailPack profile; human review is required."
          : undefined,
    };
  });

  const unchanged = results.filter((result) => result.status === "unchanged").length;
  const needsReview = results.length - unchanged;

  return {
    checkedAt,
    overallStatus: needsReview === 0 ? "pass" : "needs-review",
    summary: {
      total: results.length,
      unchanged,
      needsReview,
    },
    results,
  };
}

function escapeTableCell(value: string): string {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function fieldCell(field: NpsIntegrityFieldCheck): string {
  if (field.field === "accessibility") {
    switch (field.status) {
      case "match":
        return "Pass: NPS note saved";
      case "changed":
        return "Update available";
      case "missing":
        return "Review: saved note not parsed";
      case "not-checked":
        return "No NPS-specific note";
    }
  }

  switch (field.status) {
    case "match":
      return `Pass: ${field.observed ?? field.expected}`;
    case "changed":
      return `Review: ${field.expected} -> ${field.observed ?? "missing"}`;
    case "missing":
      return `Review: expected ${field.expected}; not parsed`;
    case "not-checked":
      return "Not checked for this page";
  }
}

export function renderNpsIntegrityMarkdown(report: NpsIntegrityReport): string {
  const lines = [
    "# TrailPack NPS Source-Integrity Report",
    "",
    `Checked at: ${report.checkedAt}`,
    `Overall result: ${report.overallStatus === "pass" ? "PASS" : "NEEDS REVIEW"}`,
    "",
    "The comparison stage is non-destructive. In automatic-refresh mode, only twice-confirmed changes that pass bounded validation can update the managed NPS snapshot file; recommendations, USGS geometry, and catalog membership remain untouched.",
    "",
    `Summary: ${report.summary.unchanged}/${report.summary.total} unchanged; ${report.summary.needsReview} require review.`,
    "",
    "| Trail | Result | Distance | Elevation gain | Duration | Difficulty | Route | Accessibility |",
    "|---|---|---|---|---|---|---|---|",
  ];

  for (const result of report.results) {
    const fieldByName = new Map(result.fields.map((field) => [field.field, field]));
    lines.push(
      `| ${escapeTableCell(result.trailName)} | ${result.status} | ${escapeTableCell(fieldCell(fieldByName.get("distanceMiles")!))} | ${escapeTableCell(fieldCell(fieldByName.get("elevationGainFeet")!))} | ${escapeTableCell(fieldCell(fieldByName.get("estimatedDuration")!))} | ${escapeTableCell(fieldCell(fieldByName.get("difficulty")!))} | ${escapeTableCell(fieldCell(fieldByName.get("routeType")!))} | ${escapeTableCell(fieldCell(fieldByName.get("accessibility")!))} |`,
    );
  }

  lines.push("", "## Source details", "");

  for (const result of report.results) {
    lines.push(
      `### ${result.trailName}`,
      "",
      `- Status: ${result.status}`,
      `- Saved NPS URL: ${result.sourceUrl}`,
      `- Final URL: ${result.finalUrl ?? "unavailable"}`,
      `- HTTP status: ${result.httpStatus ?? "unavailable"}`,
    );
    if (result.message) {
      lines.push(`- Review note: ${result.message}`);
    }
    if (result.evidence) {
      lines.push(`- Parsed evidence: ${result.evidence}`);
    }
    if (result.observed.accessibility) {
      lines.push(`- NPS accessibility information: ${result.observed.accessibility}`);
    }
    lines.push("");
  }

  lines.push(
    "## Review rule",
    "",
    "Twice-confirmed changes within the automatic safety bounds may refresh the managed NPS snapshot. Missing fields, inconsistent fetches, implausible changes, page failures, and parser failures block all writes and require investigation.",
    "",
  );

  return `${lines.join("\n")}\n`;
}
