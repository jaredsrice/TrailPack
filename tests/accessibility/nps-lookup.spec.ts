import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const result = {
  kind: "nps-live-lookup", id: "6E21CE5C-45E4-4B66-9445-8764E89BCEC5",
  title: "Fairyland Loop", parkCode: "brca", park: "Bryce Canyon National Park", state: "UT",
  sourceUrl: "https://www.nps.gov/thingstodo/fairyland-loop.htm",
  duration: "4-5 Hours", durationHours: 5, retrievalStatus: "live",
  retrievedAt: "2026-09-11T20:00:00Z", distanceMiles: null, elevationGainFeet: null, routeType: null,
};
for (const width of [390, 1280]) {
  test(`NPS lookup partial plan is deliberate and accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let searches = 0;
    let expandedServiceCalls = 0;
    page.on("request", (r) => {
      if (/api\/trailpack\/(ai-review|weather|alerts|saved-results)/.test(r.url())) expandedServiceCalls++;
    });
    await page.route("**/api/trailpack/nps-lookup", (route) => {
      searches++;
      return route.fulfill({ json: { status: "ok", results: [result] } });
    });
    await page.goto("/");
    await page.getByRole("searchbox").fill("Fairyland Loop");
    expect(searches).toBe(0);
    await page.getByText("Search live NPS hikes", { exact: true }).click();
    await page.getByLabel("NPS lookup park").selectOption("brca");
    await page.getByRole("button", { name: "Search NPS", exact: true }).click();
    await page.getByRole("button", { name: "Use Fairyland Loop" }).click();
    await expect(page.getByRole("heading", { name: "Fairyland Loop", exact: true })).toBeVisible();
    await expect(page.getByText(/Weather, daylight, and alerts are unavailable/)).toBeVisible();
    await expect(page.getByLabel(/How long do you expect/)).toHaveValue("5 hours");
    await expect(page.locator("#packing-list-heading")).toHaveCount(0);
    await page.getByRole("button", { name: "Generate partial packing list" }).click();
    await expect(page.locator("#packing-list-heading")).toBeVisible();
    await page.getByLabel(/How long do you expect/).fill("8 hours");
    await expect(page.getByRole("status").filter({ hasText: "Edits are not yet in the displayed list" })).toBeVisible();
    await page.getByRole("button", { name: "Update partial packing list" }).click();
    await expect(page.getByText("Headlamp", { exact: true })).toBeVisible();
    expect(searches).toBe(1);
    expect(expandedServiceCalls).toBe(0);
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(a11y.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `.artifacts/nps-lookup-${width}.png`, fullPage: true });
    await page.getByRole("searchbox").fill("");
    await expect(page.locator("#packing-list-heading")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Fairyland Loop", exact: true })).toHaveCount(0);
  });
}
for (const alreadyGenerated of [false, true]) {
  test(`edited then restored NPS duration stays user-provided (generated: ${alreadyGenerated})`, async ({ page }) => {
    await page.route("**/api/trailpack/nps-lookup", (route) => route.fulfill({ json: { status: "ok", results: [result] } }));
    await page.goto("/");
    await page.getByRole("searchbox").fill("Fairyland Loop");
    await page.getByText("Search live NPS hikes", { exact: true }).click();
    await page.getByLabel("NPS lookup park").selectOption("brca");
    await page.getByRole("button", { name: "Search NPS", exact: true }).click();
    await page.getByRole("button", { name: "Use Fairyland Loop" }).click();
    if (alreadyGenerated) {
      await page.getByRole("button", { name: "Generate partial packing list" }).click();
    }
    await page.getByLabel(/How long do you expect/).fill("8 hours");
    await page.getByLabel(/How long do you expect/).fill("5 hours");
    const generate = page.getByRole("button", { name: alreadyGenerated ? "Update partial packing list" : "Generate partial packing list" });
    await expect(generate).toBeEnabled();
    if (alreadyGenerated) {
      await expect(page.getByRole("status").filter({ hasText: "Edits are not yet in the displayed list" })).toBeVisible();
    }
    await generate.click();
    await expect(page.getByText(/User-provided time out replaces the NPS duration for this list/)).toBeVisible();
    await expect(page.getByRole("link", { name: "NPS duration source", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Update partial packing list" })).toBeDisabled();
  });
}
for (const [name, body] of [
  ["malformed JSON", "{"],
  ["invalid envelope", "null"],
  ["oversized response", "x".repeat(16 * 1024 + 1)],
] as const) {
  test(`NPS lookup labels ${name} as an invalid response`, async ({ page }) => {
    await page.route("**/api/trailpack/nps-lookup", (route) =>
      route.fulfill({
        body,
        contentType: "application/json",
        status: 200,
      }),
    );
    await page.goto("/");
    await page.getByRole("searchbox").fill("Fairyland Loop");
    await page.getByText("Search live NPS hikes", { exact: true }).click();
    await page.getByRole("button", { name: "Search NPS", exact: true }).click();
    await expect(
      page.getByRole("status").filter({
        hasText: "NPS returned information this lookup cannot safely use.",
      }),
    ).toBeVisible();
  });
}
for (const status of ["empty", "rate-limited", "timeout", "invalid-response", "unavailable"]) {
  test(`NPS lookup ${status} preserves immediate manual fallback`, async ({ page }) => {
    await page.route("**/api/trailpack/nps-lookup", (route) => route.fulfill({ json: { status } }));
    await page.goto("/");
    await page.getByRole("searchbox").fill("Fairyland Loop");
    await page.getByText("Search live NPS hikes", { exact: true }).click();
    await page.getByRole("button", { name: "Search NPS", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Manual entry is still available" })).toBeVisible();
    await page.getByRole("button", { name: /Manual entry/ }).click();
    await expect(page.locator("#packing-list-heading")).toBeVisible();
  });
}
