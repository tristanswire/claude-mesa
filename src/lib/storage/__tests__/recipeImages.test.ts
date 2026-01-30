import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  getExtensionFromMimeType,
  buildImagePath,
} from "../recipeImages";

describe("validateImageFile", () => {
  it("accepts valid JPEG file", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts valid PNG file", () => {
    const file = new File(["content"], "test.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 }); // 2MB

    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it("accepts valid WebP file", () => {
    const file = new File(["content"], "test.webp", { type: "image/webp" });
    Object.defineProperty(file, "size", { value: 500 * 1024 }); // 500KB

    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejects GIF file", () => {
    const file = new File(["content"], "test.gif", { type: "image/gif" });
    Object.defineProperty(file, "size", { value: 1024 });

    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  it("rejects file too large", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 }); // 6MB

    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("File too large");
    expect(result.error).toContain("5MB");
  });

  it("rejects non-image file", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: 1024 });

    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });
});

describe("getExtensionFromMimeType", () => {
  it("returns jpg for image/jpeg", () => {
    expect(getExtensionFromMimeType("image/jpeg")).toBe("jpg");
  });

  it("returns png for image/png", () => {
    expect(getExtensionFromMimeType("image/png")).toBe("png");
  });

  it("returns webp for image/webp", () => {
    expect(getExtensionFromMimeType("image/webp")).toBe("webp");
  });

  it("returns jpg as default for unknown types", () => {
    expect(getExtensionFromMimeType("image/gif")).toBe("jpg");
    expect(getExtensionFromMimeType("unknown")).toBe("jpg");
  });
});

describe("buildImagePath", () => {
  it("builds correct path with userId, recipeId, and extension", () => {
    const path = buildImagePath(
      "user-123",
      "recipe-456",
      "jpg"
    );
    expect(path).toBe("user-123/recipe-456.jpg");
  });

  it("handles different extensions", () => {
    expect(buildImagePath("u1", "r1", "png")).toBe("u1/r1.png");
    expect(buildImagePath("u1", "r1", "webp")).toBe("u1/r1.webp");
  });

  it("handles UUIDs", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const recipeId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const path = buildImagePath(userId, recipeId, "jpg");
    expect(path).toBe(`${userId}/${recipeId}.jpg`);
  });
});
