import React, { useEffect, useState } from "react";

// Roles the Admin is allowed to create ids for, in display order.
// Backend role name -> friendly label shown in the dropdown.
const CREATABLE_ROLES = [
    { name: "ROLE_RE", label: "RE (Register of Evaluation)" },
    { name: "ROLE_BOE", label: "BO (Board Officer)" },
    { name: "ROLE_CHIEF", label: "Subject Chief" },
    { name: "ROLE_REVIEWER", label: "Reviewer" },
    { name: "ROLE_VALUATOR", label: "Valuator (Evaluator)" },
    { name: "ROLE_SCANNER", label: "Scanner" },
    { name: "ROLE_INVIGILATOR", label: "Invigilator" },
];

const initialForm = {
    fullName: "",
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
    roleName: "",
};

export default function AddUserModal({ isOpen, onClose, onCreate, roles = [], error, submitting }) {
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (isOpen) setForm(initialForm);
    }, [isOpen]);

    if (!isOpen) return null;

    // Only offer roles that both exist on the backend (seeded) and are on the
    // admin-creatable whitelist above.
    const options = CREATABLE_ROLES
        .map(r => ({ ...r, id: roles.find(role => role.name === r.name)?.id }))
        .filter(r => r.id);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.roleName) return;
        onCreate(form);
    };

    const inputClass = "border border-gray-400 rounded-[0.3em] px-3 py-2 font-lexend text-[0.9em] outline-none focus:border-blue-500";
    const labelClass = "font-lexend text-[0.85em] font-medium uppercase text-gray-600";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-5/12 bg-white rounded-[0.3em] overflow-hidden border border-gray-300">
                <div className="w-full bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <span className="font-lexend font-bold text-white text-[1em] tracking-wider uppercase">Create User</span>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Role</label>
                        <select required value={form.roleName} onChange={handleChange("roleName")}
                            className={`${inputClass} bg-white cursor-pointer`}>
                            <option value="" disabled hidden>SELECT ROLE</option>
                            {options.map(r => (
                                <option key={r.name} value={r.name}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Full Name</label>
                            <input required type="text" value={form.fullName} onChange={handleChange("fullName")} className={inputClass} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Username</label>
                            <input required type="text" value={form.username} onChange={handleChange("username")} className={inputClass} />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Password</label>
                            <input required type="text" value={form.password} onChange={handleChange("password")} className={inputClass} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label className={labelClass}>Phone Number</label>
                            <input type="text" value={form.phoneNumber} onChange={handleChange("phoneNumber")} className={inputClass} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Email</label>
                        <input type="email" value={form.email} onChange={handleChange("email")} className={inputClass} />
                    </div>

                    {error && <p className="font-lexend text-sm text-red-600">{error}</p>}

                    <div className="flex gap-4 mt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 border border-gray-400 bg-gray-200 text-gray-700 font-lexend font-medium text-sm tracking-wide py-2.5 rounded-[0.3em] cursor-pointer hover:bg-gray-300">
                            CANCEL
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 bg-blue-600 text-white font-lexend font-medium text-sm tracking-wide py-2.5 rounded-[0.3em] cursor-pointer hover:bg-blue-700 disabled:opacity-60">
                            {submitting ? "CREATING..." : "CREATE"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
