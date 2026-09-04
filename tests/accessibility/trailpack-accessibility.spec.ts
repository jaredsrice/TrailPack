import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTEXTS } from "../../src/features/trailpack/data/demo-contexts";
import {
  PARK_PHOTO_ROTATION,
  getContextParkPhoto,
  type ParkPhoto,
} from "../../src/features/trailpack/data/park-images";
import type { LiveAiOutcome } from "../../src/features/trailpack/lib/ai-contract";
import type { AlertContext } from "../../src/features/trailpack/types";
import { TRAIL_CATALOG } from "../../src/features/trailpack/data/trail-catalog";

const JENNY_SCENARIO = DEMO_CONTEXTS["jenny-lake-loop"];

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  for (const id of [
    "lunch-tree-hill", "christian-pond-loop", "lake-creek-woodland-loop", "phelps-lake-loop",
    "heron-pond-swan-lake-loop", "hermitage-point",
  ]) {
    test(`new trail ${id} works as a guest with unknown live conditions at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
      });
      const trail = TRAIL_CATALOG[id];
      const scenario = DEMO_CONTEXTS[id];
      let weatherRequests = 0;
      await page.route("**/api/trailpack/weather?*", (route) => {
        weatherRequests += 1;
        return route.fulfill({
          status: 200, contentType: "application/json",
          // Exercise both the valid unknown-data contract and the client failure path.
          body: JSON.stringify(viewport.width === 390 ? { invalid: true } : scenario.weather),
        });
      });
      await page.route("**/api/trailpack/alerts?*", (route) => route.fulfill({
        status: 200, contentType: "application/json", body: JSON.stringify(scenario.alerts),
      }));
      await page.route("**/api/trailpack/ai-review", (route) => route.fulfill({
        status: 401, contentType: "application/json", body: signedOutReviewBody(trail.name),
      }));
      await page.goto("/");
      await expect(page).toHaveTitle(/TrailPack/);
      await page.getByRole("searchbox", { name: /Search a park or trail/i }).fill(trail.name);
      await page.locator(".suggestion-button").filter({ hasText: trail.name }).click();
      await expect(page.locator("#trail-profile-heading")).toContainText(trail.name);
      await expect(page.locator(".trail-accessibility-note")).toContainText(trail.accessibility!.value);
      await expectCurrentPhoto(page, getContextParkPhoto({ selectedParkId: "grand-teton", selectedTrailId: id })!);
      await expect(page.getByRole("heading", { name: "Weather unavailable", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Live NPS alerts unavailable", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Generate packing list", exact: true })).toBeEnabled();
      await page.getByLabel(/When do you plan to hike/i).fill("2026-09-05");
      await expect.poll(() => weatherRequests).toBe(2);
      await expect(page.getByRole("button", { name: "Generate packing list", exact: true })).toBeEnabled();
      await expect(page.getByRole("heading", { name: "Weather unavailable", exact: true })).toBeVisible();
      await expect(page.getByText("Saved weather example", { exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: "Generate packing list", exact: true }).click();
      await expect(page.locator("#packing-list-heading")).toContainText(trail.name);
      await expect(page.getByText("Guest review ready", { exact: true })).toBeVisible();
      expect(await page.locator(".packing-item").count()).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await expectNoAccessibilityViolations(page);
      await page.locator(".park-photo-showcase").screenshot({ path: `/tmp/trailpack-${id}-${viewport.width}.png` });
      expect(errors).toEqual([]);
    });
  }
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  for (const hot of [false, true]) {
    test(`non-closure NPS guidance remains once with hot weather ${hot} at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.route("**/api/trailpack/weather?*", (route) => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          ...JENNY_SCENARIO.weather,
          retrievalStatus: "live",
          temperatureF: { high: hot ? 99 : 70, low: 60, current: 65 },
          conditions: ["sun"], precipitationChance: 0, windMph: 5,
        }),
      }));
      await page.route("**/api/trailpack/alerts?*", (route) => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          hasActiveAlerts: true, label: "official", retrievalStatus: "live",
          alerts: [{ title: "Visitor center hours", description: "Check opening hours before visiting.", severity: "info", source: "NPS", sourceUrl: "https://www.nps.gov/grte/planyourvisit/hours.htm" }],
        }),
      }));
      await page.route("**/api/trailpack/ai-review", (route) => route.fulfill({
        status: 401, contentType: "application/json", body: signedOutReviewBody("Jenny Lake Loop"),
      }));
      await page.goto("/");
      await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
      await page.getByRole("button", { name: "Generate packing list" }).click();
      await expect(page.getByText("Review active alerts before leaving", { exact: true })).toHaveCount(1);
      const guidance = page.locator(".packing-item > summary").filter({ hasText: "Review active alerts before leaving" });
      await expect(guidance).toContainText("Visitor center hours");
      await expect(page.locator(".trip-alerts").filter({ hasText: "Visitor center hours" })).toHaveCount(0);
      if (hot) {
        await expect(page.getByText("Trip safety decision", { exact: true })).toHaveCount(1);
        await expect(page.locator(".trip-alerts")).toContainText(/heat/i);
      } else {
        await expect(page.getByText("Trip safety decision", { exact: true })).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await expectNoAccessibilityViolations(page);
    });
  }

  test(`weather fallback and alert severity stay clear at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockWeather(page);
    const exampleAlert: AlertContext["alerts"][number] = {
      title: "Death Canyon Trailhead Construction Closure",
      description: "A park notice to review before leaving.",
      severity: "closure",
      source: "NPS",
      sourceUrl: "https://www.nps.gov/grte/alerts.htm",
    };
    let currentAlerts: AlertContext = {
      hasActiveAlerts: true,
      label: "official",
      retrievalStatus: "live",
      alerts: [exampleAlert],
    };
    await page.route("**/api/trailpack/alerts?*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(currentAlerts) });
    });

    for (const state of [
      { tone: "danger", retrievalStatus: "live", severity: "closure", active: true, heading: "1 park notice", title: "Death Canyon Trailhead Construction Closure" },
      { tone: "warning", retrievalStatus: "live", severity: "caution", active: true, heading: "1 park notice", title: "Construction on North Park Road" },
      { tone: "clear", retrievalStatus: "live", severity: "info", active: false, heading: "No active official alerts", title: "" },
      { tone: "unavailable", retrievalStatus: "saved-fixture", severity: "info", active: false, heading: "Live NPS alerts unavailable", title: "" },
    ] as const) {
      currentAlerts = {
        ...currentAlerts,
        hasActiveAlerts: state.active,
        retrievalStatus: state.retrievalStatus,
        alerts: state.active ? [{ ...exampleAlert, title: state.title, severity: state.severity }] : [],
      };
      await page.goto("/");
      await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();

      const alertCard = page.locator('.context-card[data-context="alert"]');
      await expect(alertCard).toHaveAttribute("data-tone", state.tone);
      await expect(alertCard.getByRole("heading", { name: state.heading, exact: true })).toBeVisible();
      await expect(alertCard.locator(".context-detail-pill")).toHaveCount(0);
      if (state.active) {
        await expect(alertCard.locator(".context-summary")).not.toContainText(state.title);
        await expect(alertCard.getByRole("heading", { name: state.title, exact: true })).toBeHidden();
        await alertCard.getByText("NPS notices and sources", { exact: true }).click();
        await expect(alertCard.getByRole("heading", { name: state.title, exact: true })).toBeVisible();
      } else {
        await expect(alertCard.locator(".alert-notice-details")).toHaveCount(0);
      }
      await expect(page.getByRole("button", { name: "Generate packing list" })).toBeEnabled();

      const weatherCard = page.locator('.context-card[data-context="weather"]');
      await expect(weatherCard).toHaveAttribute("data-tone", "unavailable");
      await expect(weatherCard.getByRole("heading", { name: "Live forecast unavailable" })).toBeVisible();
      await expect(weatherCard.locator(".context-detail-pill")).toHaveCount(0);
      await expect(weatherCard.locator(".source-badge")).toHaveCount(0);
      await expect(weatherCard.getByText("Example values only — not current weather")).toBeVisible();

      const contrast = await alertCard.locator(".context-detail-pill, .source-badge, .retrieval-pill").evaluateAll((pills) => {
        const luminance = (colour: string) => {
          const channels = (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map((value) => {
            const channel = Number(value) / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        return pills.map((pill) => {
          const style = getComputedStyle(pill);
          const text = luminance(style.color);
          const fill = luminance(style.backgroundColor);
          return (Math.max(text, fill) + 0.05) / (Math.min(text, fill) + 0.05);
        });
      });
      expect(contrast.length).toBeGreaterThan(0);
      for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await expectNoAccessibilityViolations(page);
    }
  });

  test(`trip safety preserves notice details without claiming route closure at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockWeather(page);
    const notices = [
      {
        title: "Death Canyon Trailhead Construction Closure",
        description: "Death Canyon Road and Trailhead are closed to all use.\n\nFollow signs around the construction zone.",
        severity: "closure",
        source: "NPS",
        sourceUrl: "https://www.nps.gov/grte/planyourvisit/road-construction.htm",
      },
      {
        title: "South End construction closure",
        description: "The southern work zone is closed; follow posted detours.",
        severity: "closure",
        source: "NPS",
        sourceUrl: "https://www.nps.gov/grte/alerts.htm",
      },
      {
        title: "Visitor center hours",
        description: "The visitor center closes early; check hours before visiting.",
        severity: "info",
        source: "NPS",
        sourceUrl: "https://www.nps.gov/grte/planyourvisit/hours.htm",
      },
    ];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
    });
    await page.route("**/api/trailpack/alerts?*", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ hasActiveAlerts: true, alerts: notices, label: "official", retrievalStatus: "live" }),
    }));
    await page.route("**/api/trailpack/ai-review", (route) => route.fulfill({
      status: 401,
      contentType: "application/json",
      body: signedOutReviewBody("Jenny Lake Loop"),
    }));

    await page.goto("/");
    await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
    const alertCard = page.locator('.context-card[data-context="alert"]');
    await expect(alertCard.getByRole("heading", { name: "3 park notices" })).toBeVisible();
    const noticeToggle = alertCard.locator(".alert-notice-details > summary");
    await expect(alertCard.locator(".alert-notice-list")).toBeHidden();
    await noticeToggle.focus();
    await page.keyboard.press("Enter");
    for (const notice of notices) {
      await expect(alertCard.getByRole("heading", { name: notice.title, exact: true })).toBeVisible();
      await expect(alertCard.getByText(notice.description, { exact: true })).toBeVisible();
      await expect(alertCard.getByRole("link", { name: `View NPS notice for ${notice.title}`, exact: true })).toHaveAttribute("href", notice.sourceUrl);
    }
    await expectNoAccessibilityViolations(page);
    await noticeToggle.focus();
    await page.keyboard.press("Space");
    await expect(alertCard.locator(".alert-notice-list")).toBeHidden();
    await page.getByRole("button", { name: "Generate packing list" }).click();
    const decision = page.locator(".packing-item").filter({ hasText: "Trip safety decision" }).first();
    const summary = decision.locator("summary");
    await expect(summary.getByText("Check route", { exact: true })).toBeVisible();
    await expect(summary).toContainText("Park-wide alert; impact on this trail unconfirmed.");
    await expect(summary).toContainText(notices[0].title);
    await expect(summary).toContainText(notices[1].title);
    await expect(summary.getByText("Change plan", { exact: true })).toHaveCount(0);
    await expect(decision.locator(".packing-safety-evidence")).toBeHidden();
    await expect(page.locator(".trip-alerts").filter({ hasText: "impact on this trail unconfirmed" })).toHaveCount(0);
    await expect(page.locator(".trip-alerts").getByRole("link", { name: "View official alert" })).toHaveCount(0);
    await expect(page.getByText("Review active alerts before leaving", { exact: true })).toHaveCount(0);
    // Non-NPS weather warnings are still shown in the overview.
    await expect(page.locator(".trip-alerts")).toContainText("Rain / wet trail");

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(decision).toHaveAttribute("open", "");
    await expect(decision.getByText("Decision type", { exact: true })).toHaveCount(0);
    for (const notice of notices.filter((notice) => notice.severity === "closure")) {
      await expect(decision.getByRole("heading", { name: notice.title, exact: true })).toBeVisible();
      await expect(decision.getByText(notice.description, { exact: true })).toBeVisible();
      await expect(decision.getByRole("link", { name: `View source for ${notice.title}`, exact: true })).toHaveAttribute("href", notice.sourceUrl);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await expectNoAccessibilityViolations(page);
    await decision.screenshot({ path: `/tmp/trailpack-safety-${viewport.width}.png` });
    await summary.focus();
    await page.keyboard.press("Space");
    await expect(decision.locator(".packing-safety-evidence")).toBeHidden();
    expect(errors).toEqual([]);
  });
}

