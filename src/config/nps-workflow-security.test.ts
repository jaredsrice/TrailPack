import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  new URL("../../.github/workflows/nps-source-integrity.yml", import.meta.url),
  "utf8",
);
const [validationJob, publishJob] = workflow.split(
  "\n  publish_snapshot_refresh:\n",
);

describe("monthly NPS workflow security boundary", () => {
  it("runs repository validation without a write-capable token", () => {
    expect(validationJob).toContain("permissions:\n  contents: read");
    expect(validationJob).toContain("permissions:\n      contents: read");
    expect(validationJob).toContain("persist-credentials: false");
    expect(validationJob).toContain("run: npm ci");
    expect(validationJob).not.toContain("contents: write");
    expect(validationJob).not.toContain("pull-requests: write");
    expect(validationJob).not.toContain("GH_TOKEN");
  });

  it("isolates write access in a non-executing publisher job", () => {
    expect(publishJob).toBeDefined();
    expect(publishJob).toContain("needs: verify_nps_sources");
    expect(publishJob).toContain("contents: write");
    expect(publishJob).toContain("pull-requests: write");
    expect(publishJob).toContain("actions/download-artifact@v8");
    expect(publishJob).toContain(
      "validated-nps-snapshot/nps-source-snapshots.json",
    );
    expect(publishJob).not.toMatch(/\bnpm\b/);
    expect(workflow.match(/contents: write/g)).toHaveLength(1);
    expect(workflow.match(/pull-requests: write/g)).toHaveLength(1);
  });
});
