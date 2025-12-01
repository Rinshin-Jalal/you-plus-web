'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PhoneOff } from 'lucide-react';

// --- Mock Visualizer (UI Only) ---

const renderMockWaveform = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barCount = 32;
  const barWidth = (canvas.width / barCount) * 0.8;
  const gap = (canvas.width / barCount) * 0.2;
  let x = 0;

  for (let i = 0; i < barCount; i++) {
    // Random height for mock visualization
    const barHeight = Math.random() * 200 + 20;
    const drawHeight = barHeight * 1.5;

    // Dynamic Color based on intensity
    if (drawHeight > 180) ctx.fillStyle = "#FF0033";
    else if (drawHeight > 80) ctx.fillStyle = "#4ECDC4";
    else ctx.fillStyle = "#333333";

    ctx.fillRect(x, canvas.height - drawHeight / 2, barWidth, drawHeight / 2);
    x += barWidth + gap;
  }
};

const AudioVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      renderMockWaveform(canvas);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="w-full h-64 border-4 border-white/20 rounded-lg overflow-hidden relative bg-black shadow-[8px_8px_0px_0px_rgba(40,40,40,1)]">
      <div className="absolute top-4 left-4 font-mono text-xs text-neon-teal uppercase tracking-widest z-10 flex items-center gap-2">
        <span className="w-2 h-2 bg-neon-teal rounded-full animate-pulse"></span>
        AI Core Processing
      </div>
      <canvas ref={canvasRef} width={800} height={300} className="w-full h-full" />
    </div>
  );
};

// --- Main Component (UI Only) ---

export default function LiveCallInterface({ onEndCall }: { onEndCall: () => void }) {
  const status = "LINK SECURE. RECORDING.";

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Background Texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="flex flex-col h-full justify-between p-6 md:p-12 relative z-10 max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display font-black text-4xl text-white uppercase tracking-tight">
              Audit In Progress
            </h1>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neon-teal animate-pulse">
              {status}
            </div>
          </div>
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_#ff0000]" />
        </div>

        {/* Visualizer Centerpiece */}
        <div className="flex-grow flex flex-col justify-center gap-8 py-8">
          <AudioVisualizer />

          <div className="text-center space-y-2">
            <p className="font-mono text-gray-500 text-xs uppercase tracking-widest">Subject</p>
            <p className="font-display font-bold text-2xl text-white">THE FOUNDER</p>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-md mx-auto">
          <Button
            onClick={onEndCall}
            className="w-full py-6 bg-red-600 hover:bg-red-700 text-white border-red-800 shadow-[8px_8px_0px_0px_rgba(100,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <div className="flex items-center gap-4">
              <PhoneOff />
              <span>TERMINATE SESSION</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
