import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTEXTS } from "../../src/features/trailpack/data/demo-contexts";
import {
  PARK_PHOTO_ROTATION,
  type ParkPhoto,
} from "../../src/features/trailpack/data/park-images";
import type { LiveAiOutcome } from "../../src/features/trailpack/lib/ai-contract";

const JENNY_SCENARIO = DEMO_CONTEXTS["jenny-lake-loop"];

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
    .toHaveLength(2);
  const initialImageSources = await page
    .locator(".park-photo-layer")
    .evaluateAll((images) =>
      images.map((image) => (image as HTMLImageElement).currentSrc),
    );
  expect(new Set(initialImageSources).size).toBe(2);

  for (const photo of PARK_PHOTO_ROTATION) {
    await page.getByRole("button", { name: `Show ${photo.parkName}` }).click();
    await expectCurrentPhoto(page, photo);
  }

  await expectNoAccessibilityViolations(page);
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
  await expect(criticalSafety.getByText("Change plan", { exact: true })).toBeVisible();
  await expect(criticalSafety.getByText("Essential", { exact: true })).toHaveCount(0);
  await expect(criticalSafety.getByText("Critical danger", { exact: true })).toHaveCount(0);
  await expect(criticalSafety.getByText("Closure", { exact: true })).toHaveCount(0);
  const tripDecision = criticalSafety
    .locator(".packing-item")
    .filter({ hasText: "Trip safety decision" })
    .first();
  await tripDecision.getByText("Trip safety decision", { exact: true }).click();
  await expect(tripDecision.getByText("Official", { exact: true })).toHaveCount(0);
  await expect(tripDecision.getByText("Inferred", { exact: true })).toHaveCount(0);
  await expect(
    tripDecision.getByText(
      "Official guidance · TrailPack interpretation",
      { exact: true },
    ),
  ).toBeVisible();
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

  await page.goto("/");
  await page.getByRole("button", { name: /Jenny Lake Loop/i }).click();
  await expect(
    page.getByRole("button", { name: "Loading current conditions..." }),
  ).toBeDisabled();

  await page.clock.fastForward(12_000);
  await expect(
    page.getByText(
      "Live NPS alerts could not be loaded. TrailPack is showing saved alert context instead.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate packing list" }),
  ).toBeEnabled();
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
    page.getByText(
      "The live forecast could not be loaded. TrailPack is showing saved example conditions instead.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate packing list" }),
  ).toBeEnabled();
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
