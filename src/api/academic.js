import { api } from "./client";

// ---------- Academic structure (Admin-managed master data) ----------
export const createDepartment = (payload) => api.post("/api/admin/academic/departments", payload);
export const updateDepartment = (id, payload) => api.put(`/api/admin/academic/departments/${id}`, payload);
export const listDepartments = () => api.get("/api/admin/academic/departments");

export const createProgram = (payload) => api.post("/api/admin/academic/programs", payload);
export const updateProgram = (id, payload) => api.put(`/api/admin/academic/programs/${id}`, payload);
export const listPrograms = () => api.get("/api/admin/academic/programs");

export const createBatch = (programId, payload) => api.post(`/api/admin/academic/programs/${programId}/batches`, payload);
export const listBatches = () => api.get("/api/admin/academic/batches");
export const listBatchesForProgram = (programId) => api.get(`/api/admin/academic/programs/${programId}/batches`);
export const createSyllabus = (programId, payload) => api.post(`/api/admin/academic/programs/${programId}/syllabi`, payload);
export const createStandaloneSyllabus = (payload) => api.post("/api/admin/academic/syllabi", payload);
export const updateSyllabus = (id, payload) => api.put(`/api/admin/academic/syllabi/${id}`, payload);
export const listSyllabi = () => api.get("/api/admin/academic/syllabi");
export const listSyllabiForProgram = (programId) => api.get(`/api/admin/academic/programs/${programId}/syllabi`);
export const createAcademicSubject = (syllabusId, payload) => api.post(`/api/admin/academic/syllabi/${syllabusId}/subjects`, payload);
export const listAcademicSubjects = (syllabusId, semester) =>
    api.get(`/api/admin/academic/syllabi/${syllabusId}/subjects?semester=${encodeURIComponent(semester)}`);
export const createCurriculum = (payload) => api.post("/api/admin/academic/curricula", payload);
export const updateCurriculum = (id, payload) => api.put(`/api/admin/academic/curricula/${id}`, payload);
export const listCurricula = () => api.get("/api/admin/academic/curricula");
export const listCurriculumSubjects = (id) => api.get(`/api/admin/academic/curricula/${id}/subjects`);
export const listReDepartments = () => api.get("/api/re/academic/departments");
export const listRePrograms = () => api.get("/api/re/academic/programs");
export const listReCurricula = () => api.get("/api/re/academic/curricula");
export const createCurriculumSubject = (curriculumId, payload) =>
    api.post(`/api/admin/academic/curricula/${curriculumId}/subjects`, payload);
export const updateCurriculumSubject = (curriculumId, subjectId, payload) =>
    api.put(`/api/admin/academic/curricula/${curriculumId}/subjects/${subjectId}`, payload);

// ---------- Student master data (Admin-managed) ----------
export const upsertStudent = (payload) => api.post("/api/admin/students", payload);
export const searchAdminStudents = (registerNumber) => {
    const query = registerNumber ? `?registerNumber=${encodeURIComponent(registerNumber)}` : "";
    return api.get(`/api/admin/students${query}`);
};
export const listStudentsForBatch = (batchId) => api.get(`/api/admin/students/batch/${batchId}`);
