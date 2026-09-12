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

  it("shows a clear completion result when the profile needs no more input", () => {
    const html = renderToStaticMarkup(createElement(AiReviewPanel, {
      review: { status: "accepted", validationReasons: [], review: {
        tripSummary: "A specific completed plan assessment.",
        missingDataReview: [],
        itemExplanationDrafts: [],
      } },
      liveOutcome: "accepted",
      isLoading: false,
    }));

    expect(html).toContain("What matters most");
    expect(html).toContain("Review result");
    expect(html).toContain("No additional planning details are needed right now");
    expect(html).not.toContain("Best next step");
  });

  it("puts missing planning details up front as the next actions", () => {
    const html = renderToStaticMarkup(createElement(AiReviewPanel, {
      review: { status: "fallback", validationReasons: ["fixture"], review: {
        tripSummary: "A specific incomplete plan assessment.",
        missingDataReview: ["Add a start time so TrailPack can check daylight."],
        itemExplanationDrafts: [],
      } },
      liveOutcome: "provider-error",
      isLoading: false,
    }));

    expect(html).toContain("What matters most");
    expect(html).toContain("Best next step");
    expect(html).toContain("Add a start time so TrailPack can check daylight.");
    expect(html).not.toContain("Review result");
  });
});
