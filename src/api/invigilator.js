import { api } from "./client";

// ---------- Barcode-first flow (primary - needs pre-loaded hall ticket data from OCR import) ----------

// Scans the student's hall ticket barcode (register number) - no manual semester/QP-code
// entry, resolves whatever exam(s) they have scheduled today automatically.
export const lookupByBarcode = (registerNumber) =>
    api.get(`/api/invigilator/mobile/lookup-by-barcode?registerNumber=${encodeURIComponent(registerNumber)}`);

export const scanByBarcode = (payload) => api.post("/api/invigilator/mobile/scan-by-barcode", payload);

// ---------- Manual flow (fallback - for students with no pre-loaded hall ticket) ----------

export const lookupHallTicket = (registerNumber, semester) =>
    api.get(`/api/invigilator/mobile/lookup?registerNumber=${encodeURIComponent(registerNumber)}&semester=${encodeURIComponent(semester)}`);

export const mobileScan = (payload) => api.post("/api/invigilator/mobile/scan", payload);

// ---------- Shared ----------

export const markAbsent = (payload) => api.post("/api/invigilator/attendance/mark-absent", payload);

export const searchStudents = (registerNumber) =>
    api.get(`/api/invigilator/students?registerNumber=${encodeURIComponent(registerNumber)}`);

export const searchAttendance = (params = {}) => {
    const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
    ).toString();
    return api.get(`/api/invigilator/attendance${query ? `?${query}` : ""}`);
};

// ---------- Admin: bulk hall-ticket import (from the OCR module's extracted data) ----------

export const importHallTickets = (students) => api.post("/api/admin/halltickets/import", { students });
