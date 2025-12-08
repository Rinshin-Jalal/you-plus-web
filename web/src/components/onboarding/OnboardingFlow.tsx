
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { audioService } from '@/services/audio';
import { storageService } from '@/services/storage';

// Imports from extracted files
import { STEPS, ACTS, Step } from '@/data/onboardingSteps';
import { PILLAR_PRESETS, getPillarById } from '@/data/pillarPresets';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { CommentarySection } from '@/components/onboarding/ui/CommentarySection';
import { MegaInput } from '@/components/onboarding/ui/MegaInput';
import { BrutalChoice } from '@/components/onboarding/ui/BrutalChoice';
import { MinimalSlider } from '@/components/onboarding/ui/MinimalSlider';
import { Counter } from '@/components/onboarding/ui/Counter';
import { VoiceVisualizer } from '@/components/onboarding/ui/VoiceVisualizer';
import { ActHeader } from '@/components/onboarding/ui/ActHeader';
import { CommitmentCard } from '@/components/onboarding/steps/CommitmentCard';
import { PillarSelection } from '@/components/onboarding/steps/PillarSelection';
import { PillarQuestions } from '@/components/onboarding/steps/PillarQuestions';
import { getPersonalizedLines, getPersonalizedLabel, getPersonalizedSubtext } from '@/utils/onboardingPersonalization';
import { Button } from '@/components/ui/Button';

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

  // Get personalized content based on user's previous answers
  const personalizedLines = useMemo(() => {
    if (step.type === 'commentary' && step.lines) {
      return getPersonalizedLines(step.id, data) || step.lines;
    }
    return step.lines || [];
  }, [step.id, step.type, step.lines, data]);

  const personalizedLabel = useMemo(() => {
    return getPersonalizedLabel(step.id, step.label || '', data);
  }, [step.id, step.label, data]);

  const personalizedSubtext = useMemo(() => {
    return getPersonalizedSubtext(step.id, step.subtext || '', data);
  }, [step.id, step.subtext, data]);

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

    // 2. Save Data - only save if step has a field and value is provided
    const shouldSave = val !== undefined && step.field;
    const newData = shouldSave ? { ...data, [step.field!]: val } : data;
    if (shouldSave) {
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
  }, [isTransitioning, data, step.field, stepIndex, onFinish]);

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
    <div className="fixed inset-0 bg-[#0D0D0D] font-sans flex flex-col z-[100]">
      <GrainOverlay />

      {/* Header */}
      <div className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
            {/* Progress bar */}
            <div className="w-32 h-1 bg-white/10 rounded overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out rounded"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            {/* Step counter */}
            <span className="font-mono text-xs text-white/40">
                {stepIndex + 1}/{STEPS.length}
            </span>
            
            {/* Act indicator */}
            {step.act && (
                <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-white/40">
                    Act {step.act}/7
                </span>
            )}
        </div>
        
        <button onClick={onFinish} className="text-xs font-mono font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
            Exit
        </button>
      </div>

      {/* Main Stage */}
      <div className={`relative z-10 flex-grow overflow-y-auto flex flex-col items-center px-6 max-w-5xl mx-auto w-full transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex-grow flex flex-col items-center justify-center w-full py-8">
        
        {step.type === 'commentary' && step.lines && (
            <CommentarySection 
                key={step.id} 
                lines={personalizedLines} 
                onNext={() => next()}
            />
        )}

        {step.type === 'act_header' && step.actTitle && (
            <ActHeader
                key={step.id}
                act={step.act || 1}
                title={step.actTitle}
                subtitle={step.actSubtitle}
                onNext={() => next()}
            />
        )}

        {step.type === 'input' && step.field && (
            <div key={step.id} className="w-full flex flex-col items-center text-center">
                <h2 className="font-mono text-2xl md:text-3xl leading-relaxed font-medium mb-12 text-white">
                    {personalizedLabel}
                </h2>
                <MegaInput 
                    placeholder={step.placeholder} 
                    value={data[step.field]}
                    onChange={(val: string) => setData({ ...data, [step.field!]: val })}
                    onEnter={() => !isTransitioning && next(data[step.field!])}
                />
                 <Button 
                    className="mt-16 w-full max-w-xs" 
                    variant="primary"
                    onClick={() => next(data[step.field!])}
                    disabled={isTransitioning}
                >
                    {isTransitioning ? 'Processing...' : 'Confirm'}
                </Button>
            </div>
        )}

        {step.type === 'choice' && step.field && (
            <div key={step.id} className="w-full flex flex-col items-center text-center">
                 <h2 className="font-mono text-2xl md:text-3xl leading-relaxed font-medium mb-12 text-white">{personalizedLabel}</h2>
                 <BrutalChoice 
                    options={
                        // For primary_pillar, dynamically generate choices from selected pillars
                        step.field === 'primary_pillar' && data.selected_pillars?.length > 0
                            ? data.selected_pillars.map((pillarId: string) => {
                                const preset = getPillarById(pillarId);
                                if (preset) return `${preset.icon} ${preset.label}`;
                                // Handle custom pillars
                                if (pillarId.startsWith('custom_')) {
                                    const label = pillarId.replace('custom_', '').replace(/_/g, ' ');
                                    return `✨ ${label.charAt(0).toUpperCase() + label.slice(1)}`;
                                }
                                return pillarId;
                            })
                            : (step.choices || [])
                    } 
                    onSelect={next} 
                    disabled={isTransitioning}
                 />
            </div>
        )}

        {step.type === 'multiselect' && step.choices && step.field && (
            <div key={step.id} className="w-full flex flex-col items-center text-center">
                 <h2 className="font-mono text-2xl md:text-3xl leading-relaxed font-medium mb-12 text-white">{personalizedLabel}</h2>
                 <div className="flex flex-col gap-3 w-full max-w-lg">
                    {step.choices.map((option: string) => {
                        const selected = (data[step.field!] || []).includes(option);
                        return (
                            <button
                                key={option}
                                onClick={() => {
                                    const current = data[step.field!] || [];
                                    const updated = selected 
                                        ? current.filter((o: string) => o !== option)
                                        : [...current, option];
                                    setData({ ...data, [step.field!]: updated });
                                }}
                                disabled={isTransitioning}
                                className={`w-full p-4 border-2 font-mono text-left transition-all rounded-md ${
                                    selected 
                                        ? 'border-orange-500 bg-orange-500/20 text-white' 
                                        : 'border-white/10 bg-white/5 text-white hover:border-orange-500/50'
                                }`}
                            >
                                {option}
                            </button>
                        );
                    })}
                 </div>
                 <Button 
                    className="mt-12 w-full max-w-xs" 
                    variant="primary"
                    onClick={() => next(data[step.field!] || [])}
                    disabled={isTransitioning || !(data[step.field!]?.length > 0)}
                 >
                    {isTransitioning ? 'Processing...' : 'Continue'}
                 </Button>
            </div>
        )}

        {step.type === 'slider' && step.field && (
             <div key={step.id} className="w-full flex flex-col items-center">
                <MinimalSlider 
                    min={step.min} max={step.max} 
                    value={data[step.field] || 5} 
                    onChange={(val: number) => setData({ ...data, [step.field!]: val })}
                    label={personalizedLabel}
                />
                <Button 
                    className="mt-20 w-full max-w-xs" 
                    variant="primary" 
                    onClick={() => next(data[step.field!] || 5)}
                    disabled={isTransitioning}
                >
                    {isTransitioning ? 'Processing...' : 'Confirm'}
                </Button>
             </div>
        )}

        {step.type === 'stepper' && step.field && (
            <div key={step.id} className="flex flex-col items-center text-center gap-16">
                <h2 className="font-mono text-2xl md:text-3xl leading-relaxed font-medium text-white">{personalizedLabel}</h2>
                <Counter 
                    min={step.min} max={step.max}
                    value={data[step.field] || step.min}
                    onChange={(val: number) => setData({ ...data, [step.field!]: val })}
                />
                <Button 
                    variant="primary" 
                    className="w-40" 
                    onClick={() => next(data[step.field!] || step.min)}
                    disabled={isTransitioning}
                >
                    {isTransitioning ? '...' : 'Next'}
                </Button>
            </div>
        )}

        {step.type === 'voice' && step.field && (
             <div key={step.id} className="text-center w-full flex flex-col items-center">
                 <h2 className="font-mono text-2xl md:text-3xl leading-relaxed font-medium mb-4 text-white">{personalizedLabel}</h2>
                 <p className="font-mono text-base mb-12 text-white/40">{personalizedSubtext}</p>
                 
                 <VoiceVisualizer 
                    isRecording={voiceState} 
                    onToggle={handleVoiceToggle}
                    recordingTime={recordingTime}
                    minDuration={MIN_VOICE_DURATION}
                    canStop={canStopRecording}
                    stepId={step.field}
                 />
             </div>
        )}

        {(step.type === 'date' || step.type === 'time') && step.field && (
            <div key={step.id} className="w-full flex flex-col items-center text-center">
                 <h2 className="font-mono text-2xl md:text-3xl leading-relaxed font-medium mb-12 text-white">{personalizedLabel}</h2>
                 <input 
                    type={step.type}
                    defaultValue={step.type === 'time' ? '21:00' : undefined}
                    className="w-full max-w-lg bg-transparent border-b-4 border-orange-500/30 py-8 text-4xl md:text-5xl font-mono font-medium focus:outline-none focus:border-orange-500 tracking-tight text-center px-4 text-white transition-colors"
                    onChange={(e) => setData({ ...data, [step.field!]: e.target.value })}
                 />
                 <Button 
                    className="mt-16 w-full max-w-xs" 
                    variant="primary" 
                    onClick={() => next(data[step.field!] || (step.type === 'time' ? '21:00' : undefined))}
                    disabled={isTransitioning}
                 >
                    {isTransitioning ? 'Processing...' : 'Set'}
                 </Button>
            </div>
        )}

        {step.type === 'pillar_selection' && (
            <PillarSelection
                key={step.id}
                selected={data.selected_pillars || []}
                onSelect={(pillars) => setData({ ...data, selected_pillars: pillars })}
                onContinue={() => next(data.selected_pillars)}
            />
        )}

        {step.type === 'pillar_questions' && data.selected_pillars?.length > 0 && (
            <PillarQuestions
                key={step.id}
                selectedPillars={data.selected_pillars}
                data={data}
                onUpdate={(newData) => {
                    setData(newData);
                    storageService.saveData(newData);
                }}
                onComplete={() => next()}
            />
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
            <h2 className="font-mono text-2xl md:text-3xl font-medium text-white">
                Creating your future self...
            </h2>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-white/10 rounded overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-100 ease-out rounded"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            {/* Fun fact */}
            <p className="font-mono text-sm min-h-[3rem] transition-opacity duration-500 text-white/40">
                {FUN_FACTS[factIndex]}
            </p>
            
            {/* Loading dots */}
            <div className="flex gap-2">
                <div className="w-3 h-3 rounded-sm bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 rounded-sm bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 rounded-sm bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );
}
