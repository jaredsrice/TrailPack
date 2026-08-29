import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const details = results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map(
          (node) =>
            `  ${node.target.join(", ")}\n  ${node.failureSummary ?? "No failure summary provided."}`,
        )
        .join("\n");

      return [
        `[${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help}`,
        violation.helpUrl,
        nodes,
      ].join("\n");
    })
    .join("\n\n");

  expect(
    results.violations,
    details || "Expected axe to find no accessibility violations.",
  ).toEqual([]);
}

test("trail chooser has no automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Plan a hike/i }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("park selection returns to search and opens the selected trail", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: /Search a park or trail/i }).fill(
    "Grand Teton",
  );
  await page
    .locator(".suggestion-button")
    .filter({ hasText: "Supported park" })
    .click();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Grand Teton National Park",
    }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Jenny Lake Loop/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Two Ocean Lake Loop/i }),
  ).toBeVisible();
  await expect(page.locator(".park-trail-source")).toHaveText(
    Array(5).fill("Verified NPS + USGS profile"),
  );
  await expectNoAccessibilityViolations(page);

  await page.getByRole("button", { name: /Change park or trail/i }).click();
  await expect(
    page.getByRole("searchbox", { name: /Search a park or trail/i }),
  ).toBeFocused();

  await page.getByRole("searchbox", { name: /Search a park or trail/i }).fill(
    "Grand Teton",
  );
  await page
    .locator(".suggestion-button")
    .filter({ hasText: "Supported park" })
    .click();
  await page.getByRole("button", { name: /Two Ocean Lake Loop/i }).click();
  await expect(page.locator("#trail-profile-heading")).toContainText(
    "Two Ocean Lake Loop",
  );
  await expect(
    page.locator("#trail-profile > .section-heading-row .source-badge"),
  ).toHaveText("Verified NPS + USGS profile");
});

test("populated trail plan has no automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();

  await expect(page.locator("#trail-profile-heading")).toContainText(
    "Jenny Lake Loop",
  );
  await expect(
    page.locator("#trail-profile > .section-heading-row .source-badge"),
  ).toHaveText("Verified NPS + USGS profile");
  await expect(
    page.getByRole("heading", { name: "Accessibility and terrain" }),
  ).toBeVisible();
  await expect(page.locator(".trail-accessibility-note")).toContainText(
    "roots, exposed rock",
  );
  await expectNoAccessibilityViolations(page);
});

test("a generated trail plan opens the guarded review automatically", async ({
  page,
}) => {
  let reviewRequests = 0;
  await page.route("**/api/trailpack/ai-review", async (route) => {
    reviewRequests += 1;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        outcome: "sign-in-required",
        provider: { name: "gemini", model: "gemini-3.5-flash" },
        review: {
          status: "fallback",
          review: {
            tripSummary:
              "TrailPack kept the deterministic Jenny Lake packing list.",
            missingDataReview: [
              "Sign in to add an automatically validated live review.",
            ],
            itemExplanationDrafts: [],
          },
          validationReasons: ["Authentication is required for live AI."],
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();

  await expect(page.getByText("Sign in for live AI", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  expect(reviewRequests).toBe(1);
  await expect(
    page.getByRole("button", { name: "Refresh guarded review" }),
  ).toBeEnabled();
  await expectNoAccessibilityViolations(page);
});
