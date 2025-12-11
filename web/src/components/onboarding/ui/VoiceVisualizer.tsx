
import React, { useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { storageService } from '../../../services/storage';
import { audioService } from '../../../services/audio';

// Audio constraints - must match schema validation
const MIN_AUDIO_SIZE = 10 * 1024; // 10KB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/m4a', 'audio/mp4'];

interface VoiceVisualizerProps {
    isRecording: boolean;
    onToggle: () => void;
    recordingTime?: number;
    minDuration?: number;
    canStop?: boolean;
    fieldName?: string; // The field name to save the voice recording as (e.g., 'future_self_intro_recording')
    onRecordingComplete?: (blob: Blob) => void; // Callback when recording is complete
    onRecordingError?: (error: string) => void; // Callback when recording validation fails
}

export const VoiceVisualizer = ({ 
    isRecording, 
    onToggle, 
    recordingTime = 0, 
    minDuration = 15, 
    canStop = true,
    fieldName,
    onRecordingComplete,
    onRecordingError
}: VoiceVisualizerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    
    // Store fieldName in a ref so the onstop callback always has the latest value
    const fieldNameRef = useRef(fieldName);
    const onRecordingCompleteRef = useRef(onRecordingComplete);
    const onRecordingErrorRef = useRef(onRecordingError);

    // Calculate progress percentage toward minimum duration
    const progress = Math.min((recordingTime / minDuration) * 100, 100);
    const timeRemaining = Math.max(minDuration - recordingTime, 0);

    // Store progress in a ref so the animation loop can access current value
    const progressRef = useRef(progress);
    const canStopRef = useRef(canStop);
    
    // Update refs in an effect, not during render
    useEffect(() => {
      progressRef.current = progress;
      canStopRef.current = canStop;
      fieldNameRef.current = fieldName;
      onRecordingCompleteRef.current = onRecordingComplete;
      onRecordingErrorRef.current = onRecordingError;
    }, [progress, canStop, fieldName, onRecordingComplete, onRecordingError]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        // Initial Idle State - Dark theme (pure black)
        if (canvas && ctx && !isRecording) {
            ctx.fillStyle = '#0A0A0A'; // Pure black background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // White line with opacity
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (isRecording) {
            const startAudio = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;
                    
                    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
                        
                        // Validate audio size
                        if (blob.size < MIN_AUDIO_SIZE) {
                            const errorMsg = `Recording too short (${Math.round(blob.size / 1024)}KB). Please record for longer.`;
                            console.error('[VoiceVisualizer]', errorMsg);
                            if (onRecordingErrorRef.current) {
                                onRecordingErrorRef.current(errorMsg);
                            }
                            return;
                        }
                        
                        if (blob.size > MAX_AUDIO_SIZE) {
                            const errorMsg = `Recording too large (${Math.round(blob.size / (1024 * 1024))}MB). Maximum is 10MB.`;
                            console.error('[VoiceVisualizer]', errorMsg);
                            if (onRecordingErrorRef.current) {
                                onRecordingErrorRef.current(errorMsg);
                            }
                            return;
                        }
                        
                        // Validate audio type
                        if (!ALLOWED_AUDIO_TYPES.includes(blob.type)) {
                            const errorMsg = `Invalid audio format: ${blob.type}`;
                            console.error('[VoiceVisualizer]', errorMsg);
                            if (onRecordingErrorRef.current) {
                                onRecordingErrorRef.current(errorMsg);
                            }
                            return;
                        }
                        
                        // Use refs to get latest values (avoids stale closure bug)
                        const saveId = fieldNameRef.current || `recording_${Date.now()}`;
                        storageService.saveVoice(blob, saveId);
                        console.log("Voice recorded and saved:", saveId, `(${Math.round(blob.size / 1024)}KB)`);
                        // Notify parent component using ref
                        if (onRecordingCompleteRef.current) {
                            onRecordingCompleteRef.current(blob);
                        }
                    };
                    mediaRecorder.start();

                    // Canvas Animation Loop - Dark theme
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    const draw = () => {
                        if (!canvas || !ctx) return;
                        animationRef.current = requestAnimationFrame(draw);
                        
                        analyser.getByteTimeDomainData(dataArray);
                        
                        // Clear canvas with pure black background
                        ctx.fillStyle = '#0A0A0A';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Calculate progress line position
                        const progressX = (progressRef.current / 100) * canvas.width;
                        
                        // Draw progress background fill (orange tint for completed portion)
                        if (progressRef.current < 100) {
                            ctx.fillStyle = 'rgba(249, 115, 22, 0.15)'; // orange with low opacity
                            ctx.fillRect(0, 0, progressX, canvas.height);
                        } else {
                            // Full green tint when ready
                            ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'; // green with low opacity
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        
                        // Draw waveform with gradient based on progress
                        const sliceWidth = canvas.width / bufferLength;
                        
                        // First pass: draw the "completed" portion in orange/green
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
                        }
                        
                        ctx.strokeStyle = canStopRef.current ? '#22c55e' : '#F97316'; // green when ready, orange otherwise
                        ctx.stroke();
                        
                        // Second pass: draw the "remaining" portion in white with low opacity
                        ctx.beginPath();
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
                        
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // white with opacity for remaining
                        ctx.stroke();
                        
                        // Draw progress line marker (vertical line at progress point)
                        if (progressRef.current < 100) {
                            ctx.beginPath();
                            ctx.moveTo(progressX, 0);
                            ctx.lineTo(progressX, canvas.height);
                            ctx.strokeStyle = '#F97316'; // orange
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
            <div className="w-full bg-[#0A0A0A] border-2 border-white/20 relative overflow-hidden">
                <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <div className="w-2 h-2 bg-white/20" />
                    <div className="w-2 h-2 bg-white/20" />
                    <div className="w-2 h-2 bg-white/20" />
                </div>
                
                <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={200} 
                    className="w-full h-48"
                />
                
                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                        <div className={`w-3 h-3 animate-pulse ${canStop ? 'bg-green-500' : 'bg-[#F97316]'}`} />
                        <span className={`font-mono text-sm font-bold tracking-wider ${canStop ? 'text-green-500' : 'text-[#F97316]'}`}>
                            {canStop ? 'READY' : `${timeRemaining}s`}
                        </span>
                    </div>
                )}
            </div>
            
            <button 
                onClick={() => {
                    if (!isRecording) {
                        audioService.playDeepTone();
                    } else if (canStop) {
                        audioService.playMilestone();
                    }
                    onToggle();
                }}
                disabled={isRecording && !canStop}
                className={`group relative flex items-center justify-center w-24 h-24 border-2 transition-all duration-300 
                    ${isRecording 
                        ? canStop 
                            ? 'border-[#22c55e] bg-[#22c55e] text-black scale-110 cursor-pointer' 
                            : 'border-[#F97316] bg-transparent text-[#F97316] scale-105 cursor-not-allowed'
                        : 'border-white/30 text-white/70 hover:bg-[#F97316] hover:border-[#F97316] hover:text-black cursor-pointer'
                    }`}
            >
                {isRecording ? (
                    <Square fill="currentColor" size={32} />
                ) : (
                    <Mic size={36} strokeWidth={2} />
                )}
            </button>
            
            <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em] font-bold">
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
