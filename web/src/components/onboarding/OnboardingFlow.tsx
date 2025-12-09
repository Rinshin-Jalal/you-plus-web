'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { audioService } from '@/services/audio';
import { storageService } from '@/services/storage';
import { SavingOverlay } from '@/components/ui/Loaders';

// Step data and types
import { OnboardingStep, getFieldName, getStepsBeforePillars, getStepsAfterPillars } from '@/data/onboardingSteps';

// UI Components
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { CommentarySection } from '@/components/onboarding/ui/CommentarySection';
import { MegaInput } from '@/components/onboarding/ui/MegaInput';
import { BrutalChoice } from '@/components/onboarding/ui/BrutalChoice';
import { MinimalSlider } from '@/components/onboarding/ui/MinimalSlider';
import { VoiceVisualizer } from '@/components/onboarding/ui/VoiceVisualizer';
import { OnboardingMascot, getExpressionForStep, getExpressionForContent } from '@/components/onboarding/ui/OnboardingMascot';

// Step Components
import { CommitmentCard } from '@/components/onboarding/steps/CommitmentCard';
import { PillarSelection } from '@/components/onboarding/steps/PillarSelection';
import { PillarPrimary } from '@/components/onboarding/steps/PillarPrimary';
import { PillarQuestions } from '@/components/onboarding/steps/PillarQuestions';
import { AuthStep } from '@/components/onboarding/steps/AuthStep';

const MIN_VOICE_DURATION = 15; // 15 seconds minimum recording
const STEP_TRANSITION_DELAY = 600; // ms delay between steps

// ============================================================================
// ONBOARDING FLOW COMPONENT
// ============================================================================

