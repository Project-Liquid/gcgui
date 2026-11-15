import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FormulaPreview from "./FormulaPreview";

describe("FormulaPreview", () => {
    it("renders division as a fraction and sqrt as a radical", () => {
        const html = renderToStaticMarkup(<FormulaPreview formula="1/sqrt(2)" result="0.707107" />);
        expect(html).toContain('class="math-fraction"');
        expect(html).toContain('class="math-radical"');
        expect(html).toContain("√");
        expect(html).toContain("0.707107");
    });

    it("renders pow() and ** and ^ as superscripts", () => {
        for (const formula of ["pow(a, 2)", "a ** 2", "a ^ 2"]) {
            const html = renderToStaticMarkup(<FormulaPreview formula={formula} />);
            expect(html).toContain("<sup");
            expect(html).toContain('class="math-exponent"');
        }
    });

    it("renders nested roots and function calls", () => {
        const html = renderToStaticMarkup(<FormulaPreview formula="sqrt(a**2 + cbrt(b)) + ln(c)" />);
        expect(html.match(/class="math-radical"/g)).toHaveLength(2);
        expect(html).toContain("∛");
        expect(html).toContain("ln");
    });

    it("falls back to raw text for unsupported syntax", () => {
        const html = renderToStaticMarkup(<FormulaPreview formula="a > b ? 1 : 0" />);
        expect(html).toContain("a &gt; b ? 1 : 0");
    });
});
