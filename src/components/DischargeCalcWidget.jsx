import { Fragment, useMemo } from "react";
import "../App.css";
import { useCANDataHook } from "./parsers/canproc";
import { useCSVDataHook } from "./parsers/csvproc";
import { getCsvDisplayName, resolveCsvCanonical } from "../utils/csvAliases";
import FormulaPreview from "./FormulaPreview";

export const DEFAULT_DISCHARGE_FORMULA = "a + b + c + d + e";

const CAN_FALLBACK_FIELDS = ["RPM", "Throttle", "EngineTemp", "OilPressure", "Voltage", "Current", "Temperature", "SOC"];

const DEFAULT_ALIASES = {};

// CAN and CSV fields are { value, unit, raw } objects; extract the display value.
const fieldValue = field => field?.value ?? field?.raw ?? null;

function getSelectOptions(mode, canData, csvData) {
    let allFields = [];
    if (mode === "csv") {
        allFields = Object.keys(csvData.csv?.fields ?? {});
        if (allFields.length === 0) allFields = ["datapoint 1"];
    } else {
        Object.values(canData).forEach(message => {
            if (message?.fields) {
                Object.keys(message.fields).forEach(field => {
                    if (!allFields.includes(field)) allFields.push(field);
                });
            }
        });
        if (allFields.length === 0) allFields = CAN_FALLBACK_FIELDS;
    }

    // "time" is the sample clock, not a displayable signal.
    const visibleFields = allFields.filter(field => field !== "time");
    return visibleFields.length > 0 ? visibleFields : allFields;
}

