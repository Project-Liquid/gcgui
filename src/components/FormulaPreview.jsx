import { parseFormula, renderFormula } from "../utils/formulaMath";

export default function FormulaPreview({ formula, result }) {
    let ast;
    try {
        ast = parseFormula(formula);
    } catch {
        return (
            <code className="formula-preview-fallback">
                {formula}
                {result != null ? ` = ${result}` : ""}
            </code>
        );
    }

    return (
        <math display="block" className="formula-preview-math">
            <mrow>
                {renderFormula(ast)}
                {result != null && (
                    <>
                        <mo>=</mo>
                        <mn>{result}</mn>
                    </>
                )}
            </mrow>
        </math>
    );
}
