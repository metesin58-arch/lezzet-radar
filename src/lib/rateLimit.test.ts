import { describe, it, expect, vi } from "vitest";
import { rateLimit } from "./rateLimit";

describe("rateLimit", () => {
  it("pencerede 5 izin verir, 6.'yı reddeder, pencere geçince açılır", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) expect(rateLimit("ip1")).toBe(true);
    expect(rateLimit("ip1")).toBe(false);
    expect(rateLimit("ip2")).toBe(true);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit("ip1")).toBe(true);
    vi.useRealTimers();
  });
});
