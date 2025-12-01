
import React, { useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { storageService } from '../../../services/storage';

interface VoiceVisualizerProps {
    isRecording: boolean;
    onToggle: () => void;
    recordingTime?: number;
    minDuration?: number;
    canStop?: boolean;
}

export const VoiceVisualizer = ({ 
    isRecording, 
    onToggle, 
    recordingTime = 0, 
    minDuration = 15, 
    canStop = true 
}: VoiceVisualizerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // Calculate progress percentage toward minimum duration
    const progress = Math.min((recordingTime / minDuration) * 100, 100);
    const timeRemaining = Math.max(minDuration - recordingTime, 0);

    // Store progress in a ref so the animation loop can access current value
    const progressRef = useRef(progress);
    progressRef.current = progress;
    
    const canStopRef = useRef(canStop);
    canStopRef.current = canStop;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        // Initial Idle State
        if (canvas && ctx && !isRecording) {
            ctx.fillStyle = '#f9fafb'; // bg-gray-50
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.strokeStyle = '#d1d5db'; // gray-300
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (isRecording) {
            const startAudio = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;
                    
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    audioContextRef.current = audioContext;
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 2048;
                    analyserRef.current = analyser;
                    const source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);

                    // Setup MediaRecorder
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = mediaRecorder;
                    chunksRef.current = [];
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) chunksRef.current.push(e.data);
                    };
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                        const id = `recording_${Date.now()}`;
                        storageService.saveVoice(blob, id);
                        console.log("Voice recorded and saved:", id);
                    };
                    mediaRecorder.start();

                    // Canvas Animation Loop
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    const draw = () => {
                        if (!canvas || !ctx) return;
                        animationRef.current = requestAnimationFrame(draw);
                        
                        analyser.getByteTimeDomainData(dataArray);
                        
                        // Clear canvas
                        ctx.fillStyle = '#f9fafb';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Calculate progress line position
                        const progressX = (progressRef.current / 100) * canvas.width;
                        
                        // Draw progress background fill (teal tint for completed portion)
                        if (progressRef.current < 100) {
                            ctx.fillStyle = 'rgba(45, 212, 191, 0.15)'; // teal with low opacity
                            ctx.fillRect(0, 0, progressX, canvas.height);
                        } else {
                            // Full green tint when ready
                            ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'; // green with low opacity
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        
                        // Draw waveform with gradient based on progress
                        const sliceWidth = canvas.width / bufferLength;
                        let x = 0;
                        
                        // First pass: draw the "completed" portion in teal/green
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        
                        for (let i = 0; i < bufferLength; i++) {
                            const v = dataArray[i] / 128.0;
                            const y = v * canvas.height / 2;
                            const currentX = i * sliceWidth;
                            
                            if (currentX <= progressX) {
                                if (i === 0 || (i > 0 && (i - 1) * sliceWidth > progressX)) {
                                    ctx.moveTo(currentX, y);
                                } else {
                                    ctx.lineTo(currentX, y);
                                }
                            }
                            
                            x += sliceWidth;
                        }
                        
                        ctx.strokeStyle = canStopRef.current ? '#22c55e' : '#2dd4bf'; // green when ready, teal otherwise
                        ctx.stroke();
                        
                        // Second pass: draw the "remaining" portion in gray
                        ctx.beginPath();
                        x = 0;
                        let started = false;
                        
                        for (let i = 0; i < bufferLength; i++) {
                            const v = dataArray[i] / 128.0;
                            const y = v * canvas.height / 2;
                            const currentX = i * sliceWidth;
                            
                            if (currentX >= progressX) {
                                if (!started) {
                                    ctx.moveTo(currentX, y);
                                    started = true;
                                } else {
                                    ctx.lineTo(currentX, y);
                                }
                            }
                        }
                        
                        ctx.strokeStyle = '#d1d5db'; // gray for remaining
                        ctx.stroke();
                        
                        // Draw progress line marker (vertical line at progress point)
                        if (progressRef.current < 100) {
                            ctx.beginPath();
                            ctx.moveTo(progressX, 0);
                            ctx.lineTo(progressX, canvas.height);
                            ctx.strokeStyle = '#2dd4bf';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([4, 4]);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    };
                    draw();
                } catch (err) {
                    console.error("Microphone access denied or error:", err);
                }
            };
            startAudio();
        } else {
            // Stop Recording & Cleanup
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        };
    }, [isRecording]);

    return (
        <div className="flex flex-col items-center gap-10 animate-in fade-in duration-1000 w-full max-w-md">
            <div className="w-full bg-gray-50 border-4 border-black relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <div className="w-2 h-2 rounded-full bg-black/20" />
                    <div className="w-2 h-2 rounded-full bg-black/20" />
                    <div className="w-2 h-2 rounded-full bg-black/20" />
                </div>
                
                <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={200} 
                    className="w-full h-48"
                />
                
                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${canStop ? 'bg-green-500' : 'bg-red-600'}`} />
                        <span className={`font-mono text-sm font-bold tracking-wider ${canStop ? 'text-green-600' : 'text-red-600'}`}>
                            {canStop ? 'READY' : `${timeRemaining}s`}
                        </span>
                    </div>
                )}
            </div>
            
            <button 
                onClick={onToggle}
                disabled={isRecording && !canStop}
                className={`group relative flex items-center justify-center w-24 h-24 rounded-full border-4 transition-all duration-300 
                    ${isRecording 
                        ? canStop 
                            ? 'border-green-500 bg-green-500 text-white scale-110 shadow-[0_10px_20px_rgba(34,197,94,0.3)] cursor-pointer' 
                            : 'border-black/30 bg-black/30 text-white scale-105 cursor-not-allowed'
                        : 'border-black hover:bg-black hover:text-white cursor-pointer'
                    }`}
            >
                {isRecording ? (
                    <Square fill="currentColor" size={32} />
                ) : (
                    <Mic size={36} strokeWidth={2} />
                )}
            </button>
            
            <p className="font-mono text-xs text-black/40 uppercase tracking-[0.2em] font-bold">
                {isRecording 
                    ? canStop 
                        ? 'Tap to Stop' 
                        : 'Keep Going...'
                    : 'Tap to Record'
                }
            </p>
        </div>
    );
};
