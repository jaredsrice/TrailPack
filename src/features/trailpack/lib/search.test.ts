import { describe, expect, it } from "vitest";
import { getSearchSuggestions } from "@/features/trailpack/lib/search";

describe("getSearchSuggestions", () => {
  it("finds Taggart Lake by trail name", () => {
    const suggestions = getSearchSuggestions("taggart");
    expect(
      suggestions.some((suggestion) => suggestion.trailId === "taggart-lake"),
    ).toBe(true);
  });

  it("finds String Lake Loop by trail name", () => {
    const suggestions = getSearchSuggestions("string");
    expect(
      suggestions.some((suggestion) => suggestion.trailId === "string-lake-loop"),
    ).toBe(true);
  });

  it("still finds Grand Teton by park search", () => {
    const suggestions = getSearchSuggestions("teton");
    expect(suggestions).toContainEqual({
      id: "park-grand-teton",
      type: "park",
      title: "Grand Teton National Park",
      subtitle: "Supported park · Wyoming",
      parkId: "grand-teton",
    });
  });

  it.each([
    ["colter bay", "colter-bay-lakeshore-trail"],
    ["two ocean", "two-ocean-lake-loop"],
  ])("finds verified public-source import %s", (query, trailId) => {
    const suggestions = getSearchSuggestions(query);
    expect(suggestions).toContainEqual(
      expect.objectContaining({
        type: "public-trail",
        trailId,
      }),
    );
  });

  it("returns manual entry when a trail is not in the verified catalog", () => {
    expect(getSearchSuggestions("Cascade Canyon")).toEqual([
      expect.objectContaining({ type: "manual", id: "manual-entry" }),
    ]);
  });

  it("does not treat any query containing loop as every loop trail", () => {
    const suggestions = getSearchSuggestions("unknown loop name");
    expect(suggestions).toEqual([
      expect.objectContaining({ type: "manual", id: "manual-entry" }),
    ]);
  });
});
