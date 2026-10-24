import { describe, it, expect } from "vitest";
import { isAllowedInMemory } from "@/lib/rate-limit";

describe("in-memory traffic rate limiter", () => {
  it("allows requests under the threshold", () => {
    const key = `test-client-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(isAllowedInMemory(key, 10, 5)).toBe(true);
    }
  });

  it("blocks requests that exceed the max limit within window", () => {
    const key = `test-flood-${Math.random()}`;
    // Send 5 allowed requests
    for (let i = 0; i < 5; i++) {
      expect(isAllowedInMemory(key, 5, 5)).toBe(true);
    }
    // 6th request should be blocked
    expect(isAllowedInMemory(key, 5, 5)).toBe(false);
  });
});
