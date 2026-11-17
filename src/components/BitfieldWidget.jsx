import { useState } from "react";
import "../App.css";
import { useCANDataHook } from "./parsers/canproc";
import { useCSVDataHook } from "./parsers/csvproc";
import { getCsvDisplayName, resolveCsvCanonical } from "../utils/csvAliases";
import { buildBitRows, parseBitNames, toBinaryDigits } from "../utils/bitfield";
import CsvAliasEditor from "./CsvAliasEditor";

const CAN_FALLBACK_FIELDS = ["RPM", "Throttle", "EngineTemp", "OilPressure", "Voltage", "Current", "Temperature", "SOC"];

const DEFAULT_ALIASES = {};

// Use the raw (unscaled) value when available: bitfields are integers.
const fieldValue = field => field?.raw ?? field?.value ?? null;

export default function BitfieldWidget({ shape, mode = "can", csvAliases = DEFAULT_ALIASES, onCsvAliasChange }) {
    const { canData } = useCANDataHook();
    const { csvData } = useCSVDataHook();
    const isCSV = mode === "csv";

    const [selectedField, setSelectedField] = useState(shape.dataField || "");

    // Aliases are display-only; always work with the canonical key internally.
    const selectedCanonical = isCSV ? resolveCsvCanonical(selectedField, csvAliases) : selectedField;

    let allFields = [];
    if (isCSV) {
        const fields = csvData.csv?.fields ?? {};
        allFields = Object.keys(fields);
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
    const selectOptions = visibleFields.length > 0 ? visibleFields : allFields;
    const effectiveField = selectOptions.includes(selectedCanonical) ? selectedCanonical : selectOptions[0];

    let rawValue = null;
    if (isCSV) {
        rawValue = fieldValue(csvData.csv?.fields?.[effectiveField]);
    } else {
        Object.values(canData).forEach(message => {
            const value = fieldValue(message?.fields?.[effectiveField]);
            if (value != null) rawValue = value;
        });
    }

    const format = shape.bitFormat === "integer" ? "integer" : "binary";
    const order = shape.bitOrder === "lsb-first" ? "lsb-first" : "msb-first";
    const binary = toBinaryDigits(rawValue, format);
    const rows = binary === null ? [] : buildBitRows(binary, parseBitNames(shape.bitNames), order);
    const fieldLabel = isCSV ? getCsvDisplayName(effectiveField, csvAliases) : effectiveField;

    return (
        <div className="bitfield-widget fill">
            <div className="bitfield-header">
                <div className="widget-name">{shape.name || "Bitfield Widget"}</div>
                <div className="bitfield-binary" title={binary === null ? "No binary value" : binary}>
                    {binary ?? "N/A"}
                </div>
            </div>

            {binary === null ? (
                <div className="bitfield-empty">
                    {rawValue == null
                        ? `No data for ${fieldLabel} yet`
                        : `"${rawValue}" is not a valid ${format === "integer" ? "integer" : "binary"} value`}
                </div>
            ) : (
                <div className="bitfield-list">
                    {rows.map(row => (
                        <div key={row.bitIndex} className={`bitfield-row${row.active ? " active" : ""}`}>
                            <span className="bitfield-dot" />
                            <span className="bitfield-name" title={row.name}>
                                {row.name}
                            </span>
                            <span className="bitfield-index">bit {row.bitIndex}</span>
                            <span className={`bitfield-bool${row.active ? " active" : ""}`}>
                                {String(row.active)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="bitfield-controls">
                <select
                    id={`field-select-${shape.id}`}
                    className="bitfield-select"
                    aria-label="Field"
                    title="Select field"
                    value={effectiveField}
                    onChange={e => setSelectedField(e.target.value)}
                >
                    {selectOptions.map(field => (
                        <option key={field} value={field}>
                            {isCSV ? getCsvDisplayName(field, csvAliases) : field}
                        </option>
                    ))}
                </select>
                {isCSV && <CsvAliasEditor fields={selectOptions} aliases={csvAliases} onAliasChange={onCsvAliasChange} />}
            </div>
        </div>
    );
}
