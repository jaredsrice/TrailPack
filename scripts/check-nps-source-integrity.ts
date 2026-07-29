import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRAIL_CATALOG } from "../src/features/trailpack/data/supported-trails";
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

const DEFAULT_OUTPUT_DIR = ".artifacts/nps-source-integrity";
const SNAPSHOT_FILE = fileURLToPath(
  new URL(
    "../src/features/trailpack/data/nps-source-snapshots.json",
    import.meta.url,
  ),
);
const MAX_HTML_BYTES = 1_000_000;
const REQUEST_DELAY_MS = 1_500;
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT =
  "TrailPack-source-integrity/0.1 (+https://github.com/jaredsrice/TrailPack)";

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

function isOfficialNpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "nps.gov" || url.hostname.endsWith(".nps.gov"))
    );
  } catch {
    return false;
  }
}

async function fetchNpsPage(profile: TrailProfile): Promise<NpsPageSnapshot> {
  if (!isOfficialNpsUrl(profile.npsSourceUrl)) {
    return {
      trailId: profile.id,
      sourceUrl: profile.npsSourceUrl,
      error: "Saved source URL is not an official HTTPS nps.gov address.",
    };
  }

  try {
    const response = await fetch(profile.npsSourceUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Cache-Control": "no-cache",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: `NPS returned HTTP ${response.status}.`,
      };
    }

    if (!isOfficialNpsUrl(response.url)) {
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: "NPS redirected the saved source to a non-NPS address.",
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: `Expected an HTML response but received ${contentType || "an unknown content type"}.`,
      };
    }

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: `NPS page exceeded the ${MAX_HTML_BYTES.toLocaleString("en-US")}-byte safety limit.`,
      };
    }

    return {
      trailId: profile.id,
      sourceUrl: profile.npsSourceUrl,
      finalUrl: response.url,
      httpStatus: response.status,
      html,
    };
  } catch (error) {
    return {
      trailId: profile.id,
      sourceUrl: profile.npsSourceUrl,
      error: error instanceof Error ? error.message : "Unknown NPS request failure.",
    };
  }
}

async function fetchAllPages(profiles: TrailProfile[]): Promise<NpsPageSnapshot[]> {
  const snapshots: NpsPageSnapshot[] = [];

  for (const [index, profile] of profiles.entries()) {
    snapshots.push(await fetchNpsPage(profile));
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
  const profiles = Object.values(TRAIL_CATALOG);
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
