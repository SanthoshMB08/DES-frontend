import { useEffect, useState } from "react";
import { FiEdit, FiPlus } from "react-icons/fi";
import {
    createDepartment, listDepartments,
    updateDepartment, createProgram, updateProgram, listPrograms,
    listBatches, createBatch, createStandaloneSyllabus, updateSyllabus, listSyllabi, createCurriculum, updateCurriculum, listCurricula, createCurriculumSubject, updateCurriculumSubject, listCurriculumSubjects,
    upsertStudent, searchAdminStudents,
} from "../../api/academic";

export default function AdminAcademicPanel() {
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [batches, setBatches] = useState([]);
    const [syllabi, setSyllabi] = useState([]);
    const [curricula, setCurricula] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const [d, p, b, s, c] = await Promise.all([listDepartments(), listPrograms(), listBatches(), listSyllabi(), listCurricula()]);
            setDepartments(d); setPrograms(p); setBatches(b); setSyllabi(s); setCurricula(c);
        } catch (err) {
            setError(err.message || "Failed to load academic data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ---- Department form ----
    const [deptForm, setDeptForm] = useState({ name: "", code: "" });
    const [deptBusy, setDeptBusy] = useState(false);
    const [departmentEditId, setDepartmentEditId] = useState("");
    const handleAddDepartment = async (e) => {
        e.preventDefault();
        setDeptBusy(true);
        setError("");
        try {
            const savedDepartment = departmentEditId
                ? await updateDepartment(departmentEditId, deptForm)
                : await createDepartment(deptForm);
            setDepartments((current) => [...current.filter((item) => item.id !== savedDepartment.id), savedDepartment]
                .sort((left, right) => left.name.localeCompare(right.name)));
            setDeptForm({ name: "", code: "" });
            setDepartmentEditId("");
        } catch (err) { setError(err.message || "Failed to add department."); }
        finally { setDeptBusy(false); }
    };

    // ---- Program form ----
    const [progForm, setProgForm] = useState({ name: "", code: "", departmentId: "", durationSemesters: "6" });
    const [progBusy, setProgBusy] = useState(false);
    const [programEditId, setProgramEditId] = useState("");
    const [batchForm, setBatchForm] = useState({ programId: "", admissionYear: "", label: "" });
    const [batchBusy, setBatchBusy] = useState(false);
    const handleAddProgram = async (e) => {
        e.preventDefault();
        setProgBusy(true);
        setError("");
        try {
            const payload = {
                ...progForm,
                departmentId: progForm.departmentId || null,
                durationSemesters: Number(progForm.durationSemesters) || 6,
            };
            const savedProgram = programEditId
                ? await updateProgram(programEditId, payload)
                : await createProgram(payload);
            const previousProgram = programs.find((item) => item.id === savedProgram.id);
            setDepartments((current) => current.map((department) => {
                const previousDepartmentId = previousProgram?.departmentId;
                const nextDepartmentId = savedProgram.departmentId;
                if (previousDepartmentId === nextDepartmentId
                    || (department.id !== previousDepartmentId && department.id !== nextDepartmentId)) {
                    return department;
                }
                const countChange = department.id === nextDepartmentId ? 1 : -1;
                return { ...department, programCount: Math.max(0, department.programCount + countChange) };
            }));
            setPrograms((current) => [...current.filter((item) => item.id !== savedProgram.id), savedProgram]
                .sort((left, right) => left.name.localeCompare(right.name)));
            setProgForm({ name: "", code: "", departmentId: "", durationSemesters: "6" });
            setProgramEditId("");
        } catch (err) { setError(err.message || "Failed to add program."); }
        finally { setProgBusy(false); }
    };
    const handleAddBatch = async (e) => {
        e.preventDefault();
        setBatchBusy(true);
        setError("");
        try {
            const { programId, ...payload } = batchForm;
            const savedBatch = await createBatch(programId, payload);
            setBatches((current) => [...current.filter((item) => item.id !== savedBatch.id), savedBatch]
                .sort((left, right) => right.admissionYear.localeCompare(left.admissionYear)));
            setBatchForm({ programId: "", admissionYear: "", label: "" });
        } catch (err) { setError(err.message || "Failed to add course batch."); }
        finally { setBatchBusy(false); }
    };

    const [syllabusForm, setSyllabusForm] = useState({ name: "", year: "" });
    const [syllabusBusy, setSyllabusBusy] = useState(false);
    const [syllabusEditId, setSyllabusEditId] = useState("");
    const [curriculumForm, setCurriculumForm] = useState({ programId: "", syllabusId: "", semester: "" });
    const [curriculumBusy, setCurriculumBusy] = useState(false);
    const [curriculumEditId, setCurriculumEditId] = useState("");
    const curriculumProgram = programs.find((program) => program.id === curriculumForm.programId);
    const curriculumSemesterOptions = Array.from(
        { length: curriculumProgram?.durationSemesters || 0 },
        (_, index) => String(index + 1),
    );
    const [subjectForm, setSubjectForm] = useState({ curriculumId: "", subjectCode: "", subjectName: "", qpCode: "", maxMarks: "100", credits: "", markingScheme: [] });
    const [subjectBusy, setSubjectBusy] = useState(false);
    const [subjectEditId, setSubjectEditId] = useState("");
    const [curriculumSubjects, setCurriculumSubjects] = useState([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const sectionMaximum = subjectForm.markingScheme.reduce((total, section) => total + (Number(section.maxMarks) || 0), 0);
    const addMarkingSection = () => setSubjectForm((current) => ({
        ...current,
        markingScheme: [...current.markingScheme, {
            name: `Section ${String.fromCharCode(65 + current.markingScheme.length)}`,
            maxMarks: "1",
            marksPerQuestion: "1",
            questionCount: "1",
        }],
    }));
    const updateMarkingSection = (index, updates) => setSubjectForm((current) => ({
        ...current,
        markingScheme: current.markingScheme.map((section, sectionIndex) =>
            sectionIndex === index ? { ...section, ...updates } : section
        ),
    }));
    const removeMarkingSection = (index) => setSubjectForm((current) => ({
        ...current,
        markingScheme: current.markingScheme.filter((_, sectionIndex) => sectionIndex !== index),
    }));
    useEffect(() => {
        if (!subjectForm.curriculumId) {
            setCurriculumSubjects([]);
            return undefined;
        }
        let active = true;
        setSubjectsLoading(true);
        listCurriculumSubjects(subjectForm.curriculumId)
            .then((items) => { if (active) setCurriculumSubjects(items); })
            .catch((err) => { if (active) setError(err.message || "Failed to load curriculum subjects."); })
            .finally(() => { if (active) setSubjectsLoading(false); });
        return () => { active = false; };
    }, [subjectForm.curriculumId]);
    const handleAddSyllabus = async (e) => {
        e.preventDefault(); setSyllabusBusy(true); setError("");
        try {
            const savedSyllabus = syllabusEditId
                ? await updateSyllabus(syllabusEditId, syllabusForm)
                : await createStandaloneSyllabus(syllabusForm);
            setSyllabi((current) => [...current.filter((item) => item.id !== savedSyllabus.id), savedSyllabus]
                .sort((left, right) => right.year.localeCompare(left.year)));
            setSyllabusForm({ name: "", year: "" }); setSyllabusEditId("");
        } catch (err) { setError(err.message || "Failed to add syllabus."); } finally { setSyllabusBusy(false); }
    };
    const handleAddAcademicSubject = async (e) => {
        e.preventDefault(); setError("");
        setSubjectBusy(true);
        try {
            const selectedCurriculum = curricula.find((curriculum) => curriculum.id === subjectForm.curriculumId);
            if (!selectedCurriculum) {
                throw new Error("Select a valid curriculum before adding a subject.");
            }
            const payload = {
                semester: selectedCurriculum.semester,
                subjectCode: subjectForm.subjectCode,
                subjectName: subjectForm.subjectName,
                qpCode: subjectForm.qpCode,
                maxMarks: subjectForm.markingScheme.length > 0
                    ? sectionMaximum
                    : Number(subjectForm.maxMarks) || 100,
                credits: subjectForm.credits ? Number(subjectForm.credits) : null,
                markingScheme: subjectForm.markingScheme.map((section) => ({
                    name: section.name.trim(),
                    maxMarks: Number(section.maxMarks),
                    marksPerQuestion: Number(section.marksPerQuestion),
                    questionCount: Number(section.questionCount),
                })),
            };
            const editingSubject = Boolean(subjectEditId);
            const savedSubject = editingSubject
                ? await updateCurriculumSubject(subjectForm.curriculumId, subjectEditId, payload)
                : await createCurriculumSubject(subjectForm.curriculumId, payload);
            setCurriculumSubjects((current) => [...current.filter((item) => item.id !== savedSubject.id), savedSubject]
                .sort((left, right) => left.subjectCode.localeCompare(right.subjectCode)));
            if (!editingSubject) {
                setCurricula((current) => current.map((item) => item.id === subjectForm.curriculumId
                    ? { ...item, subjectCount: item.subjectCount + 1 }
                    : item));
            }
            setSubjectForm({ ...subjectForm, subjectCode: "", subjectName: "", qpCode: "", maxMarks: "100", credits: "", markingScheme: [] });
            setSubjectEditId("");
        } catch (err) { setError(err.message || "Failed to add academic subject."); } finally { setSubjectBusy(false); }
    };
    const handleAddCurriculum = async (e) => {
        e.preventDefault(); setError(""); setCurriculumBusy(true);
        try {
            const savedCurriculum = curriculumEditId
                ? await updateCurriculum(curriculumEditId, curriculumForm)
                : await createCurriculum(curriculumForm);
            setCurricula((current) => {
                const existing = current.some((item) => item.id === savedCurriculum.id);
                return existing
                    ? current.map((item) => item.id === savedCurriculum.id ? savedCurriculum : item)
                    : [savedCurriculum, ...current];
            });
            setCurriculumForm({ programId: "", syllabusId: "", semester: "" });
            setCurriculumEditId("");
        } catch (err) { setError(err.message || "Failed to add curriculum."); }
        finally { setCurriculumBusy(false); }
    };

    // ---- Student search / pre-load ----
    const [studentQuery, setStudentQuery] = useState("");
    const [studentResults, setStudentResults] = useState([]);
    const [studentForm, setStudentForm] = useState({ registerNumber: "", studentName: "", batchId: "", dateOfBirth: "", category: "", gender: "" });
    const [studentBusy, setStudentBusy] = useState(false);
    const [studentMsg, setStudentMsg] = useState("");

    const handleSearchStudents = async () => {
        try {
            setStudentResults(await searchAdminStudents(studentQuery));
        } catch (err) { setError(err.message || "Student search failed."); }
    };

    const handleUpsertStudent = async (e) => {
        e.preventDefault();
        setStudentBusy(true);
        setStudentMsg("");
        try {
            await upsertStudent({ ...studentForm, batchId: studentForm.batchId || null, dateOfBirth: studentForm.dateOfBirth || null });
            setStudentMsg("Saved.");
            if (studentQuery) handleSearchStudents();
        } catch (err) { setStudentMsg(err.message || "Failed to save student."); }
        finally { setStudentBusy(false); }
    };

    return (
        <div className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto">
            <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">Academic Setup</h2>
            {error && <p className="font-lexend text-sm text-red-600">{error}</p>}

            {/* DEPARTMENT */}
            <section className="flex flex-col gap-3">
                <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700">Departments</h3>
                <form onSubmit={handleAddDepartment} className="flex gap-3 items-end">
                    <input required placeholder="Name (e.g. Computer Science)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none flex-1"
                        value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
                    <input required placeholder="Code (e.g. CS)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none w-40"
                        value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} />
                    <button type="submit" disabled={deptBusy} className="flex items-center gap-1.5 bg-blue-200 border border-blue-500 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                        {departmentEditId ? "UPDATE" : <><FiPlus size={15} /> ADD</>}
                    </button>
                    {departmentEditId && <button type="button" onClick={() => { setDepartmentEditId(""); setDeptForm({ name: "", code: "" }); }} className="border px-4 py-2.5 rounded-sm text-sm">CANCEL</button>}
                </form>
                <table className="w-full border-collapse text-sm">
                    <thead><tr className="bg-gray-100 text-left"><th className="border p-2">Name</th><th className="border p-2">Code</th><th className="border p-2">Programs</th><th className="border p-2">Action</th></tr></thead>
                    <tbody>
                        {!loading && departments.length === 0 && <tr><td colSpan={4} className="border p-2 text-center text-gray-500">No departments yet.</td></tr>}
                        {departments.map(d => <tr key={d.id}><td className="border p-2">{d.name}</td><td className="border p-2 font-mono">{d.code}</td><td className="border p-2">{d.programCount}</td><td className="border p-2"><button type="button" onClick={() => { setDepartmentEditId(d.id); setDeptForm({ name: d.name, code: d.code }); }} className="inline-flex items-center gap-1 text-blue-700"><FiEdit /> Edit</button></td></tr>)}
                    </tbody>
                </table>
            </section>

            {/* PROGRAM */}
            <section className="flex flex-col gap-3">
                <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700">Programs</h3>
                <form onSubmit={handleAddProgram} className="flex gap-3 items-end flex-wrap">
                    <input required placeholder="Name (e.g. BCA)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none flex-1 min-w-[10rem]"
                        value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })} />
                    <input required placeholder="Code (e.g. BCA)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none w-32"
                        value={progForm.code} onChange={(e) => setProgForm({ ...progForm, code: e.target.value })} />
                    <select required className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={progForm.departmentId} onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}>
                        <option value="">Select department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input type="number" min="1" placeholder="Semesters" className="font-lexend text-sm border p-2.5 rounded-sm outline-none w-28"
                        value={progForm.durationSemesters} onChange={(e) => setProgForm({ ...progForm, durationSemesters: e.target.value })} />
                    <button type="submit" disabled={progBusy || departments.length === 0} className="flex items-center gap-1.5 bg-blue-200 border border-blue-500 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                        {programEditId ? "UPDATE" : <><FiPlus size={15} /> ADD</>}
                    </button>
                    {programEditId && <button type="button" onClick={() => { setProgramEditId(""); setProgForm({ name: "", code: "", departmentId: "", durationSemesters: "6" }); }} className="border px-4 py-2.5 rounded-sm text-sm">CANCEL</button>}
                </form>
                {departments.length === 0 && !loading && <p className="font-lexend text-sm text-amber-700">Add a department before creating a program.</p>}
                <table className="w-full border-collapse text-sm">
                    <thead><tr className="bg-gray-100 text-left"><th className="border p-2">Name</th><th className="border p-2">Code</th><th className="border p-2">Department</th><th className="border p-2">Duration</th><th className="border p-2">Action</th></tr></thead>
                    <tbody>
                        {!loading && programs.length === 0 && <tr><td colSpan={5} className="border p-2 text-center text-gray-500">No programs yet.</td></tr>}
                        {programs.map(p => <tr key={p.id}><td className="border p-2">{p.name}</td><td className="border p-2 font-mono">{p.code}</td><td className="border p-2">{p.departmentName || "-"}</td><td className="border p-2">{p.durationSemesters} sem</td><td className="border p-2"><button type="button" onClick={() => { setProgramEditId(p.id); setProgForm({ name: p.name, code: p.code, departmentId: p.departmentId || "", durationSemesters: String(p.durationSemesters) }); }} className="inline-flex items-center gap-1 text-blue-700"><FiEdit /> Edit</button></td></tr>)}
                    </tbody>
                </table>
            </section>

            {/* BATCH */}
            <section className="flex flex-col gap-3">
                <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700">Course batches</h3>
                <form onSubmit={handleAddBatch} className="flex gap-3 items-end flex-wrap">
                    <select required aria-label="Program for batch" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                        value={batchForm.programId} onChange={(e) => setBatchForm({ ...batchForm, programId: e.target.value })}>
                        <option value="">Select program</option>
                        {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
                    </select>
                    <input required maxLength={9} placeholder="Admission year (e.g. 2026)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none w-48"
                        value={batchForm.admissionYear} onChange={(e) => setBatchForm({ ...batchForm, admissionYear: e.target.value })} />
                    <input maxLength={100} placeholder="Batch label (optional)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none flex-1 min-w-48"
                        value={batchForm.label} onChange={(e) => setBatchForm({ ...batchForm, label: e.target.value })} />
                    <button type="submit" disabled={batchBusy || programs.length === 0} className="flex items-center gap-1.5 bg-blue-200 border border-blue-500 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                        {batchBusy ? "SAVING..." : <><FiPlus size={15} /> ADD BATCH</>}
                    </button>
                </form>
                {programs.length === 0 && !loading && <p className="font-lexend text-sm text-amber-700">Add a program before creating a batch.</p>}
                <table className="w-full border-collapse text-sm">
                    <thead><tr className="bg-gray-100 text-left"><th className="border p-2">Batch</th><th className="border p-2">Program</th><th className="border p-2">Admission year</th></tr></thead>
                    <tbody>
                        {!loading && batches.length === 0 && <tr><td colSpan={3} className="border p-2 text-center text-gray-500">No course batches yet. Create one to enable HOD student imports.</td></tr>}
                        {batches.map((batch) => <tr key={batch.id}><td className="border p-2">{batch.label}</td><td className="border p-2">{batch.programName}</td><td className="border p-2">{batch.admissionYear}</td></tr>)}
                    </tbody>
                </table>
            </section>

            {/* SYLLABUS AND SUBJECTS */}
            <section className="flex flex-col gap-3">
                <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700">Syllabus</h3>
                <form onSubmit={handleAddSyllabus} className="flex gap-3 items-end flex-wrap">
                    <input required placeholder="Syllabus name (e.g. NEP)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none w-52" value={syllabusForm.name} onChange={(e) => setSyllabusForm({ ...syllabusForm, name: e.target.value })} />
                    <input required placeholder="Year (e.g. 2020)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none w-40" value={syllabusForm.year} onChange={(e) => setSyllabusForm({ ...syllabusForm, year: e.target.value })} />
                    <button type="submit" disabled={syllabusBusy} className="flex items-center gap-1.5 bg-blue-200 border border-blue-500 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                        {syllabusEditId ? "UPDATE" : <><FiPlus size={15} /> ADD</>}
                    </button>
                    {syllabusEditId && <button type="button" onClick={() => { setSyllabusEditId(""); setSyllabusForm({ name: "", year: "" }); }} className="border px-4 py-2.5 rounded-sm text-sm">CANCEL</button>}
                </form>
                <table className="w-full border-collapse text-sm">
                    <thead><tr className="bg-gray-100 text-left"><th className="border p-2">Name</th><th className="border p-2">Year</th><th className="border p-2">Program</th><th className="border p-2">Action</th></tr></thead>
                    <tbody>
                        {!loading && syllabi.length === 0 && <tr><td colSpan={4} className="border p-2 text-center text-gray-500">No syllabi yet.</td></tr>}
                        {syllabi.map(s => <tr key={s.id}><td className="border p-2">{s.name}</td><td className="border p-2">{s.year}</td><td className="border p-2">{s.programName || "Global master syllabus"}</td><td className="border p-2"><button type="button" onClick={() => { setSyllabusEditId(s.id); setSyllabusForm({ name: s.name, year: s.year }); }} className="inline-flex items-center gap-1 text-blue-700"><FiEdit /> Edit</button></td></tr>)}
                    </tbody>
                </table>
                <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700 mt-4">Program / Semester / Syllabus</h3>
                <form onSubmit={handleAddCurriculum} className="flex gap-3 items-end flex-wrap">
                    <select required className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={curriculumForm.programId} onChange={(e) => setCurriculumForm({ ...curriculumForm, programId: e.target.value, syllabusId: "", semester: "" })}><option value="">Select program</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <select required disabled={!curriculumProgram} className="font-lexend text-sm border p-2.5 rounded-sm outline-none disabled:bg-gray-100" value={curriculumForm.syllabusId} onChange={(e) => setCurriculumForm({ ...curriculumForm, syllabusId: e.target.value })}><option value="">Select syllabus</option>{syllabi.filter(s => !s.programId || s.programId === curriculumForm.programId).map(s => <option key={s.id} value={s.id}>{s.name} {s.year}</option>)}</select>
                    <select required disabled={!curriculumProgram} className="font-lexend text-sm border p-2.5 rounded-sm outline-none disabled:bg-gray-100" value={curriculumForm.semester} onChange={(e) => setCurriculumForm({ ...curriculumForm, semester: e.target.value })}><option value="">Select semester</option>{curriculumSemesterOptions.map(semester => <option key={semester} value={semester}>{semester}</option>)}</select>
                    <button type="submit" disabled={curriculumBusy} className="bg-blue-200 border border-blue-500 px-4 py-2.5 rounded-[0.3em] font-lexend text-sm disabled:opacity-60">{curriculumBusy ? "SAVING..." : curriculumEditId ? "UPDATE CURRICULUM" : "ADD CURRICULUM"}</button>
                    {curriculumEditId && <button type="button" onClick={() => { setCurriculumEditId(""); setCurriculumForm({ programId: "", syllabusId: "", semester: "" }); }} className="border px-4 py-2.5 rounded-sm text-sm">CANCEL</button>}
                </form>
                <table className="w-full border-collapse text-sm"><thead><tr className="bg-gray-100 text-left"><th className="border p-2">Program</th><th className="border p-2">Syllabus</th><th className="border p-2">Semester</th><th className="border p-2">Subjects</th><th className="border p-2">Action</th></tr></thead><tbody>{curricula.map(c => <tr key={c.id}><td className="border p-2">{c.programName}</td><td className="border p-2">{c.syllabusName} {c.syllabusYear}</td><td className="border p-2">{c.semester}</td><td className="border p-2">{c.subjectCount}</td><td className="border p-2"><button type="button" onClick={() => { setCurriculumEditId(c.id); setCurriculumForm({ programId: c.programId, syllabusId: c.syllabusId, semester: String(c.semester) }); }} className="inline-flex items-center gap-1 text-blue-700"><FiEdit /> Edit</button></td></tr>)}</tbody></table>
                <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700 mt-4">Subjects for curriculum</h3>
                <form onSubmit={handleAddAcademicSubject} className="grid grid-cols-4 gap-3 items-end">
                    <select required className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={subjectForm.curriculumId} onChange={(e) => setSubjectForm({ ...subjectForm, curriculumId: e.target.value })}>
                        <option value="">Select program / syllabus / semester</option>{curricula.map(c => <option key={c.id} value={c.id}>{c.programName} / {c.syllabusName} {c.syllabusYear} / Sem {c.semester}</option>)}
                    </select>
                    <input required placeholder="Subject code" className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={subjectForm.subjectCode} onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })} />
                    <input required placeholder="Subject name" className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={subjectForm.subjectName} onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })} />
                    <input required placeholder="QP code" className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={subjectForm.qpCode} onChange={(e) => setSubjectForm({ ...subjectForm, qpCode: e.target.value })} />
                    <label className="text-xs text-gray-600">
                        {subjectForm.markingScheme.length > 0 ? "Subject maximum (sum of sections)" : "Subject maximum marks"}
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Max marks"
                            className="block w-full font-lexend text-sm border p-2.5 rounded-sm outline-none disabled:bg-gray-100"
                            value={subjectForm.markingScheme.length > 0 ? sectionMaximum : subjectForm.maxMarks}
                            onChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: e.target.value })}
                            disabled={subjectForm.markingScheme.length > 0}
                        />
                    </label>
                    <input type="number" min="0" step="0.1" placeholder="Credits (optional)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} />
                    <div className="col-span-full border rounded p-3 flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h4 className="font-lexend font-semibold text-sm">Question sections (optional)</h4>
                                <p className="text-xs text-gray-500">Configure the offered questions and section cap. The evaluator score uses the highest-scoring questions up to the calculated count.</p>
                            </div>
                            <button type="button" onClick={addMarkingSection} className="border border-blue-500 bg-blue-50 px-3 py-2 rounded text-sm text-blue-800">ADD SECTION</button>
                        </div>
                        {subjectForm.markingScheme.map((section, index) => {
                            const markValue = Number(section.marksPerQuestion);
                            const maxValue = Number(section.maxMarks);
                            const questionCount = Number(section.questionCount);
                            const consideredCount = markValue > 0 && maxValue > 0
                                ? Math.min(questionCount || 0, Math.ceil(maxValue / markValue))
                                : 0;
                            return (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border-t pt-3">
                                    <label className="text-xs text-gray-600">Section name
                                        <input required value={section.name} onChange={(e) => updateMarkingSection(index, { name: e.target.value })} className="block w-full border p-2 rounded text-sm" />
                                    </label>
                                    <label className="text-xs text-gray-600">Section max marks
                                        <input required type="number" min="0.01" step="0.01" value={section.maxMarks} onChange={(e) => updateMarkingSection(index, { maxMarks: e.target.value })} className="block w-full border p-2 rounded text-sm" />
                                    </label>
                                    <label className="text-xs text-gray-600">Marks per question
                                        <input required type="number" min="0.01" step="0.01" value={section.marksPerQuestion} onChange={(e) => updateMarkingSection(index, { marksPerQuestion: e.target.value })} className="block w-full border p-2 rounded text-sm" />
                                    </label>
                                    <label className="text-xs text-gray-600">Questions offered
                                        <input required type="number" min="1" step="1" value={section.questionCount} onChange={(e) => updateMarkingSection(index, { questionCount: e.target.value })} className="block w-full border p-2 rounded text-sm" />
                                    </label>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-blue-800">Consider best {consideredCount}</span>
                                        <button type="button" onClick={() => removeMarkingSection(index)} className="text-xs text-red-700 underline">Remove</button>
                                    </div>
                                </div>
                            );
                        })}
                        {subjectForm.markingScheme.length > 0 && (
                            <p className="text-xs font-semibold text-green-700">
                                Subject maximum is calculated automatically: {sectionMaximum} marks across configured sections.
                            </p>
                        )}
                    </div>
                    <button type="submit" disabled={subjectBusy} className="bg-blue-200 border border-blue-500 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm disabled:opacity-60">{subjectBusy ? "SAVING..." : subjectEditId ? "UPDATE SUBJECT" : "ADD SUBJECT"}</button>
                    {subjectEditId && <button type="button" onClick={() => { setSubjectEditId(""); setSubjectForm({ ...subjectForm, subjectCode: "", subjectName: "", qpCode: "", maxMarks: "100", credits: "", markingScheme: [] }); }} className="border px-4 py-2.5 rounded-sm text-sm">CANCEL</button>}
                </form>
                {subjectForm.curriculumId && (
                    <div className="overflow-x-auto">
                        <h4 className="font-lexend font-semibold text-sm text-gray-700 mb-2">
                            Subjects — {curricula.find((c) => c.id === subjectForm.curriculumId)?.programName}
                            {" / "}
                            {curricula.find((c) => c.id === subjectForm.curriculumId)?.syllabusName}
                            {" "}
                            {curricula.find((c) => c.id === subjectForm.curriculumId)?.syllabusYear}
                            {" / Semester "}
                            {curricula.find((c) => c.id === subjectForm.curriculumId)?.semester}
                        </h4>
                        <table className="w-full border-collapse text-sm">
                            <thead><tr className="bg-gray-100 text-left"><th className="border p-2">Code</th><th className="border p-2">Subject</th><th className="border p-2">QP code</th><th className="border p-2">Max marks</th><th className="border p-2">Credits</th><th className="border p-2">Action</th></tr></thead>
                            <tbody>
                                {subjectsLoading && <tr><td colSpan={6} className="border p-2 text-center text-gray-500">Loading subjects...</td></tr>}
                                {!subjectsLoading && curriculumSubjects.length === 0 && <tr><td colSpan={6} className="border p-2 text-center text-gray-500">No subjects configured for this curriculum.</td></tr>}
                                {!subjectsLoading && curriculumSubjects.map((subject) => (
                                    <tr key={subject.id}>
                                        <td className="border p-2 font-mono">{subject.subjectCode}</td>
                                        <td className="border p-2">{subject.subjectName}</td>
                                        <td className="border p-2 font-mono">{subject.qpCode}</td>
                                        <td className="border p-2">{subject.maxMarks}</td>
                                        <td className="border p-2">{subject.credits ?? "-"}</td>
                                        <td className="border p-2"><button type="button" onClick={() => { setSubjectEditId(subject.id); setSubjectForm({ curriculumId: subjectForm.curriculumId, subjectCode: subject.subjectCode, subjectName: subject.subjectName, qpCode: subject.qpCode, maxMarks: String(subject.maxMarks ?? 100), credits: subject.credits == null ? "" : String(subject.credits), markingScheme: (subject.markingScheme || []).map((section) => ({ ...section, maxMarks: String(section.maxMarks), marksPerQuestion: String(section.marksPerQuestion), questionCount: String(section.questionCount) })) }); }} className="inline-flex items-center gap-1 text-blue-700"><FiEdit /> Edit</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* STUDENTS */}
            <section className="flex flex-col gap-3">
                <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700">Students</h3>
                <div className="flex gap-3">
                    <input placeholder="Search by register number" className="font-lexend text-sm border p-2.5 rounded-sm outline-none flex-1"
                        value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
                    <button onClick={handleSearchStudents} type="button" className="bg-gray-100 border px-4 py-2.5 rounded-[0.3em] font-lexend text-sm cursor-pointer">SEARCH</button>
                </div>
                {studentResults.length > 0 && (
                    <table className="w-full border-collapse text-sm">
                        <thead><tr className="bg-gray-100 text-left"><th className="border p-2">Register No.</th><th className="border p-2">Name</th><th className="border p-2">Batch</th><th className="border p-2">Category</th></tr></thead>
                        <tbody>
                            {studentResults.map(s => (
                                <tr key={s.id} className="cursor-pointer hover:bg-blue-50" onClick={() => setStudentForm({
                                    registerNumber: s.registerNumber, studentName: s.studentName || "", batchId: s.batchId || "",
                                    dateOfBirth: s.dateOfBirth || "", category: s.category || "", gender: s.gender || "",
                                })}>
                                    <td className="border p-2 font-mono">{s.registerNumber}</td>
                                    <td className="border p-2">{s.studentName || "-"}</td>
                                    <td className="border p-2">{s.batchLabel || "-"}</td>
                                    <td className="border p-2">{s.category || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <form onSubmit={handleUpsertStudent} className="border border-gray-300 rounded-[0.3em] p-4 flex flex-col gap-3 mt-2">
                    <p className="font-lexend text-xs text-gray-500">Pre-load a new student, or click a search result above to edit it.</p>
                    <div className="grid grid-cols-3 gap-3">
                        <input required placeholder="Register Number" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={studentForm.registerNumber} onChange={(e) => setStudentForm({ ...studentForm, registerNumber: e.target.value })} />
                        <input placeholder="Student Name" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={studentForm.studentName} onChange={(e) => setStudentForm({ ...studentForm, studentName: e.target.value })} />
                        <select className="font-lexend text-sm border p-2.5 rounded-sm outline-none" value={studentForm.batchId} onChange={(e) => setStudentForm({ ...studentForm, batchId: e.target.value })}>
                            <option value="">No batch</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                        <input type="date" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={studentForm.dateOfBirth} onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })} />
                        <input placeholder="Category (e.g. General, OBC, SC, ST)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={studentForm.category} onChange={(e) => setStudentForm({ ...studentForm, category: e.target.value })} />
                        <input placeholder="Gender" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })} />
                    </div>
                    {studentMsg && <p className="font-lexend text-sm text-gray-600">{studentMsg}</p>}
                    <button type="submit" disabled={studentBusy} className="self-start bg-blue-200 border border-blue-500 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                        {studentBusy ? "SAVING..." : "SAVE STUDENT"}
                    </button>
                </form>
            </section>
        </div>
    );
}
