import { describe, expect, it } from "vitest";
import { generateCertificateCode, normalizeCertificateCode } from "@/server/services/certificates";

describe("certificate codes", () => {
  it("uses the LS-XXXX-XXXX-XX format with unambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCertificateCode()).toMatch(/^LS-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/);
    }
  });

  it("is effectively unique", () => {
    const codes = new Set(Array.from({ length: 5000 }, generateCertificateCode));
    expect(codes.size).toBe(5000);
  });

  it("normalizes what people type", () => {
    expect(normalizeCertificateCode("ls-7k2m-9qxp-4t")).toBe("LS-7K2M-9QXP-4T");
    expect(normalizeCertificateCode(" LS 7K2M 9QXP 4T ")).toBe("LS-7K2M-9QXP-4T");
    expect(normalizeCertificateCode("7K2M9QXP4T")).toBe("LS-7K2M-9QXP-4T");
    // O→0 and I/L→1 so misread characters still resolve.
    expect(normalizeCertificateCode("LS-OK2M-9QXP-4I")).toBe("LS-0K2M-9QXP-41");
  });
});
