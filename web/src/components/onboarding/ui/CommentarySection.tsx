'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Typewriter } from './Typewriter';
import { OnboardingMascot } from './OnboardingMascot';

interface CommentarySectionProps {
  lines: string[];
  onNext: () => void;
  showMascot?: boolean;
}

export const CommentarySection = ({ lines, onNext, showMascot = true }: CommentarySectionProps) => {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [completedLines, setCompletedLines] = useState<number[]>([]);
    const [isTyping, setIsTyping] = useState(true);
    const onNextRef = useRef(onNext);
    const hasCalledNext = useRef(false);

    // Keep ref updated
    useEffect(() => {
        onNextRef.current = onNext;
    }, [onNext]);

    // Reset state when lines prop changes (key should handle this, but just in case)
    useEffect(() => {
        setCurrentLineIndex(0);
        setCompletedLines([]);
        setIsTyping(true);
        hasCalledNext.current = false;
    }, [lines]);

    const handleLineComplete = () => {
        setIsTyping(false);
        setCompletedLines(prev => [...prev, currentLineIndex]);
        
        if (currentLineIndex < lines.length - 1) {
            // More lines to show - wait then advance
            setTimeout(() => {
                setCurrentLineIndex(prev => prev + 1);
                setIsTyping(true);
            }, 800);
        } else {
            // All lines complete - wait then go to next step
            setTimeout(() => {
                if (!hasCalledNext.current) {
                    hasCalledNext.current = true;
                    onNextRef.current();
                }
            }, 2000);
        }
    };

    return (
        <div className="w-full max-w-2xl min-h-[300px] flex flex-col justify-center">
            {/* Mascot - the "speaker" */}
            {showMascot && (
                <div className="flex justify-center mb-8 md:mb-12">
                    <OnboardingMascot 
                        expression="speaking"
                        size="lg"
                        speaking={isTyping}
                        animate={true}
                    />
                </div>
            )}
            
            {/* Commentary lines */}
            <div className="space-y-8 text-left">
                {lines.map((line, i) => {
                    // Only show lines up to current index
                    if (i > currentLineIndex) return null;
                    
                    const isCompleted = completedLines.includes(i);
                    const isCurrent = i === currentLineIndex;
                    
                    return (
                        <div key={`${i}-${line.substring(0, 20)}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {isCompleted ? (
                                // Completed line - show as dimmed static text
                                <span className="font-mono text-white/50 text-xl md:text-2xl leading-relaxed font-medium">
                                    {line}
                                </span>
                            ) : isCurrent ? (
                                // Current line - show typewriter
                                <Typewriter 
                                    text={line} 
                                    speed={35} 
                                    onComplete={handleLineComplete} 
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
