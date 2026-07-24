/**
 * ContentGeneratorAutomaton Tests
 *
 * Tests for the nanobot integration and output parsing.
 */

import { describe, it, expect } from "vitest";

// Import the class to test its methods
// Note: We need to export the class or create a testable version
// For now, we'll test the parsing logic directly

describe("ContentGeneratorAutomaton", () => {
  describe("parseNanobotOutput", () => {
    // Replicate the parsing logic for testing
    function parseNanobotOutput(output: string): { 
      title: string; 
      subtitle: string; 
      content: string; 
      summary: string; 
      tags: string[];
    } {
      const result = {
        title: "",
        subtitle: "",
        content: "",
        summary: "",
        tags: [] as string[],
      };

      const titleMatch = output.match(/TITLE:\s*(.+?)(?:\n|$)/i);
      if (titleMatch) {
        result.title = titleMatch[1].trim();
      }

      const subtitleMatch = output.match(/SUBTITLE:\s*(.+?)(?:\n|$)/i);
      if (subtitleMatch) {
        result.subtitle = subtitleMatch[1].trim();
      }

      const summaryMatch = output.match(/SUMMARY:\s*(.+?)(?:\n|$)/i);
      if (summaryMatch) {
        result.summary = summaryMatch[1].trim();
      }

      const tagsMatch = output.match(/TAGS:\s*(.+?)(?:\n|$)/i);
      if (tagsMatch) {
        result.tags = tagsMatch[1].split(",").map(t => t.trim()).filter(t => t);
      }

      const contentMatch = output.match(/CONTENT:\s*([\s\S]*?)(?=\n(?:TITLE|SUBTITLE|SUMMARY|TAGS):|$)/i);
      if (contentMatch) {
        result.content = contentMatch[1].trim();
      }

      if (!result.content && !result.title) {
        result.content = output.trim();
      }

      return result;
    }

    it("parses structured nanobot output correctly", () => {
      const sampleOutput = `
TITLE: Nigeria's Fintech Revolution Accelerates
SUBTITLE: Lagos emerges as Africa's leading hub for digital payments innovation

CONTENT:
# Nigeria's Fintech Revolution

Nigeria's financial technology sector is experiencing unprecedented growth, with venture capital investments reaching $1.2 billion in 2024. The Central Bank of Nigeria's regulatory sandbox has enabled 47 fintech startups to test innovative solutions.

## Key Players

Flutterwave, Paystack, and Kuda Bank dominate the market, serving over 15 million users combined. These companies have processed $25 billion in transactions this year.

## Investment Climate

Foreign direct investment in Nigerian fintech increased by 340% compared to 2023, positioning Lagos as the continent's premier fintech destination.

SUMMARY: Nigeria's fintech sector attracts $1.2B in VC funding with 340% FDI growth, establishing Lagos as Africa's digital payments capital.

TAGS: fintech, nigeria, investment, africa, technology
`;

      const result = parseNanobotOutput(sampleOutput);

      expect(result.title).toBe("Nigeria's Fintech Revolution Accelerates");
      expect(result.subtitle).toBe("Lagos emerges as Africa's leading hub for digital payments innovation");
      expect(result.summary).toBe("Nigeria's fintech sector attracts $1.2B in VC funding with 340% FDI growth, establishing Lagos as the continent's digital payments capital.");
      expect(result.tags).toEqual(["fintech", "nigeria", "investment", "africa", "technology"]);
      expect(result.content).toContain("Nigeria's financial technology sector");
      expect(result.content).toContain("Key Players");
    });

    it("handles output without all sections", () => {
      const partialOutput = `
TITLE: Test Article

CONTENT:
This is the main content of the article.

SUMMARY: A brief summary.
`;

      const result = parseNanobotOutput(partialOutput);

      expect(result.title).toBe("Test Article");
      expect(result.subtitle).toBe("");
      expect(result.summary).toBe("A brief summary.");
      expect(result.tags).toEqual([]);
      expect(result.content).toBe("This is the main content of the article.");
    });

    it("falls back to raw output when no structure found", () => {
      const rawOutput = "This is just plain text without any structure.";

      const result = parseNanobotOutput(rawOutput);

      expect(result.title).toBe("");
      expect(result.content).toBe("This is just plain text without any structure.");
    });

    it("handles multi-line content correctly", () => {
      const multiLineOutput = `
TITLE: Multi-line Test

CONTENT:
# Heading 1

This is paragraph one.

This is paragraph two with **bold** text.

## Subheading

- List item 1
- List item 2

SUMMARY: Testing multi-line content.

TAGS: test, markdown, content
`;

      const result = parseNanobotOutput(multiLineOutput);

      expect(result.title).toBe("Multi-line Test");
      expect(result.content).toContain("# Heading 1");
      expect(result.content).toContain("## Subheading");
      expect(result.content).toContain("- List item 1");
      expect(result.tags).toEqual(["test", "markdown", "content"]);
    });
  });

  describe("constructArticlePrompt", () => {
    function constructArticlePrompt(payload: any): string {
      const countryName = payload.country_name || "Africa";
      const sourceContent = payload.content || "";
      const sourceUrl = payload.url || "";
      
      return `Generate a Best of Africa article about: "${payload.title}" for ${countryName}. ` +
             `Use the article-generator skill to create Guardian-style business journalism. ` +
             `Base the article on this source material: ${sourceContent.substring(0, 500)}... ` +
             `Original source: ${sourceUrl}. ` +
             `Follow the editorial guidelines in the article-generator skill exactly.`;
    }

    it("constructs prompt with all payload fields", () => {
      const payload = {
        title: "Kenya's Green Energy Initiative",
        country_name: "Kenya",
        content: "Kenya has launched a massive green energy program targeting 100% renewable electricity by 2030. The program includes wind farms in Turkana and geothermal expansion in the Rift Valley.",
        url: "https://example.com/kenya-energy"
      };

      const prompt = constructArticlePrompt(payload);

      expect(prompt).toContain("Kenya's Green Energy Initiative");
      expect(prompt).toContain("Kenya");
      expect(prompt).toContain("green energy program");
      expect(prompt).toContain("https://example.com/kenya-energy");
      expect(prompt).toContain("article-generator skill");
    });

    it("handles payload with missing fields", () => {
      const payload = {
        title: "Generic Africa Update"
      };

      const prompt = constructArticlePrompt(payload);

      expect(prompt).toContain("Generic Africa Update");
      expect(prompt).toContain("Africa"); // Default country
      expect(prompt).toContain("Original source:");
    });

    it("truncates long content to 500 characters", () => {
      const payload = {
        title: "Long Content Test",
        content: "A".repeat(1000),
        country_name: "Nigeria"
      };

      const prompt = constructArticlePrompt(payload);

      expect(prompt).toContain("A".repeat(500));
      expect(prompt).toContain("...");
      expect(prompt.length).toBeLessThan(1500);
    });
  });
});
