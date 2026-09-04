import { mkdir, open, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUPPORTED_PARKS, TRAIL_CATALOG } from "../src/features/trailpack/data/supported-trails";
import {
  checkTrailDraft, checkTrailDefinition, isTrailDraftId,
  type TrailDraftCheck, type TrailDraftIssue,
} from "../src/features/trailpack/lib/trail-onboarding";
import { TRAIL_DEFINITIONS } from "../src/features/trailpack/data/trails";
import { NPS_SOURCE_SNAPSHOTS } from "../src/features/trailpack/data/nps-source-snapshots";
import { defineTrail } from "../src/features/trailpack/lib/trail-definition";
import { inspectTrailPhoto } from "../src/features/trailpack/lib/trail-photo";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const HELP = [
  "TrailPack trail onboarding (offline; never publishes a trail)",
  "",
  "npm run trail:new -- <trail-id> [--output-dir <new-directory>]",
  "npm run trail:check -- <trail.json> [--json]",
  "npm run trail:check -- --catalog [--json]",
  "npm run trail:check -- <trail.json> --prepare <new-directory>",
  "npm run trail:check -- templates/trails/colter-bay.example.json --existing",
  "",
  "Start with a blank draft. A pass checks structure and the local JPEG, not source truth.",
  "Prepared entries still need source review, catalog registration, tests, and PR approval.",
  "No files are overwritten. --existing is inspection-only, not an admission bypass.",
  "Guide: docs/trail-onboarding.md",
].join("\n");

interface Arguments {
  mode: "new" | "check" | "catalog";
  input: string;
  outputDir?: string;
  prepareDir?: string;
  existing: boolean;
  json: boolean;
}

function parseArguments(args: string[]): Arguments {
  const [mode, input, ...flags] = args;
  if (mode === "check" && input === "--catalog") {
    if (flags.some((flag) => flag !== "--json") || flags.length > 1) {
      throw new Error("--catalog is read-only and accepts only the optional --json flag.");
    }
    return { mode: "catalog", input: "", existing: true, json: flags.includes("--json") };
  }
  if ((mode !== "new" && mode !== "check") || !input || input.startsWith("--")) {
    throw new Error("Choose new <trail-id> or check <trail.json>. Run with --help for examples.");
  }
  const result: Arguments = { mode, input, existing: false, json: false };
  const seen = new Set<string>();
  for (let index = 0; index < flags.length; index++) {
    const flag = flags[index];
    if (seen.has(flag)) throw new Error("Duplicate option: " + flag);
    seen.add(flag);
    if (mode === "check" && (flag === "--existing" || flag === "--json")) {
      if (flag === "--existing") result.existing = true;
      else result.json = true;
    } else if ((mode === "new" && flag === "--output-dir") || (mode === "check" && flag === "--prepare")) {
      const value = flags[++index];
      if (!value || value.startsWith("--")) throw new Error(flag + " requires a new directory path.");
      if (flag === "--output-dir") result.outputDir = value;
      else result.prepareDir = value;
    } else {
      throw new Error("Unknown option for " + mode + ": " + flag + ". Run with --help.");
    }
  }
  if (result.existing && result.prepareDir) {
    throw new Error("--existing is inspection-only. Do not prepare a second copy of a registered trail.");
  }
  return result;
}

async function readBoundedFile(filename: string, limit: number): Promise<Buffer> {
  const handle = await open(filename, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new Error("Expected a regular file: " + filename);
    if (stat.size > limit) throw new Error("File is too large (limit " + limit + " bytes): " + filename);
    const bytes = Buffer.alloc(limit + 1);
    let length = 0;
    while (length < bytes.length) {
      const { bytesRead } = await handle.read(bytes, length, bytes.length - length, length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > limit) throw new Error("File grew beyond the allowed " + limit + " bytes: " + filename);
    return bytes.subarray(0, length);
  } finally {
    await handle.close();
  }
}

async function readJson(filename: string): Promise<unknown> {
  const bytes = await readBoundedFile(filename, 100_000);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error("Invalid JSON in " + filename + ": " +
      (error instanceof Error ? error.message : "check the syntax") +
      ". Use double quotes, no comments, and no trailing commas.");
  }
}

