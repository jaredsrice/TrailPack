import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";

const { fetchWeatherMock } = vi.hoisted(() => ({
  fetchWeatherMock: vi.fn(),
}));

vi.mock("@/features/trailpack/lib/external-context", () => ({
  fetchOpenMeteoWeatherContext: fetchWeatherMock,
}));

import { GET } from "./route";

function request(query = ""): NextRequest {
  return new NextRequest(
    `http://localhost/api/trailpack/weather${query ? `?${query}` : ""}`,
  );
}

beforeEach(() => {
  fetchWeatherMock.mockReset();
  fetchWeatherMock.mockResolvedValue(
    DEMO_CONTEXTS["jenny-lake-loop"].weather,
  );
});

describe("GET /api/trailpack/weather", () => {
  it("passes the selected date to the weather provider", async () => {
    const response = await GET(
      request("trailId=jenny-lake-loop&date=2026-07-28"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchWeatherMock).toHaveBeenCalledWith("jenny-lake-loop", {
      plannedDate: "2026-07-28",
    });
  });

  it("rejects malformed or impossible dates before provider work", async () => {
    for (const value of ["07-28-2026", "2026-02-30"]) {
      const response = await GET(
        request(`trailId=jenny-lake-loop&date=${value}`),
      );

      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toEqual({
        error: "Invalid date query parameter.",
      });
    }

    expect(fetchWeatherMock).not.toHaveBeenCalled();
  });

  it("returns controlled errors for missing and unsupported trail ids", async () => {
    const missing = await GET(request());
    const unsupported = await GET(request("trailId=unknown-trail"));

    expect(missing.status).toBe(400);
    expect(unsupported.status).toBe(400);
    expect(missing.headers.get("cache-control")).toBe("no-store");
    expect(unsupported.headers.get("cache-control")).toBe("no-store");
    expect(fetchWeatherMock).not.toHaveBeenCalled();
  });

  it("returns a controlled unavailable response when no context exists", async () => {
    fetchWeatherMock.mockResolvedValueOnce(null);

    const response = await GET(request("trailId=jenny-lake-loop"));

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Weather context is unavailable for this trail.",
    });
  });
});
