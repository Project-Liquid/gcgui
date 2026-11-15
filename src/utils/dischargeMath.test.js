import { describe, expect, it } from "vitest";
import { computeInputRate, derivative, makeInputSignal, normalizeFormulaSyntax } from "./dischargeMath";

const previousSample = {
    key: "can:RPM",
    value: 100,
    timestamp: 1000,
    rate: null,
};

describe("computeInputRate", () => {
    it("uses the finite-difference definition over elapsed seconds", () => {
        const sample = { key: "can:RPM", value: 130, timestamp: 1250 };
        expect(computeInputRate(previousSample, sample)).toBeCloseTo(120);
    });

    it("keeps the last rate when the sample has not changed", () => {
        const previous = { ...previousSample, rate: 5 };
        expect(computeInputRate(previous, { ...previous })).toBe(5);
    });

    it("resets when the selected field changes", () => {
        const sample = { key: "can:Throttle", value: 130, timestamp: 1250 };
        expect(computeInputRate(previousSample, sample)).toBeNull();
    });

    it("returns null until a second sample exists", () => {
        expect(computeInputRate(undefined, previousSample)).toBeNull();
    });

    it("keeps the last rate when time does not advance", () => {
        const previous = { ...previousSample, rate: 5 };
        const sample = { ...previous, value: 130 };
        expect(computeInputRate(previous, sample)).toBe(5);
    });
});

describe("normalizeFormulaSyntax", () => {
    it("turns formula-style carets into JavaScript exponentiation", () => {
        expect(normalizeFormulaSyntax("a^2 + pow(b, 2)")).toBe("a**2 + pow(b, 2)");
    });

    it("leaves ** exponentiation untouched", () => {
        expect(normalizeFormulaSyntax("a ** 2")).toBe("a ** 2");
    });
});

describe("derivative", () => {
    it("returns the tracked time derivative for an input signal", () => {
        expect(derivative(makeInputSignal(3, 1.25))).toBe(1.25);
        expect(Number.isNaN(derivative(makeInputSignal(3, null)))).toBe(true);
    });

    it("differentiates a function at a point", () => {
        expect(derivative(x => x * x, 3)).toBeCloseTo(6, 3);
    });

    it("returns a reusable derivative function when x is omitted", () => {
        const df = derivative(x => x * x * x);
        expect(df(2)).toBeCloseTo(12, 3);
    });

    it("returns NaN for values that are not signals or functions", () => {
        expect(Number.isNaN(derivative(42))).toBe(true);
    });
});
