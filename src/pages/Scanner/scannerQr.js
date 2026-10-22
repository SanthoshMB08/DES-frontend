const QR_FIELD_NAMES = {
    usn: ["usn", "registerNumber", "registrationNumber", "registerNo", "regNo"],
    qpCode: ["qpCode", "qp", "questionPaperCode", "questionPaper"],
    examYearMonth: ["examYearMonth", "yearMonth", "examMonth", "session"],
};

function findField(object, names) {
    const entries = Object.entries(object || {});
    const normalize = (value) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const match = entries.find(([key]) => names.some((name) => normalize(key) === normalize(name)));
    return match?.[1];
}

export function parseIdentityQr(rawValue) {
    const text = String(rawValue || "").trim();
    if (!text) return null;

    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const usn = findField(parsed, QR_FIELD_NAMES.usn);
            const qpCode = findField(parsed, QR_FIELD_NAMES.qpCode);
            const examYearMonth = findField(parsed, QR_FIELD_NAMES.examYearMonth);
            if (usn && qpCode) {
                return {
                    usn: String(usn).trim().toUpperCase(),
                    qpCode: String(qpCode).trim().toUpperCase(),
                    examYearMonth: examYearMonth ? String(examYearMonth).trim().replace("/", "-") : "",
                };
            }
        }
    } catch {
        // Continue with labelled-text formats commonly used in printed hall tickets.
    }

    const usn = text.match(/(?:USN|REGISTER(?:_?NUMBER)?|REG(?:ISTRATION)?(?:_?NO)?)\s*[:=|,;]\s*([A-Z0-9-]+)/i)?.[1];
    const qpCode = text.match(/(?:QP(?:\s*CODE)?|QUESTION\s*PAPER(?:\s*CODE)?)\s*[:=|,;]\s*([A-Z0-9_-]+)/i)?.[1];
    const examYearMonth = text.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])\b/);

    let resolvedUsn = usn;
    let resolvedQpCode = qpCode;
    if (!resolvedUsn || !resolvedQpCode) {
        const fields = text.split(/[,;|\t]/).map((field) => field.trim()).filter(Boolean);
        const plainUsn = fields[0]?.match(/^[A-Z0-9-]{5,}$/i)?.[0];
        const plainQpCode = fields[1]?.match(/^[A-Z0-9_-]{2,}$/i)?.[0];
        if (plainUsn && plainQpCode) {
            resolvedUsn = plainUsn;
            resolvedQpCode = plainQpCode;
        }
    }
    if (!resolvedUsn || !resolvedQpCode) return null;
    return {
        usn: resolvedUsn.toUpperCase(),
        qpCode: resolvedQpCode.toUpperCase(),
        examYearMonth: examYearMonth ? `${examYearMonth[1]}-${examYearMonth[2]}` : "",
    };
}

export function parsePageQr(rawValue) {
    const match = String(rawValue || "").trim().match(/^(?:PAGE[\s:#-]*)?(\d{1,3})$/i);
    return match ? Number(match[1]) : null;
}

export function normalizeBookletNumber(value) {
    return String(value || "").trim().toUpperCase();
}
