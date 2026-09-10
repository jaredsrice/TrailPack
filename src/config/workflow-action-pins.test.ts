import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflowDirectory = new URL("../../.github/workflows/", import.meta.url);

describe("GitHub Actions supply-chain boundary", () => {
  it("pins every external action to an immutable commit", () => {
    const actionReferences = readdirSync(workflowDirectory)
      .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
      .flatMap((file) =>
        readFileSync(new URL(file, workflowDirectory), "utf8")
          .split("\n")
          .filter((line) => /^\s*-?\s*uses:\s+[^.]/.test(line)),
      );

    expect(actionReferences.length).toBeGreaterThan(0);
    for (const reference of actionReferences) {
      expect(reference).toMatch(
        /^\s*-?\s*uses:\s+[\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s+v\d+(?:\.\d+){0,2}\s*$/,
      );
    }
  });
});
