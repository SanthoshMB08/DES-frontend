import React, { useState } from "react";
import { IoClose } from "react-icons/io5";

const initialForm = {
    qpCode: "",
    subject: "",
    course: "",
    semester: "",
    credits: "",
    boeid: "",
};

export default function AddQpCodeModal({ isOpen, onClose, onAdd }) {
    const [form, setForm] = useState(initialForm);

    if (!isOpen) return null;

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleAdd = () => {
        onAdd(form);
        setForm(initialForm);
    };

    const handleCancel = () => {
        setForm(initialForm);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-2/4 bg-white rounded-[0.3em] overflow-hidden border border-gray-300">
                <div className="w-full bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <span className="font-lexend font-medium text-white text-[0.95em] tracking-wider uppercase">Add QP-Code</span>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className="font-lexend text-[0.85em] font-medium uppercase text-gray-600">QP Code</label>
                            <input
                                type="text"
                                value={form.qpCode}
                                onChange={handleChange("qpCode")}
                                className="border border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className="font-lexend text-[0.85em] font-medium uppercase text-gray-600">Subject Name</label>
                            <input
                                type="text"
                                value={form.subject}
                                onChange={handleChange("subject")}
                                className="border border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className="font-lexend text-[0.85em] font-medium uppercase text-gray-600">Course</label>
                            <input
                                type="text"
                                value={form.course}
                                onChange={handleChange("course")}
                                className="border border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className="font-lexend text-[0.85em] font-medium uppercase text-gray-600">Semester</label>
                            <input
                                type="text"
                                value={form.semester}
                                onChange={handleChange("semester")}
                                className="border border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className="font-lexend text-[0.85em] font-medium uppercase text-gray-600">Credits</label>
                            <input
                                type="text"
                                value={form.credits}
                                onChange={handleChange("credits")}
                                className="border border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className="font-lexend text-[0.85em] font-medium uppercase text-gray-600">DATE OF EXAMINATION</label>
                            <input
                                type="date"
                                value={form.boeid}
                                onChange={handleChange("boeid")}
                                className="border uppercase border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-8 flex gap-4">
                    <button
                        onClick={handleCancel}
                        className="flex-1 border bg-gray-200 border-gray-400 text-gray-700 font-lexend font-medium text-sm tracking-wide py-2.5 rounded-[0.3em] cursor-pointer hover:bg-gray-100"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex-1 bg-blue-600 text-white font-lexend font-normal text-sm tracking-wide py-2.5 rounded-[0.3em] cursor-pointer hover:bg-blue-700"
                    >
                        ADD QP-CODE
                    </button>
                </div>
            </div>
        </div>
    );
}