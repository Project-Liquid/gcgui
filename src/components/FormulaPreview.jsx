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
        <span className="formula-preview-math" role="math" aria-label={formula}>
            {renderFormula(ast)}
            {result != null && (
                <>
                    <span className="math-relation">=</span>
                    <span className="math-number">{result}</span>
                </>
            )}
        </span>
    );
}
