import React, { useState } from "react";
import { IoClose } from "react-icons/io5";

const initialForm = {
    uid: "",
    name: "",
    email: "",
    password: "",
    qpCode: "",
    subject: "",
    course: "",
    semester: "",
};

export default function AddBoeModal({ isOpen, onClose, onAdd, qpCodes = [] }) {
    const [form, setForm] = useState(initialForm);

    if (!isOpen) return null;

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
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
            <div className="w-5/12 bg-white rounded-[0.3em] overflow-hidden border border-gray-300">
                <div className="w-full bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <span className="font-lexend font-bold text-white text-[1em] tracking-wider uppercase">Add BOE</span>
                </div>

                <div className="p-6 flex flex-col gap-4">
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

                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>QP-Code</label>
                        <select value={form.qpCode} onChange={handleQpCodeChange} className={`${inputClass} bg-white cursor-pointer`}>
                            <option value="" disabled hidden>SELECT QP-CODE</option>
                            {qpCodes.map(q => (
                                <option key={q.qpCode} value={q.qpCode}>{q.qpCode}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Subject</label>
                        <input type="text" value={form.subject} readOnly disabled className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} />
                    </div>

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
                </div>

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