import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/trailpack/alerts", () => {
  it("rejects unsupported input without caching the response", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/trailpack/alerts?trailId=unknown"),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Provide a supported trailId or parkCode.",
    });
  });

  it("returns a labeled unavailable response when the NPS key is absent", async () => {
    vi.stubEnv("NPS_API_KEY", "");

    const response = await GET(
      new NextRequest(
        "http://localhost/api/trailpack/alerts?trailId=jenny-lake-loop",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      hasActiveAlerts: false,
      alerts: [],
      retrievalStatus: "unavailable",
      label: "unavailable",
    });
  });
});
