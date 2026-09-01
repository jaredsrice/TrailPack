import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from "./security-headers";

describe("security headers", () => {
  it("uses a production CSP that blocks frames and plugins", () => {
    const policy = buildContentSecurityPolicy("production");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self' https://*.supabase.co");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/[\r\n]/);
  });

  it("allows the evaluator only for the local Next.js development runtime", () => {
    expect(buildContentSecurityPolicy("development")).toContain("'unsafe-eval'");
  });

  it("sets the expected browser hardening headers", () => {
    expect(buildSecurityHeaders("production")).toEqual(
      expect.arrayContaining([
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ]),
    );
  });
});
