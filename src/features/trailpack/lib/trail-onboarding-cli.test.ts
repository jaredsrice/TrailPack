import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import example from "../../../../templates/trails/colter-bay.example.json";

const ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const CLI = path.join(ROOT, "scripts/trail-onboarding.ts");
let testDirectory: string;

function run(...args: string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", CLI, ...args], {
    cwd: ROOT, encoding: "utf8", timeout: 15_000,
  });
}

function draftFile(): string {
  const draft = structuredClone(example);
  draft.trail.id = "onboarding-cli-test";
  draft.trail.name = "Onboarding CLI Test";
  draft.sourceCheck.aliases = ["Onboarding CLI Test"];
  const filename = path.join(testDirectory, "trail.json");
  writeFileSync(filename, JSON.stringify(draft));
  return filename;
}

beforeEach(() => { testDirectory = mkdtempSync(path.join(tmpdir(), "trailpack-onboarding-test-")); });
afterEach(() => { rmSync(testDirectory, { recursive: true, force: true }); });

describe("trail onboarding commands", () => {
  it("creates a blank draft and refuses to overwrite it", () => {
    const destination = path.join(testDirectory, "draft with spaces");
    const created = run("new", "example-lake-loop", "--output-dir", destination);
    expect(created.status, created.stderr).toBe(0);
    const filename = path.join(destination, "trail.json");
    const before = readFileSync(filename, "utf8");
    const draft = JSON.parse(before);
    expect(draft.trail.id).toBe("example-lake-loop");
    expect(draft.official.distanceMiles).toBeNull();
    const repeated = run("new", "example-lake-loop", "--output-dir", destination);
    expect(repeated.status).toBe(2);
    expect(repeated.stderr).toContain("nothing was overwritten");
    expect(readFileSync(filename, "utf8")).toBe(before);
  });

  it("validates the documented existing example without generating files", () => {
    const result = run("check", "templates/trails/colter-bay.example.json", "--existing", "--json");
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.ok).toBe(true);
    expect(report.photo).toContain("JPEG");
    expect(report.preparedDirectory).toBeUndefined();
    expect(report.scope).toContain("source truth");
  });

  it("reports actionable fields for an incomplete draft and writes no package", () => {
    const destination = path.join(testDirectory, "prepared");
    const result = run("check", "templates/trails/trail.template.json", "--prepare", destination, "--json");
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).issues).toContainEqual(expect.objectContaining({ field: "official.distanceMiles" }));
    expect(existsSync(destination)).toBe(false);
  });

  it("prepares a coordinated review package and never registers the draft", () => {
    const filename = draftFile();
    const destination = path.join(testDirectory, "prepared");
    const catalogBefore = readFileSync(path.join(ROOT, "src/features/trailpack/data/trails/index.ts"), "utf8");
    const result = run("check", filename, "--prepare", destination, "--json");
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(readdirSync(destination).sort()).toEqual([
      "README.md", "definition.json", "nps-snapshot.json", "trail.json",
    ]);
    const snapshot = JSON.parse(readFileSync(path.join(destination, "nps-snapshot.json"), "utf8"));
    expect(snapshot["onboarding-cli-test"].distanceMiles).toBe(example.official.distanceMiles);
    const definition = JSON.parse(readFileSync(path.join(destination, "definition.json"), "utf8"));
    expect(definition.trail.id).toBe("onboarding-cli-test");
    expect(definition.official.sourceUrl).toBe(snapshot["onboarding-cli-test"].sourceUrl);
    expect(definition.official.distanceMiles).toBeUndefined();
    expect(readFileSync(path.join(destination, "README.md"), "utf8")).toContain("Prepared, not approved or published");
    expect(readFileSync(path.join(ROOT, "src/features/trailpack/data/trails/index.ts"), "utf8")).toBe(catalogBefore);
    const again = run("check", filename, "--prepare", destination);
    expect(again.status).toBe(2);
    expect(again.stderr).toContain("nothing was overwritten");
  });

  it("will not prepare an existing trail by bypassing duplicate protection", () => {
    const destination = path.join(testDirectory, "prepared");
    const result = run("check", "templates/trails/colter-bay.example.json", "--existing", "--prepare", destination);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("inspection-only");
    expect(existsSync(destination)).toBe(false);
  });

  it("checks every approved template and photo without publishing", () => {
    const before = readdirSync(testDirectory);
    const result = run("check", "--catalog", "--json");
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.ok).toBe(true);
    expect(report.trails.length).toBeGreaterThanOrEqual(5);
    expect(report.trails.every((trail: { ok: boolean; photo: string }) => trail.ok && trail.photo.includes("JPEG"))).toBe(true);
    expect(report.orphanSnapshots).toEqual([]);
    expect(readdirSync(testDirectory)).toEqual(before);
  });

  it("reports a missing local photo and does not prepare partial entries", () => {
    const filename = draftFile();
    const draft = JSON.parse(readFileSync(filename, "utf8"));
    draft.photo.src = "/park-images/onboarding-nonexistent-photo.jpg";
    writeFileSync(filename, JSON.stringify(draft));
    const destination = path.join(testDirectory, "prepared");
    const result = run("check", filename, "--prepare", destination, "--json");
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).issues).toContainEqual({
      field: "photo.src", message: expect.stringContaining("File not found"),
    });
    expect(existsSync(destination)).toBe(false);
  });

  it("explains malformed JSON, missing files, and oversized input", () => {
    const filename = path.join(testDirectory, "bad.json");
    writeFileSync(filename, '{ "schemaVersion": 1, }');
    const malformed = run("check", filename, "--json");
    expect(malformed.status).toBe(2);
    expect(JSON.parse(malformed.stdout).issues[0].message).toContain("no trailing commas");
    const absent = run("check", path.join(testDirectory, "absent.json"), "--json");
    expect(absent.status).toBe(2);
    expect(JSON.parse(absent.stdout).issues[0].message).toContain("File not found");
    writeFileSync(filename, " ".repeat(100_001));
    const large = run("check", filename, "--json");
    expect(large.status).toBe(2);
    expect(JSON.parse(large.stdout).issues[0].message).toContain("too large");
  });

  it.each([
    ["new", "../../escape"],
    ["new", "colter-bay-lakeshore-trail"],
    ["new", "example-loop", "--output-dir"],
    ["check"],
    ["check", "trail.json", "--unknown"],
    ["check", "trail.json", "--prepare"],
    ["check", "trail.json", "--json", "--json"],
    ["check", "--catalog", "--prepare", "output"],
    ["check", "--catalog", "--existing"],
  ])("rejects invalid command arguments %j", (...args) => {
    expect(run(...args).status).toBe(2);
  });

  it("provides a short help screen", () => {
    const result = run("--help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("npm run trail:new");
    expect(result.stdout).toContain("never publishes");
  });
});
