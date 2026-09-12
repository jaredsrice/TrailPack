import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AiReviewPanel } from "./AiReviewPanel";

describe("review rejection explanation", () => {
  it("shows a safe visible rejection reason without exposing provider text", () => {
    const html = renderToStaticMarkup(createElement(AiReviewPanel, {
      review: { status: "fallback", validationReasons: ["UNTRUSTED_PRIVATE_PROVIDER_TEXT"], review: {
        tripSummary: "The baseline remains available.", missingDataReview: [], itemExplanationDrafts: [],
      } },
      liveOutcome: "rejected", isLoading: false,
    }));
    expect(html).toContain("Why this review was rejected");
    expect(html).toContain("approved explanations");
    expect(html).not.toContain("UNTRUSTED_PRIVATE_PROVIDER_TEXT");
  });
});
