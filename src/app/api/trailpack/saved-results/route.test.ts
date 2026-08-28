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

function oversizedStreamRequest(): {
  request: Request;
  getPullCount: () => number;
  chunkCount: number;
} {
  const chunkCount = 200;
  const chunk = new TextEncoder().encode("x".repeat(1_024));
  let pulls = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      if (pulls > chunkCount) {
        controller.close();
        return;
      }
      controller.enqueue(chunk);
    },
  });

  const streamedRequest = new Request("http://localhost/api/trailpack/saved-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream as unknown as BodyInit,
    duplex: "half",
  } as RequestInit);

  return {
    request: streamedRequest,
    getPullCount: () => pulls,
    chunkCount,
  };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("saved-results route ownership", () => {
  it("stops reading a streamed body after crossing the safety limit", async () => {
    const streamed = oversizedStreamRequest();

    const response = await POST(streamed.request);

    expect(response.status).toBe(413);
    expect(streamed.getPullCount()).toBeLessThan(streamed.chunkCount);
    await expect(response.json()).resolves.toEqual({
      error: "Saved result request is too large.",
    });
    expect(mocks.getSupabaseServerClient).not.toHaveBeenCalled();
  });

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
      order: vi.fn(),
      limit: vi.fn(async () => ({ data: [], error: null })),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-a" } }, error: null })) },
      from: vi.fn(() => query),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(query.limit).toHaveBeenCalledWith(100);
    await expect(response.json()).resolves.toEqual({ results: [] });
  });

  it("returns a controlled conflict when the database quota rejects an insert", async () => {
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(async () => ({
        data: null,
        error: { code: "23514" },
      })),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    });

    const response = await POST(
      new Request("http://localhost/api/trailpack/saved-results", {
        method: "POST",
        body: JSON.stringify(draft()),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Saved result limit reached. Delete one before saving another.",
    });
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
