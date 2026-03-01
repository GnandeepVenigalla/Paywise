import { useState, useRef, useCallback, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Camera, RefreshCw, Upload, Image as ImageIcon, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ScanBill() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { api } = useContext(AuthContext);
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [cameraState, setCameraState] = useState('loading'); // 'loading', 'active', 'error'
    const [hasPermission, setHasPermission] = useState(localStorage.getItem('camera_granted') === 'true');

    const requestPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Just checking permission
            setHasPermission(true);
            localStorage.setItem('camera_granted', 'true');
            setCameraState('loading');
        } catch (err) {
            setCameraState('error');
        }
    };

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImageSrc(imageSrc);
        }
    }, [webcamRef]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadstart = () => setIsProcessing(true); // show loading state while reading large files
            reader.onloadend = () => {
                setImageSrc(reader.result);
                setIsProcessing(false);
            };
            reader.onerror = () => {
                alert("Failed to read file");
                setIsProcessing(false);
            }
            reader.readAsDataURL(file);
        }
    };

    const processImage = async () => {
        if (!imageSrc) return;
        setIsProcessing(true);

        try {
            // First attempt: Try using the ultra-powerful remote Google Gemini backend!
            try {
                setProgress(50);
                const res = await api.post('/expenses/scan', { imageBase64: imageSrc });
                setProgress(100);

                // If it succeeds, gracefully pass the perfectly mapped AI object
                const isFriend = location.pathname.includes('/friend/');
                navigate(isFriend ? `/friend/${id}/split` : `/group/${id}/split`, { state: { aiItems: res.data.items, imageSrc } });
                return;
            } catch (err) {
                // If Gemini isn't configured in the .env by the developer, gracefully fallback to the basic local text parser
                if (err.response?.data?.msg === 'GEMINI_API_KEY not found in backend .env') {
                    console.log("No Gemini API key found. Falling back to simple offline OCR...");
                } else {
                    console.error("AI Scan failed:", err);
                    alert("AI Scan failed! Please try again or take a clearer photo.");
                    setIsProcessing(false);
                    return;
                }
            }

            setProgress(0);
            const result = await Tesseract.recognize(
                imageSrc,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(parseInt(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;

            // Navigate to split page with simple extracted text over to the regex parser
            const isFriend = location.pathname.includes('/friend/');
            navigate(isFriend ? `/friend/${id}/split` : `/group/${id}/split`, { state: { text, imageSrc } });
        } catch (err) {
            console.error(err);
            alert('Error processing image. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-[100dvh] w-full bg-black text-white flex flex-col font-sans overflow-hidden">
            {/* Hidden file inputs for programmatic clicking */}
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileUpload} />

            {/* Header */}
            <div className="p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full left-0">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition backdrop-blur-sm">
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <h2 className="text-lg font-bold tracking-wide shadow-black drop-shadow-md">Scan Receipt</h2>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                {!imageSrc ? (
                    <>
                        {cameraState === 'error' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-900 absolute inset-0 z-0">
                                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                                <h3 className="text-xl font-bold mb-2">Camera Access Unavailable</h3>
                                <p className="text-gray-400 mb-8 max-w-xs text-sm">
                                    We couldn't access your camera. You can still use the buttons below to upload or take a photo using your device's native camera.
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-4 px-8 rounded-full bg-gradient-to-r from-slate-800 to-slate-800 text-white font-bold hover:from-slate-900 hover:to-slate-900 transition shadow-lg shadow-slate-800/30 flex items-center gap-3">
                                    <Camera className="w-6 h-6" />
                                    Open Native Camera
                                </button>
                            </div>
                        ) : !hasPermission ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black absolute inset-0 z-0">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Camera className="w-10 h-10 text-white/40" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Enable Camera Access</h3>
                                <p className="text-gray-400 mb-10 max-w-xs text-[15px] leading-relaxed">
                                    To scan receipts and extract totals automatically, Paywise needs permission to use your camera.
                                </p>
                                <button
                                    onClick={requestPermission}
                                    className="w-full max-w-xs py-4.5 px-8 rounded-2xl bg-white text-black font-black text-lg hover:bg-gray-100 transition shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-95 transition-transform"
                                >
                                    Enable Camera
                                </button>
                                <button
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="mt-6 text-gray-500 font-bold hover:text-white transition"
                                >
                                    Upload from gallery instead
                                </button>
                            </div>
                        ) : (
                            <>
                                {cameraState === 'loading' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
                                        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
                                    </div>
                                )}
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "environment" }}
                                    className="w-full h-full object-cover absolute inset-0 z-0"
                                    playsInline
                                    onUserMedia={() => setCameraState('active')}
                                    onUserMediaError={() => {
                                        setCameraState('error');
                                        setHasPermission(false);
                                        localStorage.removeItem('camera_granted');
                                    }}
                                />
                                {/* Overlay grid for scanning */}
                                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50 transition-all z-10">
                                    <div className="w-full h-full border-2 border-dashed border-slate-400/70 rounded-3xl relative">
                                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-400/50 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-scan"></div>
                                    </div>
                                </div>

                                <p className="absolute bottom-32 text-center w-full font-medium text-white/90 drop-shadow-md text-sm z-10">Align receipt securely within the frame</p>
                            </>
                        )}
                    </>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img src={imageSrc} alt="Receipt" className="max-w-full max-h-[70vh] rounded-xl shadow-2xl border border-white/10" />
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-20 transition-all">
                                <Loader2 className="w-12 h-12 text-slate-400 animate-spin mb-4" />
                                <p className="text-slate-400 font-bold tracking-widest text-lg animate-pulse mb-2">EXTRACTING ITEMS</p>
                                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mt-4">
                                    <div className="h-full bg-gradient-to-r from-slate-800 to-purple-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-gray-400 text-xs mt-3 font-medium">{progress}% Complete</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-black/90 backdrop-blur-lg pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 px-8 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 relative">
                {!imageSrc ? (
                    <>
                        <button
                            onClick={() => galleryInputRef.current?.click()}
                            className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer group flex-shrink-0 z-20">
                            <ImageIcon className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                        </button>

                        {cameraState !== 'error' ? (
                            <button
                                onClick={capture}
                                className="w-20 h-20 rounded-full bg-white/20 p-2 flex items-center justify-center hover:bg-white/30 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] group flex-shrink-0 z-20"
                            >
                                <div className="w-16 h-16 rounded-full bg-white group-hover:scale-95 transition-transform flex items-center justify-center shadow-inner">
                                    <Camera className="w-8 h-8 text-black opacity-80" />
                                </div>
                            </button>
                        ) : (
                            <div className="w-20"></div> // Spacer when error is shown
                        )}

                        <div className="w-14 flex-shrink-0"></div> {/* Spacer to keep capture button centered */}
                    </>
                ) : (
                    <div className="w-full flex justify-between gap-4">
                        <button
                            onClick={() => {
                                setImageSrc(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                                if (galleryInputRef.current) galleryInputRef.current.value = '';
                            }}
                            disabled={isProcessing}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition disabled:opacity-50 border border-white/5 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" /> Retake
                        </button>
                        <button
                            onClick={processImage}
                            disabled={isProcessing}
                            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-800 text-white font-bold hover:from-slate-900 hover:to-slate-900 transition disabled:opacity-50 shadow-lg shadow-slate-800/30 flex items-center justify-center gap-2"
                        >
                            <Upload className="w-5 h-5" /> Use Photo
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}

