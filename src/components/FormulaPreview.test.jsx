import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FormulaPreview from "./FormulaPreview";

describe("FormulaPreview", () => {
    it("renders division as a fraction and sqrt as a radical", () => {
        const html = renderToStaticMarkup(<FormulaPreview formula="1/sqrt(2)" result="0.707107" />);
        expect(html).toContain("<mfrac>");
        expect(html).toContain("<msqrt>");
        expect(html).toContain("<mn>0.707107</mn>");
    });

    it("renders powers as superscripts", () => {
        const html = renderToStaticMarkup(<FormulaPreview formula="sqrt(a**2 + b**2)" />);
        expect(html).toContain("<msup>");
        expect(html).toContain("<msqrt>");
    });

    it("falls back to raw text for unsupported syntax", () => {
        const html = renderToStaticMarkup(<FormulaPreview formula="a > b ? 1 : 0" />);
        expect(html).toContain("a &gt; b ? 1 : 0");
    });
});
