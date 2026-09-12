import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NPS_CATALOG_ENTRIES, MIXED_ACCESS_DEFINITIONS } from "../src/features/trailpack/data/trail-catalog";
import {
  NPS_SOURCE_SNAPSHOTS,
  type NpsSourceSnapshotDocument,
} from "../src/features/trailpack/data/nps-source-snapshots";
import {
  checkNpsSourceIntegrity,
  renderNpsIntegrityMarkdown,
  type NpsPageSnapshot,
} from "../src/features/trailpack/lib/nps-source-integrity";
import {
  planNpsSourceRefresh,
  renderNpsRefreshMarkdown,
  type NpsRefreshPlan,
} from "../src/features/trailpack/lib/nps-source-refresh";
import type { TrailProfile } from "../src/features/trailpack/types";
import { fetchNpsPageWithValidationRetry } from "../src/features/trailpack/lib/nps-page-fetch";

const DEFAULT_OUTPUT_DIR = ".artifacts/nps-source-integrity";
const SNAPSHOT_FILE = fileURLToPath(
  new URL(
    "../src/features/trailpack/data/nps-source-snapshots.json",
    import.meta.url,
  ),
);
const REQUEST_DELAY_MS = 1_500;

function outputDirectory(args: string[]): string {
  const optionIndex = args.indexOf("--output-dir");
  if (optionIndex === -1) {
    return DEFAULT_OUTPUT_DIR;
  }

  const value = args[optionIndex + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("--output-dir requires a directory path.");
  }
  return value;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function applyRefresh(args: string[]): boolean {
  return args.includes("--apply");
}

async function fetchAllPages(profiles: TrailProfile[]): Promise<NpsPageSnapshot[]> {
  const snapshots: NpsPageSnapshot[] = [];

  for (const [index, profile] of profiles.entries()) {
    snapshots.push(await fetchNpsPageWithValidationRetry(
      profile,
      (snapshot) => {
        const status = checkNpsSourceIntegrity(
          [profile],
          [snapshot],
          new Date().toISOString(),
        ).results[0]?.status;
        return status !== "fetch-error" && status !== "parse-error";
      },
    ));
    if (index < profiles.length - 1) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  return snapshots;
}

async function writeReports(
  outputDir: string,
  report: ReturnType<typeof checkNpsSourceIntegrity>,
  plan?: NpsRefreshPlan,
  confirmationReport?: ReturnType<typeof checkNpsSourceIntegrity>,
): Promise<void> {
  const markdown = [
    renderNpsIntegrityMarkdown(report).trimEnd(),
    plan ? renderNpsRefreshMarkdown(plan).trimEnd() : "",
    "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const json = plan
    ? { integrityReport: report, confirmationReport, automaticRefresh: plan }
    : report;

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, "latest.md"), `${markdown}\n`, "utf8"),
    writeFile(
      path.join(outputDir, "latest.json"),
      `${JSON.stringify(json, null, 2)}\n`,
      "utf8",
    ),
  ]);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputDir = path.resolve(outputDirectory(args));
  const shouldApply = applyRefresh(args);
  const profiles = Object.values(NPS_CATALOG_ENTRIES).map((entry) => entry.profile);
  console.log(`${MIXED_ACCESS_DEFINITIONS.reduce((count, definition) => count + definition.options.length, 0)} derived mixed itineraries use separately tested geometry; their NPS parent profiles are checked below. No official mixed-route snapshots are fabricated.`);
  const snapshots = await fetchAllPages(profiles);
  const checkedInstant = new Date();
  const checkedAt = checkedInstant.toISOString();
  const checkedDate = checkedAt.slice(0, 10);

  const report = checkNpsSourceIntegrity(
    profiles,
    snapshots,
    checkedAt,
  );

  if (!shouldApply) {
    await writeReports(outputDir, report);
    console.log(
      `NPS source integrity: ${report.overallStatus.toUpperCase()} (${report.summary.unchanged}/${report.summary.total} unchanged).`,
    );
    console.log(`Reports: ${path.join(outputDir, "latest.md")} and latest.json`);

    if (report.overallStatus !== "pass") {
      process.exitCode = 1;
    }
    return;
  }

  let plan = planNpsSourceRefresh({
    profiles,
    current: NPS_SOURCE_SNAPSHOTS,
    firstReport: report,
    checkedAt: checkedDate,
  });
  let confirmationReport: ReturnType<typeof checkNpsSourceIntegrity> | undefined;

  if (plan.status === "confirmation-required") {
    await delay(REQUEST_DELAY_MS);
    const changedTrailIds = new Set(
      report.results
        .filter((result) => result.status === "changed")
        .map((result) => result.trailId),
    );
    const confirmationProfiles = profiles.filter((profile) =>
      changedTrailIds.has(profile.id),
    );
    const confirmationSnapshots = await fetchAllPages(confirmationProfiles);
    confirmationReport = checkNpsSourceIntegrity(
      confirmationProfiles,
      confirmationSnapshots,
      new Date().toISOString(),
    );
    plan = planNpsSourceRefresh({
      profiles,
      current: NPS_SOURCE_SNAPSHOTS,
      firstReport: report,
      confirmationReport,
      checkedAt: checkedDate,
    });
  }

  await writeReports(outputDir, report, plan, confirmationReport);

  if (plan.status === "blocked" || plan.status === "confirmation-required") {
    console.error(`NPS automatic refresh: ${plan.status.toUpperCase()}.`);
    process.exitCode = 1;
    return;
  }

  if (plan.status === "updated" || plan.status === "refreshed") {
    const document: NpsSourceSnapshotDocument = plan.document;
    await writeFile(
      SNAPSHOT_FILE,
      `${JSON.stringify(document, null, 2)}\n`,
      "utf8",
    );
  }

  console.log(
    `NPS automatic refresh: ${plan.status.toUpperCase()} (${plan.changes.length} source changes).`,
  );
  console.log(`Reports: ${path.join(outputDir, "latest.md")} and latest.json`);
}

main().catch((error: unknown) => {
  console.error(
    `NPS source-integrity checker failed before producing a report: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exitCode = 1;
});
