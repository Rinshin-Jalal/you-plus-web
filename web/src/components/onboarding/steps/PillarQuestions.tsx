'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getPillarById, createCustomPillar, PillarPreset, GENERIC_CURRENT_STATE_OPTIONS } from '@/data/pillarPresets';
import { Button } from '@/components/ui/Button';
import { MegaInput } from '@/components/onboarding/ui/MegaInput';
import { OnboardingMascot } from '@/components/onboarding/ui/OnboardingMascot';
import { audioService } from '@/services/audio';

interface PillarQuestionsProps {
  selectedPillars: string[];
  data: Record<string, unknown>;
  onUpdate: (data: Record<string, unknown>) => void;
  onComplete: () => void;
}

type QuestionType = 'current_state' | 'future_state' | 'identity_statement';

// Punchy transition lines between pillars (indexed by pillar number completed)
const PILLAR_TRANSITION_LINES: Record<number, string[]> = {
  1: ["First one down. You're just getting started.", "Good. One pillar locked.", "That's one. Keep moving."],
  2: ["Two pillars deep. Finding your rhythm.", "Momentum building.", "Halfway there. Don't slow down."],
  3: ["Three locked in. You're on fire.", "The vision's getting clearer.", "This is where most people quit. Not you."],
  4: ["Four pillars. You're built different.", "Almost there. One more.", "Final stretch incoming."],
  5: ["All five. Legendary.", "Complete domination.", "You just defined your entire future."],
};

// Milestone celebrations - special moments to break monotony
const MILESTONE_CELEBRATIONS: Record<number, { title: string; subtitle: string; duration: number }> = {
  2: { 
    title: "🔥 MOMENTUM", 
    subtitle: "You're not like the others who quit after one.",
    duration: 2000 
  },
  3: { 
    title: "⚡ HALFWAY", 
    subtitle: "Most people never get this clear on what they want.",
    duration: 2200 
  },
  5: { 
    title: "🏆 LOCKED IN", 
    subtitle: "Your future self just became real.",
    duration: 2500 
  },
};

// Breather insights - quick thought-provoking moments
const BREATHER_INSIGHTS = [
  { text: "The gap between who you are and who you want to be is closed by what you do daily.", duration: 3000 },
  { text: "You're not just answering questions. You're programming your subconscious.", duration: 3000 },
  { text: "Most people spend more time planning vacations than planning their lives. Not you.", duration: 3000 },
  { text: "Clarity is power. You're getting clearer with every answer.", duration: 2500 },
];

// Speed encouragement based on how fast they're moving
const SPEED_LINES = [
  "You're moving fast. Good.",
  "No hesitation. I like it.",
  "Quick decisions. Strong mind.",
];

// Varied question headers to break monotony
const CURRENT_STATE_HEADERS = [
  { title: "Real talk - where you at?", subtitle: "No judgment. Just facts." },
  { title: "Be honest with yourself.", subtitle: "The truth is the only way forward." },
  { title: "Let's see where you're starting.", subtitle: "Every journey has a beginning." },
  { title: "Time for some truth.", subtitle: "You can't fix what you don't acknowledge." },
];

const FUTURE_STATE_HEADERS = [
  { title: "Close your eyes. See it.", subtitle: "What does winning look like?" },
  { title: "Picture your best self.", subtitle: "Be specific. Make it real." },
  { title: "Fast forward 1 year.", subtitle: "What do you see?" },
  { title: "Visualize the transformation.", subtitle: "Details matter." },
];

const IDENTITY_HEADERS = [
  { title: "Say it like you mean it:", subtitle: "\"I am...\"" },
  { title: "Claim your new identity:", subtitle: "\"I am...\"" },
  { title: "Speak it into existence:", subtitle: "\"I am...\"" },
  { title: "Who are you becoming?", subtitle: "\"I am...\"" },
];

// Reaction lines based on current_state answers
const REACTION_LINES: Record<number, string[]> = {
  0: ["Brutal honesty. Respect.", "Rock bottom is a foundation.", "At least you're not lying to yourself."],
  1: ["Been there.", "The cycle ends now.", "Awareness is step one."],
  2: ["Not bad. But not where you want to be.", "Room to grow.", "Let's fix that."],
  3: ["Solid foundation.", "Time to go from good to great.", "Let's optimize."],
};

