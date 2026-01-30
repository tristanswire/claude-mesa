import { describe, it, expect } from "vitest";
import { parseJsonLd } from "../jsonld";

describe("parseJsonLd", () => {
  const wrapInHtml = (jsonLd: object): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
      </head>
      <body></body>
      </html>
    `;
  };

  describe("image extraction", () => {
    it("extracts image URL from string", () => {
      const html = wrapInHtml({
        "@type": "Recipe",
        name: "Test Recipe",
        image: "https://example.com/image.jpg",
        recipeIngredient: ["1 cup flour"],
        recipeInstructions: ["Mix ingredients"],
      });

      const result = parseJsonLd(html, "https://example.com/recipe");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/image.jpg");
      }
    });

    it("extracts image URL from ImageObject", () => {
      const html = wrapInHtml({
        "@type": "Recipe",
        name: "Test Recipe",
        image: {
          "@type": "ImageObject",
          url: "https://example.com/image.jpg",
        },
        recipeIngredient: ["1 cup flour"],
        recipeInstructions: ["Mix ingredients"],
      });

      const result = parseJsonLd(html, "https://example.com/recipe");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/image.jpg");
      }
    });

    it("extracts first image from array of strings", () => {
      const html = wrapInHtml({
        "@type": "Recipe",
        name: "Test Recipe",
        image: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
        recipeIngredient: ["1 cup flour"],
        recipeInstructions: ["Mix ingredients"],
      });

      const result = parseJsonLd(html, "https://example.com/recipe");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/image1.jpg");
      }
    });

    it("extracts first image from array of ImageObjects", () => {
      const html = wrapInHtml({
        "@type": "Recipe",
        name: "Test Recipe",
        image: [
          { "@type": "ImageObject", url: "https://example.com/image1.jpg" },
          { "@type": "ImageObject", url: "https://example.com/image2.jpg" },
        ],
        recipeIngredient: ["1 cup flour"],
        recipeInstructions: ["Mix ingredients"],
      });

      const result = parseJsonLd(html, "https://example.com/recipe");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/image1.jpg");
      }
    });

    it("extracts contentUrl from ImageObject if url is missing", () => {
      const html = wrapInHtml({
        "@type": "Recipe",
        name: "Test Recipe",
        image: {
          "@type": "ImageObject",
          contentUrl: "https://example.com/content-image.jpg",
        },
        recipeIngredient: ["1 cup flour"],
        recipeInstructions: ["Mix ingredients"],
      });

      const result = parseJsonLd(html, "https://example.com/recipe");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/content-image.jpg");
      }
    });

    it("returns undefined when no image is present", () => {
      const html = wrapInHtml({
        "@type": "Recipe",
        name: "Test Recipe",
        recipeIngredient: ["1 cup flour"],
        recipeInstructions: ["Mix ingredients"],
      });

      const result = parseJsonLd(html, "https://example.com/recipe");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBeUndefined();
      }
    });

    it("trims whitespace from image URL", () => {
      const html = wrapInHtml({
        "@type": "Recipe",
        name: "Test Recipe",
        image: "  https://example.com/image.jpg  ",
        recipeIngredient: ["1 cup flour"],
        recipeInstructions: ["Mix ingredients"],
      });

      const result = parseJsonLd(html, "https://example.com/recipe");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/image.jpg");
      }
    });
  });
});
