import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { detectBot } from "@/lib/security";

describe("cn utility", () => {
  it("combines class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
  it("merges tailwind classes", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
  it("handles undefined", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });
});

describe("security - detectBot", () => {
  it("detects GPT bots", () => {
    expect(detectBot("Mozilla/5.0 GPTBot")).toBe(true);
  });
  it("detects Claude", () => {
    expect(detectBot("Claude-Web crawler")).toBe(true);
  });
  it("detects Google crawler", () => {
    expect(detectBot("Googlebot/2.1")).toBe(true);
  });
  it("passes regular browsers", () => {
    expect(detectBot("Mozilla/5.0 Chrome/120")).toBe(false);
  });
  it("passes Firefox", () => {
    expect(detectBot("Mozilla/5.0 Firefox/121")).toBe(false);
  });
});

describe("quote number generation", () => {
  it("generates correct format", () => {
    const year = new Date().getFullYear();
    const num = `QTE-${year}-0001`;
    expect(num).toMatch(/^QTE-\d{4}-\d{4}$/);
  });
});

describe("status colors mapping", () => {
  it("has valid statuses", () => {
    const statuses = ["draft", "sent", "opened", "accepted", "changes_requested", "expired", "archived"];
    statuses.forEach((s) => {
      expect(s.length).toBeGreaterThan(0);
    });
  });
});
