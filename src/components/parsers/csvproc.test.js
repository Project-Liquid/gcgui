import { describe, expect, it } from "vitest";
import { parseCSVMessage } from "./csvproc";

describe("parseCSVMessage", () => {
    it("keeps the original cell text in raw so leading zeros survive", () => {
        const message = parseCSVMessage("0.0, 0001010, 42");
        expect(message.fields["datapoint 1"]).toEqual({ value: 1010, unit: "", raw: "0001010" });
        expect(message.fields["datapoint 2"]).toEqual({ value: 42, unit: "", raw: "42" });
    });

    it("keeps non-numeric cells as strings", () => {
        const message = parseCSVMessage("0.0, abc");
        expect(message.fields["datapoint 1"]).toEqual({ value: "abc", unit: "", raw: "abc" });
    });
});
