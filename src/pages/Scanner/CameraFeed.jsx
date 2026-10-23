import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.PDF_417,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
];

export default function CameraFeed({ onDecode, active }) {
    const elementId = useRef(`scanner-camera-${Math.random().toString(36).slice(2)}`);
    const callbackRef = useRef(onDecode);
    const [cameraError, setCameraError] = useState("");

    useEffect(() => {
        callbackRef.current = onDecode;
    }, [onDecode]);

    useEffect(() => {
        if (!active) return undefined;

        let scanner;
        let disposed = false;
        const startCamera = async () => {
            scanner = new Html5Qrcode(elementId.current, { formatsToSupport: SUPPORTED_FORMATS });
            try {
                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        disableFlip: false,
                        qrbox: (viewfinderWidth, viewfinderHeight) => ({
                            width: Math.min(Math.round(viewfinderWidth * 0.9), 420),
                            height: Math.min(Math.round(viewfinderHeight * 0.78), 560),
                        }),
                    },
                    (decodedText, result) => callbackRef.current?.(decodedText, result),
                    () => {},
                );
                if (disposed) {
                    await scanner.stop();
                    scanner.clear();
                }
            } catch (error) {
                if (!disposed) {
                    setCameraError(error?.message || "Camera access failed. Allow camera access and try again.");
                }
            }
        };

        setCameraError("");
        startCamera();
        return () => {
            disposed = true;
            if (scanner) {
                const stopScanner = async () => {
                    try {
                        if (scanner.isScanning) await scanner.stop();
                        scanner.clear();
                    } catch (error) {
                        console.error("Could not clean up the scanner camera.", error);
                    }
                };
                stopScanner();
            }
        };
    }, [active]);

    return (
        <div className="w-full">
            {cameraError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {cameraError}
                </div>
            )}
            <div id={elementId.current} className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-950 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        </div>
    );
}