async function mockWeather(page: Page) {
  await page.route("**/api/trailpack/weather?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(JENNY_SCENARIO.weather),
    });
  });
}

async function mockAlerts(page: Page) {
  await page.route("**/api/trailpack/alerts?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(JENNY_SCENARIO.alerts),
    });
  });
}

function signedOutReviewBody(trailName: string) {
  return JSON.stringify({
    outcome: "sign-in-required",
    provider: { name: "gemini", model: "gemini-3.5-flash" },
    review: {
      status: "fallback",
      review: {
        tripSummary: `TrailPack kept the deterministic ${trailName} packing list.`,
        missingDataReview: [
          "Sign in to add an automatically validated live review.",
        ],
        itemExplanationDrafts: [],
      },
      validationReasons: ["Authentication is required for live AI."],
    },
  });
}

function mockedLiveReviewBody(
  outcome: Extract<
    LiveAiOutcome,
    "accepted" | "duplicate-generation" | "quota-limited" | "rate-limited"
  >,
  trailName: string,
) {
  const accepted = outcome === "accepted";
  return JSON.stringify({
    outcome,
    provider: { name: "gemini", model: "gemini-3.5-flash" },
    review: {
      status: accepted ? "accepted" : "fallback",
      review: {
        tripSummary: `Mocked ${outcome} review for ${trailName}.`,
        missingDataReview: [],
        itemExplanationDrafts: [],
      },
      validationReasons: accepted ? [] : [`Mocked ${outcome} fallback.`],
    },
  });
}

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

