/**
 * Rate-limit key. X-Forwarded-For is only trusted behind a reverse proxy (TRUST_PROXY=1); otherwise anyone
 * can forge it, so a shared key with a higher overall limit is used instead.
 */
export function clientKey(headers: Headers, trustProxy: boolean): { key: string; limit: number } {
  if (!trustProxy) return { key: "all", limit: 30 };
  const ip = headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
  return { key: ip, limit: 5 };
}
