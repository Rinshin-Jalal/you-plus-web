
import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { audioService } from '@/services/audio';
import { storageService } from '@/services/storage';

// Imports from extracted files
import { STEPS } from '@/data/onboardingSteps';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { CommentarySection } from '@/components/onboarding/ui/CommentarySection';
import { MegaInput } from '@/components/onboarding/ui/MegaInput';
import { BrutalChoice } from '@/components/onboarding/ui/BrutalChoice';
import { MinimalSlider } from '@/components/onboarding/ui/MinimalSlider';
import { Counter } from '@/components/onboarding/ui/Counter';
import { VoiceVisualizer } from '@/components/onboarding/ui/VoiceVisualizer';
import { CommitmentCard } from '@/components/onboarding/steps/CommitmentCard';

const MIN_VOICE_DURATION = 15; // 15 seconds minimum recording
const STEP_TRANSITION_DELAY = 800; // ms delay between steps

const FUN_FACTS = [
    "92% of people never achieve their New Year's resolutions...",
    "The average person quits a new habit after just 12 days...",
    "Your brain forms new neural pathways in just 21 days of consistency...",
    "People with accountability partners are 65% more likely to succeed...",
    "Writing down goals increases success rate by 42%...",
    "The best time to build habits is right after another habit...",
    "Your future self will thank you for starting today...",
    "Discipline weighs ounces, regret weighs tons...",
    "Small daily improvements lead to stunning results...",
    "You've already taken the hardest step - showing up..."
];