async function checkPhoto(src: string): Promise<string> {
  const publicDirectory = await realpath(path.join(ROOT, "public"));
  const filename = await realpath(path.join(publicDirectory, src.slice(1)));
  const relative = path.relative(publicDirectory, filename);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("The image resolves outside public/. Use a real local park image, not an external symlink.");
  }
  const dimensions = inspectTrailPhoto(await readBoundedFile(filename, 12_000_000));
  return dimensions.width + " x " + dimensions.height + " JPEG; sharpness and crops still need visual review.";
}

function errorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "ENOENT") return "File not found. Check the draft path or add the photo at public/park-images/.";
  if (code === "EEXIST") return "Output already exists. Choose a new output directory; nothing was overwritten.";
  if (code === "EACCES" || code === "EPERM") return "Permission denied. Choose a writable output directory or check the input file's permissions.";
  return error instanceof Error ? error.message : "Unexpected file error.";
}

async function createDirectory(directory: string): Promise<string> {
  const destination = path.resolve(directory);
  await mkdir(path.dirname(destination), { recursive: true });
  // Atomic refusal of existing targets, including symlinks. Never overwrite drafts.
  await mkdir(destination);
  return destination;
}

async function writePrepared(directory: string, result: Extract<TrailDraftCheck, { ok: true }>): Promise<string> {
  const destination = await createDirectory(directory);
  const { draft, prepared } = result;
  const id = draft.trail.id;
  const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
  const instructions = [
    "# Prepared trail: " + draft.trail.name,
    "",
    "Prepared, not approved or published. This command made no source requests.",
    "Review the evidence and the checklist in docs/trail-onboarding.md before registration.",
    "",
    "1. Preserve trail.json with the reviewed evidence.",
    "2. Add the nps-snapshot.json entry under trails in data/nps-source-snapshots.json.",
    "   Set updatedAt to at least the newest checkedAt without changing other trail review dates.",
    "3. Copy definition.json to src/features/trailpack/data/trails/" + id + ".json.",
    "   Import it once in that folder's index.ts and add it to TRAIL_DEFINITIONS.",
    "   Profiles, park membership, photo credit/crops, source policy, and unknown-data fallback derive from that registration.",
    "4. Run npm run trail:check -- --catalog, add acceptance coverage, and visually review desktop/mobile crops.",
    "5. Update docs, run the full verification checklist, and use a reviewed PR.",
    "",
    "The local JPEG must already exist. No catalog files were changed or overwritten.",
    "Photo permission review: " + draft.photo.permissionNote,
    "Route-type exception: " + (draft.sourceCheck.skipRouteTypeReason ?? "None; automated checking remains enabled."),
    "Never treat onboarding data as a live forecast or current closure report.",
    "",
  ].join("\n");
  const files: Record<string, string> = {
    "trail.json": json(draft),
    "definition.json": json(defineTrail(draft)),
    "nps-snapshot.json": json({ [id]: prepared.snapshot }),
    "README.md": instructions,
  };
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(destination, name), content, { encoding: "utf8", flag: "wx" });
  }
  return destination;
}

