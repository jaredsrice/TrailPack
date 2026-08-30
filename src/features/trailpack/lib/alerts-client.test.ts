import { describe, expect, it, vi } from "vitest";
import {
  parseAlertContextResponse,
  requestTrailAlerts,
} from "@/features/trailpack/lib/alerts-client";

const LIVE_ALERT_RESPONSE = {
  hasActiveAlerts: true,
  alerts: [
    {
      title: "Death Canyon Trailhead Construction Closure",
      description: "Death Canyon Road and Trailhead are closed to all use.",
      severity: "closure",
      source: "NPS",
      sourceUrl:
        "https://www.nps.gov/grte/planyourvisit/road-construction.htm",
    },
  ],
  label: "official",
  retrievalStatus: "live",
} as const;

function asFetch(response: Response): typeof fetch {
  return vi.fn(async () => response) as unknown as typeof fetch;
}

describe("NPS alert route client", () => {
  it("requests live alerts for the selected trail", async () => {
    const fetchImpl = asFetch(Response.json(LIVE_ALERT_RESPONSE));
    const controller = new AbortController();

    const alerts = await requestTrailAlerts("jenny-lake-loop", {
      fetchImpl,
      signal: controller.signal,
    });

    expect(alerts).toMatchObject({
      hasActiveAlerts: true,
      retrievalStatus: "live",
      label: "official",
    });

    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url).toBe("/api/trailpack/alerts?trailId=jenny-lake-loop");
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
  });

  it("does not expose route error bodies to the UI", async () => {
    const fetchImpl = asFetch(
      new Response("private provider detail", { status: 500 }),
    );

    await expect(
      requestTrailAlerts("jenny-lake-loop", { fetchImpl }),
    ).rejects.not.toThrow(/private provider detail/i);
  });
});

describe("NPS alert response parser", () => {
  it("keeps only the bounded live-alert response shape", () => {
    const alerts = parseAlertContextResponse({
      ...LIVE_ALERT_RESPONSE,
      internalProviderDetail: "must not reach the client model",
    });

    expect(alerts).not.toBeNull();
    expect(alerts).not.toHaveProperty("internalProviderDetail");
    expect(alerts?.alerts[0]?.title).toMatch(/Death Canyon/i);
  });

  it("accepts a labeled unavailable response", () => {
    expect(
      parseAlertContextResponse({
        hasActiveAlerts: false,
        alerts: [],
        label: "unavailable",
        retrievalStatus: "saved-fixture",
        statusReason: "Using saved alert context.",
      }),
    ).toMatchObject({
      hasActiveAlerts: false,
      retrievalStatus: "saved-fixture",
    });
  });

  it.each([
    {
      ...LIVE_ALERT_RESPONSE,
      hasActiveAlerts: false,
    },
    {
      ...LIVE_ALERT_RESPONSE,
      alerts: [
        {
          ...LIVE_ALERT_RESPONSE.alerts[0],
          sourceUrl: "https://nps.gov.example.com/closure",
        },
      ],
    },
    {
      ...LIVE_ALERT_RESPONSE,
      alerts: Array.from({ length: 11 }, () => LIVE_ALERT_RESPONSE.alerts[0]),
    },
  ])("rejects an inconsistent or unsafe response %#", (value) => {
    expect(parseAlertContextResponse(value)).toBeNull();
  });
});
