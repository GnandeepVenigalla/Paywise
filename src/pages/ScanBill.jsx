import { useState, useRef, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Camera, RefreshCw, Upload, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ScanBill() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api } = useContext(AuthContext);
    const webcamRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImageSrc(imageSrc);
    }, [webcamRef]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result);
            };
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
                navigate(`/group/${id}/split`, { state: { aiItems: res.data.items, imageSrc } });
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
            navigate(`/group/${id}/split`, { state: { text, imageSrc } });
        } catch (err) {
            console.error(err);
            alert('Error processing image. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
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
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "environment" }}
                            className="w-full h-full object-cover absolute inset-0"
                        />
                        {/* Overlay grid for scanning */}
                        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50 transition-all">
                            <div className="w-full h-full border-2 border-dashed border-teal-400/70 rounded-3xl relative">
                                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-teal-400/50 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-scan"></div>
                            </div>
                        </div>

                        <p className="absolute bottom-32 text-center w-full font-medium text-white/90 drop-shadow-md text-sm">Align receipt securely within the frame</p>
                    </>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img src={imageSrc} alt="Receipt" className="max-w-full max-h-[70vh] rounded-xl shadow-2xl border border-white/10" />
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-20 transition-all">
                                <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
                                <p className="text-teal-400 font-bold tracking-widest text-lg animate-pulse mb-2">EXTRACTING ITEMS</p>
                                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mt-4">
                                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-gray-400 text-xs mt-3 font-medium">{progress}% Complete</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-black/90 backdrop-blur-lg pb-10 pt-6 px-8 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
                {!imageSrc ? (
                    <>
                        <label className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer group">
                            <ImageIcon className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </label>

                        <button
                            onClick={capture}
                            className="w-20 h-20 rounded-full bg-white/20 p-2 flex items-center justify-center hover:bg-white/30 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
                        >
                            <div className="w-16 h-16 rounded-full bg-white group-hover:scale-95 transition-transform flex items-center justify-center shadow-inner">
                                <Camera className="w-8 h-8 text-black opacity-80" />
                            </div>
                        </button>

                        <div className="w-14"></div> {/* Spacer to keep capture button centered */}
                    </>
                ) : (
                    <div className="w-full flex justify-between gap-4">
                        <button
                            onClick={() => setImageSrc(null)}
                            disabled={isProcessing}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition disabled:opacity-50 border border-white/5 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" /> Retake
                        </button>
                        <button
                            onClick={processImage}
                            disabled={isProcessing}
                            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold hover:from-teal-600 hover:to-emerald-600 transition disabled:opacity-50 shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2"
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
