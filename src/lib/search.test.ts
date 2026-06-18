import { describe, expect, it } from "vitest";
import { getSearchSuggestions } from "@/lib/search";

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
});