async function expectCurrentPhoto(page: Page, photo: ParkPhoto) {
  const showcase = page.locator(".park-photo-showcase");
  const visiblePhoto = showcase.locator(".park-photo-layer.is-visible");
  await expect(showcase).toHaveAttribute(
    "aria-label",
    `${photo.locationName}, ${photo.parkName}`,
  );
  await expect(visiblePhoto).toHaveAttribute("alt", photo.alt);
  await expect(visiblePhoto).toHaveJSProperty("complete", true);
  await expect
    .poll(() =>
      visiblePhoto.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);

  const renderedSize = await visiblePhoto.evaluate(
    (image: HTMLImageElement) => ({
      clientWidth: image.clientWidth,
      naturalWidth: image.naturalWidth,
    }),
  );
  expect(renderedSize.naturalWidth).toBeGreaterThanOrEqual(
    renderedSize.clientWidth,
  );
  await expect(showcase.getByRole("img")).toHaveCount(1);
  await expect(showcase.locator(".park-photo-credit")).toHaveAttribute(
    "href",
    photo.sourceUrl,
  );
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

test("featured photos stay sharp, synchronized, and reduced-motion safe", async ({
  page,
}) => {
  await page.goto("/");

  const reducedMotionStatus = page.getByRole("button", {
    name: "Automatic park photo rotation is paused for reduced motion",
  });
  await expect(reducedMotionStatus).toBeDisabled();
  await expect(reducedMotionStatus).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.locator(".park-photo-layer").evaluateAll((images) =>
        images.map((image) => (image as HTMLImageElement).currentSrc),
      ),
    )
    .toHaveLength(1);
  const initialImageSources = await page
    .locator(".park-photo-layer")
    .evaluateAll((images) =>
      images.map((image) => (image as HTMLImageElement).currentSrc),
    );
  expect(new Set(initialImageSources).size).toBe(1);

  for (const photo of PARK_PHOTO_ROTATION) {
    await page.getByRole("button", { name: `Show ${photo.parkName}` }).click();
    await expectCurrentPhoto(page, photo);
  }

  const transitionedImageSources = await page
    .locator(".park-photo-layer")
    .evaluateAll((images) =>
      images.map((image) => (image as HTMLImageElement).currentSrc),
    );
  expect(new Set(transitionedImageSources).size).toBe(2);

  await expectNoAccessibilityViolations(page);
});

