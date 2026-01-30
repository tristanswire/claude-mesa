import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset the timer mocks
    vi.useFakeTimers();
  });

  it("allows requests under the limit", () => {
    const config = { limit: 3, windowMs: 60000 };

    const result1 = checkRateLimit("user1", config);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit("user1", config);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = checkRateLimit("user1", config);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    const config = { limit: 2, windowMs: 60000 };

    checkRateLimit("user2", config);
    checkRateLimit("user2", config);

    const result = checkRateLimit("user2", config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different identifiers separately", () => {
    const config = { limit: 1, windowMs: 60000 };

    const result1 = checkRateLimit("userA", config);
    expect(result1.success).toBe(true);

    const result2 = checkRateLimit("userB", config);
    expect(result2.success).toBe(true);

    // userA should be blocked
    const result3 = checkRateLimit("userA", config);
    expect(result3.success).toBe(false);

    // userB should also be blocked
    const result4 = checkRateLimit("userB", config);
    expect(result4.success).toBe(false);
  });

  it("resets after the window expires", () => {
    const config = { limit: 1, windowMs: 1000 };

    const result1 = checkRateLimit("user3", config);
    expect(result1.success).toBe(true);

    const result2 = checkRateLimit("user3", config);
    expect(result2.success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1100);

    const result3 = checkRateLimit("user3", config);
    expect(result3.success).toBe(true);
  });
});
