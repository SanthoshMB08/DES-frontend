// Runtime validation coverage for: scanner identity and page QR parsing
import { describe, expect, it } from "vitest";
import { normalizeBookletNumber, parseIdentityQr, parsePageQr } from "./scannerQr";

describe("scanner QR parsing", () => {
    it("reads student and exam values from JSON, including snake-case fields", () => {
        expect(parseIdentityQr(JSON.stringify({
            register_number: "1AB23CS001",
            qp_code: "BCA0105",
            exam_year_month: "2024-09",
        }))).toEqual({
            usn: "1AB23CS001",
            qpCode: "BCA0105",
            examYearMonth: "2024-09",
        });
    });

    it("reads labelled values and normalizes an exam session", () => {
        expect(parseIdentityQr("USN:1AB23CS001|QP CODE:BCA0105|EXAM:2024/09")).toEqual({
            usn: "1AB23CS001",
            qpCode: "BCA0105",
            examYearMonth: "2024-09",
        });
    });

    it("accepts a delimited hall-ticket payload without labels", () => {
        expect(parseIdentityQr("1AB23CS001,BCA0105,2024-09")).toEqual({
            usn: "1AB23CS001",
            qpCode: "BCA0105",
            examYearMonth: "2024-09",
        });
    });

    it("rejects incomplete identity payloads", () => {
        expect(parseIdentityQr("USN:1AB23CS001")).toBeNull();
    });

    it("accepts numeric and labelled page numbers but rejects other QR text", () => {
        expect(parsePageQr("1")).toBe(1);
        expect(parsePageQr("Page: 40")).toBe(40);
        expect(parsePageQr("page 41")).toBe(41);
        expect(parsePageQr("page forty")).toBeNull();
    });

    it("normalizes booklet barcode text", () => {
        expect(normalizeBookletNumber(" ab-123 ")).toBe("AB-123");
    });
});