test("keeps the current photo and credit while the next photo loads", async ({
  page,
}) => {
  let releaseNextPhoto = () => {};
  const nextPhotoReady = new Promise<void>((resolve) => {
    releaseNextPhoto = resolve;
  });
  let markNextPhotoRequested = () => {};
  const nextPhotoRequested = new Promise<void>((resolve) => {
    markNextPhotoRequested = resolve;
  });

  await page.route("**/_next/image?*", async (route) => {
    const imagePath = new URL(route.request().url()).searchParams.get("url");
    if (imagePath === PARK_PHOTO_ROTATION[1].src) {
      markNextPhotoRequested();
      await nextPhotoReady;
    }
    await route.continue();
  });

  await page.goto("/");
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[0]);
  await page.getByRole("button", { name: "Show next park photo" }).click();
  await nextPhotoRequested;

  try {
    await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[0]);
    await expect(page.locator(".park-photo-showcase")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await page.getByRole("button", { name: "Show previous park photo" }).click();
    await expect(page.locator(".park-photo-showcase")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  } finally {
    releaseNextPhoto();
  }

  await expect
    .poll(() =>
      page.locator(".park-photo-layer").evaluateAll((images) =>
        images.every(
          (image) =>
            (image as HTMLImageElement).complete &&
            (image as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[0]);
  await page.getByRole("button", { name: "Show next park photo" }).click();
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[1]);
});

test("featured photo auto-rotation and controls stay synchronized", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[0]);

  await page.clock.fastForward(9_000);
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[1]);

  const pauseButton = page.getByRole("button", {
    name: "Pause park photo rotation",
  });
  await pauseButton.click();
  const resumeButton = page.getByRole("button", {
    name: "Resume park photo rotation",
  });
  await expect(resumeButton).toHaveAttribute("aria-pressed", "true");
  await page.clock.fastForward(18_000);
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[1]);

  await page.getByRole("button", { name: "Show next park photo" }).click();
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[2]);
  await page.getByRole("button", { name: "Show previous park photo" }).click();
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[1]);

  await resumeButton.click();
  await expect(pauseButton).toHaveAttribute("aria-pressed", "false");
  await page.clock.fastForward(9_000);
  await expectCurrentPhoto(page, PARK_PHOTO_ROTATION[2]);
});

