import { describe, expect, it } from "vitest";
import { buildAuthCallbackUrl } from "./auth-redirect";

describe("buildAuthCallbackUrl", () => {
  it("uses the exact allow-listed callback without a query string", () => {
    expect(buildAuthCallbackUrl("https://preview.example.com")).toBe(
      "https://preview.example.com/auth/callback",
    );
  });

  it("normalizes an origin with a trailing slash", () => {
    expect(buildAuthCallbackUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000/auth/callback",
    );
  });
});
