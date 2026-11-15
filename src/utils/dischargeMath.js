// Pure math helpers used by DischargeCalcWidget formulas.

// Time derivative from two successive samples:
//   (value - previousValue) / (timestamp - previousTimestamp)
// This is the finite-difference form of the derivative definition applied to
// the incoming signal. `timestamp` is in milliseconds.
export function computeInputRate(previous, sample) {
    if (!previous || !sample || previous.value == null || sample.value == null) return null;
    if (previous.key !== sample.key) return null;

    const unchanged = sample.timestamp === previous.timestamp && sample.value === previous.value;
    if (unchanged) return previous.rate ?? null;

    const dt = (sample.timestamp - previous.timestamp) / 1000;
    if (!Number.isFinite(dt) || dt <= 0) return previous.rate ?? null;

    return (sample.value - previous.value) / dt;
}

// Formula authors commonly write a^2 for exponentiation, but JavaScript
// treats ^ as bitwise XOR. Translate carets to ** so the evaluated value
// matches the power shown in the preview.
export function normalizeFormulaSyntax(source) {
    return source.replace(/\^/g, "**");
}

// Numerical derivative. derivative(a) returns the time derivative of input A;
// derivative(fn, x) differentiates a function at x, and derivative(fn) returns
// a reusable derivative function.
export function derivative(input, x, step = 1e-4) {
    if (input != null && typeof input === "object" && input.__isDischargeInput) {
        return Number.isFinite(input.__dischargeRate) ? input.__dischargeRate : NaN;
    }
    if (typeof input !== "function") return NaN;
    const h = Number.isFinite(step) && step !== 0 ? Math.abs(step) : 1e-4;
    const df = value => (input(value + h) - input(value - h)) / (2 * h);
    return x === undefined ? df : df(x);
}

// Wrap inputs in Number objects so arithmetic still behaves normally while
// derivative(a) can tell which input it was given.
export function makeInputSignal(value, rate) {
    if (value == null || !Number.isFinite(value)) return NaN;
    const signal = new Number(value);
    signal.__isDischargeInput = true;
    signal.__dischargeRate = Number.isFinite(rate) ? rate : NaN;
    return signal;
}
