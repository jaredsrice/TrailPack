import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import type {
  SavedResultDraft,
  SavedResultRecord,
} from "../../src/features/trailpack/lib/saved-results";

loadEnvConfig(process.cwd());

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://trailpack-browser-test.supabase.co";
const accountEmail = "trailpack-browser-test@example.com";
const accountUser = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: accountEmail,
  email_confirmed_at: "2026-09-12T00:00:00.000Z",
  phone: "",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: {},
  identities: [],
  created_at: "2026-09-12T00:00:00.000Z",
  updated_at: "2026-09-12T00:00:00.000Z",
  is_anonymous: false,
};

for (const [status, message] of [
  [
    "signed-in",
    "Returned from Google sign-in. Generate a packing list to check your account and save privately.",
  ],
  ["error", "TrailPack could not complete Google sign-in. Please try again."],
  ["unavailable", "Google sign-in is temporarily unavailable. You can still plan as a guest."],
] as const) {
  test(`the OAuth callback reports ${status}`, async ({ page }) => {
    await page.goto(`/?auth=${status}`);

    await expect(page.getByRole("status").filter({ hasText: message })).toBeVisible();
  });
}

for (const query of ["auth=unexpected", "auth=signed-in&auth=error"]) {
  test(`the OAuth callback ignores an untrusted status query: ${query}`, async ({ page }) => {
    await page.goto(`/?${query}`);

    await expect(page.getByText(/Returned from Google sign-in|Google sign-in is temporarily unavailable/)).toHaveCount(0);
    await expect(page.getByText("TrailPack could not complete Google sign-in. Please try again.")).toHaveCount(0);
  });
}

test("a failed account check preserves the guest plan and reports saved plans unavailable", async ({ page }) => {
  await seedBrowserSession(page);
  await page.route(`${supabaseUrl}/auth/v1/user`, (route) =>
    route.fulfill({
      contentType: "application/json",
      json: { message: "Account service unavailable" },
      status: 503,
    }),
  );

  await openManualPlan(page);

  await expect(page.locator("#packing-list-heading")).toBeVisible();
  await expect(
    page.getByText(
      "Saved plans are temporarily unavailable. You can still use the full guest planner without an account.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with Google to save" }),
  ).toHaveCount(0);
});

test("a failed saved-library account check settles to a load error", async ({ page }) => {
  await seedBrowserSession(page);
  await page.route(`${supabaseUrl}/auth/v1/user`, (route) =>
    route.fulfill({
      contentType: "application/json",
      json: { message: "Account service unavailable" },
      status: 503,
    }),
  );

  await page.goto("/saved");

  await expect(
    page.getByText("TrailPack could not load saved plans. Please try again.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Loading saved plans…", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Sign in from a generated packing list to view your saved plans.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("a remote sign-out error reports the local sign-out honestly", async ({ page }) => {
  await seedBrowserSession(page);
  await page.route(`${supabaseUrl}/auth/v1/user`, (route) =>
    route.fulfill({ contentType: "application/json", json: accountUser, status: 200 }),
  );
  await page.route(`${supabaseUrl}/auth/v1/logout?**`, (route) =>
    route.fulfill({
      contentType: "application/json",
      json: { message: "Account service unavailable" },
      status: 500,
    }),
  );

  await openManualPlan(page);
  await expect(page.getByText(`Signed in as ${accountEmail}.`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();

  await expect(
    page.getByRole("alert").filter({
      hasText:
        "Signed out on this device, but TrailPack could not confirm sign-out with the account service.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with Google to save" }),
  ).toBeVisible();
});

test("a signed-in hiker can save, revisit, and delete a private plan", async ({ page }) => {
  let savedRecord: SavedResultRecord | null = null;

  await seedBrowserSession(page);
  await page.route(`${supabaseUrl}/auth/v1/user`, (route) =>
    route.fulfill({ contentType: "application/json", json: accountUser, status: 200 }),
  );
  await page.route("**/api/trailpack/saved-results/*", (route) => {
    savedRecord = null;
    return route.fulfill({ status: 204 });
  });
  await page.route("**/api/trailpack/saved-results", async (route) => {
    if (route.request().method() === "POST") {
      const draft = route.request().postDataJSON() as SavedResultDraft;
      savedRecord = {
        ...draft,
        id: "22222222-2222-4222-8222-222222222222",
        createdAt: "2026-09-12T12:00:00.000Z",
      };
      await route.fulfill({
        contentType: "application/json",
        json: { result: savedRecord },
        status: 201,
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      json: { results: savedRecord ? [savedRecord] : [] },
      status: 200,
    });
  });

  await openManualPlan(page);
  await expect(page.getByText(`Signed in as ${accountEmail}.`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save this plan", exact: true }).click();
  await expect(page.getByText("Saved privately.", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Saved plans", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Manual hike entry", exact: true }),
  ).toBeVisible();
  await page.getByText("Revisit packing list", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Essential", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("You have not saved a plan yet.", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Manual hike entry", exact: true }),
  ).toHaveCount(0);
});

async function openManualPlan(page: Page) {
  await page.goto("/");
  await page.getByRole("searchbox").fill("custom ridge hike");
  await page.getByRole("button", { name: /Enter hike details yourself/i }).click();
}

async function seedBrowserSession(page: Page) {
  const parsedUrl = new URL(supabaseUrl!);
  const storageKey = `sb-${parsedUrl.hostname.split(".")[0]}-auth-token`;
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const payload = Buffer.from(
    JSON.stringify({
      aud: "authenticated",
      email: accountEmail,
      exp: expiresAt,
      role: "authenticated",
      sub: accountUser.id,
    }),
  ).toString("base64url");
  const session = {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.test-signature`,
    expires_at: expiresAt,
    expires_in: 60 * 60,
    refresh_token: "browser-test-refresh-token",
    token_type: "bearer",
    user: accountUser,
  };
  const encodedSession = Buffer.from(JSON.stringify(session)).toString("base64url");

  await page.context().addCookies([
    {
      domain: "127.0.0.1",
      name: storageKey,
      path: "/",
      sameSite: "Lax",
      value: `base64-${encodedSession}`,
    },
  ]);
}
