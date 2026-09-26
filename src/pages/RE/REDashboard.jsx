import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosLogOut } from "react-icons/io";
import { IoAdd, IoChevronDown, IoChevronForward } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";
import { RxLockClosed } from "react-icons/rx";

import { getSession } from "../../api/client";
import { logout as apiLogout, changePassword } from "../../api/auth";
import {
    createCourse,
    listCourses,
    assignBo,
    listSubjectsForCourse,
    listSubjects,
    releaseCourseResults,
    getSubjectProgress,
} from "../../api/valuation";
import { listReDepartments, listRePrograms, listReCurricula } from "../../api/academic";
import ResetPasswordModal from "../../components/Shared/ResetPasswordModal";

const emptyCourseForm = { courseName: "", semester: "", syllabusYear: "", programId: "", syllabusId: "" };
const emptyBoForm = { username: "", password: "", fullName: "" };

export default function REDashboard() {
    const navigate = useNavigate();
    const session = getSession();
    const userInfo = {
        id: session?.username?.toUpperCase() || "RE",
        name: session?.username || "Register of Evaluation",
    };

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [courseForm, setCourseForm] = useState(emptyCourseForm);
    const [openingCourse, setOpeningCourse] = useState(false);
    const [openError, setOpenError] = useState("");
    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [curricula, setCurricula] = useState([]);
    const [academicSetupError, setAcademicSetupError] = useState("");
    const [academicSetupLoading, setAcademicSetupLoading] = useState(true);
    const [departmentId, setDepartmentId] = useState("");
    const selectedProgram = programs.find((program) => program.id === courseForm.programId);
    const departmentPrograms = departmentId
        ? programs.filter((program) => program.departmentId === departmentId)
        : [];
    const programCurricula = curricula.filter((curriculum) =>
        curriculum.programId === courseForm.programId && curriculum.subjectCount > 0
    );
    const syllabusOptions = [...new Map(programCurricula.map((curriculum) => [
        curriculum.syllabusId,
        { id: curriculum.syllabusId, name: curriculum.syllabusName, year: curriculum.syllabusYear },
    ])).values()];
    const semesterOptions = [...new Set(programCurricula
        .filter((curriculum) => curriculum.syllabusId === courseForm.syllabusId)
        .map((curriculum) => String(curriculum.semester)))].sort((a, b) => Number(a) - Number(b));

    const [boModalCourse, setBoModalCourse] = useState(null);
    const [boForm, setBoForm] = useState(emptyBoForm);
    const [creatingBo, setCreatingBo] = useState(false);
    const [boError, setBoError] = useState("");


    // Expand/collapse: which course's subject list is currently open.
    const [expandedCourseId, setExpandedCourseId] = useState(null);
    // courseId -> SubjectResponse[]
    const [subjectsByCourse, setSubjectsByCourse] = useState({});
    const [subjectsLoading, setSubjectsLoading] = useState({});
    // subjectId -> SubjectProgressResponse
    const [progressBySubject, setProgressBySubject] = useState({});
    const [progressLoadedByCourse, setProgressLoadedByCourse] = useState({});
    // subjectId -> true while a close/release action is in flight for that row
    const [actionLoading, setActionLoading] = useState({});
    const [actionErrors, setActionErrors] = useState({});

    const loadCourses = async () => {
        setLoading(true);
        setLoadError("");
        try {
            const [courseData, subjectData] = await Promise.all([listCourses(), listSubjects()]);
            setCourses(courseData);
            setProgressBySubject({});
            setProgressLoadedByCourse({});
            setSubjectsByCourse(subjectData.reduce((byCourse, subject) => {
                if (subject.courseId) {
                    byCourse[subject.courseId] = [...(byCourse[subject.courseId] || []), subject];
                }
                return byCourse;
            }, {}));
        } catch (err) {
            setLoadError(err.message || "Failed to load courses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
        Promise.all([listReDepartments(), listRePrograms(), listReCurricula()])
            .then(([departmentData, programData, curriculumData]) => {
                setDepartments(departmentData);
                setPrograms(programData);
                setCurricula(curriculumData);
            })
            .catch((err) => setAcademicSetupError(err.message || "Failed to load Admin academic setup."))
            .finally(() => setAcademicSetupLoading(false));
    }, []);

    const handleLogout = () => {
        apiLogout();
        navigate("/login");
    };

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPasswordError, setResetPasswordError] = useState("");

    const handleResetPasswordConfirm = async (passwords) => {
        setResetPasswordError("");
        try {
            await changePassword(passwords.currentPassword, passwords.newPassword);
            setShowResetModal(false);
            alert("Password updated successfully.");
        } catch (err) {
            setResetPasswordError(err.message || "Failed to update password.");
        }
    };

    const handleOpenCourse = async (e) => {
        e.preventDefault();
        setOpeningCourse(true);
        setOpenError("");
        try {
            await createCourse({ ...courseForm, programId: courseForm.programId, syllabusId: courseForm.syllabusId });
            setCourseForm(emptyCourseForm);
            await loadCourses();
        } catch (err) {
            setOpenError(err.message || "Failed to open course.");
        } finally {
            setOpeningCourse(false);
        }
    };

    const handleCreateBo = async (e) => {
        e.preventDefault();
        if (!boModalCourse) return;
        setCreatingBo(true);
        setBoError("");
        try {
            await assignBo(boModalCourse.id, boForm);
            setBoForm(emptyBoForm);
            setBoModalCourse(null);
            await loadCourses();
        } catch (err) {
            setBoError(err.message || "Failed to create BO.");
        } finally {
            setCreatingBo(false);
        }
    };

    const loadSubjectsFor = async (courseId) => {
        setSubjectsLoading((prev) => ({ ...prev, [courseId]: true }));
        try {
            const list = await listSubjectsForCourse(courseId);
            setSubjectsByCourse((prev) => ({ ...prev, [courseId]: list }));
            const relevant = list.filter((s) => s.status !== "PUBLISHED");
            const entries = await Promise.all(
                relevant.map(async (s) => {
                    try {
                        return [s.id, await getSubjectProgress(s.id)];
                    } catch {
                        return [s.id, null];
                    }
                })
            );
            setProgressBySubject((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
        } catch (err) {
            setLoadError(err.message || "Failed to load subjects.");
        } finally {
            setSubjectsLoading((prev) => ({ ...prev, [courseId]: false }));
            setProgressLoadedByCourse((prev) => ({ ...prev, [courseId]: true }));
        }
    };

    const toggleExpand = (course) => {
        if (expandedCourseId === course.id) {
            setExpandedCourseId(null);
            return;
        }
        setExpandedCourseId(course.id);
        if (!progressLoadedByCourse[course.id]) {
            loadSubjectsFor(course.id);
        }
    };

    const handleReleaseCourse = async (course) => {
        const subjects = subjectsByCourse[course.id] || [];
        const completed = subjects.filter((subject) => subject.status !== "OPEN").length;
        if (subjects.length === 0 || completed !== subjects.length) return;
        if (!window.confirm(
            `Release results for ${course.courseName}, semester ${course.semester}?\n\n` +
            `This will publish all ${subjects.length} BO-completed subjects to the public marks lookup.`
        )) return;
        setActionLoading((prev) => ({ ...prev, [course.id]: true }));
        setActionErrors((prev) => ({ ...prev, [course.id]: "" }));
        try {
            await releaseCourseResults(course.id);
            await loadSubjectsFor(course.id);
        } catch (err) {
            setActionErrors((prev) => ({ ...prev, [course.id]: err.message || "Failed to release course results." }));
        } finally {
            setActionLoading((prev) => ({ ...prev, [course.id]: false }));
        }
    };

    return (
        <div className="w-full h-screen flex flex-col bg-white">
            {/* HEADER */}
            <div className="w-full p-4 flex justify-between items-center border-b border-gray-200">
                <div className="font-lexend text-[1.1em] font-medium tracking-wide flex gap-4">
                    <span>ID : <span className="font-medium text-red-700">{userInfo.id}</span></span>
                    <span className="text-gray-600">|</span>
                    <span className="text-[1em] font-normal">{userInfo.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowResetModal(true)} className="bg-indigo-100 border border-indigo-400 text-indigo-700 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center gap-3 tracking-wide cursor-pointer hover:bg-indigo-200">
                        <RxLockClosed size={17} />
                        RESET PASSWORD
                    </button>
                    <button onClick={handleLogout} className="bg-red-300 border border-red-500 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center gap-4 tracking-wide cursor-pointer">
                        <IoIosLogOut size={20} />
                        LOGOUT
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-lexend font-bold tracking-wide uppercase">Register of Evaluation</h2>
                    <button type="button" onClick={loadCourses} disabled={loading} className="inline-flex items-center gap-2 border border-gray-400 bg-gray-100 px-3 py-2 rounded-[0.3em] font-lexend text-xs disabled:opacity-60">
                        <FiRefreshCw size={14} /> REFRESH COURSE STATUS
                    </button>
                </div>

                {/* OPEN NEW COURSE FORM */}
                <form onSubmit={handleOpenCourse} className="border border-gray-300 rounded-[0.3em] p-5 flex flex-col gap-4">
                    <h3 className="font-lexend font-semibold text-sm uppercase tracking-wide text-gray-700">Open a New Course</h3>
                    <p className="font-lexend text-xs text-gray-600">
                        Select a program and syllabus configured by Admin. Course and semester values cannot be entered manually.
                    </p>
                    <div className="grid grid-cols-5 gap-4">
                        <select required disabled={academicSetupLoading || Boolean(academicSetupError)} className="font-lexend text-sm border p-2.5 rounded-sm outline-none disabled:bg-gray-100" value={departmentId}
                            onChange={(e) => {
                                setDepartmentId(e.target.value);
                                setCourseForm({ ...courseForm, programId: "", courseName: "", semester: "", syllabusId: "", syllabusYear: "" });
                            }}>
                            <option value="">Select department</option>
                            {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                        </select>
                        <select required disabled={!departmentId || academicSetupLoading || Boolean(academicSetupError)} className="font-lexend text-sm border p-2.5 rounded-sm outline-none disabled:bg-gray-100"
                            value={courseForm.programId}
                            onChange={(e) => {
                                const program = programs.find((p) => p.id === e.target.value);
                                setCourseForm({
                                    ...courseForm,
                                    programId: e.target.value,
                                    courseName: program?.name || "",
                                    semester: "",
                                    syllabusId: "",
                                    syllabusYear: "",
                                });
                            }}>
                            <option value="">Select program</option>
                            {departmentPrograms.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                        </select>
                        <select required disabled={!selectedProgram || academicSetupLoading || Boolean(academicSetupError)} className="font-lexend text-sm border p-2.5 rounded-sm outline-none disabled:bg-gray-100"
                            value={courseForm.syllabusId}
                            onChange={(e) => {
                                const syllabus = syllabusOptions.find((item) => item.id === e.target.value);
                                setCourseForm({ ...courseForm, syllabusId: e.target.value, semester: "", syllabusYear: syllabus ? `${syllabus.name}-${syllabus.year}` : "" });
                            }}>
                            <option value="">Select syllabus</option>
                            {syllabusOptions.map((syllabus) => <option key={syllabus.id} value={syllabus.id}>{syllabus.name} - {syllabus.year}</option>)}
                        </select>
                        <select required disabled={!courseForm.syllabusId || academicSetupLoading || Boolean(academicSetupError)} className="font-lexend text-sm border p-2.5 rounded-sm outline-none disabled:bg-gray-100"
                            value={courseForm.semester}
                            onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}>
                            <option value="">Select semester</option>
                            {semesterOptions.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
                        </select>
                        <button type="submit" disabled={openingCourse || !selectedProgram}
                            className="bg-blue-200 border border-blue-500 text-blue-950 px-8 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                            {openingCourse ? "OPENING..." : "OPEN COURSE"}
                        </button>
                    </div>
                    {academicSetupLoading && <p className="font-lexend text-sm text-gray-500">Loading Admin academic setup...</p>}
                    {!academicSetupLoading && !academicSetupError && departments.length === 0 && (
                        <p className="font-lexend text-sm text-amber-700">No Admin departments are available. Ask Admin to create a department first.</p>
                    )}
                    {!academicSetupLoading && !academicSetupError && departments.length > 0 && programs.length === 0 && (
                        <p className="font-lexend text-sm text-amber-700">
                            No Admin academic programs are available. Ask Admin to create the program first.
                        </p>
                    )}
                    {academicSetupError && <p className="font-lexend text-sm text-red-600">{academicSetupError}</p>}
                    {!academicSetupLoading && !academicSetupError && departmentId && departmentPrograms.length === 0 && programs.length > 0 && (
                        <p className="font-lexend text-sm text-amber-700">No programs are assigned to this department. Ask Admin to assign a program to it in Academic Setup.</p>
                    )}
                    {selectedProgram && courseForm.syllabusId && semesterOptions.length === 0 && (
                        <p className="font-lexend text-sm text-amber-700">
                            No curriculum is configured for this program and syllabus. Ask Admin to add it in Academic Setup.
                        </p>
                    )}
                    {openError && <p className="font-lexend text-sm text-red-600">{openError}</p>}
                </form>

                {loadError && <p className="font-lexend text-sm text-red-600">{loadError}</p>}

                {/* COURSES TABLE */}
                <div className="flex-1 max-h-[65vh] overflow-x-auto overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center sticky top-0 z-10">
                                <th className="border border-gray-400 p-2.5 w-10"></th>
                                <th className="border border-gray-400 p-2.5">Course</th>
                                <th className="border border-gray-400 p-2.5">Sem</th>
                                <th className="border border-gray-400 p-2.5">Syllabus</th>
                                <th className="border border-gray-400 p-2.5">Board Officer</th>
                                <th className="border border-gray-400 p-2.5">Subjects</th>
                                <th className="border border-gray-400 p-2.5 w-48">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={7} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">Loading...</td></tr>
                            )}
                            {!loading && courses.length === 0 && (
                                <tr><td colSpan={7} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">No courses opened yet.</td></tr>
                            )}
                            {!loading && courses.map((c) => (
                                <React.Fragment key={c.id}>
                                    <tr className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                        <td className="border border-gray-400 p-2 cursor-pointer" onClick={() => toggleExpand(c)}>
                                            {expandedCourseId === c.id ? <IoChevronDown className="mx-auto" /> : <IoChevronForward className="mx-auto" />}
                                        </td>
                                        <td className="border border-gray-400 p-2 font-mono cursor-pointer" onClick={() => toggleExpand(c)}>{c.courseName}</td>
                                        <td className="border border-gray-400 p-2">{c.semester}</td>
                                        <td className="border border-gray-400 p-2">{c.syllabusYear}</td>
                                        <td className="border border-gray-400 p-2">{c.boName || "-"}</td>
                                        <td className="border border-gray-400 p-2">{c.subjectCount}</td>
                                        <td className="border border-gray-400 p-1.5">
                                            <div className="flex gap-1.5 justify-center">
                                                {subjectsByCourse[c.id] && (
                                                    <span className="self-center text-[10px] text-gray-600 whitespace-nowrap">
                                                        {subjectsByCourse[c.id].filter((subject) => subject.status !== "OPEN").length}/{c.subjectCount} complete
                                                    </span>
                                                )}
                                                {!c.boId && (
                                                    <button
                                                        onClick={() => { setBoModalCourse(c); setBoError(""); }}
                                                        className="flex items-center gap-1 border border-blue-400 bg-blue-200 hover:bg-blue-300 font-bold py-1.5 px-2 rounded-[0.3em] text-[10px] tracking-wider cursor-pointer">
                                                        <IoAdd size={12} /> CREATE BO
                                                    </button>
                                                )}
                                                {Boolean(subjectsByCourse[c.id]?.length) && subjectsByCourse[c.id].every((subject) => subject.status !== "OPEN") && (
                                                    subjectsByCourse[c.id].every((subject) => subject.status === "PUBLISHED") ? (
                                                        <span className="text-[10px] font-bold text-emerald-700 px-2 py-1">RELEASED</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReleaseCourse(c)}
                                                            disabled={actionLoading[c.id]}
                                                            className="border border-purple-400 bg-purple-200 hover:bg-purple-300 font-bold py-1.5 px-2 rounded-[0.3em] text-[10px] tracking-wider cursor-pointer disabled:opacity-60">
                                                            {actionLoading[c.id] ? "RELEASING..." : "RELEASE RESULTS"}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            {actionErrors[c.id] && <p className="text-[9px] text-red-600 mt-1">{actionErrors[c.id]}</p>}
                                        </td>
                                    </tr>

                                    {expandedCourseId === c.id && (
                                        <tr>
                                            <td colSpan={7} className="border border-gray-400 p-3 bg-gray-50">
                                                {subjectsLoading[c.id] && (
                                                    <p className="font-lexend text-sm text-gray-500 text-center py-2">Loading subjects...</p>
                                                )}
                                                {!subjectsLoading[c.id] && (subjectsByCourse[c.id] || []).length === 0 && (
                                                    <p className="font-lexend text-sm text-gray-500 text-center py-2">No subjects in this course yet - add one above.</p>
                                                )}
                                                {!subjectsLoading[c.id] && (subjectsByCourse[c.id] || []).length > 0 && (
                                                    <table className="w-full border-collapse bg-white">
                                                        <thead>
                                                            <tr className="bg-amber-50 text-[0.8em] font-lexend text-yellow-900 font-bold uppercase tracking-wider text-center">
                                                                <th className="border border-gray-300 p-2">Subject Code</th>
                                                                <th className="border border-gray-300 p-2">Subject Name</th>
                                                                <th className="border border-gray-300 p-2">QP Code</th>
                                                                <th className="border border-gray-300 p-2">Status</th>
                                                                <th className="border border-gray-300 p-2">Chief</th>
                                                                <th className="border border-gray-300 p-2 w-32">Papers</th>
                                                                <th className="border border-gray-300 p-2 w-52">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(subjectsByCourse[c.id] || []).map((s) => {
                                                                const progress = progressBySubject[s.id];
                                                                return (
                                                                    <tr key={s.id} className="text-[0.85em] font-lexend font-medium text-center h-9 hover:bg-blue-50">
                                                                        <td className="border border-gray-300 p-1.5 font-mono">{s.subjectCode}</td>
                                                                        <td className="border border-gray-300 p-1.5 text-left px-3">{s.subjectName}</td>
                                                                        <td className="border border-gray-300 p-1.5 font-mono">{s.qpCode}</td>
                                                                        <td className="border border-gray-300 p-1.5">
                                                                            <span className={`inline-block px-2 py-1 rounded-[0.3em] text-[9px] font-bold border ${s.status === "OPEN" ? "bg-green-100 text-green-700 border-green-400" : "bg-gray-200 text-gray-600 border-gray-400"}`}>
                                                                                {s.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1.5">{s.chiefName || "-"}</td>
                                                                        <td className="border border-gray-300 p-1.5">
                                                                            {s.status === "PUBLISHED" ? (
                                                                                <span className="text-[10px] text-gray-500">-</span>
                                                                            ) : !progress ? (
                                                                                <span className="text-[10px] text-gray-400">Loading...</span>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center leading-tight">
                                                                                    <span className="text-[10px] text-emerald-700 font-bold">{progress.reviewedScripts} finished</span>
                                                                                    <span className="text-[10px] text-yellow-700 font-bold">{progress.totalScripts - progress.reviewedScripts} pending</span>
                                                                                    <span className="text-[9px] text-gray-400">of {progress.totalScripts} total</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <span className={`inline-block w-full text-center font-bold py-1 rounded-[0.3em] text-[10px] tracking-wider ${s.status === "OPEN" ? "text-amber-700" : s.status === "CLOSED" ? "text-green-700" : "text-emerald-700"}`}>
                                                                                {s.status === "OPEN" ? "AWAITING BO COMPLETION" : s.status === "CLOSED" ? "BO COMPLETED" : "RELEASED"}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE BO MODAL */}
            {boModalCourse && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-96 rounded-[0.4em] p-6 flex flex-col gap-4">
                        <h3 className="font-lexend font-bold text-lg">Create BO for {boModalCourse.courseName} (Sem {boModalCourse.semester})</h3>
                        <form onSubmit={handleCreateBo} className="flex flex-col gap-3">
                            <input required placeholder="Username" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={boForm.username} onChange={(e) => setBoForm({ ...boForm, username: e.target.value })} />
                            <input required placeholder="Password" type="password" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={boForm.password} onChange={(e) => setBoForm({ ...boForm, password: e.target.value })} />
                            <input placeholder="Full Name" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={boForm.fullName} onChange={(e) => setBoForm({ ...boForm, fullName: e.target.value })} />
                            {boError && <p className="font-lexend text-sm text-red-600">{boError}</p>}
                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setBoModalCourse(null)}
                                    className="bg-gray-100 border border-gray-400 text-gray-700 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer">
                                    CANCEL
                                </button>
                                <button type="submit" disabled={creatingBo}
                                    className="bg-blue-200 border border-blue-500 text-blue-950 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                                    {creatingBo ? "CREATING..." : "CREATE BO"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            <ResetPasswordModal
                isOpen={showResetModal}
                onClose={() => { setShowResetModal(false); setResetPasswordError(""); }}
                onConfirm={handleResetPasswordConfirm}
                error={resetPasswordError}
            />
        </div>
    );
}
