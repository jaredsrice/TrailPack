import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  JENNY_LAKE_LOOP,
  TAGGART_LAKE,
  TRAIL_CATALOG,
} from "@/features/trailpack/data/supported-trails";
import { TWO_OCEAN_LAKE_LOOP } from "@/features/trailpack/data/public-trails";
import {
  checkNpsSourceIntegrity,
  renderNpsIntegrityMarkdown,
  type NpsPageSnapshot,
} from "./nps-source-integrity";

const CHECKED_AT = "2026-07-28T16:00:00.000Z";

function fixture(name: string): string {
  return readFileSync(
    new URL(`./__fixtures__/nps-source-integrity/${name}`, import.meta.url),
    "utf8",
  );
}

function snapshot(
  trailId: string,
  html: string,
  sourceUrl = JENNY_LAKE_LOOP.npsSourceUrl,
): NpsPageSnapshot {
  return {
    trailId,
    sourceUrl,
    finalUrl: sourceUrl,
    httpStatus: 200,
    html,
  };
}

describe("checkNpsSourceIntegrity", () => {
  it("reports an unchanged profile from the current NPS things-to-do layout", () => {
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(JENNY_LAKE_LOOP.id, fixture("jenny-current.html"))],
      CHECKED_AT,
    );

    expect(report.overallStatus).toBe("pass");
    expect(report.results[0]).toMatchObject({
      trailId: "jenny-lake-loop",
      status: "unchanged",
    });
    expect(report.results[0].fields.every((field) => field.status === "match")).toBe(
      true,
    );
    expect(report.results[0].observed.accessibility).toContain(
      "roots, exposed rock",
    );
  });

  it("selects the named Two Ocean route instead of other routes on the page", () => {
    const report = checkNpsSourceIntegrity(
      [TWO_OCEAN_LAKE_LOOP],
      [
        snapshot(
          TWO_OCEAN_LAKE_LOOP.id,
          fixture("two-ocean-current.html"),
          TWO_OCEAN_LAKE_LOOP.npsSourceUrl,
        ),
      ],
      CHECKED_AT,
    );

    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "distanceMiles", observed: "6.4 mi" }),
        expect.objectContaining({ field: "elevationGainFeet", observed: "400 ft" }),
        expect.objectContaining({ field: "routeType", observed: "loop" }),
      ]),
    );
  });

  it("finds a named route statement outside the selected metric block", () => {
    const report = checkNpsSourceIntegrity(
      [TAGGART_LAKE],
      [
        snapshot(
          TAGGART_LAKE.id,
          fixture("taggart-current.html"),
          TAGGART_LAKE.npsSourceUrl,
        ),
      ],
      CHECKED_AT,
    );

    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].fields).toContainEqual(
      expect.objectContaining({
        field: "routeType",
        status: "match",
        observed: "out-and-back",
      }),
    );
  });

  it("flags a changed NPS value without mutating the TrailPack profile", () => {
    const originalDistance = JENNY_LAKE_LOOP.distanceMiles.value;
    const changedHtml = fixture("jenny-current.html").replace("7.1 mi", "7.3 mi");
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(JENNY_LAKE_LOOP.id, changedHtml)],
      CHECKED_AT,
    );

    expect(report.overallStatus).toBe("needs-review");
    expect(report.results[0].status).toBe("changed");
    expect(report.results[0].fields).toContainEqual(
      expect.objectContaining({
        field: "distanceMiles",
        status: "changed",
        expected: "7.1 mi",
        observed: "7.3 mi",
      }),
    );
    expect(JENNY_LAKE_LOOP.distanceMiles.value).toBe(originalDistance);
  });

  it("flags a missing metric block as a parser review instead of a data change", () => {
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(JENNY_LAKE_LOOP.id, fixture("missing-fields.html"))],
      CHECKED_AT,
    );

    expect(report.overallStatus).toBe("needs-review");
    expect(report.results[0].status).toBe("parse-error");
    expect(report.results[0].fields).toContainEqual(
      expect.objectContaining({ field: "distanceMiles", status: "missing" }),
    );
  });

  it("continues to match when the NPS markup layout changes", () => {
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(JENNY_LAKE_LOOP.id, fixture("jenny-layout-changed.html"))],
      CHECKED_AT,
    );

    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].status).toBe("unchanged");
  });

  it("has an explicit policy for every supported catalog profile", () => {
    const profiles = Object.values(TRAIL_CATALOG);
    const snapshots = profiles.map((profile) =>
      snapshot(profile.id, fixture("missing-fields.html"), profile.npsSourceUrl),
    );
    const report = checkNpsSourceIntegrity(profiles, snapshots, CHECKED_AT);

    expect(report.results).toHaveLength(profiles.length);
    expect(report.results.every((result) => result.status !== "configuration-error")).toBe(
      true,
    );
  });

  it("renders a reviewable non-destructive Markdown report", () => {
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(JENNY_LAKE_LOOP.id, fixture("jenny-current.html"))],
      CHECKED_AT,
    );
    const markdown = renderNpsIntegrityMarkdown(report);

    expect(markdown).toContain("Overall result: PASS");
    expect(markdown).toContain("Jenny Lake Loop");
    expect(markdown).toContain(JENNY_LAKE_LOOP.npsSourceUrl);
    expect(markdown).toContain("twice-confirmed changes");
    expect(markdown).toContain("USGS geometry");
  });
});
