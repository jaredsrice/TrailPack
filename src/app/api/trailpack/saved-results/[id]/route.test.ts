import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSupabaseServerClient: vi.fn() }));

vi.mock("@/features/trailpack/lib/supabase/server", () => mocks);

import { DELETE } from "./route";

const SAVED_RESULT_ID = "123e4567-e89b-42d3-a456-426614174000";

function request() {
  return new Request(
    `https://trailpack.example/api/trailpack/saved-results/${SAVED_RESULT_ID}`,
    { method: "DELETE" },
  );
}

function context(id = SAVED_RESULT_ID) {
  return { params: Promise.resolve({ id }) };
}

function deleteQuery(result: { data: { id: string } | null; error: unknown }) {
  const query = {
    delete: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(async () => result),
  };
  query.delete.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return query;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("DELETE /api/trailpack/saved-results/[id]", () => {
  it("rejects an invalid identifier before opening a database client", async () => {
    const response = await DELETE(request(), context("not-a-uuid"));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.getSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
    });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
  });

  it("returns not found when the authenticated user does not own the row", async () => {
    const query = deleteQuery({ data: null, error: null });
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-b" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(404);
    expect(query.eq.mock.calls).toEqual([
      ["id", SAVED_RESULT_ID],
      ["user_id", "user-b"],
    ]);
    await expect(response.json()).resolves.toEqual({
      error: "Saved result was not found.",
    });
  });

  it("deletes a row owned by the authenticated user", async () => {
    const query = deleteQuery({ data: { id: SAVED_RESULT_ID }, error: null });
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(query.eq.mock.calls).toEqual([
      ["id", SAVED_RESULT_ID],
      ["user_id", "user-a"],
    ]);
  });

  it("returns a generic error when the database delete fails", async () => {
    const query = deleteQuery({ data: null, error: { code: "XX000" } });
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        })),
      },
      from: vi.fn(() => query),
    });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Saved result could not be deleted.",
    });
  });
});
