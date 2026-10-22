import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoSettingsOutline, IoBookmarkOutline } from "react-icons/io5";
import { SlGraph } from "react-icons/sl";
import { FiBook, FiUsers, FiLayers } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";



import QpCodesTable from "../../components/Admin/AdminQPCodeTable";
import AnswerBookletsTable from "../../components/Shared/AnswerBookletTable";
import StatCard from "../../components/Shared/StatsCard";
import { COLLEGE_NAME } from "../../config/branding";
import TrendChart from "../../components/Shared/TrendChart";
import AdminUsersTable from "../../components/Admin/AdminUsersTable";
import AddUserModal from "../../components/Admin/AddUserModal";
import TempPasswordModal from "../../components/Admin/TempPasswordModal";
import AdminAcademicPanel from "../../components/Admin/AdminAcademicPanel";

import { getSession } from "../../api/client";
import { logout as apiLogout, changePassword } from "../../api/auth";
import {
    getAdminDashboard,
    listAdminUsers,
    createAdminUser,
    deleteAdminUser,
    resetAdminUserPassword,
    unlockAdminUser,
    listAdminRoles,
    listSubjects,
    listCourses,
    createCourse,
    createSubject,
    createAdminRole,
    createAdminPermission,
    listAdminPermissions,
    listAdminAudit,
} from "../../api/valuation";
import ResetPasswordModal from "../../components/Shared/ResetPasswordModal";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const session = getSession();

    const userInfo = {
        id: session?.username?.toUpperCase() || "ADMIN",
        name: session?.username || "Administrator",
        role: "ADMIN"
    };

    const [activeTab, setActiveTab] = useState("dashboard");

    // Live counts from the backend (falls back to zeros while loading / on error).
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardError, setDashboardError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const data = await getAdminDashboard();
                setDashboardData(data);
            } catch (err) {
                setDashboardError(err.message || "Failed to load dashboard stats.");
            }
        })();
    }, []);

    const [subjects, setSubjects] = useState([]);
    const [subjectError, setSubjectError] = useState("");
    const qpCodes = subjects.map((s, index) => ({ slNo: index + 1, id: s.id, qpCode: s.qpCode, subject: s.subjectName, course: s.course, semester: s.semester, boeid: s.chiefName || "-", credits: "-" }));

    const [answerBooklets] = useState([
        { slNo: 1, bookletId: "AB-2026-0001", candidateId: "VALBCA2601", course: "BCA", semester: "V", qpCode: "BCA501-ECD", status: "valuated" },
        { slNo: 2, bookletId: "AB-2026-0002", candidateId: "VALBCA2602", course: "BCA", semester: "V", qpCode: "BCA501-ECD", status: "pending" },
        { slNo: 3, bookletId: "AB-2026-0003", candidateId: "VALBCA2603", course: "BCA", semester: "V", qpCode: "BCA502-ECD", status: "reviewed" },
        { slNo: 4, bookletId: "AB-2026-0004", candidateId: "VALBCA2604", course: "BCA", semester: "V", qpCode: "BCA503-ECD", status: "pending" },
    ]);


    const trendData = [
        { day: "Mon", scripts: 12 },
        { day: "Tue", scripts: 19 },
        { day: "Wed", scripts: 15 },
        { day: "Thu", scripts: 27 },
        { day: "Fri", scripts: 22 },
        { day: "Sat", scripts: 34 },
        { day: "Sun", scripts: 40 },
    ];

    // Real, backend-driven stats (falls back to 0 while loading).
    const stats = [
        { label: "Total Users", value: dashboardData?.totalUsers ?? 0, color: "blue" },
        { label: "Students", value: dashboardData?.totalStudents ?? 0, color: "purple" },
        { label: "Exam Registrations", value: dashboardData?.totalExamRegistrations ?? 0, color: "green" },
        { label: "Booklets", value: dashboardData?.totalBooklets ?? 0, color: "yellow" },
    ];

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

    // ---------- USER MANAGEMENT (admin can create an id for any role: RE, BO, Reviewer, Valuator, Scanner, Invigilator) ----------
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState("");
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditPage, setAuditPage] = useState(0);
    const [auditTotalPages, setAuditTotalPages] = useState(0);
    const [adminToolsError, setAdminToolsError] = useState("");

    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [createUserError, setCreateUserError] = useState("");

    const [tempPasswordInfo, setTempPasswordInfo] = useState(null); // { username, tempPassword }

    const loadUsers = async () => {
        setUsersLoading(true);
        setUsersError("");
        try {
            setUsers(await listAdminUsers());
        } catch (err) {
            setUsersError(err.message || "Failed to load users.");
        } finally {
            setUsersLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            setRoles(await listAdminRoles());
        } catch {
            // Role dropdown just stays empty; the users table itself doesn't need it.
        }
    };

    useEffect(() => {
        if (activeTab === "users" && users.length === 0 && !usersError) {
            loadUsers();
        }
        if (activeTab === "users" && roles.length === 0) {
            loadRoles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);
    useEffect(() => {
        (async () => {
            try {
                if (activeTab === "access") {
                    const [roleData, permissionData] = await Promise.all([listAdminRoles(), listAdminPermissions()]);
                    setRoles(roleData); setPermissions(permissionData);
                }
                if (activeTab === "audit") {
                    const result = await listAdminAudit({ page: auditPage, size: 25 });
                    setAuditLogs(result.content || []);
                    setAuditTotalPages(result.totalPages || 0);
                }
                setAdminToolsError("");
            } catch (err) { setAdminToolsError(err.message || "Failed to load administration data."); }
        })();
    }, [activeTab, auditPage]);

    const handleCreateUser = async (form) => {
        setCreatingUser(true);
        setCreateUserError("");
        try {
            const role = roles.find(r => r.name === form.roleName);
            await createAdminUser({
                fullName: form.fullName,
                username: form.username,
                password: form.password,
                email: form.email || null,
                phoneNumber: form.phoneNumber || null,
                status: "ACTIVE",
                roleIds: role ? [role.id] : [],
            });
            setShowAddUserModal(false);
            await loadUsers();
        } catch (err) {
            setCreateUserError(err.message || "Failed to create user.");
        } finally {
            setCreatingUser(false);
        }
    };

    const handleResetUserPassword = async (user) => {
        try {
            const result = await resetAdminUserPassword(user.id);
            setTempPasswordInfo({ username: result.username, tempPassword: result.temporaryPassword });
        } catch (err) {
            alert(err.message || "Failed to reset password.");
        }
    };

    const handleUnlockUser = async (user) => {
        try {
            await unlockAdminUser(user.id);
            await loadUsers();
        } catch (err) {
            alert(err.message || "Failed to unlock user.");
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Delete user "${user.username}"?`)) return;
        try {
            await deleteAdminUser(user.id);
            await loadUsers();
        } catch (err) {
            alert(err.message || "Failed to delete user.");
        }
    };

    const loadSubjects = async () => {
        try { setSubjects(await listSubjects()); setSubjectError(""); }
        catch (err) { setSubjectError(err.message || "Failed to load QP-codes."); }
    };
    useEffect(() => { if (activeTab === "qpcodes") loadSubjects(); }, [activeTab]);
    const handleAddQpCode = async (form) => {
        try {
            // Subjects now live under a Course - find one matching this course/semester,
            // or create it, then add the subject (QP code) under it.
            const courses = await listCourses();
            let course = courses.find(
                (c) => c.courseName.toLowerCase() === form.course.toLowerCase() && c.semester === form.semester
            );
            if (!course) {
                course = await createCourse({ courseName: form.course, semester: form.semester });
            }
            await createSubject(course.id, { subjectCode: form.qpCode, subjectName: form.subject, qpCode: form.qpCode });
            await loadSubjects();
        } catch (err) { setSubjectError(err.message || "Failed to add QP-code."); }
    };
    const addRole = async () => {
        const name = window.prompt("Role name (for example ROLE_EXAMINER)");
        if (!name) return;
        try { await createAdminRole({ name, enabled: true, permissionIds: [] }); setRoles(await listAdminRoles()); }
        catch (err) { setAdminToolsError(err.message || "Failed to create role."); }
    };
    const addPermission = async () => {
        const name = window.prompt("Permission name");
        if (!name) return;
        try { await createAdminPermission({ name, enabled: true }); setPermissions(await listAdminPermissions()); }
        catch (err) { setAdminToolsError(err.message || "Failed to create permission."); }
    };

    const tabs = [
        { key: "dashboard", label: "Dashboard", icon: SlGraph },
        { key: "academic", label: "Academic Setup", icon: FiLayers },
        { key: "qpcodes", label: "QP-Codes", icon: IoBookmarkOutline },
        { key: "booklets", label: "Booklets", icon: FiBook },
        { key: "users", label: "Users", icon: FiUsers },
        { key: "access", label: "Access", icon: IoSettingsOutline },
        { key: "audit", label: "Audit Log", icon: FiBook },
    ];

    return (
        <div className="w-full h-screen flex">
            {/* SIDEBAR */}
            <div className="w-60 flex flex-col p-4 mr-0.5 border-r border-gray-300">
                <div className="w-auto flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-full text-blue-600 border border-blue-400 bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer">
                        {userInfo.name.charAt(0)}
                    </div>
                    <div className="w-fit text-center text-blue-600 bg-blue-200 border border-blue-400 font-lexend font-medium text-[0.8em] px-12 py-2 rounded-[0.3em] tracking-wider uppercase">
                        {userInfo.role}
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 mt-8">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`w-full font-lexend font-medium text-[0.85em] px-4 py-2.5 rounded-[0.3em] uppercase tracking-wide cursor-pointer border flex items-center gap-3 transition-colors ${activeTab === tab.key
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={17} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <button onClick={() => setShowResetModal(true)} className="w-full bg-indigo-100 border border-indigo-400 text-indigo-700 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-[0.8em] flex items-center justify-between cursor-pointer hover:bg-indigo-200">
                    <IoSettingsOutline size={19} />
                    RESET PASSWORD
                </button>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col gap-4">
                {/* HEADER */}
                <div className="w-full p-4 flex justify-between items-center border-b border-gray-200 ml-[-0.2em]">
                    <div className="font-lexend text-[1em] font-medium tracking-wide">
                        {COLLEGE_NAME}
                    </div>
                    <button onClick={handleLogout} className="bg-red-300 border border-red-500 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center gap-4 tracking-wide cursor-pointer">
                        <IoIosLogOut size={20} />
                        LOGOUT
                    </button>
                </div>

                {/* DASHBOARD TAB */}
                {activeTab === "dashboard" && (
                    <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto mt-[-1.5em]">
                        <div>
                            <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">Dashboard</h2>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {stats.map(stat => (
                                <StatCard key={stat.label} value={stat.value} label={stat.label} color={stat.color} />
                            ))}
                        </div>
                        {dashboardError && (
                            <p className="font-lexend text-sm text-red-600">{dashboardError}</p>
                        )}

                        <TrendChart
                            title="Valuation Trend"
                            subtitle="This Week"
                            data={trendData}
                            xKey="day"
                            dataKey="scripts"
                            color="#2563eb"
                        />
                    </div>
                )}

                {activeTab === "academic" && <AdminAcademicPanel />}
                {subjectError && activeTab === "qpcodes" && <p className="px-6 text-sm text-red-600">{subjectError}</p>}
                {activeTab === "qpcodes" && <QpCodesTable qpCodes={qpCodes} onAddQpCode={handleAddQpCode} />}
                {activeTab === "booklets" && <AnswerBookletsTable answerBooklets={answerBooklets} />}
                {activeTab === "users" && (
                    <AdminUsersTable
                        users={users}
                        loading={usersLoading}
                        loadError={usersError}
                        onAddUser={() => { setCreateUserError(""); setShowAddUserModal(true); }}
                        onResetPassword={handleResetUserPassword}
                        onUnlock={handleUnlockUser}
                        onDelete={handleDeleteUser}
                    />
                )}
                {activeTab === "access" && <div className="p-6 overflow-y-auto"><div className="flex gap-3 mb-4"><button onClick={addRole} className="border border-blue-400 bg-blue-200 px-4 py-2 rounded">ADD ROLE</button><button onClick={addPermission} className="border border-blue-400 bg-blue-200 px-4 py-2 rounded">ADD PERMISSION</button></div>{adminToolsError && <p className="text-red-600 mb-3">{adminToolsError}</p>}<div className="grid grid-cols-2 gap-6"><div><h2 className="font-bold mb-2">Roles</h2><table className="w-full border-collapse"><tbody>{roles.map(r => <tr key={r.id}><td className="border p-2">{r.name}</td><td className="border p-2">{r.enabled ? "Active" : "Disabled"}</td></tr>)}</tbody></table></div><div><h2 className="font-bold mb-2">Permissions</h2><table className="w-full border-collapse"><tbody>{permissions.map(p => <tr key={p.id}><td className="border p-2">{p.name}</td><td className="border p-2">{p.enabled ? "Active" : "Disabled"}</td></tr>)}</tbody></table></div></div></div>}
                {activeTab === "audit" && <div className="p-6 overflow-auto"><h2 className="font-bold mb-3">Audit Log</h2>{adminToolsError && <p className="text-red-600 mb-3">{adminToolsError}</p>}<table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2">Time</th><th className="border p-2">User</th><th className="border p-2">Action</th><th className="border p-2">Entity</th></tr></thead><tbody>{auditLogs.map(log => <tr key={log.id}><td className="border p-2">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td><td className="border p-2">{log.actorUsername || "System"}</td><td className="border p-2">{log.action}</td><td className="border p-2">{log.entityType}</td></tr>)}</tbody></table>{auditTotalPages > 1 && <div className="flex items-center justify-center gap-4 mt-4"><button onClick={() => setAuditPage(p => Math.max(0, p - 1))} disabled={auditPage === 0} className="px-4 py-1.5 border rounded disabled:opacity-40 cursor-pointer">Previous</button><span className="text-sm">Page {auditPage + 1} of {auditTotalPages}</span><button onClick={() => setAuditPage(p => Math.min(auditTotalPages - 1, p + 1))} disabled={auditPage >= auditTotalPages - 1} className="px-4 py-1.5 border rounded disabled:opacity-40 cursor-pointer">Next</button></div>}</div>}
            </div>

            {/* CREATE USER MODAL - admin can create an id for any role (RE, BO, Reviewer, Valuator, Scanner, Invigilator) */}
            <AddUserModal
                isOpen={showAddUserModal}
                onClose={() => setShowAddUserModal(false)}
                onCreate={handleCreateUser}
                roles={roles}
                error={createUserError}
                submitting={creatingUser}
            />

            {/* TEMP PASSWORD MODAL (shown after an admin resets a user's password) */}
            <TempPasswordModal
                isOpen={!!tempPasswordInfo}
                onClose={() => setTempPasswordInfo(null)}
                username={tempPasswordInfo?.username}
                tempPassword={tempPasswordInfo?.tempPassword}
            />

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