test("park selection returns to search and opens the selected trail", async ({
  page,
}) => {
  await mockWeather(page);
  await mockAlerts(page);
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
    Array(Object.keys(TRAIL_CATALOG).length).fill("Verified NPS + USGS profile"),
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
  await mockWeather(page);
  await mockAlerts(page);
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

test("manual guest entry remains usable without provider or authentication work", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("searchbox", { name: /Search a park or trail/i })
    .fill("custom ridge hike");
  await page
    .getByRole("button", { name: /Enter hike details yourself/i })
    .click();

  await expect(
    page.getByRole("heading", { name: "Manual hike entry", exact: true }),
  ).toBeVisible();
  await page.getByLabel(/Trail distance/i).fill("6.2 miles");
  await page.getByLabel(/Elevation gain/i).fill("900 ft");
  await page.getByLabel(/Route type/i).selectOption("out-and-back");
  await page
    .getByLabel(/current trail conditions/i)
    .fill("dry with exposed sun");

  await expect(
    page.getByRole("heading", { name: /Packing list for Manual hike entry/i }),
  ).toBeVisible();
  await expect(page.getByText("Manual entry", { exact: true }).first()).toBeVisible();
  await expect(page.locator("#ai-review")).toHaveCount(0);
  await expectNoAccessibilityViolations(page);
});

test("one generated packing list requests one guarded review", async ({
  page,
}) => {
  let reviewRequests = 0;
  await mockWeather(page);
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
      body: signedOutReviewBody("Jenny Lake"),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();

  await expect(
    page.getByRole("heading", { name: "1 park notice", exact: true }),
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

  const generateButton = page.getByRole("button", {
    name: "Generate packing list",
  });
  await expect(generateButton).toBeEnabled();
  await generateButton.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });

  await expect(page.getByText("Guest review ready", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  const overallAlerts = page.locator(".trip-alerts");
  await expect(overallAlerts.getByText("Weather", { exact: true })).toHaveCount(0);
  await expect(overallAlerts.getByText("Wet", { exact: true })).toHaveCount(0);
  await expect(overallAlerts.getByText("Official alert", { exact: true })).toHaveCount(0);

  const criticalSafety = page
    .getByRole("heading", { name: "Critical Safety" })
    .locator("xpath=../..");
  await expect(
    criticalSafety.getByText("Trip safety decision", { exact: true }),
  ).toBeVisible();
  await expect(
    criticalSafety.getByText("Review active alerts before leaving", { exact: true }),
  ).toHaveCount(0);
  await expect(criticalSafety.getByText("Check route", { exact: true })).toBeVisible();
  await expect(criticalSafety.getByText("Essential", { exact: true })).toHaveCount(0);
  await expect(criticalSafety.getByText("Critical danger", { exact: true })).toHaveCount(0);
  await expect(criticalSafety.getByText("Closure", { exact: true })).toHaveCount(0);
  const tripDecision = criticalSafety
    .locator(".packing-item")
    .filter({ hasText: "Trip safety decision" })
    .first();
  await tripDecision.getByText("Trip safety decision", { exact: true }).click();
  await expect(tripDecision.locator(".packing-item-basis")).toContainText(
    "Triggered by a live NPS alert.",
  );
  await expect(tripDecision.getByText("Official", { exact: true })).toHaveCount(0);
  await expect(tripDecision.getByText("Inferred", { exact: true })).toHaveCount(0);
  await expect(tripDecision.locator(".packing-safety-evidence")).toContainText(
    "Death Canyon Road and Trailhead are closed to all use.",
  );
  await expect(tripDecision.getByText("Decision type", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Item explanation drafts", { exact: true })).toHaveCount(0);
  const reviewDetails = page.getByText("Why and review details", { exact: true });
  await expect(reviewDetails).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What could improve this plan" }),
  ).toBeHidden();
  await reviewDetails.click();
  await expect(
    page.getByRole("heading", { name: "What could improve this plan" }),
  ).toBeVisible();
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

for (const scenario of [
  {
    name: "accepted",
    outcome: "accepted",
    status: 200,
    badge: "Live review complete",
  },
  {
    name: "duplicate",
    outcome: "duplicate-generation",
    status: 409,
    badge: "List already reviewed",
  },
  {
    name: "provider quota",
    outcome: "quota-limited",
    status: 200,
    badge: "Standard review ready",
  },
  {
    name: "account rate limit",
    outcome: "rate-limited",
    status: 429,
    badge: "Standard review ready",
  },
] as const) {
  test(`renders the mocked ${scenario.name} AI state without changing the packing list`, async ({
    page,
  }) => {
    await mockWeather(page);
    await mockAlerts(page);
    await page.route("**/api/trailpack/ai-review", async (route) => {
      await route.fulfill({
        status: scenario.status,
        contentType: "application/json",
        body: mockedLiveReviewBody(
          scenario.outcome,
          "Jenny Lake Loop",
        ),
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
    await page.getByRole("button", { name: "Generate packing list" }).click();

    await expect(page.getByText(scenario.badge, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Packing list for Jenny Lake Loop/i }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });
}

test("renders a generic AI failure without exposing the route body", async ({
  page,
}) => {
  await mockWeather(page);
  await mockAlerts(page);
  await page.route("**/api/trailpack/ai-review", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "text/plain",
      body: "private mocked provider detail",
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
  await page.getByRole("button", { name: "Generate packing list" }).click();

  await expect(page.getByText("Standard review ready", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/optional live review was unavailable/i),
  ).toBeVisible();
  await expect(page.getByText(/private mocked provider detail/i)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Packing list for Jenny Lake Loop/i }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("a stalled AI browser request times out while the rule-based list remains", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();
      if (!url.includes("/api/trailpack/ai-review")) {
        return originalFetch(input, init);
      }

      return new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (init?.signal?.aborted) {
          abort();
        } else {
          init?.signal?.addEventListener("abort", abort, { once: true });
        }
      });
    }) as typeof window.fetch;
  });
  await page.clock.install();
  await mockWeather(page);
  await mockAlerts(page);

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
  await page.getByRole("button", { name: "Generate packing list" }).click();
  await expect(page.getByText("Checking plan", { exact: true })).toBeVisible();

  await page.clock.fastForward(30_000);
  await expect(page.getByText("Standard review ready", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Packing list for Jenny Lake Loop/i }),
  ).toBeVisible();
});

test("a stalled alert request falls back and cannot leave Generate disabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();
      if (!url.includes("/api/trailpack/alerts?")) {
        return originalFetch(input, init);
      }

      return new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (init?.signal?.aborted) {
          abort();
        } else {
          init?.signal?.addEventListener("abort", abort, { once: true });
        }
      });
    }) as typeof window.fetch;
  });
  await page.clock.install();
  await mockWeather(page);
  await page.route("**/api/trailpack/ai-review", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: signedOutReviewBody("Taggart Lake"),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Taggart Lake/i }).click();
  await expect(
    page.getByRole("button", { name: "Loading current conditions..." }),
  ).toBeDisabled();

  await page.clock.fastForward(6_000);
  await expect(
    page.getByRole("heading", { name: "Live NPS alerts unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Alert-based recommendations could not be evaluated from live NPS data/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate packing list" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Generate packing list" }).click();
  await expect(
    page.getByText("Trip safety decision", { exact: true }),
  ).toHaveCount(0);
});

test("a background NPS retry offers an explicit list update without mutating the generated list", async ({
  page,
}) => {
  let alertRequests = 0;
  await page.clock.install();
  await mockWeather(page);
  await page.route("**/api/trailpack/alerts?*", async (route) => {
    alertRequests += 1;
    if (alertRequests === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          hasActiveAlerts: false,
          alerts: [],
          label: "unavailable",
          retrievalStatus: "saved-fixture",
          statusReason: "Live NPS alerts are temporarily unavailable.",
        }),
      });
      return;
    }

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
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: signedOutReviewBody("Jenny Lake Loop"),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
  const generateButton = page.getByRole("button", {
    name: "Generate packing list",
  });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();

  await expect(
    page.getByText("Trip safety decision", { exact: true }),
  ).toHaveCount(0);
  const bearSpray = page
    .locator(".packing-item")
    .filter({ hasText: "Bear spray" })
    .first();
  await bearSpray.getByText("Bear spray", { exact: true }).click();
  await expect(bearSpray.locator(".packing-item-basis")).toContainText(
    "Standard TrailPack safety rule",
  );

  await page.clock.fastForward(1_500);
  await expect.poll(() => alertRequests).toBe(2);
  await expect(
    page.getByRole("button", { name: "Update list with live alerts" }),
  ).toBeEnabled();
  await expect(
    page.getByText("Trip safety decision", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/A newer live NPS alert check is available/i),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Update list with live alerts" })
    .click();
  const tripDecision = page
    .locator(".packing-item")
    .filter({ hasText: "Trip safety decision" })
    .first();
  await expect(tripDecision).toBeVisible();
  await tripDecision.getByText("Trip safety decision", { exact: true }).click();
  await expect(tripDecision.locator(".packing-item-basis")).toContainText(
    "Triggered by a live NPS alert.",
  );
});

