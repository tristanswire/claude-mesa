import { describe, it, expect } from "vitest";
import { simplifyInstructionLines } from "../simplifier";

describe("simplifyInstructionLines", () => {
  describe("removes URLs and promotional lines", () => {
    it("removes URLs from instruction text", () => {
      const input = [
        "Mix ingredients well. Check out my blog at https://example.com/recipe for more tips!",
        "Bake at 350F for 20 minutes.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toContain("https://");
      expect(result[0]).toBe("Mix ingredients well. Check out my blog at for more tips!");
    });

    it("removes entire line if mostly URL", () => {
      const input = [
        "Visit https://example.com/full-recipe for the complete guide",
        "Mix the dry ingredients.",
      ];

      const result = simplifyInstructionLines(input);

      // First line should be dropped or heavily cleaned
      expect(result.some((l) => l.includes("example.com"))).toBe(false);
      expect(result.some((l) => l.includes("Mix the dry ingredients"))).toBe(
        true
      );
    });

    it("drops promotional lines entirely", () => {
      const input = [
        "Preheat oven to 375F.",
        "Subscribe to my newsletter!",
        "Follow me on Instagram",
        "Add flour and mix well.",
        "Jump to recipe",
        "Print recipe",
        "Enjoy!",
        "Let cool for 10 minutes.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result).toContain("Preheat oven to 375F.");
      expect(result).toContain("Add flour and mix well.");
      expect(result).toContain("Let cool for 10 minutes.");

      // Promotional lines should be dropped
      expect(result.some((l) => /subscribe/i.test(l))).toBe(false);
      expect(result.some((l) => /follow me/i.test(l))).toBe(false);
      expect(result.some((l) => /jump to recipe/i.test(l))).toBe(false);
      expect(result.some((l) => /print recipe/i.test(l))).toBe(false);
    });

    it("removes junk phrases from within instructions", () => {
      const input = [
        "See notes below for substitutions. Mix the eggs and milk together.",
        "Add flour. See recipe card for measurements.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result.some((l) => /see notes/i.test(l))).toBe(false);
      expect(result.some((l) => /recipe card/i.test(l))).toBe(false);
      expect(result.some((l) => l.includes("Mix the eggs"))).toBe(true);
    });
  });

  describe("splits long multi-action lines", () => {
    it("splits on sentence boundaries for long lines", () => {
      const input = [
        "Preheat the oven to 375 degrees Fahrenheit. In a large mixing bowl, combine the flour, sugar, and baking powder. Add the eggs and milk and mix until smooth. Pour the batter into a greased pan.",
      ];

      const result = simplifyInstructionLines(input);

      // Should be split into multiple steps
      expect(result.length).toBeGreaterThan(1);
      expect(result.some((l) => l.includes("Preheat"))).toBe(true);
      expect(result.some((l) => l.includes("combine"))).toBe(true);
    });

    it("splits on 'then' connector", () => {
      const input = [
        "Add the butter to the pan, then stir constantly until melted.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result.length).toBe(2);
      expect(result[0]).toBe("Add the butter to the pan.");
      expect(result[1]).toBe("Stir constantly until melted.");
    });

    it("splits on semicolon", () => {
      const input = [
        "Mix dry ingredients thoroughly; gradually add wet ingredients while stirring.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result.length).toBe(2);
      expect(result[0]).toContain("dry ingredients");
      expect(result[1]).toContain("wet ingredients");
    });

    it("does not split inside parentheses", () => {
      const input = [
        "Cook until golden (about 5 minutes. Check frequently). Then flip.",
      ];

      const result = simplifyInstructionLines(input);

      // Should not split the content inside parentheses
      expect(result.some((l) => l.includes("(about 5 minutes"))).toBe(true);
    });

    it("keeps short lines intact", () => {
      const input = ["Mix well.", "Add salt.", "Stir to combine."];

      const result = simplifyInstructionLines(input);

      expect(result).toHaveLength(3);
      expect(result).toEqual(["Mix well.", "Add salt.", "Stir to combine."]);
    });
  });

  describe("preserves legitimate cooking steps", () => {
    it("keeps standard cooking instructions", () => {
      const input = [
        "Preheat oven to 350F (175C).",
        "Cream butter and sugar until fluffy.",
        "Add eggs one at a time, beating well after each addition.",
        "Fold in the flour mixture gently.",
        "Bake for 25-30 minutes or until golden brown.",
        "Let cool in pan for 10 minutes before removing.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result).toHaveLength(6);
      expect(result[0]).toContain("Preheat oven");
      expect(result[1]).toContain("Cream butter");
      expect(result[2]).toContain("Add eggs");
      expect(result[3]).toContain("Fold in");
      expect(result[4]).toContain("Bake for");
      expect(result[5]).toContain("Let cool");
    });

    it("preserves measurements and temperatures", () => {
      const input = [
        "Heat oil to 375°F.",
        "Add 1/2 cup of broth.",
        "Simmer for 15-20 minutes.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toContain("375");
      expect(result[1]).toContain("1/2 cup");
      expect(result[2]).toContain("15-20 minutes");
    });

    it("handles recipe steps with notes in parentheses", () => {
      const input = [
        "Add the garlic (minced fresh is best, but jarred works too).",
        "Cook until fragrant (about 30 seconds).",
      ];

      const result = simplifyInstructionLines(input);

      expect(result).toHaveLength(2);
      expect(result[0]).toContain("(minced fresh is best");
      expect(result[1]).toContain("(about 30 seconds)");
    });
  });

  describe("removes empty and duplicate lines", () => {
    it("removes empty lines", () => {
      const input = ["Mix ingredients.", "", "   ", "Bake until done."];

      const result = simplifyInstructionLines(input);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe("Mix ingredients.");
      expect(result[1]).toBe("Bake until done.");
    });

    it("removes duplicate instructions", () => {
      const input = [
        "Mix well.",
        "Add flour.",
        "Mix well.", // duplicate
        "Add sugar.",
        "mix well", // duplicate (different case)
      ];

      const result = simplifyInstructionLines(input);

      expect(result).toHaveLength(3);
      expect(result).toEqual(["Mix well.", "Add flour.", "Add sugar."]);
    });

    it("removes very short lines", () => {
      const input = ["Mix.", "Go", "Add flour and eggs.", "Ok"];

      const result = simplifyInstructionLines(input);

      // "Mix." is 4 chars, "Go" is 2 chars, "Ok" is 2 chars - should be dropped
      expect(result).toContain("Add flour and eggs.");
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe("cleans formatting", () => {
    it("removes emojis", () => {
      const input = [
        "Mix the batter well! 🥣",
        "🔥 Bake until golden 🍪",
        "Serve and enjoy! 😋🎉",
      ];

      const result = simplifyInstructionLines(input);

      expect(result.every((l) => !/[\u{1F300}-\u{1F9FF}]/u.test(l))).toBe(true);
      expect(result[0]).toBe("Mix the batter well!");
      expect(result[1]).toBe("Bake until golden");
    });

    it("normalizes repeated punctuation", () => {
      const input = [
        "Mix well!!!",
        "Add flour...",
        "Bake until done????",
        "Stir constantly!!!!!!",
      ];

      const result = simplifyInstructionLines(input);

      // Should reduce to max 2 repeated punctuation
      expect(result[0]).toBe("Mix well!!");
      expect(result[1]).toBe("Add flour..");
      expect(result[2]).toBe("Bake until done??");
      expect(result[3]).toBe("Stir constantly!!");
    });

    it("decodes HTML entities", () => {
      const input = [
        "Add 1&nbsp;cup of flour.",
        "Heat to 350&deg;F.",
        "It&#39;s ready when golden.",
        "Use &frac12; cup sugar.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result[0]).toBe("Add 1 cup of flour.");
      expect(result[1]).toBe("Heat to 350°F.");
      expect(result[2]).toBe("It's ready when golden.");
      expect(result[3]).toBe("Use ½ cup sugar.");
    });

    it("normalizes whitespace", () => {
      const input = [
        "Mix   the   ingredients    well.",
        "Add flour  and  sugar.",
      ];

      const result = simplifyInstructionLines(input);

      expect(result[0]).toBe("Mix the ingredients well.");
      expect(result[1]).toBe("Add flour and sugar.");
    });
  });

  describe("integration: realistic blog recipe", () => {
    it("cleans up a typical noisy blog recipe", () => {
      const input = [
        "Jump to Recipe",
        "Print Recipe",
        "",
        "Prep Time: 15 minutes",
        "Cook Time: 30 minutes",
        "",
        "Step 1: Preheat your oven to 350°F (175°C). This is so important!! 🔥",
        "In a large bowl, cream together the butter and sugar until light and fluffy. This takes about 3-4 minutes with a hand mixer then add the vanilla.",
        "Add the eggs one at a time, beating well after each. See notes below for egg substitutes.",
        "Gradually fold in the flour mixture. Don't overmix!",
        "Pour into prepared pan. Check out my baking tips at https://blog.example.com/tips",
        "Bake for 25-30 minutes or until a toothpick comes out clean. Subscribe for more recipes!",
        "Let cool completely before frosting.",
        "Enjoy! 😋",
        "Follow me on Instagram @baker",
        "Did you make this? Let me know in the comments!",
      ];

      const result = simplifyInstructionLines(input);

      // Should keep the actual cooking steps
      expect(result.some((l) => l.includes("Preheat"))).toBe(true);
      expect(result.some((l) => l.includes("cream together"))).toBe(true);
      expect(result.some((l) => l.includes("Add the eggs"))).toBe(true);
      expect(result.some((l) => l.includes("fold in"))).toBe(true);
      expect(result.some((l) => l.includes("Pour into"))).toBe(true);
      expect(result.some((l) => l.includes("Bake for"))).toBe(true);
      expect(result.some((l) => l.includes("cool completely"))).toBe(true);

      // Should remove the junk
      expect(result.some((l) => /jump to recipe/i.test(l))).toBe(false);
      expect(result.some((l) => /print recipe/i.test(l))).toBe(false);
      expect(result.some((l) => /subscribe/i.test(l))).toBe(false);
      expect(result.some((l) => /instagram/i.test(l))).toBe(false);
      expect(result.some((l) => /let me know/i.test(l))).toBe(false);
      expect(result.some((l) => l.includes("https://"))).toBe(false);
      expect(result.some((l) => /see notes/i.test(l))).toBe(false);

      // Should split the long line with "then"
      expect(
        result.some((l) => l.includes("cream together") && l.includes("vanilla"))
      ).toBe(false); // Should be split

      // No emojis
      expect(result.every((l) => !/[\u{1F300}-\u{1F9FF}]/u.test(l))).toBe(true);
    });
  });
});
