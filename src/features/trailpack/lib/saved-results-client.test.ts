import { describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import { generatePackingRecommendation } from "@/features/trailpack/lib/packing";
import {
  listSavedResultsFromRoute,
  saveResultFromRoute,
} from "@/features/trailpack/lib/saved-results-client";
import { buildSavedResultDraft } from "@/features/trailpack/lib/saved-results";

function draft() {
  const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
  return buildSavedResultDraft({
    trail: JENNY_LAKE_LOOP,
    userInput: { startTime: "8 AM" },
    recommendation: generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      scenario.weather,
      scenario.alerts,
      { startTime: "8 AM" },
    ),
  });
}

function asFetch(response: Response): typeof fetch {
  return vi.fn(async () => response) as unknown as typeof fetch;
}

describe("saved results route client", () => {
  it("parses a bounded saved-result response", async () => {
    const value = draft();
    const fetchImpl = asFetch(
      Response.json({
        result: {
          ...value,
          id: "3f9a1f5e-6144-4f20-b1ad-32f8cc77d4bc",
          createdAt: "2026-08-30T12:00:00.000Z",
        },
      }),
    );

    await expect(saveResultFromRoute(value, fetchImpl)).resolves.toMatchObject({
      id: "3f9a1f5e-6144-4f20-b1ad-32f8cc77d4bc",
      trailSummary: { name: "Jenny Lake Loop" },
    });
  });

  it("rejects an oversized list body with the generic client error", async () => {
    let cancelled = false;
    const response = new Response(
      new ReadableStream<Uint8Array>({
        cancel() {
          cancelled = true;
        },
      }),
      { headers: { "content-length": "6600001" } },
    );

    await expect(
      listSavedResultsFromRoute(asFetch(response)),
    ).rejects.toThrow("TrailPack could not update saved results.");
    expect(cancelled).toBe(true);
  });

  it("does not expose malformed route bodies in client errors", async () => {
    const fetchImpl = asFetch(
      new Response("private database detail", { status: 500 }),
    );

    await expect(listSavedResultsFromRoute(fetchImpl)).rejects.not.toThrow(
      /private database detail/i,
    );
  });
});
