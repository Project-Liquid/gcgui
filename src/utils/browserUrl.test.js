import { describe, expect, it } from "vitest";
import { normalizeBrowserUrl } from "./browserUrl";

describe("normalizeBrowserUrl", () => {
    it("returns an empty string for missing input", () => {
        expect(normalizeBrowserUrl("")).toBe("");
        expect(normalizeBrowserUrl("   ")).toBe("");
        expect(normalizeBrowserUrl(null)).toBe("");
        expect(normalizeBrowserUrl(undefined)).toBe("");
        expect(normalizeBrowserUrl(42)).toBe("");
    });

    it("adds https to bare hostnames", () => {
        expect(normalizeBrowserUrl("example.com")).toBe("https://example.com/");
        expect(normalizeBrowserUrl("  example.com/dashboard  ")).toBe("https://example.com/dashboard");
    });

    it("keeps explicit http(s) URLs", () => {
        expect(normalizeBrowserUrl("https://example.com/path?q=1#top")).toBe("https://example.com/path?q=1#top");
        expect(normalizeBrowserUrl("http://example.com")).toBe("http://example.com/");
    });

    it("uses http for local addresses", () => {
        expect(normalizeBrowserUrl("localhost:3000")).toBe("http://localhost:3000/");
        expect(normalizeBrowserUrl("127.0.0.1:8080/dashboard")).toBe("http://127.0.0.1:8080/dashboard");
        expect(normalizeBrowserUrl("192.168.1.20:8080")).toBe("http://192.168.1.20:8080/");
    });

    it("rejects non-web schemes", () => {
        expect(normalizeBrowserUrl("file:///etc/passwd")).toBe("");
        expect(normalizeBrowserUrl("ftp://example.com/file")).toBe("");
        expect(normalizeBrowserUrl("javascript:alert(1)")).toBe("");
        expect(normalizeBrowserUrl("not a url")).toBe("");
    });
});
