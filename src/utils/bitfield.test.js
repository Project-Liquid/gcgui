import { describe, expect, it } from "vitest";
import { buildBitRows, parseBitNames, toBinaryDigits } from "./bitfield";

describe("bitfield helpers", () => {
    it("keeps binary-looking values as digits in binary mode", () => {
        expect(toBinaryDigits("1011010", "binary")).toBe("1011010");
        expect(toBinaryDigits(1011010, "binary")).toBe("1011010");
        expect(toBinaryDigits("0b1010", "binary")).toBe("1010");
    });

    it("never strips leading zeros", () => {
        expect(toBinaryDigits("0001010", "binary")).toBe("0001010");
        expect(toBinaryDigits("000", "binary")).toBe("000");
        const rows = buildBitRows("0001010", parseBitNames(""), "msb-first");
        expect(rows).toHaveLength(7);
        expect(rows.filter(row => row.active).map(row => row.bitIndex)).toEqual([3, 1]);
    });

    it("falls back to integer conversion for non-binary values", () => {
        expect(toBinaryDigits("13", "binary")).toBe("1101");
        expect(toBinaryDigits(90, "integer")).toBe("1011010");
    });

    it("rejects values that are not unsigned integers", () => {
        expect(toBinaryDigits(null)).toBeNull();
        expect(toBinaryDigits("hello")).toBeNull();
        expect(toBinaryDigits(-1)).toBeNull();
        expect(toBinaryDigits(1.5, "integer")).toBeNull();
    });

    it("maps the first name to the first displayed bit", () => {
        const names = parseBitNames("Armed, Fuel, Ignition");
        expect(buildBitRows("101", names, "msb-first")).toEqual([
            { bitIndex: 2, name: "Armed", active: true },
            { bitIndex: 1, name: "Fuel", active: false },
            { bitIndex: 0, name: "Ignition", active: true },
        ]);
        expect(buildBitRows("10", names.slice(0, 2), "lsb-first")).toEqual([
            { bitIndex: 0, name: "Armed", active: false },
            { bitIndex: 1, name: "Fuel", active: true },
        ]);
    });

    it("fills unnamed bits and pads short binary values", () => {
        const rows = buildBitRows("11", parseBitNames("A, B, C, D"), "msb-first");
        expect(rows).toHaveLength(4);
        expect(rows.map(row => row.name)).toEqual(["A", "B", "C", "D"]);
        expect(rows.map(row => row.active)).toEqual([false, false, true, true]);
    });
});
