import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { FiX, FiCamera } from "react-icons/fi";

const ELEMENT_ID = "invigilator-qr-reader";

// Full-screen camera scanner. Calls onResult(text) once with the decoded
// value, then stops itself - the parent decides what happens next.
export default function QrScanner({ title, onResult, onClose }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState("");
    const [starting, setStarting] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const scanner = new Html5Qrcode(ELEMENT_ID);
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 260, height: 260 } },
                (decodedText) => {
                    if (cancelled) return;
                    cancelled = true;
                    scanner.stop().catch(() => {}).finally(() => scanner.clear());
                    onResult(decodedText);
                },
                () => {
                    /* per-frame decode failure - ignore, this fires constantly while scanning */
                }
            )
            .then(() => setStarting(false))
            .catch((err) => {
                setStarting(false);
                setError(
                    "Could not open the camera. Check camera permission for this site, or use manual entry instead. (" +
                        (err?.message || err) +
                        ")"
                );
            });

        return () => {
            cancelled = true;
            scanner.stop().catch(() => {}).finally(() => scanner.clear());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-white">
                <div className="flex items-center gap-2 font-lexend font-medium">
                    <FiCamera size={18} />
                    {title}
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-white/10 active:bg-white/20">
                    <FiX size={22} className="text-white" />
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-4">
                <div id={ELEMENT_ID} className="w-full max-w-md rounded-xl overflow-hidden" />
            </div>

            {starting && <p className="text-center text-white/70 font-lexend text-sm pb-4">Starting camera...</p>}
            {error && (
                <div className="px-4 pb-6">
                    <p className="text-red-400 font-lexend text-sm text-center">{error}</p>
                    <button
                        onClick={onClose}
                        className="mt-3 w-full bg-white/10 text-white font-lexend font-medium py-3 rounded-lg"
                    >
                        Close and enter manually
                    </button>
                </div>
            )}
        </div>
    );
}
