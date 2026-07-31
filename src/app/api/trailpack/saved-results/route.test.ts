import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import { generatePackingRecommendation } from "@/features/trailpack/lib/packing";
import { buildSavedResultDraft } from "@/features/trailpack/lib/saved-results";

const mocks = vi.hoisted(() => ({ getSupabaseServerClient: vi.fn() }));

vi.mock("@/features/trailpack/lib/supabase/server", () => mocks);

import { GET, POST } from "./route";

function draft() {
  const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
  const userInput = { plannedDate: "2026-08-05", notes: "Do not store this" };
  return buildSavedResultDraft({
    trail: JENNY_LAKE_LOOP,
    userInput,
    recommendation: generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      scenario.weather,
      scenario.alerts,
      userInput,
    ),
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("saved-results route ownership", () => {
  it("derives the inserted owner from the validated session, not the request", async () => {
    const saved = draft();
    const row = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      created_at: "2026-07-30T12:00:00.000Z",
      trail_summary: saved.trailSummary,
      trip_inputs: saved.tripInputs,
      recommendation: saved.recommendation,
      source_labels: saved.sourceLabels,
    };
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(async () => ({ data: row, error: null })),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-a" } }, error: null })) },
      from: vi.fn(() => query),
    });

    const response = await POST(
      new Request("http://localhost/api/trailpack/saved-results", {
        method: "POST",
        body: JSON.stringify(saved),
      }),
    );

    expect(response.status).toBe(201);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-a" }));
    expect(query.insert.mock.calls[0][0]).not.toHaveProperty("ownerId");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("scopes list reads to the validated user before RLS applies", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(async () => ({ data: [], error: null })),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-a" } }, error: null })) },
      from: vi.fn(() => query),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-a");
    await expect(response.json()).resolves.toEqual({ results: [] });
  });

  it("does not process a valid-looking snapshot without authentication", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
    });

    const response = await POST(
      new Request("http://localhost/api/trailpack/saved-results", {
        method: "POST",
        body: JSON.stringify(draft()),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication is required." });
  });
});
