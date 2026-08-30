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

test("one generated packing list requests one guarded review", async ({
  page,
}) => {
  let reviewRequests = 0;
  await page.route("**/api/trailpack/alerts?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hasActiveAlerts: true,
        alerts: [
          {
            title: "Death Canyon Trailhead Construction Closure",
            description: "Death Canyon Road and Trailhead are closed to all use.",
            severity: "closure",
            source: "NPS",
            sourceUrl:
              "https://www.nps.gov/grte/planyourvisit/road-construction.htm",
          },
        ],
        label: "official",
        retrievalStatus: "live",
      }),
    });
  });
  await page.route("**/api/trailpack/ai-review", async (route) => {
    reviewRequests += 1;
    const requestBody = route.request().postDataJSON();
    expect(requestBody.generationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(requestBody.input.trail.id).toBe("jenny-lake-loop");
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

  await expect(
    page.getByRole("heading", { name: "Active official alert" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: /What time will you start/i })
    .fill("6 AM");
  await page
    .getByRole("textbox", { name: /How long do you expect/i })
    .fill("6 hours");
  await page
    .getByRole("textbox", { name: /current trail conditions/i })
    .fill("wet");
  await page.waitForTimeout(1_700);
  expect(reviewRequests).toBe(0);

  await page
    .getByRole("button", { name: "Generate packing list" })
    .click();

  await expect(page.getByText("Sign in for live AI", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  expect(reviewRequests).toBe(1);
  await expect(
    page.getByRole("button", { name: "Packing list is current" }),
  ).toBeDisabled();

  await page
    .getByRole("textbox", { name: /How long do you expect/i })
    .fill("8 hours");
  await page.waitForTimeout(1_700);
  expect(reviewRequests).toBe(1);
  await page.getByRole("button", { name: "Update packing list" }).click();
  await expect.poll(() => reviewRequests).toBe(2);
  await expectNoAccessibilityViolations(page);
});
