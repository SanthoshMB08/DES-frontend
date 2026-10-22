import { api, getBlob, uploadFile } from "./client";

// ---------- SCANNER ----------
export const createScript = (payload) => api.post("/api/scanner/scripts", payload);
export const listMyScannedScripts = () => api.get("/api/scanner/scripts");
// Attaches the actual scanned PDF to a script the scanner just created.
export const uploadScannedFile = (scriptId, file) => uploadFile(`/api/scanner/scripts/${scriptId}/file`, file, "POST");
// Scanned PDF preview for the scanner.
export const getScannerScriptFile = (scriptId) => getBlob(`/api/scanner/scripts/${scriptId}/file`);
export const getScannerCorrectedScriptFile = (scriptId) => getBlob(`/api/scanner/scripts/${scriptId}/corrected-file`);
// Lookup booklet details by answer booklet ID (auto-fills candidate info).
export const lookupBooklet = (answerBookletId) => api.get(`/api/scanner/booklets/${answerBookletId}`);
export const lookupScannerRegistrations = ({ usn, qpCode, examYearMonth }) => {
    const params = new URLSearchParams({ usn, qpCode });
    if (examYearMonth) params.set("examYearMonth", examYearMonth);
    return api.get(`/api/scanner/registrations?${params.toString()}`);
};
export const submitScannedBooklet = ({ registrationId, bookletNumber, file }) =>
    uploadFile("/api/scanner/booklets/submit", file, "POST", { registrationId, bookletNumber });

// ---------- RE (Register of Evaluation) ----------
export const createCourse = (payload) => api.post("/api/re/courses", payload);
export const listCourses = () => api.get("/api/re/courses");
export const assignBo = (courseId, payload) => api.post(`/api/re/courses/${courseId}/bo`, payload);
export const createSubject = (courseId, payload) => api.post(`/api/re/courses/${courseId}/subjects`, payload);
export const listSubjectsForCourse = (courseId) => api.get(`/api/re/courses/${courseId}/subjects`);
export const listSubjects = () => api.get("/api/re/subjects");
export const releaseCourseResults = (courseId) => api.post(`/api/re/courses/${courseId}/release`);
export const getSubjectProgress = (subjectId) => api.get(`/api/re/subjects/${subjectId}/progress`);

// ---------- BO (Board Officer) - oversees a whole Course ----------
export const getMyCourse = () => api.get("/api/bo/course");
// Status of every paper, grouped by subject, across the BO's whole course.
export const listMyCourseSubjects = () => api.get("/api/bo/subjects");
export const getBoeSubjectReport = (subjectId) => api.get(`/api/bo/subjects/${subjectId}/report`);
export const getBoeSubjectReportExcel = (subjectId) => getBlob(`/api/bo/subjects/${subjectId}/report.xlsx`);
export const assignChief = (subjectId, payload) => api.post(`/api/bo/subjects/${subjectId}/chief`, payload);
export const completeSubject = (subjectId) => api.post(`/api/bo/subjects/${subjectId}/complete`);

// ---------- CHIEF (Subject Chief) - runs one subject's evaluation ----------
export const createReviewer = (payload) => api.post("/api/chief/reviewers", payload);
export const listChiefReviewers = () => api.get("/api/chief/reviewers");
export const listChiefEvaluators = () => api.get("/api/chief/evaluators");
export const listUnbundledScripts = () => api.get("/api/chief/scripts/unbundled");
export const formBundle = () => api.post("/api/chief/bundles/form");
export const listChiefBundles = () => api.get("/api/chief/bundles");
export const listChiefBundleScripts = (bundleId) => api.get(`/api/chief/bundles/${bundleId}/scripts`);
export const getChiefScriptFile = (scriptId) => getBlob(`/api/chief/scripts/${scriptId}/file`);
export const assignBundle = (bundleId, evaluatorId) =>
    api.post(`/api/chief/bundles/${bundleId}/assign`, { evaluatorId });