test("a stalled weather request falls back and cannot leave Generate disabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();
      if (!url.includes("/api/trailpack/weather?")) {
        return originalFetch(input, init);
      }

      return new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (init?.signal?.aborted) {
          abort();
        } else {
          init?.signal?.addEventListener("abort", abort, { once: true });
        }
      });
    }) as typeof window.fetch;
  });
  await page.clock.install();
  await mockAlerts(page);

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
  await expect(
    page.getByRole("button", { name: "Loading current conditions..." }),
  ).toBeDisabled();

  await page.clock.fastForward(20_000);
  await expect(
    page.getByRole("button", { name: "Loading current conditions..." }),
  ).toBeDisabled();
  await page.clock.fastForward(5_000);
  await expect(
    page.getByText(
      "The live forecast could not be loaded. TrailPack is showing saved example conditions instead.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate packing list" }),
  ).toBeEnabled();
});

test("a weather response arriving after the old browser deadline is still accepted", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();
      if (!url.includes("/api/trailpack/weather?")) {
        return originalFetch(input, init);
      }

      return new Promise<Response>((resolve, reject) => {
        const abort = () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        };
        const timer = setTimeout(() => {
          init?.signal?.removeEventListener("abort", abort);
          resolve(new Response(JSON.stringify({
            summary: "Slow but valid live forecast",
            temperatureF: { high: 70, low: 40, current: 55 },
            precipitationChance: 10,
            windMph: 5,
            conditions: ["sun"],
            source: "open-meteo",
            label: "forecast-based",
            retrievalStatus: "live",
            forecastPeriods: [],
          }), { status: 200, headers: { "Content-Type": "application/json" } }));
        }, 22_000);
        if (init?.signal?.aborted) {
          abort();
        } else {
          init?.signal?.addEventListener("abort", abort, { once: true });
        }
      });
    }) as typeof window.fetch;
  });
  await page.clock.install();
  await mockAlerts(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();

  await page.clock.fastForward(20_000);
  await expect(page.getByRole("button", { name: "Loading current conditions..." })).toBeDisabled();
  await page.clock.fastForward(2_000);
  await expect(page.getByText("Slow but valid live forecast")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate packing list" })).toBeEnabled();
  await page.clock.fastForward(3_000);
  await expect(page.getByText("Slow but valid live forecast")).toBeVisible();
  await expect(page.getByText("Saved weather example", { exact: true })).toHaveCount(0);
});

