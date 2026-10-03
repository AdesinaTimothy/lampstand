import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/validation/auth";
import { sanitizeRichText } from "@/server/sanitize";
import { roleHasPermission } from "@/lib/roles";

describe("safeRedirectPath", () => {
  it("allows same-site relative paths", () => {
    expect(safeRedirectPath("/learn/romans/abc?x=1")).toBe("/learn/romans/abc?x=1");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, undefined])("rejects %s", (v) => {
    expect(safeRedirectPath(v as string)).toBe("/dashboard");
  });
});

describe("sanitizeRichText", () => {
  it("strips scripts, event handlers and javascript: URLs", () => {
    const out = sanitizeRichText(`<p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><img src="x" onerror="alert(1)">`);
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(out).toContain("<p>Hi</p>");
  });
  it("keeps formatting and only trusted embeds", () => {
    const out = sanitizeRichText(
      `<h2>Title</h2><blockquote>Verse</blockquote><iframe src="https://www.youtube.com/embed/abc"></iframe><iframe src="https://evil.example/x"></iframe>`,
    );
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("youtube.com/embed/abc");
    expect(out).not.toContain("evil.example");
  });
});

describe("role permissions", () => {
  it("keeps organization settings to owners", () => {
    expect(roleHasPermission("OWNER", "organization:manage")).toBe(true);
    expect(roleHasPermission("ADMIN", "organization:manage")).toBe(false);
  });
  it("gives learners no management permissions", () => {
    expect(roleHasPermission("LEARNER", "course:create")).toBe(false);
    expect(roleHasPermission("LEARNER", "learner:view")).toBe(false);
    expect(roleHasPermission("INSTRUCTOR", "course:create")).toBe(true);
    expect(roleHasPermission("INSTRUCTOR", "course:manage_any")).toBe(false);
  });
});
