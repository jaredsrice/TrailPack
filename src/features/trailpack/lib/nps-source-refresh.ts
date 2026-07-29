import type {
  NpsSourceSnapshot,
  NpsSourceSnapshotDocument,
} from "@/features/trailpack/data/nps-source-snapshots";
import type { TrailProfile } from "@/features/trailpack/types";
import type {
  NpsIntegrityFieldName,
  NpsIntegrityReport,
  NpsIntegrityTrailResult,
  NpsObservedFields,
} from "./nps-source-integrity";

export type NpsRefreshStatus =
  | "unchanged"
  | "refreshed"
  | "updated"
  | "confirmation-required"
  | "blocked";

export interface NpsRefreshChange {
  trailId: string;
  trailName: string;
  field: NpsIntegrityFieldName;
  previous: string;
  next: string;
}

export interface NpsRefreshPlan {
  status: NpsRefreshStatus;
  checkedAt: string;
  document: NpsSourceSnapshotDocument;
  changes: NpsRefreshChange[];
  blockers: string[];
}

interface PlanInput {
  profiles: TrailProfile[];
  current: NpsSourceSnapshotDocument;
  firstReport: NpsIntegrityReport;
  confirmationReport?: NpsIntegrityReport;
  checkedAt: string;
}

const MANAGED_FIELDS: NpsIntegrityFieldName[] = [
  "distanceMiles",
  "elevationGainFeet",
  "estimatedDuration",
  "difficulty",
  "routeType",
  "accessibility",
];

function cloneDocument(
  document: NpsSourceSnapshotDocument,
): NpsSourceSnapshotDocument {
  return structuredClone(document);
}

function normalizedValue(
  field: NpsIntegrityFieldName,
  value: number | string | undefined,
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (field === "estimatedDuration") {
    return value.toLowerCase().replace(/\s*[-–—]\s*/g, "-").replace(/\s+/g, " ").trim();
  }
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function observedValue(
  observed: NpsObservedFields,
  field: NpsIntegrityFieldName,
): number | string | undefined {
  return observed[field];
}

function changedFields(result: NpsIntegrityTrailResult): NpsIntegrityFieldName[] {
  return result.fields
    .filter((field) => field.status === "changed")
    .map((field) => field.field);
}

function firstBlockingStatus(report: NpsIntegrityReport): string[] {
  return report.results.flatMap((result) =>
    result.status === "parse-error" ||
    result.status === "fetch-error" ||
    result.status === "configuration-error"
      ? [`${result.trailName}: ${result.message ?? result.status}`]
      : [],
  );
}

function validateConfirmation(
  first: NpsIntegrityTrailResult,
  confirmation: NpsIntegrityTrailResult | undefined,
): string[] {
  if (!confirmation) {
    return [`${first.trailName}: confirmation result is missing.`];
  }
  if (confirmation.status !== first.status) {
    return [
      `${first.trailName}: repeated fetch changed status from ${first.status} to ${confirmation.status}.`,
    ];
  }

  const firstFields = changedFields(first).toSorted();
  const confirmationFields = changedFields(confirmation).toSorted();
  if (firstFields.join("|") !== confirmationFields.join("|")) {
    return [
      `${first.trailName}: the set of changed fields differed between the two NPS fetches.`,
    ];
  }

  return firstFields.flatMap((field) => {
    const firstValue = observedValue(first.observed, field);
    const confirmedValue = observedValue(confirmation.observed, field);
    return normalizedValue(field, firstValue) ===
      normalizedValue(field, confirmedValue)
      ? []
      : [`${first.trailName}: ${field} differed between the two NPS fetches.`];
  });
}

function percentageDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(Math.abs(right), 0.01);
}

function validateProposedSnapshot(
  profile: TrailProfile,
  current: NpsSourceSnapshot,
  proposed: NpsSourceSnapshot,
): string[] {
  const blockers: string[] = [];

  if (
    !Number.isFinite(proposed.distanceMiles) ||
    proposed.distanceMiles < 0.1 ||
    proposed.distanceMiles > 40 ||
    percentageDifference(proposed.distanceMiles, current.distanceMiles) > 0.25
  ) {
    blockers.push(`${profile.name}: distance change is outside the automatic bounds.`);
  }

  const computedDistance = profile.distanceMiles.computedValue;
  if (
    computedDistance !== undefined &&
    percentageDifference(proposed.distanceMiles, computedDistance) > 0.15
  ) {
    blockers.push(
      `${profile.name}: proposed NPS distance is more than 15% from the saved USGS comparison.`,
    );
  }

  if (
    !Number.isFinite(proposed.elevationGainFeet) ||
    proposed.elevationGainFeet < 0 ||
    proposed.elevationGainFeet > 10_000 ||
    percentageDifference(
      proposed.elevationGainFeet,
      current.elevationGainFeet,
    ) > 0.5
  ) {
    blockers.push(
      `${profile.name}: elevation-gain change is outside the automatic bounds.`,
    );
  }

  const duration = proposed.estimatedDuration.match(
    /^(\d+)(?:-(\d+))?\s+hours?$/i,
  );
  if (!duration || Number(duration[2] ?? duration[1]) > 24) {
    blockers.push(`${profile.name}: duration is outside the automatic format bounds.`);
  }

  if (!/^(easy|moderate|moderate-strenuous|strenuous)$/i.test(proposed.difficulty)) {
    blockers.push(`${profile.name}: difficulty is outside the supported values.`);
  }

  if (!["loop", "out-and-back", "point-to-point"].includes(proposed.routeType)) {
    blockers.push(`${profile.name}: route type is outside the supported values.`);
  }

  if (proposed.accessibility) {
    const firstNameWord = profile.name.split(/\s+/)[0].toLowerCase();
    if (
      proposed.accessibility.length < 20 ||
      proposed.accessibility.length > 1_200 ||
      !proposed.accessibility.toLowerCase().includes(firstNameWord)
    ) {
      blockers.push(
        `${profile.name}: accessibility text failed the identity or length guard.`,
      );
    }
  }

  return blockers;
}

