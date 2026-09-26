import React, { useState } from "react";

const initialForm = {
    role: "",
    uid: "",
    name: "",
    email: "",
    password: "",
    qpCode: "",
    subject: "",
    course: "",
    semester: "",
    supervisorId: "",
};

export default function AddMemberModal({ isOpen, onClose, onAdd, qpCodes = [], reviewers = [] }) {
    const [form, setForm] = useState(initialForm);

    if (!isOpen) return null;

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleRoleChange = (e) => {
        const role = e.target.value;
        setForm(prev => ({
            ...prev,
            role,
            // Reset supervisor when switching away from valuator
            supervisorId: role === "valuator" ? prev.supervisorId : "",
        }));
    };

    const handleQpCodeChange = (e) => {
        const selectedCode = e.target.value;
        const matched = qpCodes.find(q => q.qpCode === selectedCode);
        setForm(prev => ({
            ...prev,
            qpCode: selectedCode,
            subject: matched?.subject ?? "",
            course: matched?.course ?? "",
            semester: matched?.semester ?? "",
        }));
    };

    const handleAdd = () => {
        onAdd(form);
        setForm(initialForm);
    };

    const handleCancel = () => {
        setForm(initialForm);
        onClose();
    };

    const inputClass = "border border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500";
    const labelClass = "font-lexend text-[0.85em] font-medium uppercase text-gray-600";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-6/12 bg-white rounded-[0.3em] overflow-hidden border border-gray-300">
                <div className="w-full bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <span className="font-lexend font-bold text-white text-[1em] tracking-wider uppercase">Add Member</span>
                </div>

                <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto
                    [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none]">

                    {/* Role Dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Role</label>
                        <select value={form.role} onChange={handleRoleChange} className={`${inputClass} bg-white cursor-pointer`}>
                            <option value="" disabled hidden>SELECT ROLE</option>
                            <option value="valuator">VALUATOR</option>
                            <option value="reviewer">REVIEWER</option>
                        </select>
                    </div>

                    {/* UID + Name */}
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>UID</label>
                            <input type="text" value={form.uid} onChange={handleChange("uid")} className={inputClass} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Name</label>
                            <input type="text" value={form.name} onChange={handleChange("name")} className={inputClass} />
                        </div>
                    </div>

                    {/* Email + Password */}
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Email</label>
                            <input type="email" value={form.email} onChange={handleChange("email")} className={inputClass} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Password</label>
                            <input type="text" value={form.password} onChange={handleChange("password")} className={inputClass} />
                        </div>
                    </div>

                    {/* QP-Code Dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>QP-Code</label>
                        <select value={form.qpCode} onChange={handleQpCodeChange} className={`${inputClass} bg-white cursor-pointer`}>
                            <option value="" disabled hidden>SELECT QP-CODE</option>
                            {qpCodes.map(q => (
                                <option key={q.qpCode} value={q.qpCode}>{q.qpCode}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject (auto-filled, read-only) */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Subject</label>
                        <input type="text" value={form.subject} readOnly disabled className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} />
                    </div>

                    {/* Course + Semester (auto-filled, read-only) */}
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Course</label>
                            <input type="text" value={form.course} readOnly disabled className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Semester</label>
                            <input type="text" value={form.semester} readOnly disabled className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} />
                        </div>
                    </div>

                    {/* Under Supervision Of — only when role is valuator */}
                    {form.role === "valuator" && (
                        <div className="flex flex-col gap-3 border border-amber-300 bg-amber-50 rounded-[0.3em] px-4 py-3 mt-1">
                            <span className="font-lexend text-[0.85em] font-bold uppercase text-amber-800 tracking-wide">Under Supervision Of</span>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Select Reviewer</label>
                                <select
                                    value={form.supervisorId}
                                    onChange={(e) => setForm(prev => ({ ...prev, supervisorId: e.target.value }))}
                                    className={`${inputClass} bg-white cursor-pointer`}
                                >
                                    <option value="" disabled hidden>SELECT REVIEWER ID</option>
                                    {reviewers.map(r => (
                                        <option key={r.reviewerId} value={r.reviewerId}>{r.reviewerId}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Show selected reviewer name */}
                            {form.supervisorId && (() => {
                                const matched = reviewers.find(r => r.reviewerId === form.supervisorId);
                                return matched ? (
                                    <div className="border border-amber-200 rounded-[0.3em] p-2.5 bg-white">
                                        <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Reviewer Name</span>
                                        <span className="font-lexend font-medium text-[0.9em] text-gray-800">{matched.name}</span>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-6 pb-6 flex gap-4 mt-4">
                    <button
                        onClick={handleCancel}
                        className="flex-1 border border-gray-400 bg-gray-200 text-gray-700 font-lexend font-medium text-sm tracking-wide py-2.5 rounded-[0.3em] cursor-pointer hover:bg-gray-300"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex-1 bg-blue-600 text-white font-lexend font-medium text-sm tracking-wide py-2.5 rounded-[0.3em] cursor-pointer hover:bg-blue-700"
                    >
                        ADD
                    </button>
                </div>
            </div>
        </div>
    );
}