// ---------- VALUATOR (Evaluator) ----------
export const listValuatorBundles = () => api.get("/api/valuator/bundles");
export const listValuatorBundleScripts = (bundleId) =>
    api.get(`/api/valuator/bundles/${bundleId}/scripts`);
export const submitValuatorBundle = (bundleId) =>
    api.post(`/api/valuator/bundles/${bundleId}/submit`);
export const getValuatorScript = (scriptId) => api.get(`/api/valuator/scripts/${scriptId}`);
export const submitScriptMarks = (scriptId, payload) =>
    api.post(`/api/valuator/scripts/${scriptId}/submit`, payload);
export const toggleAvailability = () => api.post("/api/valuator/availability/toggle");
export const getMyAvailability = () => api.get("/api/valuator/me");
// Loads the scanned PDF straight into the evaluator's viewer - no manual upload needed.
export const getValuatorScriptFile = (scriptId) => getBlob(`/api/valuator/scripts/${scriptId}/file`);
// Uploads the corrected/annotated copy to the separate QP correction folder.
export const submitScriptFile = (scriptId, blob) => uploadFile(`/api/valuator/scripts/${scriptId}/file`, blob, "PUT");

// ---------- REVIEWER ----------
export const createEvaluator = (payload) => api.post("/api/reviewer/evaluators", payload);
export const listReviewerEvaluators = () => api.get("/api/reviewer/evaluators");
export const listReviewerBundles = () => api.get("/api/reviewer/bundles");
export const listReviewerBundleScripts = (bundleId) =>
    api.get(`/api/reviewer/bundles/${bundleId}/scripts`);
export const getReviewerScript = (scriptId) => api.get(`/api/reviewer/scripts/${scriptId}`);
export const reviewScript = (scriptId, payload) =>
    api.post(`/api/reviewer/scripts/${scriptId}/review`, payload);
export const getReviewerScriptFile = (scriptId) => getBlob(`/api/reviewer/scripts/${scriptId}/file`);

// ---------- ADMIN ----------
export const getAdminDashboard = () => api.get("/api/admin/dashboard");

// ---------- STAFF ----------
export const getCorrectedPaper = (roleNumber, qpCode) => {
    const params = new URLSearchParams({ roleNumber, qpCode });
    return getBlob(`/api/staff/papers/corrected?${params.toString()}`);
};

// Admin can create/manage a user account for ANY role - RE, BO (BOE), Reviewer,
// Valuator (Evaluator), Scanner, Invigilator - all through the same generic user API.
export const listAdminUsers = () => api.get("/api/admin/users");
export const getAdminUser = (id) => api.get(`/api/admin/users/${id}`);
export const createAdminUser = (payload) => api.post("/api/admin/users", payload);
export const updateAdminUser = (id, payload) => api.put(`/api/admin/users/${id}`, payload);
export const deleteAdminUser = (id) => api.del(`/api/admin/users/${id}`);
export const resetAdminUserPassword = (id) => api.post(`/api/admin/users/${id}/reset-password`);
export const unlockAdminUser = (id) => api.post(`/api/admin/users/${id}/unlock`);
export const listAdminRoles = () => api.get("/api/admin/roles");
export const createAdminRole = (payload) => api.post("/api/admin/roles", payload);
export const listAdminPermissions = () => api.get("/api/admin/permissions");
export const createAdminPermission = (payload) => api.post("/api/admin/permissions", payload);
export const listAdminAudit = (params = {}) => {
    const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
    ).toString();
    return api.get(`/api/admin/audit${query ? `?${query}` : ""}`);
};

// ---------- MARKS (public - no login required) ----------
export const lookupMarks = (rollNumber, semester, course) => {
    const params = new URLSearchParams({ rollNumber, semester });
    if (course) params.set("course", course);
    return api.get(`/api/marks?${params.toString()}`);
};