export default function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<any>(storageService.getData() || {});
  const [voiceState, setVoiceState] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Voice recording state
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) clearInterval(recordingInterval);
    };
  }, [recordingInterval]);

  const next = useCallback((val?: any) => {
    // Prevent rapid clicking
    if (isTransitioning) return;
    
    // Start transition
    setIsTransitioning(true);
    setIsVisible(false);

    // 1. Play Audio
    audioService.playBinauralBurst();

    // 2. Save Data
    const newData = val !== undefined ? { ...data, [step.id]: val } : data;
    if (val !== undefined) {
      setData(newData);
      storageService.saveData(newData);
    }

    // 3. Delayed transition to next step
    setTimeout(() => {
      if (stepIndex < STEPS.length - 1) {
        setStepIndex(prev => prev + 1);
      } else {
        onFinish();
        return;
      }
      
      // Re-show content after step change
      setTimeout(() => {
        setIsVisible(true);
        setIsTransitioning(false);
      }, 100);
    }, STEP_TRANSITION_DELAY);
  }, [isTransitioning, data, step.id, stepIndex, onFinish]);

  const handleVoiceToggle = () => {
    if (!voiceState) {
      // Start recording
      setVoiceState(true);
      setRecordingTime(0);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      
    } else {
      // Try to stop recording
      if (recordingTime < MIN_VOICE_DURATION) {
        // Don't allow stopping before minimum time
        return;
      }
      
      // Stop recording
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setVoiceState(false);
      setRecordingTime(0);
      next('voice_recorded');
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if can stop recording
  const canStopRecording = recordingTime >= MIN_VOICE_DURATION;

  return (
    <div className="fixed inset-0 bg-white text-black font-sans flex flex-col z-[100]">
      <GrainOverlay />

      {/* Header */}
      <div className="relative z-10 px-8 py-8 flex justify-between items-center bg-white/90 backdrop-blur-sm border-b border-black/5">
        <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                <span className="font-mono font-bold text-sm">{stepIndex + 1}</span>
            </div>
            <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
        </div>
        <button onClick={onFinish} className="text-xs font-mono font-bold text-black/30 hover:text-black uppercase tracking-widest transition-colors">
            Exit
        </button>
      </div>

      {/* Main Stage */}
      <div className={`relative z-10 flex-grow overflow-y-auto flex flex-col items-center px-6 max-w-5xl mx-auto w-full transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex-grow flex flex-col items-center justify-center w-full py-8">
        
        {step.type === 'commentary' && step.lines && (
            <CommentarySection 
                key={step.id} 
                lines={step.lines} 
                onNext={() => next()} 
            />
        )}

        {step.type === 'input' && (
            <div key={step.id} className="w-full flex flex-col items-center text-center">
                <h2 className="font-mono text-black text-2xl md:text-3xl leading-relaxed font-medium mb-12">
                    {step.label}
                </h2>
                <MegaInput 
                    placeholder={step.placeholder} 
                    value={data[step.id]}
                    onChange={(val: string) => setData({ ...data, [step.id]: val })}
                    onEnter={() => !isTransitioning && next(data[step.id])}
                />
                 <Button 
                    className="mt-16 w-full max-w-xs border-black" 
                    variant="primary"
                    onClick={() => next(data[step.id])}
                    disabled={isTransitioning}
                >
                    {isTransitioning ? 'Processing...' : 'Confirm'}
                </Button>
            </div>
        )}

        {step.type === 'choice' && step.choices && (
            <div key={step.id} className="w-full flex flex-col items-center text-center">
                 <h2 className="font-mono text-black text-2xl md:text-3xl leading-relaxed font-medium mb-12">{step.label}</h2>
                 <BrutalChoice options={step.choices} onSelect={next} disabled={isTransitioning} />
            </div>
        )}

        {step.type === 'slider' && (
             <div key={step.id} className="w-full flex flex-col items-center">
                <MinimalSlider 
                    min={step.min} max={step.max} 
                    value={data[step.id] || 5} 
                    onChange={(val: number) => setData({ ...data, [step.id]: val })}
                    label={step.label}
                />
                <Button 
                    className="mt-20 w-full max-w-xs border-black" 
                    variant="primary" 
                    onClick={() => next(data[step.id] || 5)}
                    disabled={isTransitioning}
                >
                    {isTransitioning ? 'Processing...' : 'Confirm'}
                </Button>
             </div>
        )}

        {step.type === 'stepper' && (
            <div key={step.id} className="flex flex-col items-center text-center gap-16">
                <h2 className="font-mono text-black text-2xl md:text-3xl leading-relaxed font-medium">{step.label}</h2>
                <Counter 
                    min={step.min} max={step.max}
                    value={data[step.id] || step.min}
                    onChange={(val: number) => setData({ ...data, [step.id]: val })}
                />
                <Button 
                    variant="primary" 
                    className="border-black w-40" 
                    onClick={() => next(data[step.id] || step.min)}
                    disabled={isTransitioning}
                >
                    {isTransitioning ? '...' : 'Next'}
                </Button>
            </div>
        )}

        {step.type === 'voice' && (
             <div key={step.id} className="text-center w-full flex flex-col items-center">
                 <h2 className="font-mono text-black text-2xl md:text-3xl leading-relaxed font-medium mb-4">{step.label}</h2>
                 <p className="font-mono text-black/40 text-base mb-12">{step.subtext}</p>
                 
                 <VoiceVisualizer 
                    isRecording={voiceState} 
                    onToggle={handleVoiceToggle}
                    recordingTime={recordingTime}
                    minDuration={MIN_VOICE_DURATION}
                    canStop={canStopRecording}
                    stepId={step.id}
                 />
             </div>
        )}

        {(step.type === 'date' || step.type === 'time') && (
            <div key={step.id} className="w-full flex flex-col items-center text-center">
                 <h2 className="font-mono text-black text-2xl md:text-3xl leading-relaxed font-medium mb-12">{step.label}</h2>
                 <input 
                    type={step.type} 
                    className="w-full max-w-lg bg-transparent border-b-4 border-black/5 py-8 text-4xl md:text-5xl font-mono font-medium text-black focus:outline-none focus:border-neon-teal tracking-tight text-center px-4"
                    onChange={(e) => setData({ ...data, [step.id]: e.target.value })}
                 />
                 <Button 
                    className="mt-16 w-full max-w-xs border-black" 
                    variant="primary" 
                    onClick={() => next(data[step.id] || 'skipped')}
                    disabled={isTransitioning}
                 >
                    {isTransitioning ? 'Processing...' : 'Set'}
                 </Button>
            </div>
        )}

        {step.type === 'card' && (
            <CommitmentCard 
                key={step.id}
                data={data}
                onAccept={() => next()}
            />
        )}

        {step.type === 'finalLoader' && (
            <FinalLoader onComplete={onFinish} />
        )}

        </div>
      </div>
    </div>
  );
}

// Final loader component with fun facts
function FinalLoader({ onComplete }: { onComplete: () => void }) {
    const [factIndex, setFactIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Rotate fun facts every 2 seconds
        const factInterval = setInterval(() => {
            setFactIndex(prev => (prev + 1) % FUN_FACTS.length);
        }, 2000);

        // Progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + 2;
            });
        }, 100);

        // Auto redirect after 5 seconds
        const redirectTimeout = setTimeout(() => {
            onComplete();
        }, 5000);

        return () => {
            clearInterval(factInterval);
            clearInterval(progressInterval);
            clearTimeout(redirectTimeout);
        };
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center gap-8 text-center max-w-md">
            <h2 className="font-mono text-black text-2xl md:text-3xl font-medium">
                Creating your future self...
            </h2>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-teal-500 transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            {/* Fun fact */}
            <p className="font-mono text-sm text-black/60 min-h-[3rem] transition-opacity duration-500">
                {FUN_FACTS[factIndex]}
            </p>
            
            {/* Loading dots */}
            <div className="flex gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );
}
