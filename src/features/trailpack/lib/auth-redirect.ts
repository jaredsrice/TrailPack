export function buildAuthCallbackUrl(origin: string): string {
  return new URL("/auth/callback", origin).toString();
}
