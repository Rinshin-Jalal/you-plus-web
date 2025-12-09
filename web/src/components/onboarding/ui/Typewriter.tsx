'use client';

import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../../services/audio';

interface TypewriterProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
  startDelay?: number;
  className?: string;
}

export const Typewriter = ({ text, onComplete, speed = 30, startDelay = 0, className }: TypewriterProps) => {
  const [displayLength, setDisplayLength] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const lastAudioTime = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const textRef = useRef(text);
  
  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Mark as client-side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Main typing effect
  useEffect(() => {
    if (!isClient) return;
    
    // Reset if text changes
    if (text !== textRef.current) {
      textRef.current = text;
      setDisplayLength(0);
    }

    // Start delay
    const delayTimer = setTimeout(() => {
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        charIndex++;
        setDisplayLength(charIndex);
        
        // Play sound every 2 characters
        const now = Date.now();
        if (charIndex % 2 === 0 && now - lastAudioTime.current > 50) {
          audioService.playClick();
          lastAudioTime.current = now;
        }

        // Check if complete
        if (charIndex >= text.length) {
          clearInterval(typeInterval);
          // Small delay before calling onComplete
          setTimeout(() => {
            onCompleteRef.current?.();
          }, 100);
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, startDelay);

    return () => clearTimeout(delayTimer);
  }, [text, speed, startDelay, isClient]);

  // Don't render typing effect on server - show nothing to match initial client state
  if (!isClient) {
    return (
      <span className={className || "font-mono text-[#FAFAFA] text-xl md:text-2xl leading-relaxed font-medium"}>
        <span className="animate-pulse inline-block w-2 h-5 bg-[#F97316] ml-1 align-middle" />
      </span>
    );
  }

  return (
    <span className={className || "font-mono text-[#FAFAFA] text-xl md:text-2xl leading-relaxed font-medium"}>
      {text.substring(0, displayLength)}
      <span className="animate-pulse inline-block w-2 h-5 bg-[#F97316] ml-1 align-middle" />
    </span>
  );
};