test("an older weather response cannot replace the newest selected date", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    const response = (summary: string, plannedDate?: string) =>
      new Response(
        JSON.stringify({
          plannedDate,
          summary,
          temperatureF: { high: 70, low: 40, current: 55 },
          precipitationChance: 10,
          windMph: 5,
          conditions: ["sun"],
          source: "open-meteo",
          label: "forecast-based",
          retrievalStatus: "live",
          forecastPeriods: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();
      if (!url.includes("/api/trailpack/weather?")) {
        return originalFetch(input, init);
      }
      if (url.includes("date=2026-09-01")) {
        return response("Newest selected-date forecast.", "2026-09-01");
      }

      return new Promise<Response>((resolve) => {
        window.setTimeout(
          () => resolve(response("Stale earlier forecast.")),
          5_000,
        );
      });
    }) as typeof window.fetch;
  });
  await page.clock.install();
  await mockAlerts(page);

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
  await page.getByLabel(/When do you plan to hike/i).fill("2026-09-01");
  await expect(page.getByText("Newest selected-date forecast.")).toBeVisible();

  await page.clock.fastForward(5_000);
  await expect(page.getByText("Newest selected-date forecast.")).toBeVisible();
  await expect(page.getByText("Stale earlier forecast.")).toHaveCount(0);
});

