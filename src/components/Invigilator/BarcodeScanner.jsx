import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { FiCamera, FiX } from "react-icons/fi";

const ELEMENT_ID = "invigilator-barcode-reader";

// Same formats the Expo BarcodeScanner reads: code128 is what the OCR module's
// hall-ticket barcodes use, the rest are a safety net for booklet barcodes.
const FORMATS = [
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
];

const isPermissionError = (err) =>
    err?.name === "NotAllowedError" || err?.name === "SecurityError" || /permission|not allowed|denied/i.test(err?.message || "");

// Full-screen camera scanner. Calls onResult(text) once with the decoded value,
// then stops itself - the parent decides what happens next.
export default function BarcodeScanner({ title, onResult, onClose }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState("");
    const [needsPermission, setNeedsPermission] = useState(false);
    const [starting, setStarting] = useState(true);
    const [runId, setRunId] = useState(0);

    const stop = useCallback(() => {
        const scanner = scannerRef.current;
        if (!scanner) return;
        scanner.stop().catch(() => {}).finally(() => scanner.clear());
    }, []);

    // Mounted only once permission is available, so a denied camera doesn't
    // leave a dead <video> element behind.
    useEffect(() => {
        let cancelled = false;
        const scanner = new Html5Qrcode(ELEMENT_ID, {
            formatsToSupport: FORMATS,
            verbose: false,
        });
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 260, height: 260 } },
                (decodedText) => {
                    if (cancelled) return;
                    cancelled = true;
                    stop();
                    onResult(decodedText);
                },
                () => {
                    /* per-frame decode failure - ignore, this fires constantly while scanning */
                }
            )
            .then(() => setStarting(false))
            .catch((err) => {
                setStarting(false);
                if (isPermissionError(err)) {
                    setNeedsPermission(true);
                    return;
                }
                setError(
                    "Could not open the camera. Check camera permission for this site, or use manual entry instead. (" +
                        (err?.message || err) +
                        ")"
                );
            });

        return () => {
            cancelled = true;
            stop();
        };
    }, [runId, stop, onResult]);

    // Ask up front when the browser can tell us, so a first-time visitor gets
    // the native prompt instead of a bare error screen.
    useEffect(() => {
        if (!navigator.permissions?.query) return;
        let cancelled = false;
        navigator.permissions
            .query({ name: "camera" })
            .then((status) => {
                if (cancelled || status.state === "granted" || status.state === "prompt") return;
                setNeedsPermission(true);
                setStarting(false);
            })
            .catch(() => {
                /* Firefox rejects the camera descriptor - fall back to starting anyway */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const requestPermission = async () => {
        setError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            stream.getTracks().forEach((track) => track.stop());
            setNeedsPermission(false);
            setStarting(true);
            setRunId((id) => id + 1);
        } catch (err) {
            setError(
                "Camera access was denied. Allow the camera for this site in your browser's address bar, or enter the value manually. (" +
                    (err?.message || err) +
                    ")"
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 text-white bg-black/50">
                <div className="flex items-center gap-2 font-lexend font-semibold">
                    <FiCamera size={18} />
                    {title}
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-white/15 active:bg-white/25">
                    <FiX size={20} />
                </button>
            </div>

            {needsPermission ? (
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
                    <p className="font-lexend text-white text-base">Camera access is needed to scan barcodes.</p>
                    <button
                        onClick={requestPermission}
                        className="bg-blue-600 text-white font-lexend font-semibold px-6 py-3 rounded-xl"
                    >
                        GRANT PERMISSION
                    </button>
                    <button onClick={onClose} className="font-lexend text-white/70 text-sm underline">
                        Close and enter manually instead
                    </button>
                    {error && <p className="font-lexend text-red-400 text-sm text-center">{error}</p>}
                </div>
            ) : (
                <>
                    {/* Camera viewport + framing guide */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        <div id={ELEMENT_ID} className="w-full max-w-md" />
                    </div>

                    <div className="px-4 pb-6 text-center space-y-3 pointer-events-none">
                        <p className="font-lexend text-white/80 text-sm">Line up the barcode inside the frame</p>
                        {starting && <p className="font-lexend text-white/60 text-sm">Starting camera...</p>}
                        {error && (
                            <div className="pointer-events-auto space-y-3">
                                <p className="font-lexend text-red-400 text-sm">{error}</p>
                                <button
                                    onClick={onClose}
                                    className="w-full bg-white/10 text-white font-lexend font-medium py-3 rounded-lg"
                                >
                                    Close and enter manually
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
