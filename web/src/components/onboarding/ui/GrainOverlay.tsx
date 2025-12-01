
import React from 'react';

export const GrainOverlay = () => (
  <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden mix-blend-multiply opacity-50">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
  </div>
);