async function checkCatalog(json: boolean): Promise<number> {
  const trails = [];
  for (const definition of TRAIL_DEFINITIONS) {
    const result = checkTrailDefinition(definition, NPS_SOURCE_SNAPSHOTS.trails, {
      parks: SUPPORTED_PARKS, existingTrails: TRAIL_CATALOG,
      today: new Date().toISOString().slice(0, 10), allowExisting: true,
    });
    const issues = [...result.issues];
    let photo: string | undefined;
    if (result.ok) {
      try { photo = await checkPhoto(result.draft.photo.src); }
      catch (error) { issues.push({ field: "photo.src", message: errorMessage(error) }); }
    }
    trails.push({ id: definition.trail.id, ok: !issues.length, issues, warnings: result.warnings, photo });
  }
  const orphanSnapshots = Object.keys(NPS_SOURCE_SNAPSHOTS.trails).filter((id) => !Object.hasOwn(TRAIL_CATALOG, id));
  const ok = trails.every((trail) => trail.ok) && orphanSnapshots.length === 0;
  const scope = "Offline catalog/template consistency and local JPEG checks; source truth and visual acceptance still require review.";
  if (json) console.log(JSON.stringify({ ok, trails, orphanSnapshots, scope }, null, 2));
  else {
    console.log("Trail catalog: " + (ok ? "PASS" : "NEEDS WORK") + " — " + trails.length + " shared records");
    for (const trail of trails) {
      console.log((trail.ok ? "PASS " : "FAIL ") + trail.id);
      for (const issue of trail.issues) console.log("- " + issue.field + ": " + issue.message);
      for (const warning of trail.warnings) console.log("  Note: " + warning);
    }
    for (const id of orphanSnapshots) console.log("Unregistered managed snapshot: " + id);
    console.log(scope);
  }
  return ok ? 0 : 1;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    return 0;
  }
  let parsed: Arguments;
  try {
    parsed = parseArguments(args);
  } catch (error) {
    console.error(errorMessage(error) + "\n\n" + HELP);
    return 2;
  }
  try {
    if (parsed.mode === "catalog") return await checkCatalog(parsed.json);
    if (parsed.mode === "new") {
      if (!isTrailDraftId(parsed.input)) {
        throw new Error("Use a lowercase hyphenated trail ID of at most 80 characters, for example example-lake-loop.");
      }
      if (Object.hasOwn(TRAIL_CATALOG, parsed.input)) {
        throw new Error("This trail ID is already registered. Choose a new ID.");
      }
      const template = await readJson(path.join(ROOT, "templates/trails/trail.template.json")) as {
        trail: { id: string }; [key: string]: unknown;
      };
      template.trail.id = parsed.input;
      const destination = await createDirectory(parsed.outputDir ??
        path.join(ROOT, ".artifacts/trail-onboarding", parsed.input));
      const filename = path.join(destination, "trail.json");
      await writeFile(filename, JSON.stringify(template, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
      console.log("Created blank draft: " + filename);
      console.log("Fill in reviewed facts; null and empty fields are intentional. No trail was added.");
      console.log("Next: npm run trail:check -- " + JSON.stringify(filename));
      return 0;
    }
    const filename = path.resolve(parsed.input);
    const result = checkTrailDraft(await readJson(filename), {
      parks: SUPPORTED_PARKS, existingTrails: TRAIL_CATALOG,
      today: new Date().toISOString().slice(0, 10), allowExisting: parsed.existing,
    });
    const issues: TrailDraftIssue[] = [...result.issues];
    let photo: string | undefined;
    if (result.ok) {
      try {
        photo = await checkPhoto(result.draft.photo.src);
      } catch (error) {
        issues.push({ field: "photo.src", message: errorMessage(error) });
      }
    }
    let preparedDirectory: string | undefined;
    if (result.ok && !issues.length && parsed.prepareDir) {
      preparedDirectory = await writePrepared(parsed.prepareDir, result);
    }
    const report = {
      ok: issues.length === 0, file: filename, issues, warnings: result.warnings,
      photo, preparedDirectory,
      scope: "Offline structure and local-photo checks only; source truth, visual acceptance, and admission still require review.",
    };
    if (parsed.json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log("Trail draft: " + (report.ok ? "PASS" : "NEEDS WORK") + " — " + filename);
      for (const issue of issues) console.log("- " + issue.field + ": " + issue.message);
      for (const warning of result.warnings) console.log("Note: " + warning);
      if (photo) console.log("Photo: " + photo);
      if (preparedDirectory) console.log("Prepared review entries: " + preparedDirectory);
      console.log(report.scope);
      console.log("Guide: docs/trail-onboarding.md");
    }
    return report.ok ? 0 : 1;
  } catch (error) {
    const issue = { field: "$file", message: errorMessage(error) };
    if (parsed.json) console.log(JSON.stringify({ ok: false, issues: [issue], warnings: [] }, null, 2));
    else console.error(issue.message + "\nGuide: docs/trail-onboarding.md");
    return 2;
  }
}

main().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
  console.error(errorMessage(error));
  process.exitCode = 2;
});
