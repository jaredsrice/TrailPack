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

const PADDED_STRING_KEYS = new Set([
  "name",
  "trailId",
  "trailName",
  "park",
  "state",
  "plannedDate",
  "startTime",
  "expectedDuration",
  "trailConditions",
  "distanceMiles",
  "elevationGainFeet",
  "generatedAt",
  "confidenceNote",
  "missingDetails",
  "id",
  "title",
  "summary",
  "affectedBy",
  "question",
  "recommendation",
  "why",
  "answer",
  "reason",
  "label",
  "text",
]);

function validDraftTextAtByteLength(targetBytes: number): string {
  const value = JSON.parse(JSON.stringify(draft())) as Record<string, unknown>;
  const slots: Array<{ container: Record<string, unknown> | unknown[]; key: string | number }> = [];

  function collect(node: unknown, parentKey = "") {
    if (Array.isArray(node)) {
      node.forEach((entry, index) => {
        if (typeof entry === "string" && PADDED_STRING_KEYS.has(parentKey)) {
          slots.push({ container: node, key: index });
        } else {
          collect(entry, parentKey);
        }
      });
      return;
    }
    if (typeof node !== "object" || node === null) {
      return;
    }
    Object.entries(node).forEach(([key, entry]) => {
      if (typeof entry === "string" && PADDED_STRING_KEYS.has(key)) {
        slots.push({ container: node as Record<string, unknown>, key });
      } else {
        collect(entry, key);
      }
    });
  }

  collect(value);
  let text = JSON.stringify(value);
  for (const slot of slots) {
    const remaining = targetBytes - new TextEncoder().encode(text).byteLength;
    if (remaining <= 0) {
      break;
    }
    const current = Array.isArray(slot.container)
      ? String(slot.container[slot.key as number])
      : String(slot.container[slot.key as string]);
    const addition = Math.min(2_000 - current.length, remaining);
    if (addition > 0) {
      if (Array.isArray(slot.container)) {
        slot.container[slot.key as number] = `${current}${"x".repeat(addition)}`;
      } else {
        slot.container[slot.key as string] = `${current}${"x".repeat(addition)}`;
      }
      text = JSON.stringify(value);
    }
  }

  if (new TextEncoder().encode(text).byteLength !== targetBytes) {
    throw new Error(`Unable to build a valid ${targetBytes}-byte saved result`);
  }
  return text;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("saved-results route ownership", () => {
  it("rejects signed-out list reads before opening the saved-results table", async () => {
    const from = vi.fn();
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
      from,
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects a signed-out request before consuming its body", async () => {
    let bodyPulled = false;
    const body = new TextEncoder().encode(JSON.stringify(draft()));
    const request = new Request("http://localhost/api/trailpack/saved-results", {
      method: "POST",
      body: new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            bodyPulled = true;
            controller.enqueue(body);
            controller.close();
          },
        },
        { highWaterMark: 0 },
      ) as unknown as BodyInit,
      duplex: "half",
    } as RequestInit);
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(bodyPulled).toBe(false);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("stops reading a streamed body after crossing the safety limit", async () => {
    const streamed = oversizedStreamRequest();
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        })),
      },
    });

    const response = await POST(streamed.request);

    expect(response.status).toBe(413);
    expect(streamed.getPullCount()).toBeLessThan(streamed.chunkCount);
    await expect(response.json()).resolves.toEqual({
      error: "Saved result request is too large.",
    });
    expect(mocks.getSupabaseServerClient).toHaveBeenCalledOnce();
  });

  it("accepts a valid request at exactly 64,000 bytes", async () => {
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
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    });
    const body = validDraftTextAtByteLength(64_000);

    const response = await POST(
      new Request("http://localhost/api/trailpack/saved-results", {
        method: "POST",
        body,
      }),
    );

    expect(new TextEncoder().encode(body)).toHaveLength(64_000);
    expect(response.status).toBe(201);
    expect(query.insert).toHaveBeenCalledOnce();
  });

  it("rejects a valid request at 64,001 bytes before database work", async () => {
    const query = { insert: vi.fn() };
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    });
    const body = validDraftTextAtByteLength(64_001);

    const response = await POST(
      new Request("http://localhost/api/trailpack/saved-results", {
        method: "POST",
        body,
      }),
    );

    expect(response.status).toBe(413);
    expect(query.insert).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("no-store");
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

  it("fails safely when a stored row no longer matches the canonical contract", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(async () => ({
        data: [{ id: "malformed-row", created_at: "invalid" }],
        error: null,
      })),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    });

    const response = await GET();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Saved results could not be loaded.",
    });
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

  it("fails closed when session validation unexpectedly rejects", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => {
          throw new Error("auth unavailable");
        }),
      },
    });

    const response = await POST(
      new Request("http://localhost/api/trailpack/saved-results", {
        method: "POST",
        body: JSON.stringify(draft()),
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
