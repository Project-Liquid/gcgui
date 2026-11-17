/**
 * Helpers for the bitfield widget.
 */

/**
 * Split a stored comma-separated names string into display slots.
 * Empty entries are preserved so a name stays attached to its bit.
 */
export function parseBitNames(bitNames) {
    return String(bitNames ?? "")
        .split(",")
        .map(name => name.trim());
}

/**
 * Convert a field value into a string of binary digits.
 *
 * "binary" format interprets values exactly as written (so 1011010 is seven
 * bits, not the decimal number one million) and never strips leading zeros.
 * Values that are not valid binary digits fall back to integer conversion so
 * ordinary CAN counts still work. "integer" format converts the number to
 * base 2.
 */
export function toBinaryDigits(value, format = "binary") {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    if (!text) return null;

    if (format === "binary") {
        const prefixed = text.match(/^0b([01]+)$/i);
        if (prefixed) return prefixed[1];
        if (/^[01]+$/.test(text)) return text;
    }

    const numeric = typeof value === "number" ? value : Number(text);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric < 0) return null;
    return numeric.toString(2);
}

/**
 * Build the rows shown in the widget. The first name maps to the first
 * displayed bit, so "order" controls both display order and name mapping.
 */
export function buildBitRows(binary, names, order = "msb-first") {
    if (binary === null || binary === undefined) return [];
    const slots = Math.max(binary.length, names.length);
    const rows = [];

    for (let i = 0; i < slots; i++) {
        const bitIndex = order === "lsb-first" ? i : slots - 1 - i;
        const digitIndex = binary.length - 1 - bitIndex;
        const digit = digitIndex >= 0 ? binary[digitIndex] : "0";
        rows.push({
            bitIndex,
            name: names[i] || `Bit ${bitIndex}`,
            active: digit === "1",
        });
    }

    return rows;
}
