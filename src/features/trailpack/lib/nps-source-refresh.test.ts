import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  JENNY_LAKE_LOOP,
  TRAIL_CATALOG,
} from "@/features/trailpack/data/supported-trails";
import {
  NPS_SOURCE_SNAPSHOTS,
  type NpsSourceSnapshotDocument,
} from "@/features/trailpack/data/nps-source-snapshots";
import {
  checkNpsSourceIntegrity,
  type NpsPageSnapshot,
} from "./nps-source-integrity";
import {
  planNpsSourceRefresh,
  renderNpsRefreshMarkdown,
} from "./nps-source-refresh";

const CHECKED_AT = "2026-08-01";
const PREVIOUS_CHECKED_AT = "2026-07-31";

function fixture(name: string): string {
  return readFileSync(
    new URL(`./__fixtures__/nps-source-integrity/${name}`, import.meta.url),
    "utf8",
  );
}

function snapshot(html: string): NpsPageSnapshot {
  return {
    trailId: JENNY_LAKE_LOOP.id,
    sourceUrl: JENNY_LAKE_LOOP.npsSourceUrl,
    finalUrl: JENNY_LAKE_LOOP.npsSourceUrl,
    httpStatus: 200,
    html,
  };
}

function currentDocument(): NpsSourceSnapshotDocument {
  const document = structuredClone(NPS_SOURCE_SNAPSHOTS);

  document.updatedAt = PREVIOUS_CHECKED_AT;
  document.trails[JENNY_LAKE_LOOP.id] = {
    ...document.trails[JENNY_LAKE_LOOP.id],
    checkedAt: PREVIOUS_CHECKED_AT,
    distanceMiles: 7.1,
    elevationGainFeet: 1_040,
    estimatedDuration: "3-5 hours",
    difficulty: "Moderate",
    routeType: "loop",
    accessibility:
      "The Jenny Lake Loop is a 7.1 mi (11.4 km) loop hike with 1,040 ft (320 m) of elevation gain with an average slope of 6%. The trail is dirt, narrow in sections, and features obstacles such as roots, exposed rock, and slight elevation change.",
  };

  return document;
}

describe("planNpsSourceRefresh", () => {
  it("refreshes the checked date without changing official values", () => {
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(fixture("jenny-current.html"))],
      `${CHECKED_AT}T00:00:00.000Z`,
    );
    const plan = planNpsSourceRefresh({
      profiles: [JENNY_LAKE_LOOP],
      current: currentDocument(),
      firstReport: report,
      checkedAt: CHECKED_AT,
    });

    expect(plan.status).toBe("refreshed");
    expect(plan.document.trails[JENNY_LAKE_LOOP.id]).toMatchObject({
      checkedAt: CHECKED_AT,
      distanceMiles: 7.1,
    });
  });

  it("requires a repeated fetch before applying a source change", () => {
    const changedHtml = fixture("jenny-current.html").replace("7.1 mi", "7.2 mi");
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(changedHtml)],
      `${CHECKED_AT}T00:00:00.000Z`,
    );
    const plan = planNpsSourceRefresh({
      profiles: [JENNY_LAKE_LOOP],
      current: currentDocument(),
      firstReport: report,
      checkedAt: CHECKED_AT,
    });

    expect(plan.status).toBe("confirmation-required");
    expect(plan.document.trails[JENNY_LAKE_LOOP.id].distanceMiles).toBe(7.1);
  });

  it("applies a bounded value after two matching NPS fetches", () => {
    const changedHtml = fixture("jenny-current.html").replaceAll("7.1 mi", "7.2 mi");
    const firstReport = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(changedHtml)],
      `${CHECKED_AT}T00:00:00.000Z`,
    );
    const confirmationReport = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(changedHtml)],
      `${CHECKED_AT}T00:01:00.000Z`,
    );
    const plan = planNpsSourceRefresh({
      profiles: [JENNY_LAKE_LOOP],
      current: currentDocument(),
      firstReport,
      confirmationReport,
      checkedAt: CHECKED_AT,
    });

    expect(plan.status).toBe("updated");
    expect(plan.document.trails[JENNY_LAKE_LOOP.id].distanceMiles).toBe(7.2);
    expect(renderNpsRefreshMarkdown(plan)).toContain("Two matching NPS fetches");
  });

  it("automatically refreshes a confirmed NPS accessibility note", () => {
    const changedHtml = fixture("jenny-current.html").replace(
      "roots, exposed rock",
      "roots, exposed rock, uneven tread",
    );
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(changedHtml)],
      `${CHECKED_AT}T00:00:00.000Z`,
    );
    const plan = planNpsSourceRefresh({
      profiles: [JENNY_LAKE_LOOP],
      current: currentDocument(),
      firstReport: report,
      confirmationReport: report,
      checkedAt: CHECKED_AT,
    });

    expect(plan.status).toBe("updated");
    expect(
      plan.document.trails[JENNY_LAKE_LOOP.id].accessibility,
    ).toContain("uneven tread");
  });

  it("blocks inconsistent repeated fetches", () => {
    const firstHtml = fixture("jenny-current.html").replaceAll("7.1 mi", "7.2 mi");
    const secondHtml = fixture("jenny-current.html").replaceAll("7.1 mi", "7.3 mi");
    const plan = planNpsSourceRefresh({
      profiles: [JENNY_LAKE_LOOP],
      current: currentDocument(),
      firstReport: checkNpsSourceIntegrity(
        [JENNY_LAKE_LOOP],
        [snapshot(firstHtml)],
        `${CHECKED_AT}T00:00:00.000Z`,
      ),
      confirmationReport: checkNpsSourceIntegrity(
        [JENNY_LAKE_LOOP],
        [snapshot(secondHtml)],
        `${CHECKED_AT}T00:01:00.000Z`,
      ),
      checkedAt: CHECKED_AT,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.document.trails[JENNY_LAKE_LOOP.id].distanceMiles).toBe(7.1);
  });

  it("blocks an implausible confirmed distance", () => {
    const changedHtml = fixture("jenny-current.html").replaceAll("7.1 mi", "20 mi");
    const report = checkNpsSourceIntegrity(
      [JENNY_LAKE_LOOP],
      [snapshot(changedHtml)],
      `${CHECKED_AT}T00:00:00.000Z`,
    );
    const plan = planNpsSourceRefresh({
      profiles: [JENNY_LAKE_LOOP],
      current: currentDocument(),
      firstReport: report,
      confirmationReport: report,
      checkedAt: CHECKED_AT,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers.join(" ")).toContain("distance");
  });

  it("has a managed snapshot for every supported profile", () => {
    expect(Object.keys(NPS_SOURCE_SNAPSHOTS.trails).sort()).toEqual(
      Object.keys(TRAIL_CATALOG).sort(),
    );
  });
});
