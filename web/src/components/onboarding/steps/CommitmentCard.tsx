
import React, { useState } from 'react';
import { Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CommitmentCard = ({ data, onAccept }: { data: any, onAccept: () => void }) => {
  const [agreed, setAgreed] = useState(false);
  
  const commitments = [
    "I will show up every single day, no excuses.",
    "I will be radically honest with myself.",
    "I will embrace discomfort as the path to growth.",
    "I will not negotiate with my weaker self.",
    "I will hold myself to a higher standard."
  ];

  return (
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header */}
          <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black rounded-full mb-6">
                  <Shield size={28} className="text-black" />
              </div>
              <h2 className="font-mono text-black text-2xl md:text-3xl font-medium mb-2">
                  Your Commitment
              </h2>
              <p className="font-mono text-black/40 text-sm">
                  This is a binding agreement with yourself.
              </p>
          </div>

          {/* User Info Summary */}
          <div className="bg-gray-50 border border-black/10 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <p className="font-mono text-black/40 text-xs mb-1">Name</p>
                      <p className="font-mono text-black font-medium">{data[4] || 'Not provided'}</p>
                  </div>
                  <div>
                      <p className="font-mono text-black/40 text-xs mb-1">Mission</p>
                      <p className="font-mono text-black font-medium truncate">{data[5] || 'Not provided'}</p>
                  </div>
              </div>
          </div>

          {/* Commitments List */}
          <div className="space-y-3 mb-8">
              {commitments.map((commitment, i) => (
                  <div 
                      key={i} 
                      className="flex items-start gap-4 p-4 border border-black/5 rounded-lg bg-white"
                      style={{ animationDelay: `${i * 100}ms` }}
                  >
                      <div className="w-6 h-6 rounded-full border-2 border-black/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={12} className="text-black/40" />
                      </div>
                      <p className="font-mono text-black/70 text-sm leading-relaxed">
                          {commitment}
                      </p>
                  </div>
              ))}
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-4 p-5 border-2 border-black/10 rounded-lg cursor-pointer hover:border-black/30 transition-colors mb-8">
              <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-black cursor-pointer"
              />
              <span className="font-mono text-black text-sm leading-relaxed">
                  I understand this is a commitment to myself. I am ready to be held accountable.
              </span>
          </label>

          {/* Footer */}
          <div className="flex flex-col items-center gap-4">
              <Button 
                  size="lg" 
                  variant="primary" 
                  className={`w-full border-black transition-all duration-300 ${!agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => agreed && onAccept()}
                  disabled={!agreed}
              >
                  I Accept This Commitment
              </Button>
              <p className="font-mono text-black/30 text-xs">
                  {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                  })}
              </p>
          </div>
      </div>
  );
}
