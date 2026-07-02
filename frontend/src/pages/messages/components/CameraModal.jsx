import React, { useState, useRef, useEffect } from 'react';
import { RefreshCcw, Check, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const CameraModal = ({ show, onClose, onCapture, t }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let currentStream = null;

        const initCamera = async () => {
            if (!show) return;

            setIsLoading(true);
            setError(null);

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });

                if (!isMounted) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                currentStream = mediaStream;
                setStream(mediaStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                setIsLoading(false);

            } catch (err) {
                if (isMounted) {
                    console.error("Error accessing camera:", err);
                    setError(err.message || "Could not access camera.");
                    setIsLoading(false);
                }
            }
        };

        if (show) {
            initCamera();
        } else {
            if (stream) {
                stopCamera(stream);
            }
            setCapturedImage(null);
            setError(null);
        }

        return () => {
            isMounted = false;
            if (currentStream) {
                stopCamera(currentStream);
            } else if (stream) {
                stopCamera(stream);
            }
        };
    }, [show]);

    const stopCamera = (streamToStop = stream) => {
        if (streamToStop) {
            streamToStop.getTracks().forEach(track => track.stop());
            if (streamToStop === stream) {
                setStream(null);
            }
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setCapturedImage({
                        url: URL.createObjectURL(blob),
                        file: file
                    });
                    stopCamera();
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setIsLoading(true);
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(mediaStream => {
                setStream(mediaStream);
                if (videoRef.current) videoRef.current.srcObject = mediaStream;
                setIsLoading(false);
            })
            .catch(err => {
                setError("Could not restart camera.");
                setIsLoading(false);
            });
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage.file);
            onClose();
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-center animate-in fade-in">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-center items-center z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <span className="text-white/80 font-semibold text-sm tracking-widest drop-shadow-md">PHOTO CAPTURE</span>
            </div>

            {/* Video / Image Display Area */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black z-0 mb-32">
                {isLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white gap-4">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-sm font-medium animate-pulse">Starting camera...</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white gap-4 text-center px-6">
                        <XCircle className="w-16 h-16 text-red-500" />
                        <p className="text-lg font-bold">Camera Error</p>
                        <p className="text-sm text-gray-400">{error}</p>
                    </div>
                )}

                {capturedImage && (
                    <div className="absolute inset-0 z-10 bg-black">
                        <img src={capturedImage.url} alt="Captured" className="w-full h-full object-contain" />
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => e.target.play().catch(console.error)}
                    className="w-full h-full object-cover md:object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Bottom Controls Area - Using Grid to force layout visibility */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-black px-6 pb-safe z-50 flex flex-col justify-center border-t border-gray-900">
                <div className="grid grid-cols-3 items-center w-full max-w-md mx-auto">

                    {capturedImage ? (
                        /* Captured State: Retake (Left), Empty (Center), Use Photo (Right) */
                        <>
                            <div className="flex justify-start">
                                <button onClick={retakePhoto} className="flex flex-col items-center justify-center text-white/80 hover:text-white transition gap-1">
                                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium">Retake</span>
                                </button>
                            </div>

                            <div className="flex justify-center">
                                {/* Empty space in center for captured state to balance buttons */}
                            </div>

                            <div className="flex justify-end">
                                <button onClick={handleConfirm} className="flex flex-col items-center justify-center text-white transition gap-1">
                                    <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium">Use Photo</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Live Camera State: Cancel (Left), Capture (Center), Empty (Right) */
                        <>
                            <div className="flex justify-start">
                                <button
                                    onClick={onClose}
                                    className="text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full font-medium transition-all active:scale-95 shadow-md text-sm md:text-base whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="flex justify-center">
                                {!error && !isLoading && (
                                    <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-[6px] border-white flex items-center justify-center transform hover:scale-105 transition active:scale-95 group">
                                        <div className="w-14 h-14 bg-white rounded-full group-hover:bg-gray-200 transition"></div>
                                    </button>
                                )}
                            </div>

                            <div className="flex justify-end">
                                {/* Empty column to keep the capture button perfectly centered */}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;