'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Check, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PRESET_VOICES, PresetVoice } from '@/data/presetVoices';
import { audioService } from '@/services/audio';

interface VoiceSelectionProps {
  selected: string | null;
  onSelect: (voiceId: string) => void;
  onContinue: () => void;
}

// Sample text that Cartesia will speak for preview
const PREVIEW_TEXT = "Hey. It's me. You. From the future. I'm here to help you become who you're meant to be.";

export const VoiceSelection = ({ selected, onSelect, onContinue }: VoiceSelectionProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSelect = (voice: PresetVoice) => {
    audioService.playTick();
    onSelect(voice.id);
  };

  const handlePlayPreview = useCallback(async (voice: PresetVoice) => {
    setError(null);

    // If already playing this voice, stop it
    if (playingId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoadingId(voice.id);
    abortControllerRef.current = new AbortController();

    try {
      // Call our API to generate TTS preview
      const response = await fetch('/api/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.id,
          text: PREVIEW_TEXT,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice preview');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingId(null);
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setPlayingId(voice.id);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      console.error('Voice preview error:', err);
      setError('Failed to load voice preview');
    } finally {
      setLoadingId(null);
    }
  }, [playingId]);

  const handleContinue = () => {
    if (selected) {
      audioService.playMilestone();
      onContinue();
    }
  };

  const getGenderIcon = (gender: PresetVoice['gender']) => {
    switch (gender) {
      case 'male':
        return '♂';
      case 'female':
        return '♀';
      default:
        return '⚧';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <h2 className="font-mono text-2xl md:text-3xl font-bold mb-4 text-white">
          Choose Your Future Self&apos;s Voice
        </h2>
        <p className="font-mono text-white/50 text-sm md:text-base px-4">
          Select the voice that resonates with you
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 text-red-200 text-sm font-mono text-center">
          {error}
        </div>
      )}

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
        {PRESET_VOICES.map((voice) => {
          const isSelected = selected === voice.id;
          const isPlaying = playingId === voice.id;
          const isLoading = loadingId === voice.id;

          return (
            <div
              key={voice.id}
              className={`relative p-5 border-2 transition-all duration-200 cursor-pointer
                ${isSelected 
                  ? 'border-[#F97316] bg-[#F97316]/10' 
                  : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
              onClick={() => handleSelect(voice)}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center">
                  <Check className="w-4 h-4 text-black" />
                </div>
              )}

              {/* Voice Info */}
              <div className="flex items-start gap-4">
                {/* Avatar / Gender indicator */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg
                  ${isSelected ? 'bg-[#F97316]/30' : 'bg-white/10'}`}>
                  {getGenderIcon(voice.gender)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-lg ${isSelected ? 'text-[#F97316]' : 'text-white'}`}>
                      {voice.name}
                    </span>
                    <span className="font-mono text-xs text-white/40 px-2 py-0.5 bg-white/10 rounded">
                      {voice.vibe}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-white/50 mt-1 line-clamp-2">
                    {voice.description}
                  </p>
                </div>
              </div>

              {/* Play Preview Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPreview(voice);
                }}
                disabled={isLoading}
                className={`mt-4 w-full py-2.5 flex items-center justify-center gap-2 font-mono text-sm
                  border transition-all duration-200
                  ${isLoading 
                    ? 'border-white/20 bg-white/5 text-white/50 cursor-wait'
                    : isPlaying
                      ? 'border-[#F97316] bg-[#F97316]/20 text-[#F97316]'
                      : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                    Loading...
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Preview Voice
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="mt-10 flex flex-col items-center px-4">
        <Button
          variant="accent"
          onClick={handleContinue}
          disabled={!selected}
          className="w-full max-w-xs"
        >
          {selected ? 'Continue' : 'Select a Voice'}
        </Button>
        
        {/* Hint */}
        <p className="text-center text-xs text-white/30 mt-4 font-mono flex items-center gap-2">
          <Volume2 className="w-3 h-3" />
          Tap preview to hear each voice
        </p>
      </div>
    </div>
  );
};