function applyChangedFields(
  current: NpsSourceSnapshot,
  result: NpsIntegrityTrailResult,
  checkedAt: string,
): NpsSourceSnapshot {
  const proposed = { ...current, checkedAt };
  const changed = new Set(changedFields(result));

  for (const field of MANAGED_FIELDS) {
    if (!changed.has(field)) {
      continue;
    }
    const value = observedValue(result.observed, field);
    if (value !== undefined) {
      Object.assign(proposed, { [field]: value });
    }
  }

  return proposed;
}

export function planNpsSourceRefresh({
  profiles,
  current,
  firstReport,
  confirmationReport,
  checkedAt,
}: PlanInput): NpsRefreshPlan {
  const document = cloneDocument(current);
  const blockers = firstBlockingStatus(firstReport);
  if (blockers.length > 0) {
    return { status: "blocked", checkedAt, document, changes: [], blockers };
  }

  const changedResults = firstReport.results.filter(
    (result) => result.status === "changed",
  );
  if (changedResults.length > 0 && !confirmationReport) {
    return {
      status: "confirmation-required",
      checkedAt,
      document,
      changes: [],
      blockers: [],
    };
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const confirmationById = new Map(
    confirmationReport?.results.map((result) => [result.trailId, result]) ?? [],
  );
  const changes: NpsRefreshChange[] = [];

  for (const result of firstReport.results) {
    const profile = profilesById.get(result.trailId);
    const currentSnapshot = document.trails[result.trailId];
    if (!profile || !currentSnapshot) {
      blockers.push(`${result.trailName}: managed profile or snapshot is missing.`);
      continue;
    }

    if (result.status === "changed") {
      const confirmation = confirmationById.get(result.trailId);
      blockers.push(...validateConfirmation(result, confirmation));
      if (confirmation) {
        const proposed = applyChangedFields(
          currentSnapshot,
          confirmation,
          checkedAt,
        );
        blockers.push(
          ...validateProposedSnapshot(profile, currentSnapshot, proposed),
        );
        document.trails[result.trailId] = proposed;

        for (const field of changedFields(result)) {
          const previous = result.fields.find(
            (fieldCheck) => fieldCheck.field === field,
          )?.expected;
          const next = result.fields.find(
            (fieldCheck) => fieldCheck.field === field,
          )?.observed;
          changes.push({
            trailId: result.trailId,
            trailName: result.trailName,
            field,
            previous: previous ?? "Not published",
            next: next ?? "Not published",
          });
        }
      }
    } else {
      document.trails[result.trailId] = {
        ...currentSnapshot,
        checkedAt,
      };
    }
  }

  if (blockers.length > 0) {
    return {
      status: "blocked",
      checkedAt,
      document: cloneDocument(current),
      changes: [],
      blockers,
    };
  }

  document.updatedAt = checkedAt;
  const didRefreshDate = current.updatedAt !== checkedAt;
  return {
    status:
      changes.length > 0 ? "updated" : didRefreshDate ? "refreshed" : "unchanged",
    checkedAt,
    document,
    changes,
    blockers: [],
  };
}

export function renderNpsRefreshMarkdown(plan: NpsRefreshPlan): string {
  const lines = [
    "## Automatic refresh",
    "",
    `Result: ${plan.status.toUpperCase().replaceAll("-", " ")}`,
    "",
  ];

  if (plan.changes.length > 0) {
    lines.push(
      "Two matching NPS fetches passed the automatic bounds. These saved official values were refreshed:",
      "",
      "| Trail | Field | Previous | Updated |",
      "|---|---|---|---|",
      ...plan.changes.map(
        (change) =>
          `| ${change.trailName} | ${change.field} | ${change.previous.replaceAll("|", "\\|")} | ${change.next.replaceAll("|", "\\|")} |`,
      ),
      "",
    );
  } else if (plan.status === "refreshed" || plan.status === "unchanged") {
    lines.push(
      "No official values changed. The managed snapshots were marked as checked.",
      "",
    );
  }

  if (plan.blockers.length > 0) {
    lines.push(
      "No data was updated because:",
      "",
      ...plan.blockers.map((blocker) => `- ${blocker}`),
      "",
    );
  }

  lines.push(
    "Automatic writes are limited to the managed NPS snapshot file. USGS geometry, recommendations, and the supported-trail catalog cannot be expanded by this job.",
    "",
  );

  return lines.join("\n");
}
