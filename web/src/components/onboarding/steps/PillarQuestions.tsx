'use client';

import React, { useState, useMemo } from 'react';
import { getPillarById, PillarPreset } from '@/data/pillarPresets';
import { Button } from '@/components/ui/Button';
import { MegaInput } from '@/components/onboarding/ui/MegaInput';
import { BrutalChoice } from '@/components/onboarding/ui/BrutalChoice';

// Generic options for custom pillars
const GENERIC_CURRENT_STATE_OPTIONS = [
  "Honestly pretty bad",
  "Up and down, not consistent", 
  "Okay but could be better",
  "Pretty good, just need to keep it up"
];

interface PillarQuestionsProps {
  selectedPillars: string[];
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
  onComplete: () => void;
}

// Only 3 questions now: current, goal, future
type QuestionType = 'current' | 'goal' | 'future';

export const PillarQuestions = ({ 
  selectedPillars, 
  data, 
  onUpdate, 
  onComplete
}: PillarQuestionsProps) => {
  const [pillarIndex, setPillarIndex] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('current');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentPillarId = selectedPillars[pillarIndex];
  
  const currentPillar = useMemo(() => {
    const preset = getPillarById(currentPillarId);
    if (preset) return preset;
    
    // Handle custom pillars
    if (currentPillarId?.startsWith('custom_')) {
      const label = currentPillarId.replace('custom_', '').replace(/_/g, ' ');
      return {
        id: currentPillarId,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        icon: '✨',
        description: '',
        currentStateOptions: GENERIC_CURRENT_STATE_OPTIONS,
        goalPrompt: '',
        futurePrompt: '',
      } as PillarPreset;
    }
    
    return null;
  }, [currentPillarId]);

  const isCustomPillar = currentPillarId?.startsWith('custom_');

  // 3 questions per pillar now
  const questionsPerPillar = 3;
  const totalQuestions = selectedPillars.length * questionsPerPillar;
  const currentQuestionNumber = pillarIndex * questionsPerPillar + ['current', 'goal', 'future'].indexOf(questionType) + 1;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  const getFieldName = (pillarId: string, type: QuestionType): string => {
    return `${pillarId}_${type}`;
  };

  const currentFieldName = currentPillar ? getFieldName(currentPillar.id, questionType) : '';
  const currentValue = data[currentFieldName] || '';

  const handleNext = (value: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const newData = { ...data, [currentFieldName]: value };
    onUpdate(newData);

    setTimeout(() => {
      const questionOrder: QuestionType[] = ['current', 'goal', 'future'];
      const currentQIndex = questionOrder.indexOf(questionType);

      if (currentQIndex < questionOrder.length - 1) {
        setQuestionType(questionOrder[currentQIndex + 1]);
      } else if (pillarIndex < selectedPillars.length - 1) {
        setPillarIndex(pillarIndex + 1);
        setQuestionType('current');
      } else {
        onComplete();
        return;
      }

      setIsTransitioning(false);
    }, 300);
  };

  if (!currentPillar) {
    return (
      <div className="text-center">
        <p className="font-mono text-red-500">Error: No pillar found</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Pillar Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">{currentPillar.icon}</span>
          <h2 className="font-mono text-2xl font-bold text-black uppercase tracking-wide">
            {currentPillar.label}
          </h2>
        </div>
        <p className="font-mono text-sm text-gray-500">
          Pillar {pillarIndex + 1} of {selectedPillars.length}
        </p>
      </div>

      {/* Progress dots for this pillar - now 3 */}
      <div className="flex justify-center gap-2 mb-8">
        {['current', 'goal', 'future'].map((q) => {
          const qType = q as QuestionType;
          const fieldName = getFieldName(currentPillar.id, qType);
          const isCompleted = !!data[fieldName];
          const isCurrent = questionType === qType;
          
          return (
            <div
              key={q}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isCurrent 
                  ? 'bg-black scale-125' 
                  : isCompleted 
                    ? 'bg-black' 
                    : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>

      {/* Question Content */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        
        {/* CURRENT STATE - Choice with dynamic options */}
        {questionType === 'current' && (
          <div className="w-full flex flex-col items-center text-center">
            <h3 className="font-mono text-xl md:text-2xl text-black font-medium mb-8">
              Where are you at right now?
            </h3>
            <BrutalChoice 
              options={currentPillar.currentStateOptions || GENERIC_CURRENT_STATE_OPTIONS} 
              onSelect={handleNext}
              disabled={isTransitioning}
            />
          </div>
        )}

        {/* GOAL - Input */}
        {questionType === 'goal' && (
          <div className="w-full flex flex-col items-center text-center">
            <h3 className="font-mono text-xl md:text-2xl text-black font-medium mb-8">
              {isCustomPillar ? "What's your goal?" : currentPillar.goalPrompt}
            </h3>
            <MegaInput
              value={currentValue}
              onChange={(val: string) => onUpdate({ ...data, [currentFieldName]: val })}
              onEnter={() => currentValue && handleNext(currentValue)}
            />
            <Button
              className="mt-12 w-full max-w-xs border-black"
              variant="primary"
              onClick={() => handleNext(currentValue)}
              disabled={isTransitioning || !currentValue}
            >
              Continue
            </Button>
          </div>
        )}

        {/* FUTURE STATE - Input */}
        {questionType === 'future' && (
          <div className="w-full flex flex-col items-center text-center">
            <h3 className="font-mono text-xl md:text-2xl text-black font-medium mb-8">
              {isCustomPillar ? "When you win, what does it look like?" : currentPillar.futurePrompt}
            </h3>
            <MegaInput
              value={currentValue}
              onChange={(val: string) => onUpdate({ ...data, [currentFieldName]: val })}
              onEnter={() => currentValue && handleNext(currentValue)}
            />
            <Button
              className="mt-12 w-full max-w-xs border-black"
              variant="primary"
              onClick={() => handleNext(currentValue)}
              disabled={isTransitioning || !currentValue}
            >
              {pillarIndex === selectedPillars.length - 1 ? 'Done' : 'Next Pillar'}
            </Button>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="mt-12 w-full max-w-xs mx-auto">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-black transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center font-mono text-xs text-gray-400 mt-2">
          {currentQuestionNumber} / {totalQuestions}
        </p>
      </div>
    </div>
  );
};
