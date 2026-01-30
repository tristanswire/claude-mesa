import { describe, it, expect } from "vitest";
import { isRecipeLimitReached, getPlanDisplayInfo } from "../entitlements";

describe("isRecipeLimitReached", () => {
  it("returns false when limit is null (unlimited)", () => {
    expect(isRecipeLimitReached(0, null)).toBe(false);
    expect(isRecipeLimitReached(100, null)).toBe(false);
    expect(isRecipeLimitReached(1000, null)).toBe(false);
  });

  it("returns false when count is below limit", () => {
    expect(isRecipeLimitReached(0, 25)).toBe(false);
    expect(isRecipeLimitReached(24, 25)).toBe(false);
    expect(isRecipeLimitReached(10, 100)).toBe(false);
  });

  it("returns true when count equals limit", () => {
    expect(isRecipeLimitReached(25, 25)).toBe(true);
    expect(isRecipeLimitReached(100, 100)).toBe(true);
    expect(isRecipeLimitReached(1, 1)).toBe(true);
  });

  it("returns true when count exceeds limit", () => {
    expect(isRecipeLimitReached(26, 25)).toBe(true);
    expect(isRecipeLimitReached(101, 100)).toBe(true);
  });

  it("handles edge cases", () => {
    expect(isRecipeLimitReached(0, 0)).toBe(true);
    expect(isRecipeLimitReached(0, 1)).toBe(false);
  });
});

describe("getPlanDisplayInfo", () => {
  it("returns correct info for free plan", () => {
    const info = getPlanDisplayInfo("free");
    expect(info.name).toBe("Free");
    expect(info.description).toBe("Up to 25 recipes");
  });

  it("returns correct info for plus plan", () => {
    const info = getPlanDisplayInfo("plus");
    expect(info.name).toBe("Plus");
    expect(info.description).toBe("Unlimited recipes");
  });

  it("returns correct info for ai plan", () => {
    const info = getPlanDisplayInfo("ai");
    expect(info.name).toBe("AI");
    expect(info.description).toBe("Unlimited recipes + AI features");
  });
});