// Create a fallback pillar for unknown IDs
function getOrCreatePillar(pillarId: string): PillarPreset {
  const preset = getPillarById(pillarId);
  if (preset) return preset;
  
  if (pillarId.startsWith('custom_')) {
    return createCustomPillar(pillarId);
  }
  
  const label = pillarId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    id: pillarId,
    label: label,
    icon: '🎯',
    description: 'Your focus area',
    category: 'lifestyle',
    currentStateOptions: GENERIC_CURRENT_STATE_OPTIONS,
    goalPrompt: `Where do you want to be with ${label.toLowerCase()}?`,
    futurePrompt: `When you've mastered ${label.toLowerCase()}, what does it look like?`,
  };
}

export const PillarQuestions = ({ 
  selectedPillars, 
  data, 
  onUpdate, 
  onComplete
}: PillarQuestionsProps) => {
  const [pillarIndex, setPillarIndex] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('current_state');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionLine, setTransitionLine] = useState('');
  const [reactionLine, setReactionLine] = useState('');
  const [showReaction, setShowReaction] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<{ title: string; subtitle: string } | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [startTime] = useState(Date.now());
  const [showSpeedBonus, setShowSpeedBonus] = useState(false);
  const [speedLine, setSpeedLine] = useState('');
  const [showBreather, setShowBreather] = useState(false);
  const [breatherText, setBreatherText] = useState('');

  const currentPillarId = selectedPillars[pillarIndex];
  
  const currentPillar = useMemo((): PillarPreset | null => {
    if (!currentPillarId) return null;
    return getOrCreatePillar(currentPillarId);
  }, [currentPillarId]);

  const questionOrder: QuestionType[] = ['current_state', 'future_state', 'identity_statement'];
  const totalPillars = selectedPillars.length;

  const getFieldName = (pillarId: string, type: QuestionType): string => {
    return `${pillarId}_${type}`;
  };

  const currentFieldName = currentPillar ? getFieldName(currentPillar.id, questionType) : '';
  const currentValue = (data[currentFieldName] as string) || '';

  // Show pillar intro on first question of each pillar
  const [showPillarIntro, setShowPillarIntro] = useState(true);

  useEffect(() => {
    if (questionType === 'current_state') {
      setShowPillarIntro(true);
      audioService.playWhoosh(); // Sound for pillar intro
      const timer = setTimeout(() => setShowPillarIntro(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [pillarIndex, questionType]);

  const handleCurrentStateSelect = (value: string, optionIndex: number) => {
    if (isTransitioning) return;
    
    setSelectedOptionIndex(optionIndex);
    audioService.playBinauralBurst();
    
    // Show reaction
    const reactions = REACTION_LINES[optionIndex] || REACTION_LINES[1];
    setReactionLine(reactions[Math.floor(Math.random() * reactions.length)]);
    setShowReaction(true);
    
    setTimeout(() => {
      setShowReaction(false);
      setSelectedOptionIndex(null);
      handleNext(value);
    }, 1200);
  };

  const handleNext = (value: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setQuestionsAnswered(prev => prev + 1);

    const newData = { ...data, [currentFieldName]: value };
    onUpdate(newData);

    // Check for speed bonus (if answering quickly)
    const avgTimePerQuestion = (Date.now() - startTime) / (questionsAnswered + 1);
    const isMovingFast = avgTimePerQuestion < 8000 && questionsAnswered > 2;

    setTimeout(() => {
      const currentQIndex = questionOrder.indexOf(questionType);

      if (currentQIndex < questionOrder.length - 1) {
        setQuestionType(questionOrder[currentQIndex + 1]);
        setIsTransitioning(false);
      } else if (pillarIndex < selectedPillars.length - 1) {
        const pillarsCompleted = pillarIndex + 1;
        
        // Check for milestone celebration
        const milestone = MILESTONE_CELEBRATIONS[pillarsCompleted];
        if (milestone) {
          setCurrentMilestone(milestone);
          setShowMilestone(true);
          audioService.playMilestone(); // Celebration sound!
          
          setTimeout(() => {
            setShowMilestone(false);
            // Then show speed bonus if applicable
            if (isMovingFast && pillarsCompleted === 2) {
              setSpeedLine(SPEED_LINES[Math.floor(Math.random() * SPEED_LINES.length)]);
              setShowSpeedBonus(true);
              audioService.playPowerUp(); // Speed bonus sound!
              setTimeout(() => {
                setShowSpeedBonus(false);
                showPillarTransition(pillarsCompleted);
              }, 1500);
            } else {
              showPillarTransition(pillarsCompleted);
            }
          }, milestone.duration);
        } else {
          showPillarTransition(pillarsCompleted);
        }
      } else {
        // Final pillar complete - check for final milestone
        const finalMilestone = MILESTONE_CELEBRATIONS[selectedPillars.length];
        if (finalMilestone) {
          setCurrentMilestone(finalMilestone);
          setShowMilestone(true);
          audioService.playMilestone(); // Final celebration!
          setTimeout(() => {
            setShowMilestone(false);
            onComplete();
          }, finalMilestone.duration);
        } else {
          onComplete();
        }
      }
    }, 300);
  };

  const showPillarTransition = (pillarsCompleted: number) => {
    // Show breather insight occasionally (after pillar 1 and 4)
    const shouldShowBreather = (pillarsCompleted === 1 || pillarsCompleted === 4) && selectedPillars.length > 2;
    
    if (shouldShowBreather) {
      const insight = BREATHER_INSIGHTS[pillarsCompleted === 1 ? 0 : Math.floor(Math.random() * BREATHER_INSIGHTS.length)];
      setBreatherText(insight.text);
      setShowBreather(true);
      audioService.playDeepTone(); // Reflective moment sound
      
      setTimeout(() => {
        setShowBreather(false);
        proceedToTransition(pillarsCompleted);
      }, insight.duration);
    } else {
      proceedToTransition(pillarsCompleted);
    }
  };

  const proceedToTransition = (pillarsCompleted: number) => {
    const lines = PILLAR_TRANSITION_LINES[pillarsCompleted] || PILLAR_TRANSITION_LINES[1];
    setTransitionLine(lines[Math.floor(Math.random() * lines.length)]);
    setShowTransition(true);
    audioService.playPillarComplete(); // Pillar complete chime
    
    setTimeout(() => {
      setShowTransition(false);
      setPillarIndex(pillarIndex + 1);
      setQuestionType('current_state');
      setIsTransitioning(false);
    }, 1500);
  };

  if (!currentPillar || !currentPillarId) {
    return (
      <div className="text-center">
        <p className="font-mono text-white/50">No pillars selected.</p>
      </div>
    );
  }

  // Pillar intro splash
  if (showPillarIntro && questionType === 'current_state') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in-95 duration-500">
        <div className="text-6xl mb-4 animate-bounce">{currentPillar.icon}</div>
        <h2 className="font-mono text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
          {currentPillar.label}
        </h2>
        <p className="font-mono text-white/40 mt-2">
          {pillarIndex + 1} of {totalPillars}
        </p>
      </div>
    );
  }

  // Milestone celebration screen
  if (showMilestone && currentMilestone) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-in zoom-in-50 duration-700">
          <h2 className="font-mono text-4xl md:text-6xl font-black text-[#F97316] text-center mb-4 animate-pulse">
            {currentMilestone.title}
          </h2>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <p className="font-mono text-lg md:text-xl text-white/80 text-center max-w-md">
            {currentMilestone.subtitle}
          </p>
        </div>
        <div className="mt-8 flex gap-2 animate-in fade-in duration-500 delay-500">
          {selectedPillars.map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 transition-all duration-500 ${
                i <= pillarIndex ? 'bg-[#F97316] scale-110' : 'bg-white/20'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Speed bonus screen
  if (showSpeedBonus) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in-95 duration-300">
        <div className="text-5xl mb-4">⚡</div>
        <p className="font-mono text-xl text-[#F97316] font-bold text-center">
          {speedLine}
        </p>
      </div>
    );
  }

  // Breather insight screen
  if (showBreather) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="animate-in fade-in duration-700">
          <OnboardingMascot expression="serious" size="md" animate={false} />
        </div>
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <p className="font-mono text-lg md:text-xl text-white/80 text-center leading-relaxed max-w-lg">
            {breatherText}
          </p>
        </div>
        <div className="mt-8 animate-in fade-in duration-500 delay-700">
          <div className="w-16 h-0.5 bg-white/20">
            <div className="h-full bg-[#F97316] animate-[grow_3s_ease-in-out]" style={{ animation: 'grow 3s ease-in-out forwards' }} />
          </div>
        </div>
      </div>
    );
  }

  // Transition between pillars - enhanced with stats
  if (showTransition) {
    const completedPillars = selectedPillars.slice(0, pillarIndex + 1);
    const nextPillar = selectedPillars[pillarIndex + 1];
    const nextPillarData = nextPillar ? getOrCreatePillar(nextPillar) : null;
    
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-in fade-in duration-300">
          <OnboardingMascot expression="proud" size="lg" animate={true} />
        </div>
        
        <p className="font-mono text-xl text-[#F97316] mt-6 font-bold animate-in fade-in slide-in-from-bottom-2 duration-500">
          {transitionLine}
        </p>
        
        {/* Completed pillars recap */}
        <div className="flex gap-3 mt-6 animate-in fade-in duration-500 delay-200">
          {completedPillars.map((id) => {
            const p = getOrCreatePillar(id);
            return (
              <div key={id} className="flex flex-col items-center">
                <div className="w-10 h-10 bg-[#F97316] flex items-center justify-center text-xl">
                  {p.icon}
                </div>
                <span className="font-mono text-[10px] text-white/40 mt-1 uppercase">✓</span>
              </div>
            );
          })}
        </div>
        
        {/* Next pillar preview */}
        {nextPillarData && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2">Next up</p>
            <div className="flex items-center gap-3 px-4 py-2 border border-white/20">
              <span className="text-2xl">{nextPillarData.icon}</span>
              <span className="font-mono text-white font-bold">{nextPillarData.label}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Reaction after current_state selection
  if (showReaction) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-200">
        <OnboardingMascot 
          expression={selectedOptionIndex === 0 ? 'serious' : selectedOptionIndex === 3 ? 'proud' : 'listening'} 
          size="lg" 
          animate={true} 
        />
        <p className="font-mono text-xl text-white mt-6 text-center">
          {reactionLine}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      
      {/* Momentum indicator */}
      {questionsAnswered >= 3 && (
        <div className="flex items-center justify-center gap-2 mb-4 animate-in fade-in duration-500">
          <div className="flex gap-0.5">
            {[...Array(Math.min(questionsAnswered, 9))].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 h-3 bg-[#F97316] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
          <span className="font-mono text-xs text-[#F97316] uppercase tracking-widest">
            {questionsAnswered >= 9 ? 'On Fire' : questionsAnswered >= 6 ? 'Locked In' : 'Building Momentum'}
          </span>
        </div>
      )}
      
      {/* Compact header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentPillar.icon}</span>
          <span className="font-mono text-sm font-bold text-white/60 uppercase">
            {currentPillar.label}
          </span>
        </div>
        <div className="flex gap-1">
          {questionOrder.map((q, i) => (
            <div
              key={q}
              className={`w-8 h-1 transition-all ${
                questionOrder.indexOf(questionType) >= i ? 'bg-[#F97316]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* QUESTION 1: Current State - Big tappable cards */}
      {questionType === 'current_state' && (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <h3 className="font-mono text-xl md:text-2xl text-white font-bold mb-2 text-center">
            {CURRENT_STATE_HEADERS[pillarIndex % CURRENT_STATE_HEADERS.length].title}
          </h3>
          <p className="font-mono text-sm text-white/40 mb-8 text-center">
            {CURRENT_STATE_HEADERS[pillarIndex % CURRENT_STATE_HEADERS.length].subtitle}
          </p>
          
          <div className="space-y-3">
            {(currentPillar.currentStateOptions || GENERIC_CURRENT_STATE_OPTIONS).map((option, index) => (
              <button
                key={index}
                onClick={() => handleCurrentStateSelect(option, index)}
                disabled={isTransitioning}
                className={`w-full p-4 border-2 text-left font-mono transition-all duration-200
                  ${index === 0 
                    ? 'border-white/10 hover:border-[#F97316] hover:bg-[#F97316] hover:text-black' 
                    : index === 3 
                      ? 'border-white/10 hover:border-[#22c55e] hover:bg-[#22c55e] hover:text-black'
                      : 'border-white/10 hover:border-[#F97316] hover:bg-[#F97316] hover:text-black'
                  }
                  ${selectedOptionIndex === index ? 'border-[#F97316] bg-[#F97316] text-black scale-[1.02]' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {index === 0 ? '😬' : index === 1 ? '😐' : index === 2 ? '🤔' : '💪'}
                  </span>
                  <span className="text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 2: Future State - Intense vision prompt */}
      {questionType === 'future_state' && (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <div className="text-center mb-8">
            <OnboardingMascot expression="encouraging" size="md" animate={true} />
          </div>
          
          <h3 className="font-mono text-xl md:text-2xl text-white font-bold mb-2 text-center">
            {currentPillar.futurePrompt || FUTURE_STATE_HEADERS[pillarIndex % FUTURE_STATE_HEADERS.length].title}
          </h3>
          <p className="font-mono text-sm text-white/40 mb-8 text-center">
            {FUTURE_STATE_HEADERS[pillarIndex % FUTURE_STATE_HEADERS.length].subtitle}
          </p>
          
          <div className="relative">
            <textarea
              value={currentValue}
              onChange={(e) => onUpdate({ ...data, [currentFieldName]: e.target.value })}
              placeholder="Be specific. What do you see? How do you feel?"
              className="w-full h-32 bg-transparent border-2 border-white/20 p-4 font-mono text-lg text-white placeholder-white/30 focus:outline-none focus:border-[#F97316] resize-none"
            />
          </div>
          
          <Button
            className="mt-6 w-full"
            variant="accent"
            onClick={() => {
              audioService.playTick();
              handleNext(currentValue);
            }}
            disabled={isTransitioning || !currentValue.trim()}
          >
            Lock it in
          </Button>
        </div>
      )}

      {/* QUESTION 3: Identity Statement - Who you're becoming */}
      {questionType === 'identity_statement' && (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <div className="text-center mb-6">
            <div className="inline-block p-4 border-2 border-[#F97316]">
              <span className="text-4xl">{currentPillar.icon}</span>
            </div>
          </div>
          
          <h3 className="font-mono text-xl md:text-2xl text-white font-bold mb-2 text-center">
            {IDENTITY_HEADERS[pillarIndex % IDENTITY_HEADERS.length].title}
          </h3>
          <p className="font-mono text-sm text-white/40 mb-6 text-center">
            {IDENTITY_HEADERS[pillarIndex % IDENTITY_HEADERS.length].subtitle}
          </p>
          
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-2xl text-[#F97316] font-bold">
              I am
            </div>
            <input
              type="text"
              value={currentValue}
              onChange={(e) => onUpdate({ ...data, [currentFieldName]: e.target.value })}
              placeholder="someone who..."
              className="w-full bg-transparent border-b-4 border-white/20 py-4 pl-20 font-mono text-xl text-white placeholder-white/30 focus:outline-none focus:border-[#F97316]"
            />
          </div>
          
          <p className="font-mono text-xs text-white/30 mt-4 text-center">
            e.g., "someone who shows up to the gym no matter what"
          </p>
          
          <Button
            className="mt-8 w-full"
            variant="accent"
            onClick={() => {
              audioService.playTick();
              handleNext(currentValue);
            }}
            disabled={isTransitioning || !currentValue.trim()}
          >
            {pillarIndex === selectedPillars.length - 1 ? "Complete" : "Next Pillar →"}
          </Button>
        </div>
      )}

      {/* Overall progress */}
      <div className="mt-12 flex justify-center gap-1">
        {selectedPillars.map((id, i) => {
          const pillar = getOrCreatePillar(id);
          const isComplete = i < pillarIndex;
          const isCurrent = i === pillarIndex;
          
          return (
            <div 
              key={id}
              className={`w-8 h-8 flex items-center justify-center text-sm transition-all ${
                isComplete 
                  ? 'bg-[#F97316] text-black' 
                  : isCurrent 
                    ? 'border-2 border-[#F97316] text-white'
                    : 'bg-white/10 text-white/30'
              }`}
              title={pillar.label}
            >
              {pillar.icon}
            </div>
          );
        })}
      </div>
    </div>
  );
};
