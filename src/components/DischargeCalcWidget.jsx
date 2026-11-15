import { Fragment } from "react";
import "../App.css";
import { useCANDataHook } from "./parsers/canproc";
import { useCSVDataHook } from "./parsers/csvproc";
import { getCsvDisplayName, resolveCsvCanonical } from "../utils/csvAliases";

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

export default function DischargeCalcWidget({ shape, mode = "can", csvAliases = DEFAULT_ALIASES }) {
    const { canData } = useCANDataHook();
    const { csvData } = useCSVDataHook();
    const isCSV = mode === "csv";

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

    // Placeholder formula inputs. Replace the calculation below with the real
    // discharge formula; the inputs and constants already come from settings.
    const a = readFieldValue(mode, inputA, canData, csvData);
    const b = readFieldValue(mode, inputB, canData, csvData);
    const c = readFieldValue(mode, inputC, canData, csvData);
    const d = toConstant(shape.constantD);
    const e = toConstant(shape.constantE);

    // TODO: replace this placeholder sum with the real discharge formula.
    const result = a != null && b != null && c != null ? a + b + c + d + e : null;
    const currentValue = result == null ? "N/A" : formatResult(result);

    return (
        <div className="number-widget fill">
            <div className="widget-name">{shape.name || "Discharge Calc Widget"}</div>
            <div className="number-widget-value">{currentValue}</div>
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
            <div className="properties-hint">
                Inputs A, B and C read the selected data fields. Constants D and E are fixed values. Placeholder
                formula: a + b + c + d + e.
            </div>
        </>
    );
}