test("switching trails aborts stale review state without unlocking duplicates", async ({
  page,
}) => {
  let reviewRequests = 0;
  await mockWeather(page);
  await mockAlerts(page);
  await page.route("**/api/trailpack/ai-review", async (route) => {
    reviewRequests += 1;
    const requestNumber = reviewRequests;
    const requestBody = route.request().postDataJSON();
    const trailName = requestBody.input.trail.name as string;

    if (requestNumber === 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }

    try {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: signedOutReviewBody(trailName),
      });
    } catch {
      // The first route is expected to be gone after the trail switch aborts it.
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
  await page.getByRole("button", { name: "Generate packing list" }).click();
  await expect.poll(() => reviewRequests).toBe(1);

  const searchBox = page.getByRole("searchbox", {
    name: /Search a park or trail/i,
  });
  await searchBox.fill("Taggart Lake");
  await page
    .locator(".suggestion-button")
    .filter({ hasText: "Taggart Lake" })
    .first()
    .click();
  await expect(page.locator("#trail-profile-heading")).toContainText(
    "Taggart Lake",
  );

  const nextGenerateButton = page.getByRole("button", {
    name: "Generate packing list",
  });
  await expect(nextGenerateButton).toBeEnabled();
  await nextGenerateButton.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });

  await expect.poll(() => reviewRequests).toBe(2);
  await expect(
    page.getByText(
      "TrailPack kept the deterministic Taggart Lake packing list.",
    ),
  ).toBeVisible();
  await page.waitForTimeout(1_600);
  expect(reviewRequests).toBe(2);
  await expect(
    page.getByRole("button", { name: "Packing list is current" }),
  ).toBeDisabled();
});
