
import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../../services/audio';

export const Typewriter = ({ text, onComplete, speed = 30, startDelay = 0 }: { text: string; onComplete?: () => void; speed?: number; startDelay?: number }) => {
  const [display, setDisplay] = useState('');
  const [started, setStarted] = useState(false);
  const lastAudioTime = useRef(0);
  
  useEffect(() => {
    const startTimer = setTimeout(() => {
        setStarted(true);
    }, startDelay);
    return () => clearTimeout(startTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    setDisplay('');
    const timer = setInterval(() => {
      setDisplay(text.substring(0, i + 1));
      
      const now = Date.now();
      // Only play click if audio context is running (handled globally now)
      if (i % 2 === 0 && now - lastAudioTime.current > 50) {
        audioService.playClick();
        lastAudioTime.current = now;
      }

      i++;
      if (i > text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onComplete, started]);

  return (
    <span className="font-mono text-black text-xl md:text-2xl leading-relaxed font-medium">
      {display}
      <span className="animate-pulse inline-block w-2 h-5 bg-neon-teal ml-1 align-middle" />
    </span>
  );
};
