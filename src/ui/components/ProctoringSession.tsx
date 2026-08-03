import { useState, useRef, useEffect } from "react";
import { Camera, Monitor, ShieldAlert, CheckCircle } from "lucide-react";

export const ProctoringSession = ({ assessmentTitle, onComplete }: { assessmentTitle: string, onComplete: () => void }) => {
    const [isProctoring, setIsProctoring] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const startProctoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = screenStream;
            if (screenRef.current) {
                screenRef.current.srcObject = screenStream;
            }

            setIsProctoring(true);
        } catch (err) {
            console.error("Proctoring error:", err);
            alert("Camera, Microphone, and Screen Share permissions are required to take this assessment.");
        }
    };

    const stopProctoring = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsProctoring(false);
        onComplete();
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    if (!isProctoring) {
        return (
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 text-center">
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Proctored Assessment: {assessmentTitle}</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                    This assessment requires screen, camera, and microphone monitoring to ensure academic integrity. Please grant the necessary permissions to begin.
                </p>
                <button 
                    onClick={startProctoring}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center mx-auto"
                >
                    <Camera className="w-5 h-5 mr-2" /> Start Proctored Session
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" /> Session Monitored
                    </h3>
                    <p className="text-xs text-emerald-400/80">Your screen, camera, and microphone are currently being recorded for integrity purposes.</p>
                </div>
                <button 
                    onClick={stopProctoring}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors"
                >
                    End Session
                </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center">
                        <Camera className="w-3 h-3 mr-1" /> Camera & Mic
                    </div>
                </div>
                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative aspect-video">
                    <video ref={screenRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center">
                        <Monitor className="w-3 h-3 mr-1" /> Screen Capture
                    </div>
                </div>
            </div>
        </div>
    );
};
