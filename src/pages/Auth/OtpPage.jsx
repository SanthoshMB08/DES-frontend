import { useState, useRef, useEffect } from "react";

export default function OtpPage() {
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timeLeft, setTimeLeft] = useState(180);    // 3 MIN RESEND-OTP TIME
    const [isLoading, setIsLoading] = useState(false); // NEW LOADING STATE

    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    // TIMER LOGIC
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // FORMAT TIME TO MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // OTP-INPUT LOGIC
    const handleChange = (element, index) => {
        const value = element.value;
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 3) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    // VERIFY OTP WITH 5-SECOND SIMULATION
    const handleVerify = async () => {
        if (isLoading) return;

        setIsLoading(true);
        console.log("Entered OTP:", otp.join(""));

        await new Promise((resolve) => setTimeout(resolve, 5000));
        setIsLoading(false);
    };


    // HANDLE RESEND BTN
    const handleResend = () => {
        if (timeLeft === 0 && !isLoading) {
            console.log("Resending OTP...");
            setTimeLeft(180);
            setOtp(["", "", "", ""]);
            inputRefs[0].current.focus();
        }
    };

    return (
        // CONTAINER
        <div className="w-full h-screen flex flex-col items-center justify-center">
            <div className="w-3/12 h-fit flex flex-col">
                <h1 className="font-lexend font-bold text-2xl mb-2">VERIFY OTP</h1>

                {/* 4 INPUT BOXES CONTAINER */}
                <div className="flex justify-between mt-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={inputRefs[index]}
                            type="number"
                            value={digit}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            disabled={isLoading} // Lock inputs during verification
                            className="font-lexend text-center text-[1.3em] font-medium border p-2 rounded-sm outline-0 w-14 h-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-gray-50"
                        />
                    ))}
                </div>

                {/* TIMER & RESEND SECTION */}
                <div className="flex justify-between items-center mt-4 font-lexend text-[0.9em]">
                    <span className={timeLeft === 0 ? "text-red-500 font-medium" : "text-gray-500"}>
                        {formatTime(timeLeft)}
                    </span>

                    {/* RESEND OTP BTN */}
                    <button
                        onClick={handleResend}
                        disabled={timeLeft > 0 || isLoading}
                        className={`bg-transparent border-0 p-0 text-blue-500 ${timeLeft > 0 || isLoading ? "opacity-50 cursor-not-allowed" : "hover:text-blue-600 cursor-pointer"
                            }`}
                    >
                        RESEND OTP
                    </button>
                </div>

                {/* VERIFY BUTTON WITH DYNAMIC UI TEXT */}
                <button
                    onClick={handleVerify}
                    disabled={isLoading}
                    className={`font-lexend font-normal text-[1em] tracking-wide border-0 p-3 rounded-sm mt-6 bg-gray-900 text-white ${isLoading ? "opacity-90 cursor-not-allowed" : "cursor-pointer"
                        }`}
                >
                    {isLoading ? "VERIFYING . . ." : "VERIFY"}
                </button>
            </div>
        </div>
    );
}