import { describe, it, expect } from "vitest";
import { decodeHtmlEntities, decodeHtmlEntitiesArray } from "../decode-html";

describe("decodeHtmlEntities", () => {
  it("decodes common named entities", () => {
    expect(decodeHtmlEntities("Fish &amp; Chips")).toBe("Fish & Chips");
    expect(decodeHtmlEntities("&lt;tag&gt;")).toBe("<tag>");
    expect(decodeHtmlEntities("She said &quot;hello&quot;")).toBe(
      'She said "hello"'
    );
  });

  it("decodes apostrophe entities", () => {
    expect(decodeHtmlEntities("Mom&#39;s Favorite")).toBe("Mom's Favorite");
    expect(decodeHtmlEntities("Mom&apos;s Favorite")).toBe("Mom's Favorite");
    expect(decodeHtmlEntities("Mom&#x27;s Favorite")).toBe("Mom's Favorite");
  });

  it("decodes decimal numeric entities", () => {
    expect(decodeHtmlEntities("&#169; 2024")).toBe("© 2024");
    expect(decodeHtmlEntities("&#8212;")).toBe("—"); // em dash
  });

  it("decodes hex numeric entities", () => {
    expect(decodeHtmlEntities("&#x2014;")).toBe("—"); // em dash
    expect(decodeHtmlEntities("&#xA9;")).toBe("©"); // copyright
  });

  it("handles multiple entities in one string", () => {
    expect(
      decodeHtmlEntities("Mom&#39;s Fish &amp; Chips &mdash; The Best!")
    ).toBe("Mom's Fish & Chips — The Best!");
  });

  it("is idempotent (safe to call multiple times)", () => {
    const input = "Mom&#39;s Favorite";
    const decoded = decodeHtmlEntities(input);
    const decodedTwice = decodeHtmlEntities(decoded);
    expect(decoded).toBe("Mom's Favorite");
    expect(decodedTwice).toBe("Mom's Favorite");
  });

  it("preserves already clean text", () => {
    expect(decodeHtmlEntities("Already clean text")).toBe("Already clean text");
    expect(decodeHtmlEntities("Mom's Favorite")).toBe("Mom's Favorite");
  });

  it("handles empty and null-ish input", () => {
    expect(decodeHtmlEntities("")).toBe("");
    expect(decodeHtmlEntities(null as unknown as string)).toBe(null);
    expect(decodeHtmlEntities(undefined as unknown as string)).toBe(undefined);
  });

  it("decodes fraction entities", () => {
    expect(decodeHtmlEntities("&frac12; cup")).toBe("½ cup");
    expect(decodeHtmlEntities("&frac14; tsp")).toBe("¼ tsp");
    expect(decodeHtmlEntities("&frac34; lb")).toBe("¾ lb");
  });

  it("decodes non-breaking spaces", () => {
    expect(decodeHtmlEntities("hello&nbsp;world")).toBe("hello world");
    expect(decodeHtmlEntities("hello\u00a0world")).toBe("hello world");
  });
});

describe("decodeHtmlEntitiesArray", () => {
  it("decodes an array of strings", () => {
    const input = ["Mom&#39;s Recipe", "Fish &amp; Chips", "Normal text"];
    const expected = ["Mom's Recipe", "Fish & Chips", "Normal text"];
    expect(decodeHtmlEntitiesArray(input)).toEqual(expected);
  });

  it("handles empty array", () => {
    expect(decodeHtmlEntitiesArray([])).toEqual([]);
  });
});
