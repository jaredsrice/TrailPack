import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { buildContextStatus } from "@/features/trailpack/lib/context-status";
import type { AlertContext } from "@/features/trailpack/types";

describe("context status summaries", () => {
  it("labels saved demo weather and no-active alert fixtures", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];

    const status = buildContextStatus(scenario.weather, scenario.alerts);

    expect(status.weather.status).toBe("Saved demo forecast");
    expect(status.weather.summary).toMatch(/Partly sunny/);
    expect(status.weather.details).toContain("Civil twilight ends 9:42 PM");
    expect(status.alerts.status).toBe("No active alerts in saved fixture");
    expect(status.alerts.details).toEqual([]);
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
  });
});
