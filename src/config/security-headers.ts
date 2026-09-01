export function buildContentSecurityPolicy(
  environment = process.env.NODE_ENV,
): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${
      environment === "development" ? " 'unsafe-eval'" : ""
    } https://vercel.live`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://vercel.live https://*.vercel.live",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://vercel.live https://*.vercel.live",
    "frame-src https://vercel.live https://*.vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function buildSecurityHeaders(
  environment = process.env.NODE_ENV,
): Array<{ key: string; value: string }> {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(environment),
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
  ];
}