export default function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  // State - initialize with empty object to avoid SSR/client mismatch
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [inputError, setInputError] = useState<string | null>(null);
  const [showSavingOverlay, setShowSavingOverlay] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Pillar questions state
  const [inPillarQuestions, setInPillarQuestions] = useState(false);
  const [pillarQuestionsComplete, setPillarQuestionsComplete] = useState(false);
  
  // Voice recording state
  const [voiceState, setVoiceState] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);

  // Load data from storage after hydration
  useEffect(() => {
    const savedData = storageService.getData();
    if (savedData) {
      setData(savedData);
    }
    setIsHydrated(true);
  }, []);

  // Build the complete step list dynamically
  const allSteps = useMemo(() => {
    const beforePillars = getStepsBeforePillars();
    const afterPillars = getStepsAfterPillars();
    
    // The pillar_questions step is a placeholder - we handle it specially
    // It's inserted between beforePillars and afterPillars in the STEPS array
    return [...beforePillars, { id: 'pillar_questions', type: 'pillar_questions' as const }, ...afterPillars];
  }, []);

  // Get current step, accounting for pillar questions phase
  const currentStep = useMemo(() => {
    if (inPillarQuestions && !pillarQuestionsComplete) {
      return { id: 'pillar_questions', type: 'pillar_questions' as const } as OnboardingStep;
    }
    return allSteps[stepIndex];
  }, [stepIndex, allSteps, inPillarQuestions, pillarQuestionsComplete]);

  // Calculate progress - round to avoid hydration mismatch from floating-point precision
  const selectedPillars: string[] = Array.isArray(data.selected_pillars) ? data.selected_pillars : (Array.isArray(data[8]) ? data[8] : []);
  const pillarQuestionCount = selectedPillars.length * 3;
  const totalSteps = allSteps.length + pillarQuestionCount - 1; // -1 because pillar_questions placeholder is replaced
  
  const progress = useMemo(() => {
    if (inPillarQuestions) {
      // Find pillar_questions index
      const pillarQIdx = allSteps.findIndex(s => s.type === 'pillar_questions');
      // Estimate progress within pillar questions
      return Math.round(((pillarQIdx + 1) / totalSteps) * 100);
    }
    return Math.round(((stepIndex + 1) / totalSteps) * 100);
  }, [stepIndex, totalSteps, inPillarQuestions, allSteps]);

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) clearInterval(recordingInterval);
    };
  }, [recordingInterval]);

  // Save data whenever it changes
  useEffect(() => {
    storageService.saveData(data);
  }, [data]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const next = useCallback((val?: string | number | string[]) => {
    if (isTransitioning) return;
    
    setInputError(null);
    setIsTransitioning(true);
    setIsVisible(false);

    // Play audio feedback
    audioService.playBinauralBurst();

    // Save data if value provided
    if (val !== undefined && currentStep) {
      const fieldName = getFieldName(currentStep.id);
      const newData = { ...data, [fieldName]: val, [currentStep.id]: val };
      setData(newData);
    }

    // Delayed transition
    setTimeout(() => {
      // Check if we just completed pillar selection (step 8)
      if (currentStep?.type === 'pillar_selection') {
        // Move to pillar_primary step
        setStepIndex(prev => prev + 1);
      }
      // Check if we just completed pillar primary selection (step 9)
      else if (currentStep?.type === 'pillar_primary') {
        // Enter pillar questions phase
        setInPillarQuestions(true);
        setPillarQuestionsComplete(false);
      }
      // Check if pillar questions just completed
      else if (inPillarQuestions && pillarQuestionsComplete) {
        // Move past the pillar_questions placeholder
        const pillarQIdx = allSteps.findIndex(s => s.type === 'pillar_questions');
        setStepIndex(pillarQIdx + 1);
        setInPillarQuestions(false);
        setPillarQuestionsComplete(false);
      }
      // Normal step progression
      else if (stepIndex < allSteps.length - 1) {
        // Skip the pillar_questions placeholder if we're not in that phase
        const nextIdx = stepIndex + 1;
        if (allSteps[nextIdx]?.type === 'pillar_questions') {
          // This shouldn't happen normally, but just in case
          setStepIndex(nextIdx + 1);
        } else {
          setStepIndex(nextIdx);
        }
      } else {
        // Finished all steps
        setShowSavingOverlay(false);
        onFinish();
        return;
      }

      // Re-show content
      setTimeout(() => {
        setIsVisible(true);
        setIsTransitioning(false);
        setShowSavingOverlay(false);
      }, 100);
    }, STEP_TRANSITION_DELAY);
  }, [isTransitioning, data, currentStep, stepIndex, allSteps, inPillarQuestions, pillarQuestionsComplete, onFinish]);

  // ============================================================================
  // PILLAR HANDLERS
  // ============================================================================

  const handlePillarSelect = (pillars: string[]) => {
    setData((prev: Record<string, unknown>) => ({ ...prev, selected_pillars: pillars, 8: pillars }));
  };

  const handlePillarContinue = () => {
    next(Array.isArray(data.selected_pillars) ? data.selected_pillars : (Array.isArray(data[8]) ? data[8] : []));
  };

  const handlePrimaryPillarSelect = (pillarId: string) => {
    setData((prev: Record<string, unknown>) => ({ ...prev, primary_pillar: pillarId, 9: pillarId }));
    next(pillarId);
  };

  const handlePillarQuestionsUpdate = (newData: Record<string, unknown>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handlePillarQuestionsComplete = () => {
    setPillarQuestionsComplete(true);
    // Trigger next to move past pillar questions
    setTimeout(() => {
      setIsTransitioning(true);
      setIsVisible(false);
      
      setTimeout(() => {
        const pillarQIdx = allSteps.findIndex(s => s.type === 'pillar_questions');
        setStepIndex(pillarQIdx + 1);
        setInPillarQuestions(false);
        setPillarQuestionsComplete(false);
        
        setTimeout(() => {
          setIsVisible(true);
          setIsTransitioning(false);
        }, 100);
      }, STEP_TRANSITION_DELAY);
    }, 100);
  };

  // ============================================================================
  // VOICE RECORDING
  // ============================================================================

  const handleVoiceToggle = () => {
    if (!voiceState) {
      // Start recording
      setVoiceState(true);
      setRecordingTime(0);
      
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } else {
      // Try to stop recording
      if (recordingTime < MIN_VOICE_DURATION) {
        return; // Don't allow stopping before minimum time
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

  const canStopRecording = recordingTime >= MIN_VOICE_DURATION;

  // ============================================================================
  // MASCOT EXPRESSION
  // ============================================================================
  
  const mascotExpression = useMemo(() => {
    if (!currentStep) return 'neutral';
    
    // Check for content-specific expressions first (heavy/emotional steps)
    const contentExpression = getExpressionForContent(currentStep.id);
    if (contentExpression) return contentExpression;
    
    // Otherwise get expression based on step type
    return getExpressionForStep(currentStep.type, voiceState);
  }, [currentStep, voiceState]);

  // ============================================================================
  // DYNAMIC COMMENTARY
  // ============================================================================

  const getCommentaryLines = (step: OnboardingStep): string[] => {
    // If step has dynamic lines function, use it
    if (step.dynamicLines) {
      return step.dynamicLines(data as Record<string, string | number | string[]>);
    }
    // Otherwise use static lines
    return step.lines || [];
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!currentStep) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-white font-mono">Loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] text-[#FAFAFA] font-sans flex flex-col z-[100]">
      {showSavingOverlay && <SavingOverlay message="Saving..." />}
      <GrainOverlay />

      {/* Header */}
      <div className="relative z-10 px-6 md:px-8 py-4 md:py-6 flex justify-between items-center bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mascot in header - reactive to current step */}
          <OnboardingMascot 
            expression={mascotExpression}
            size="sm"
            speaking={currentStep?.type === 'commentary'}
            animate={true}
          />
          <div className="h-1 md:h-1.5 w-20 md:w-28 bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-[#F97316] transition-all duration-500 ease-out" 
              style={{ width: isHydrated ? `${Math.min(progress, 100)}%` : '0%' }} 
            />
          </div>
          <span className="font-mono text-xs text-white/40" suppressHydrationWarning>
            {inPillarQuestions ? 'Pillars' : `${stepIndex + 1}/${allSteps.length}`}
          </span>
        </div>
      </div>

      {/* Main Stage */}
      <div className={`relative z-10 flex-grow overflow-y-auto flex flex-col items-center px-4 md:px-6 max-w-5xl mx-auto w-full transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex-grow flex flex-col items-center justify-center w-full py-6 md:py-8">
          
          {/* COMMENTARY */}
          {currentStep.type === 'commentary' && (
            <CommentarySection 
              key={currentStep.id} 
              lines={getCommentaryLines(currentStep)} 
              onNext={() => next()}
              showMascot={false}
            />
          )}

          {/* INPUT */}
          {currentStep.type === 'input' && (
            <div key={currentStep.id} className="w-full flex flex-col items-center text-center">
              <h2 className="font-mono text-[#FAFAFA] text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium mb-8 md:mb-12 px-4">
                {currentStep.label}
              </h2>
              <MegaInput 
                placeholder={currentStep.placeholder} 
                value={(data[currentStep.id] as string) || ''}
                onChange={(val: string) => setData({ ...data, [currentStep.id]: val })}
                onEnter={() => !isTransitioning && data[currentStep.id] && next(data[currentStep.id] as string)}
              />
              {inputError && <p className="mt-4 text-sm text-[#F97316]">{inputError}</p>}
              <Button 
                className="mt-12 md:mt-16 w-full max-w-xs" 
                variant="accent"
                onClick={() => next(data[currentStep.id] as string)}
                disabled={isTransitioning || !data[currentStep.id]}
              >
                {isTransitioning ? 'Processing...' : 'Continue'}
              </Button>
            </div>
          )}

          {/* CHOICE */}
          {currentStep.type === 'choice' && currentStep.choices && (
            <div key={currentStep.id} className="w-full flex flex-col items-center text-center">
              <h2 className="font-mono text-[#FAFAFA] text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium mb-8 md:mb-12 px-4">
                {currentStep.label}
              </h2>
              <BrutalChoice 
                options={currentStep.choices} 
                onSelect={(val) => next(val)} 
                disabled={isTransitioning} 
              />
            </div>
          )}

          {/* SLIDER */}
          {currentStep.type === 'slider' && (
            <div key={currentStep.id} className="w-full flex flex-col items-center">
              <MinimalSlider 
                min={currentStep.min || 1} 
                max={currentStep.max || 10} 
                value={(data[currentStep.id] as number) ?? Math.floor(((currentStep.min || 1) + (currentStep.max || 10)) / 2)} 
                onChange={(val: number) => setData({ ...data, [currentStep.id]: val })}
                label={currentStep.label}
              />
              <Button 
                className="mt-16 md:mt-20 w-full max-w-xs" 
                variant="accent" 
                onClick={() => next((data[currentStep.id] as number) ?? Math.floor(((currentStep.min || 1) + (currentStep.max || 10)) / 2))}
                disabled={isTransitioning}
              >
                {isTransitioning ? 'Processing...' : 'Continue'}
              </Button>
            </div>
          )}

          {/* VOICE */}
          {currentStep.type === 'voice' && (
            <div key={currentStep.id} className="text-center w-full flex flex-col items-center">
              <h2 className="font-mono text-[#FAFAFA] text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium mb-4 px-4">
                {currentStep.label}
              </h2>
              <p className="font-mono text-white/40 text-sm md:text-base mb-8 md:mb-12 px-4">
                {currentStep.subtext}
              </p>
              <VoiceVisualizer 
                isRecording={voiceState} 
                onToggle={handleVoiceToggle}
                recordingTime={recordingTime}
                minDuration={MIN_VOICE_DURATION}
                canStop={canStopRecording}
                fieldName={getFieldName(currentStep.id)}
              />
            </div>
          )}

          {/* TIME */}
          {currentStep.type === 'time' && (
            <div key={currentStep.id} className="w-full flex flex-col items-center text-center">
              <h2 className="font-mono text-[#FAFAFA] text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium mb-8 md:mb-12 px-4">
                {currentStep.label}
              </h2>
              <input 
                type="time" 
                value={(data[currentStep.id] as string) || '21:00'}
                className="w-full max-w-xs bg-transparent border-b-4 border-white/10 py-6 md:py-8 text-3xl md:text-4xl lg:text-5xl font-mono font-medium text-[#FAFAFA] focus:outline-none focus:border-[#F97316] tracking-tight text-center"
                onChange={(e) => setData({ ...data, [currentStep.id]: e.target.value })}
              />
              <Button 
                className="mt-12 md:mt-16 w-full max-w-xs" 
                variant="accent" 
                onClick={() => next((data[currentStep.id] as string) || '21:00')}
                disabled={isTransitioning}
              >
                {isTransitioning ? 'Processing...' : 'Set Time'}
              </Button>
            </div>
          )}

          {/* PILLAR SELECTION */}
          {currentStep.type === 'pillar_selection' && (
            <PillarSelection
              key={currentStep.id}
              selected={Array.isArray(data.selected_pillars) ? data.selected_pillars : (Array.isArray(data[8]) ? data[8] : [])}
              onSelect={handlePillarSelect}
              onContinue={handlePillarContinue}
            />
          )}

          {/* PILLAR PRIMARY */}
          {currentStep.type === 'pillar_primary' && (
            <PillarPrimary
              key={currentStep.id}
              selectedPillars={Array.isArray(data.selected_pillars) ? data.selected_pillars : (Array.isArray(data[8]) ? data[8] : [])}
              onSelect={handlePrimaryPillarSelect}
            />
          )}

          {/* PILLAR QUESTIONS */}
          {currentStep.type === 'pillar_questions' && inPillarQuestions && (
            <PillarQuestions
              key="pillar_questions"
              selectedPillars={Array.isArray(data.selected_pillars) ? data.selected_pillars : (Array.isArray(data[8]) ? data[8] : [])}
              data={data}
              onUpdate={handlePillarQuestionsUpdate}
              onComplete={handlePillarQuestionsComplete}
            />
          )}

          {/* COMMITMENT CARD */}
          {currentStep.type === 'card' && (
            <CommitmentCard 
              key={currentStep.id}
              data={data}
              onAccept={() => next()}
            />
          )}

          {/* AUTH */}
          {currentStep.type === 'auth' && (
            <AuthStep
              key={currentStep.id}
              data={data}
              onComplete={() => {
                // After auth, redirect to checkout
                if (typeof window !== 'undefined') {
                  window.location.href = '/checkout';
                }
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}