// Read the current numeric value for a field from the active parser.
function readFieldValue(mode, field, canData, csvData) {
    let value = null;
    if (mode === "csv") {
        value = fieldValue(csvData.csv?.fields?.[field]);
    } else {
        Object.values(canData).forEach(message => {
            const next = fieldValue(message?.fields?.[field]);
            if (next != null) value = next;
        });
    }
    const numeric = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function toConstant(value) {
    const numeric = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

// Keep calculated values readable without dropping meaningful precision.
function formatResult(value) {
    if (!Number.isFinite(value)) return "N/A";
    return String(Number.parseFloat(value.toFixed(6)));
}

// Numerical derivative. Call derivative(fn, x) for the value at x, or
// derivative(fn) to get a reusable derivative function.
function derivative(fn, x, step = 1e-4) {
    if (typeof fn !== "function") return NaN;
    const h = Number.isFinite(step) && step !== 0 ? Math.abs(step) : 1e-4;
    const df = value => (fn(value + h) - fn(value - h)) / (2 * h);
    return x === undefined ? df : df(x);
}

// Math helpers are exposed directly so formulas can use sqrt(a) as well as
// Math.sqrt(a). "derivative" is available for numerical differentiation.
const FORMULA_HELPERS = {
    Math,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    pow: Math.pow,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,
    exp: Math.exp,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    sign: Math.sign,
    trunc: Math.trunc,
    hypot: Math.hypot,
    PI: Math.PI,
    E: Math.E,
    derivative,
};
const FORMULA_HELPER_NAMES = Object.keys(FORMULA_HELPERS);
const FORMULA_HELPER_VALUES = FORMULA_HELPER_NAMES.map(name => FORMULA_HELPERS[name]);

function compileFormula(formula) {
    try {
        const evaluate = new Function(
            "a",
            "b",
            "c",
            "d",
            "e",
            ...FORMULA_HELPER_NAMES,
            `"use strict"; return (${formula});`,
        );
        return { evaluate, error: null };
    } catch (error) {
        return { evaluate: null, error: error instanceof Error ? error.message : String(error) };
    }
}

function evaluateCompiledFormula(compiled, values) {
    if (!compiled.evaluate) return { value: null, error: compiled.error };
    try {
        // Missing inputs are NaN so a formula that ignores them still works,
        // while a formula that uses them naturally produces no result.
        const raw = compiled.evaluate(
            values.a ?? NaN,
            values.b ?? NaN,
            values.c ?? NaN,
            values.d,
            values.e,
            ...FORMULA_HELPER_VALUES,
        );
        const numeric = typeof raw === "number" ? raw : Number(raw);
        return { value: Number.isFinite(numeric) ? numeric : null, error: null };
    } catch (error) {
        return { value: null, error: error instanceof Error ? error.message : String(error) };
    }
}

export default function DischargeCalcWidget({ shape, mode = "can", csvAliases = DEFAULT_ALIASES }) {
    const { canData } = useCANDataHook();
    const { csvData } = useCSVDataHook();
    const isCSV = mode === "csv";
    const formula = typeof shape.formula === "string" && shape.formula.trim() ? shape.formula : DEFAULT_DISCHARGE_FORMULA;
    const compiledFormula = useMemo(() => compileFormula(formula), [formula]);

    if (mode !== "can" && mode !== "csv") {
        return (
            <div className="number-widget fill">
                <div className="widget-name">{shape.name || "Discharge Calc Widget"}</div>
                <div className="number-widget-value">invalid mode</div>
            </div>
        );
    }

    const selectOptions = getSelectOptions(mode, canData, csvData);
    const canonicalField = field => (isCSV ? resolveCsvCanonical(field, csvAliases) : field);
    const effectiveField = field => {
        const canonical = canonicalField(field);
        return selectOptions.includes(canonical) ? canonical : selectOptions[0];
    };

    const inputA = effectiveField(shape.inputA);
    const inputB = effectiveField(shape.inputB);
    const inputC = effectiveField(shape.inputC);

    const a = readFieldValue(mode, inputA, canData, csvData);
    const b = readFieldValue(mode, inputB, canData, csvData);
    const c = readFieldValue(mode, inputC, canData, csvData);
    const d = toConstant(shape.constantD);
    const e = toConstant(shape.constantE);

    const evaluation = evaluateCompiledFormula(compiledFormula, { a, b, c, d, e });
    const currentValue = evaluation.value != null ? formatResult(evaluation.value) : evaluation.error ? "ERR" : "N/A";

    return (
        <div className="number-widget fill">
            <div className="widget-name">{shape.name || "Discharge Calc Widget"}</div>
            <div className="number-widget-value" title={evaluation.error || undefined}>
                {currentValue}
            </div>
        </div>
    );
}

// Settings form shown inside the Widget Properties modal. It lives here so it
// can use the same parser hooks as the widget to list available input fields.
export function DischargeCalcSettings({ editor, onChange, mode = "can", csvAliases = DEFAULT_ALIASES }) {
    const { canData } = useCANDataHook();
    const { csvData } = useCSVDataHook();
    const isCSV = mode === "csv";
    const selectOptions = getSelectOptions(mode, canData, csvData);

    const inputRows = [
        { key: "inputA", label: "Input A" },
        { key: "inputB", label: "Input B" },
        { key: "inputC", label: "Input C" },
    ];
    const constantRows = [
        { key: "constantD", label: "Constant D" },
        { key: "constantE", label: "Constant E" },
    ];

    // Keep configured fields selectable even when the current data has not
    // produced them yet, so opening settings never silently drops a choice.
    const options = [...selectOptions];
    inputRows.forEach(row => {
        const configured = isCSV ? resolveCsvCanonical(editor[row.key], csvAliases) : editor[row.key];
        if (typeof configured === "string" && configured && !options.includes(configured)) {
            options.push(configured);
        }
    });

    const effectiveField = field => {
        const canonical = isCSV ? resolveCsvCanonical(field, csvAliases) : field;
        return options.includes(canonical) ? canonical : options[0];
    };
    const setValue = patch => onChange(current => ({ ...current, ...patch }));

    const previewValues = {
        a: readFieldValue(mode, effectiveField(editor.inputA), canData, csvData),
        b: readFieldValue(mode, effectiveField(editor.inputB), canData, csvData),
        c: readFieldValue(mode, effectiveField(editor.inputC), canData, csvData),
        d: toConstant(editor.constantD),
        e: toConstant(editor.constantE),
    };
    const formula =
        typeof editor.formula === "string" && editor.formula.trim() ? editor.formula : DEFAULT_DISCHARGE_FORMULA;
    const compiledFormula = useMemo(() => compileFormula(formula), [formula]);
    const preview = evaluateCompiledFormula(compiledFormula, previewValues);
    let previewText = null;
    if (preview.error) previewText = `Formula error: ${preview.error}`;
    else if (preview.value == null) previewText = "Preview: waiting for input data.";

    return (
        <>
            {inputRows.map(row => (
                <Fragment key={row.key}>
                    <label htmlFor={`widget-${row.key}`}>{row.label}</label>
                    <select
                        id={`widget-${row.key}`}
                        value={effectiveField(editor[row.key])}
                        onChange={event => setValue({ [row.key]: event.target.value })}
                    >
                        {options.map(field => (
                            <option key={field} value={field}>
                                {isCSV ? getCsvDisplayName(field, csvAliases) : field}
                            </option>
                        ))}
                    </select>
                </Fragment>
            ))}
            {constantRows.map(row => (
                <Fragment key={row.key}>
                    <label htmlFor={`widget-${row.key}`}>{row.label}</label>
                    <input
                        id={`widget-${row.key}`}
                        type="number"
                        step="any"
                        value={editor[row.key] ?? 0}
                        onChange={event => setValue({ [row.key]: event.target.value })}
                    />
                </Fragment>
            ))}
            <label htmlFor="widget-formula">Formula (JavaScript)</label>
            <input
                id="widget-formula"
                type="text"
                className="properties-formula-input"
                value={editor.formula ?? DEFAULT_DISCHARGE_FORMULA}
                placeholder={DEFAULT_DISCHARGE_FORMULA}
                spellCheck={false}
                onChange={event => setValue({ formula: event.target.value })}
            />
            <div className="formula-preview-box">
                <FormulaPreview
                    formula={formula}
                    result={preview.value != null ? formatResult(preview.value) : null}
                />
            </div>
            <div className="properties-hint">
                Inputs are <code>a</code>, <code>b</code>, <code>c</code>; constants are <code>d</code>,{" "}
                <code>e</code>. Math helpers such as <code>sqrt(a)</code>, <code>pow(a, 2)</code> and{" "}
                <code>derivative(x =&gt; x * x, a)</code> are available.
            </div>
            {previewText && (
                <div className={`properties-hint${preview.error ? " properties-preview-error" : ""}`}>
                    {previewText}
                </div>
            )}
        </>
    );
}
