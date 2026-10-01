import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ICONS
import { FiEye, FiEyeOff } from "react-icons/fi";

import { login, routeForRoles } from "../../api/auth";

export default function LoginPage() {
    const navigate = useNavigate();

    const [uid, setUid] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // LOADING + ERROR STATE FOR REAL BACKEND CALL
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // LOGIN HANDLER
    const handleLogin = async () => {
        if (isLoading) return; // Prevent multiple clicks
        const normalizedUid = uid.trim();
        const normalizedPassword = password.trim();
        if (!normalizedUid || !normalizedPassword) {
            setError("Please enter both UID and password.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await login(normalizedUid, normalizedPassword);
            navigate(response.forcePasswordChange ? "/change-password" : routeForRoles(response.roles));
        } catch (err) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    // UI
    return (
        // CONTAINER
        <div className="w-full h-screen flex items-center justify-center">
            <div className="w-3/12 flex flex-col">
                <h1 className="font-lexend font-bold text-2xl mb-2">
                    LOGIN
                </h1>

                {/* UID */}
                <input
                    className="font-lexend text-[1.1em] border p-2.5 rounded-sm mt-2 outline-none"
                    type="text"
                    placeholder="UID"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading} // Disable input during submission
                />

                {/* PASSWORD */}
                <div className="relative mt-4">
                    <input
                        className="font-lexend text-[1.1em] border p-2.5 rounded-sm outline-none w-full pr-12"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading} // Disable input during submission
                    />

                    {/* EYE-BUTTON-SWITCHER */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                        disabled={isLoading}
                    >
                        {showPassword ? (
                            <FiEyeOff size={22} />
                        ) : (
                            <FiEye size={22} />
                        )}
                    </button>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <p className="font-lexend text-sm text-red-600 mt-2">{error}</p>
                )}

                {/* LOGIN BUTTON */}
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className={`font-lexend font-normal text-[1em] p-3 rounded-sm tracking-wide mt-4 bg-gray-900 text-white cursor-pointer ${isLoading ? "opacity-90 cursor-not-allowed" : ""
                        }`}
                >
                    {isLoading ? "LOGGING IN . . ." : "LOGIN"}
                </button>
            </div>
        </div>
    );
}
