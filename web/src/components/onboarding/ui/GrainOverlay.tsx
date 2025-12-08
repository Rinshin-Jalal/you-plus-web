import React from 'react';

export const GrainOverlay = () => (
  <div className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden">
    {/* Scan lines - subtle light lines on dark background */}
    <div 
      className="absolute inset-0"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.015) 2px, rgba(255, 255, 255, 0.015) 4px)',
      }}
      aria-hidden="true"
    />
    
    {/* Vignette - subtle dark edges */}
    <div 
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0, 0, 0, 0.3) 100%)',
      }}
      aria-hidden="true"
    />
    
    {/* Subtle noise texture */}
    <div 
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
      aria-hidden="true"
    />
  </div>
);
