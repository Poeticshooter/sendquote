import { describe, it, expect } from "vitest";
import { detectBot } from "@/lib/security";

describe("detectBot", () => {
  it("detects GPT bots", () => {
    const result = detectBot("Mozilla/5.0 GPTBot");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(true);
  });

  it("detects Claude web crawler", () => {
    const result = detectBot("Claude-Web crawler");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(true);
  });

  it("detects PerplexityBot", () => {
    const result = detectBot("PerplexityBot/2.0");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(true);
  });

  it("detects generic crawlers", () => {
    const result = detectBot("Generic crawler");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(false);
  });

  it("detects curl as bot but not AI crawler", () => {
    const result = detectBot("curl/7.88.1");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(false);
  });

  it("passes regular Chrome browser", () => {
    const result = detectBot("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36");
    expect(result.isBot).toBe(false);
    expect(result.isAiCrawler).toBe(false);
  });

  it("passes Firefox", () => {
    const result = detectBot("Mozilla/5.0 Firefox/121.0");
    expect(result.isBot).toBe(false);
    expect(result.isAiCrawler).toBe(false);
  });

  it("passes Safari", () => {
    const result = detectBot("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/604.1");
    expect(result.isBot).toBe(false);
    expect(result.isAiCrawler).toBe(false);
  });

  it("does NOT match 'ai' substring in regular browsers", () => {
    const result = detectBot("Mozilla/5.0 AI Browser");
    expect(result.isBot).toBe(false);
  });

  it("handles empty user agent", () => {
    const result = detectBot("");
    expect(result.isBot).toBe(false);
    expect(result.isAiCrawler).toBe(false);
  });

  it("detects search engine bots", () => {
    const result = detectBot("Mozilla/5.0 Googlebot/2.1");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(false);
  });

  it("detects social media crawlers", () => {
    const result = detectBot("facebookexternalhit/1.1");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(false);
  });

  it("detects Wget as bot", () => {
    const result = detectBot("Wget/1.21.4");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(false);
  });
});
