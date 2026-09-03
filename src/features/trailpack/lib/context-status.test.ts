import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { buildContextStatus } from "@/features/trailpack/lib/context-status";
import type { AlertContext } from "@/features/trailpack/types";

describe("context status summaries", () => {
  it("labels saved demo weather and no-active alert fixtures", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];

    const status = buildContextStatus(scenario.weather, scenario.alerts);

    expect(status.weather.status).toBe("Live forecast unavailable");
    expect(status.weather.summary).toMatch(/saved example conditions, not a current forecast/);
    expect(status.weather.details).toEqual([]);
    expect(status.weather.tone).toBe("unavailable");
    expect(status.weather.notice).toMatch(/deterministic TrailPack testing/);
    expect(status.alerts.status).toBe("Live NPS alerts unavailable");
    expect(status.alerts.summary).toMatch(/could not be evaluated from live NPS data/i);
    expect(status.alerts.details).toEqual([]);
    expect(status.alerts.tone).toBe("unavailable");
  });

  it("summarizes active official alerts by title", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      label: "official",
      retrievalStatus: "live",
      alerts: [
        {
          title: "Moose-Wilson Road closure",
          description: "Road closure near the park.",
          severity: "closure",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/alerts.htm",
        },
      ],
    };

    const status = buildContextStatus(scenario.weather, alerts);

    expect(status.alerts.status).toBe("Active official alert");
    expect(status.alerts.details).toEqual(["Moose-Wilson Road closure"]);
    expect(status.alerts.tone).toBe("danger");
  });

  it.each(["info", "caution"] as const)("uses an attention colour for live %s alerts without claiming a closure", (severity) => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      label: "official",
      retrievalStatus: "live",
      alerts: [{ title: "Park notice", description: "Check before leaving.", severity, source: "NPS" }],
    };

    expect(buildContextStatus(scenario.weather, alerts).alerts).toMatchObject({
      tone: "warning",
      status: "Active official alert",
    });
  });

  it("reserves the clear state for a successful live check with no alerts", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
    const alerts: AlertContext = { ...scenario.alerts, hasActiveAlerts: false, alerts: [], retrievalStatus: "live" };

    expect(buildContextStatus(scenario.weather, alerts).alerts).toMatchObject({
      tone: "clear",
      status: "No active official alerts",
    });
  });

  it("does not promote a saved closure fixture to a live warning", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      label: "official",
      retrievalStatus: "saved-fixture",
      alerts: [{ title: "Example closure", description: "Saved example only.", severity: "closure", source: "NPS" }],
    };

    expect(buildContextStatus(scenario.weather, alerts).alerts).toMatchObject({
      tone: "unavailable",
      status: "Live NPS alerts unavailable",
      details: [],
    });
  });

  it("keeps live weather details separate from alert severity", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
    const weather = { ...scenario.weather, retrievalStatus: "live" as const };
    const status = buildContextStatus(weather, scenario.alerts);

    expect(status.weather.status).toBe("Live forecast");
    expect(status.weather.summary).toBe(weather.summary);
    expect(status.weather.details).toContain("Civil twilight ends 9:42 PM");
    expect(status.weather.tone).toBe("neutral");
    expect(status.alerts.tone).toBe("unavailable");
  });
});
