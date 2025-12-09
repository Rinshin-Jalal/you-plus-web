'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Download, ChevronLeft, ChevronRight, Phone, Mic, Calendar, TrendingUp, X, ArrowRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';

// Color constants - using hex values to avoid lab() color issues with html2canvas
const colors = {
  dark: '#0A0A0A',
  darkCard: '#1A1A1A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  orange: '#F97316',
  orangeLight: '#FB923C',
  orangeDark: '#EA580C',
  text: '#FAFAFA',
  textDark: '#1A1A1A',
  textMuted: '#B3B3B3',
  textMutedDark: '#4A4A4A',
  textSubtle: '#666666',
  green: '#22C55E',
  red: '#DC2626',
  redDark: '#B91C1C',
  border: 'rgba(255,255,255,0.1)',
  borderDark: '#E5E5E5',
};

// Slide data
const slides = [
  { id: 'cover', type: 'cover' },
  { id: 'problem', type: 'problem' },
  { id: 'solution', type: 'solution' },
  { id: 'how-it-works', type: 'how-it-works' },
  { id: 'features', type: 'features' },
  { id: 'market', type: 'market' },
  { id: 'business-model', type: 'business-model' },
  { id: 'traction', type: 'traction' },
  { id: 'team', type: 'team' },
  { id: 'ask', type: 'ask' },
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const exportToPDF = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
      });

      const container = exportContainerRef.current;
      if (!container) {
        throw new Error('Export container not found');
      }

      const slideElements = container.querySelectorAll('[data-slide]');
      
      for (let i = 0; i < slideElements.length; i++) {
        const slideElement = slideElements[i] as HTMLElement;
        const bgColor = slideElement.dataset.bg || colors.dark;
        
        const canvas = await html2canvas(slideElement, {
          scale: 2,
          backgroundColor: bgColor,
          useCORS: true,
          logging: false,
          allowTaint: true,
          width: 1600,
          height: 900,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        
        if (i > 0) {
          pdf.addPage([1920, 1080], 'landscape');
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
      }

      pdf.save('YouPlus-Pitch-Deck.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(`Error exporting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const renderSlide = (slideIndex: number) => {
    const slide = slides[slideIndex];
    
    switch (slide.type) {
      case 'cover':
        return <CoverSlide />;
      case 'problem':
        return <ProblemSlide />;
      case 'solution':
        return <SolutionSlide />;
      case 'how-it-works':
        return <HowItWorksSlide />;
      case 'features':
        return <FeaturesSlide />;
      case 'market':
        return <MarketSlide />;
      case 'business-model':
        return <BusinessModelSlide />;
      case 'traction':
        return <TractionSlide />;
      case 'team':
        return <TeamSlide />;
      case 'ask':
        return <AskSlide />;
      default:
        return null;
    }
  };

  const getSlideBg = (type: string): string => {
    switch (type) {
      case 'problem':
        return colors.orange;
      case 'how-it-works':
        return colors.light;
      case 'team':
        return colors.white;
      default:
        return colors.dark;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.dark }}>
      <GrainOverlay />
      
      {/* Hidden export container */}
      <div 
        ref={exportContainerRef}
        style={{ position: 'fixed', left: -9999, top: 0 }}
        aria-hidden="true"
      >
        {slides.map((slide, index) => (
          <div
            key={`export-${slide.id}`}
            data-slide={slide.id}
            data-bg={getSlideBg(slide.type)}
            style={{ width: 1600, height: 900 }}
          >
            {renderSlide(index)}
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="px-6 py-3 font-bold uppercase tracking-wide flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          style={{ backgroundColor: colors.orange, color: colors.dark }}
        >
          <Download size={16} />
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Navigation */}
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 backdrop-blur-md px-8 py-4"
        style={{ backgroundColor: 'rgba(26,26,26,0.95)', border: `1px solid ${colors.border}` }}
      >
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ color: colors.textMuted }}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="w-2.5 h-2.5 transition-all"
              style={{ 
                backgroundColor: i === currentSlide ? colors.orange : 'rgba(255,255,255,0.3)',
                transform: i === currentSlide ? 'scale(1.25)' : 'scale(1)'
              }}
            />
          ))}
        </div>
        
        <span className="text-sm font-mono min-w-[60px] text-center" style={{ color: colors.textSubtle }}>
          {currentSlide + 1} / {slides.length}
        </span>
        
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ color: colors.textMuted }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Slides Container */}
      <div className="flex-1 flex items-center justify-center p-8">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="w-full max-w-[1600px] aspect-video"
            style={{ display: index === currentSlide ? 'block' : 'none' }}
          >
            {renderSlide(index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE COMPONENTS - Using inline styles for PDF export compatibility
// ============================================================================

// Simple Logo SVG component (inline to avoid import issues with html2canvas)
function LogoSvg({ size = 140 }: { size?: number }) {
  const height = Math.round(size * (677 / 562));
  return (
    <svg width={size} height={height} viewBox="0 0 562 677" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        fill="#F2721B" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M502.802 146.638C504.445 146.489 506.092 146.379 507.741 146.308C516.742 145.987 526.109 147.596 534.866 149.639C573.408 158.632 610.909 181.765 639.42 208.714C711.782 278.313 754.144 373.391 757.5 473.736C760.565 592.154 689.223 694.303 570.106 715.036C557.341 717.258 543.65 719.187 530.707 719.493C517.498 719.422 506.57 720.081 492.929 719.217C452.081 716.799 411.84 706.222 376.84 685.309C310.417 645.618 274.541 578.313 281.517 501.017C283.084 483.651 283.818 469.951 288.296 452.546C302.934 395.642 339.124 346.114 386.262 311.562C418.409 287.689 459.715 271.231 481.612 236.594C492.607 219.202 495.383 195.911 492.144 175.782C491.255 171.27 488.778 166.93 487.844 162.462C485.34 150.476 493.351 148.413 502.802 146.638Z"
      />
      <path 
        fill="#111111" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M469.933 378.615C505.43 374.996 511.149 436 495.945 457.292C489.517 466.295 486.331 469.687 475.28 472.446C438.649 474.295 434.325 415.232 449.364 392.704C454.863 384.466 460.285 380.801 469.933 378.615Z"
      />
      <path 
        fill="#111111" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M620.035 378.148C626.482 378.296 630.976 379.508 636.384 383.44C660.819 401.208 659.024 468.491 623.675 472.63C618.016 472.495 612.524 470.688 607.889 467.438C581.548 449.016 583.612 384.405 620.035 378.148Z"
      />
      <path 
        fill="#111111" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M517.004 505.027C538.873 504.243 563.397 506.276 585.111 509.275C596.265 510.815 598.628 526.67 585.847 533.548C578.548 534.866 554.728 532.145 545.888 531.83C536.383 531.031 526.229 531.768 516.883 529.937C510.464 528.679 507.38 519.126 509.346 513.516C511.312 507.906 510.519 505.277 517.004 505.027Z"
      />
    </svg>
  );
}

// SLIDE 1: COVER
function CoverSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ backgroundColor: colors.dark, color: colors.text }}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(249,115,22,0.1), transparent, transparent)` }} />
      
      <div className="relative z-10 flex flex-col items-center">
        <LogoSvg size={140} />
        
        <div className="mt-10 flex items-center gap-3">
          <span className="text-6xl md:text-7xl font-black tracking-tight">YOU</span>
          <span className="text-6xl md:text-7xl font-black tracking-tight" style={{ color: colors.orange }}>+</span>
        </div>
        
        <p className="text-2xl mt-8 max-w-2xl font-medium" style={{ color: colors.textMuted }}>
          Voice-First Accountability That Works
        </p>
        
        <div 
          className="mt-12 inline-block px-6 py-3 text-sm font-mono uppercase"
          style={{ 
            border: `1px solid rgba(249,115,22,0.5)`, 
            backgroundColor: 'rgba(249,115,22,0.1)',
            color: colors.orange,
            letterSpacing: '0.2em'
          }}
        >
          Pre-Seed Investment Opportunity
        </div>
        
        <p className="mt-16 text-sm font-mono" style={{ color: colors.textSubtle }}>
          Confidential • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// SLIDE 2: PROBLEM
function ProblemSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col relative"
      style={{ backgroundColor: colors.orange, color: colors.dark }}
    >
      <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: 'rgba(0,0,0,0.5)' }}>THE PROBLEM</div>
      <h2 className="text-5xl font-black mb-12 tracking-tight">
        Self-improvement apps have a 95% abandonment rate.
      </h2>
      
      <div className="grid grid-cols-2 gap-12 flex-1">
        <div className="p-10" style={{ backgroundColor: colors.dark, color: colors.text, transform: 'rotate(-1deg)' }}>
          <h3 className="text-2xl font-black mb-8 tracking-tight">WHY THEY FAIL</h3>
          <div className="space-y-6">
            <div className="pl-6" style={{ borderLeft: '4px solid rgba(255,255,255,0.3)' }}>
              <div className="font-bold text-lg">Too Easy to Ignore</div>
              <p style={{ color: colors.textMuted }}>Notifications get swiped away. Checkboxes get skipped.</p>
            </div>
            <div className="pl-6" style={{ borderLeft: '4px solid rgba(255,255,255,0.3)' }}>
              <div className="font-bold text-lg">No Real Accountability</div>
              <p style={{ color: colors.textMuted }}>Text-based apps lack the friction needed for behavior change.</p>
            </div>
            <div className="pl-6" style={{ borderLeft: `4px solid ${colors.red}` }}>
              <div className="font-bold text-lg">Broken Streaks = Deleted App</div>
              <p style={{ color: colors.textMuted }}>One missed day and users abandon entirely.</p>
            </div>
          </div>
        </div>
        
        <div className="p-10" style={{ backgroundColor: colors.dark, color: colors.text, transform: 'rotate(1deg)' }}>
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: colors.redDark }}>
              <X size={18} style={{ color: colors.white }} />
            </div>
            <span className="uppercase tracking-wide">EXISTING SOLUTIONS FAIL</span>
          </h3>
          <div className="space-y-4">
            {[
              { thing: "Habit trackers", why: "Passive, easily ignored" },
              { thing: "Productivity apps", why: "Feature bloat, low engagement" },
              { thing: "Accountability partners", why: "Inconsistent, hard to coordinate" },
              { thing: "Coaching apps", why: "Expensive, not scalable" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <X size={16} style={{ color: colors.redDark, flexShrink: 0, marginTop: 4 }} />
                <div>
                  <div className="font-semibold" style={{ color: colors.white }}>{item.thing}</div>
                  <div className="text-sm" style={{ color: colors.textSubtle }}>{item.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// SLIDE 3: SOLUTION
function SolutionSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col relative"
      style={{ backgroundColor: colors.dark, color: colors.text }}
    >
      <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.orange }}>THE SOLUTION</div>
      
      <div className="flex gap-16 flex-1">
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-5xl font-black mb-8 tracking-tight leading-tight">
            Voice-based accountability<br />
            <span style={{ color: colors.orange }}>creates real friction.</span>
          </h2>
          
          <p className="text-xl mb-10 max-w-lg leading-relaxed" style={{ color: colors.textMuted }}>
            You+ calls users every night. They must verbally report whether they followed through on their commitments. Speaking out loud creates psychological friction that text-based apps cannot replicate.
          </p>
          
          <div className="mb-8">
            <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.textSubtle }}>KEY INSIGHT</div>
            <div className="p-6" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderLeft: `4px solid ${colors.orange}` }}>
              <p className="text-lg" style={{ color: colors.textMuted }}>
                Research shows verbal commitment significantly increases follow-through rates compared to written or mental commitments. The act of speaking creates cognitive dissonance that drives action.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="p-12 max-w-md" style={{ backgroundColor: colors.orange, color: colors.dark }}>
            <div className="text-xs font-mono uppercase mb-6" style={{ letterSpacing: '0.3em', color: 'rgba(0,0,0,0.5)' }}>THE MECHANISM</div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <Mic size={28} style={{ color: colors.dark }} />
              </div>
              <span className="text-3xl font-black">Voice-First</span>
            </div>
            
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(0,0,0,0.8)' }}>
              Real phone calls. AI that remembers context. Users must speak their results out loud. This creates the psychological weight that drives actual behavior change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// SLIDE 4: HOW IT WORKS
function HowItWorksSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col"
      style={{ backgroundColor: colors.light, color: colors.textDark }}
    >
      <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.orange }}>PRODUCT</div>
      <h2 className="text-5xl font-black mb-16 tracking-tight">How It Works</h2>
      
      <div className="grid grid-cols-3 gap-0 flex-1">
        <div className="relative px-10 py-8" style={{ borderRight: `1px solid ${colors.borderDark}` }}>
          <div className="absolute top-4 left-10 text-[100px] font-black leading-none select-none" style={{ color: colors.borderDark }}>01</div>
          <div className="relative z-10 pt-24">
            <h3 className="text-xl font-black mb-4 uppercase tracking-wide" style={{ color: colors.textDark }}>COMMIT</h3>
            <p className="leading-relaxed" style={{ color: colors.textMutedDark }}>
              Users set daily commitments during onboarding and after each call. Commitments are stored and tracked by the AI system.
            </p>
          </div>
        </div>
        
        <div className="relative px-10 py-8" style={{ borderRight: `1px solid ${colors.borderDark}` }}>
          <div className="absolute top-4 left-10 text-[100px] font-black leading-none select-none" style={{ color: colors.borderDark }}>02</div>
          <div className="relative z-10 pt-24">
            <h3 className="text-xl font-black mb-4 uppercase tracking-wide" style={{ color: colors.textDark }}>CALL</h3>
            <p className="leading-relaxed" style={{ color: colors.textMutedDark }}>
              Every evening at the user's chosen time, they receive a real phone call. The AI asks about each commitment and processes verbal responses.
            </p>
          </div>
        </div>
        
        <div className="relative px-10 py-8" style={{ backgroundColor: colors.orange }}>
          <div className="absolute top-4 left-10 text-[100px] font-black leading-none select-none" style={{ color: 'rgba(234,88,12,0.3)' }}>03</div>
          <div className="relative z-10 pt-24">
            <h3 className="text-xl font-black mb-4 uppercase tracking-wide" style={{ color: colors.white }}>TRACK</h3>
            <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
              The AI maintains a persistent memory of patterns, progress, and excuses. Weekly summaries highlight trends and areas for improvement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// SLIDE 5: FEATURES
function FeaturesSlide() {
  const features = [
    {
      icon: Mic,
      title: "Voice-First",
      desc: "Speaking out loud creates psychological commitment that typing cannot match. Users hear themselves admit failures.",
    },
    {
      icon: Phone,
      title: "Real Calls",
      desc: "Actual phone calls demand attention. Unlike notifications, they cannot be passively dismissed or ignored.",
    },
    {
      icon: Calendar,
      title: "Persistent Memory",
      desc: "The AI remembers everything - patterns, excuses, progress. This creates continuity across sessions.",
    },
    {
      icon: TrendingUp,
      title: "Pattern Analysis",
      desc: "Weekly summaries reveal behavioral patterns. Users see their actual follow-through rates objectively.",
      accent: true,
    },
  ];

  return (
    <div 
      className="w-full h-full p-16 flex flex-col"
      style={{ backgroundColor: colors.dark, color: colors.text }}
    >
      <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.orange }}>DIFFERENTIATION</div>
      <h2 className="text-5xl font-black mb-16 tracking-tight">Why Voice Changes Everything</h2>
      
      <div className="grid grid-cols-4 gap-0 flex-1">
        {features.map((feature, i) => (
          <div 
            key={i} 
            className="p-8 flex flex-col"
            style={{ 
              backgroundColor: feature.accent ? colors.orange : 'transparent',
              color: feature.accent ? colors.dark : colors.text,
              borderRight: feature.accent ? 'none' : `1px solid ${colors.border}`
            }}
          >
            <div 
              className="w-14 h-14 flex items-center justify-center mb-6"
              style={{ border: `1px solid ${feature.accent ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}` }}
            >
              <feature.icon size={24} />
            </div>
            <h3 className="text-lg font-black mb-4 uppercase tracking-wide">{feature.title}</h3>
            <p className="leading-relaxed" style={{ color: feature.accent ? 'rgba(0,0,0,0.8)' : colors.textMuted }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// SLIDE 6: MARKET
function MarketSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col"
      style={{ backgroundColor: colors.dark, color: colors.text }}
    >
      <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.orange }}>MARKET OPPORTUNITY</div>
      <h2 className="text-5xl font-black mb-16 tracking-tight">Large Market, Failed Incumbents</h2>
      
      <div className="grid grid-cols-3 gap-8 flex-1">
        <div className="p-10 flex flex-col" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
          <div className="text-6xl font-black" style={{ color: colors.orange }}>$11B</div>
          <div className="text-xl font-bold mt-4" style={{ color: colors.white }}>US Self-Improvement Market</div>
          <p className="mt-4 flex-1 leading-relaxed" style={{ color: colors.textMuted }}>
            Growing 5.5% annually. High willingness to pay for solutions that actually work.
          </p>
          <div className="text-xs mt-4 font-mono" style={{ color: colors.textSubtle }}>Source: Market Research Future, 2023</div>
        </div>
        
        <div className="p-10 flex flex-col" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
          <div className="text-6xl font-black" style={{ color: colors.orange }}>95%</div>
          <div className="text-xl font-bold mt-4" style={{ color: colors.white }}>App Abandonment Rate</div>
          <p className="mt-4 flex-1 leading-relaxed" style={{ color: colors.textMuted }}>
            Most habit apps are abandoned within the first week. Massive opportunity for a solution with real engagement.
          </p>
          <div className="text-xs mt-4 font-mono" style={{ color: colors.textSubtle }}>Source: Localytics</div>
        </div>
        
        <div className="p-10 flex flex-col" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
          <div className="text-6xl font-black" style={{ color: colors.orange }}>47M</div>
          <div className="text-xl font-bold mt-4" style={{ color: colors.white }}>Target Addressable Users</div>
          <p className="mt-4 flex-1 leading-relaxed" style={{ color: colors.textMuted }}>
            US adults who have tried and failed with traditional productivity/habit apps. Looking for something different.
          </p>
          <div className="text-xs mt-4 font-mono" style={{ color: colors.textSubtle }}>Internal estimate based on app usage data</div>
        </div>
      </div>
    </div>
  );
}

// SLIDE 7: BUSINESS MODEL
function BusinessModelSlide() {
  return (
    <div className="w-full h-full grid grid-cols-2">
      <div className="p-16 flex flex-col justify-center" style={{ backgroundColor: colors.dark, color: colors.text }}>
        <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.orange }}>BUSINESS MODEL</div>
        <h2 className="text-4xl font-black mb-10 tracking-tight">Subscription SaaS with Strong Unit Economics</h2>
        
        <div className="space-y-6">
          <div className="p-6" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
            <div className="text-3xl font-black" style={{ color: colors.orange }}>$28/mo</div>
            <div className="mt-2" style={{ color: colors.textMuted }}>Target ARPU (weekly pricing presented as $6.99/week)</div>
          </div>
          
          <div className="p-6" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
            <div className="text-3xl font-black" style={{ color: colors.orange }}>~$0.50</div>
            <div className="mt-2" style={{ color: colors.textMuted }}>Estimated cost per call (AI inference + telephony)</div>
          </div>
          
          <div className="p-6" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
            <div className="text-3xl font-black" style={{ color: colors.green }}>85%+</div>
            <div className="mt-2" style={{ color: colors.textMuted }}>Target gross margin at scale</div>
          </div>
        </div>
      </div>
      
      <div className="p-16 flex flex-col justify-center" style={{ backgroundColor: colors.orange, color: colors.dark }}>
        <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: 'rgba(0,0,0,0.5)' }}>PRICING STRATEGY</div>
        
        <div className="text-7xl font-black mb-2">$6.99</div>
        <p className="text-xl mb-10" style={{ color: 'rgba(0,0,0,0.6)' }}>/week after 7-day free trial</p>

        <div className="space-y-4">
          {[
            'Daily accountability calls',
            'Persistent AI memory',
            'Weekly progress summaries',
            'Pattern recognition',
            'No annual commitment required',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <ArrowRight size={16} style={{ color: 'rgba(0,0,0,0.7)' }} />
              <span className="font-semibold" style={{ color: colors.dark }}>{item}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.7)' }}>
            Weekly pricing reduces friction to trial. Higher ARPU than monthly alternatives due to weekly billing psychology.
          </p>
        </div>
      </div>
    </div>
  );
}

// SLIDE 8: TRACTION
function TractionSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col"
      style={{ backgroundColor: colors.dark, color: colors.text }}
    >
      <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.orange }}>CURRENT STATUS</div>
      <h2 className="text-5xl font-black mb-12 tracking-tight">Pre-Launch Stage</h2>
      
      <div className="grid grid-cols-2 gap-12 flex-1">
        <div className="p-10" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
          <h3 className="text-2xl font-black mb-8" style={{ color: colors.orange }}>WHAT'S BUILT</h3>
          <div className="space-y-4">
            {[
              'Full web application with user authentication',
              'AI voice calling system (Cartesia integration)',
              'Onboarding flow with commitment setup',
              'User dashboard with progress tracking',
              'Payment integration (DodoPayments)',
              'Database and backend infrastructure',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 flex-shrink-0" style={{ backgroundColor: colors.green }} />
                <span style={{ color: colors.textMuted }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-10" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
          <h3 className="text-2xl font-black mb-8" style={{ color: colors.orange }}>NEXT MILESTONES</h3>
          <div className="space-y-4">
            {[
              'Private beta launch with initial users',
              'Iterate on AI conversation quality',
              'Optimize call scheduling and reliability',
              'Gather user feedback and retention data',
              'Refine messaging and positioning',
              'Scale marketing channels',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <span style={{ color: colors.textMuted }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6" style={{ border: `1px solid rgba(249,115,22,0.3)`, backgroundColor: 'rgba(249,115,22,0.05)' }}>
        <p className="text-center" style={{ color: colors.textMuted }}>
          Looking for pre-seed investment to fund beta testing, user acquisition, and product iteration.
        </p>
      </div>
    </div>
  );
}

// SLIDE 9: TEAM
function TeamSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col"
      style={{ backgroundColor: colors.white, color: colors.textDark }}
    >
      <div className="text-xs font-mono uppercase mb-4" style={{ letterSpacing: '0.3em', color: colors.orange }}>TEAM</div>
      <h2 className="text-5xl font-black mb-16 tracking-tight">Founder-Led</h2>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl">
          <div className="p-12" style={{ backgroundColor: colors.light, border: `1px solid ${colors.borderDark}` }}>
            <div className="flex items-start gap-10">
              <div 
                className="w-32 h-32 flex items-center justify-center text-5xl font-black flex-shrink-0"
                style={{ backgroundColor: colors.orange, color: colors.dark }}
              >
                F
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold" style={{ color: colors.textDark }}>Solo Founder</div>
                <div className="font-bold mt-1 mb-6" style={{ color: colors.orange }}>Founder & CEO</div>
                <p className="leading-relaxed mb-6" style={{ color: colors.textMutedDark }}>
                  Technical founder with full-stack development experience. Built the entire product solo - web app, backend, AI integration, and payment systems.
                </p>
                <p className="leading-relaxed" style={{ color: colors.textMutedDark }}>
                  Personal experience with accountability challenges drove the product vision. Seeking to solve a problem experienced firsthand.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6" style={{ backgroundColor: colors.light, border: `1px solid ${colors.borderDark}` }}>
            <p className="text-center" style={{ color: colors.textMutedDark }}>
              Actively seeking technical co-founder and advisors with expertise in consumer apps, behavioral psychology, and voice AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// SLIDE 10: THE ASK
function AskSlide() {
  return (
    <div 
      className="w-full h-full p-16 flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ backgroundColor: colors.dark, color: colors.text }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(249,115,22,0.15), transparent, transparent)' }} />
      
      <div className="relative z-10 max-w-4xl">
        <div className="text-xs font-mono uppercase mb-8" style={{ letterSpacing: '0.3em', color: colors.orange }}>THE ASK</div>
        
        <h2 className="text-6xl font-black mb-8 tracking-tight">
          Raising <span style={{ color: colors.orange }}>$500K</span> Pre-Seed
        </h2>
        
        <p className="text-xl mb-12 max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
          To fund beta testing, validate retention metrics, and achieve product-market fit before Series A.
        </p>
        
        <div className="grid grid-cols-3 gap-6 mb-16">
          <div className="p-6" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
            <div className="text-3xl font-black mb-2" style={{ color: colors.orange }}>40%</div>
            <div style={{ color: colors.textMuted }}>Product & Engineering</div>
            <div className="text-sm mt-2" style={{ color: colors.textSubtle }}>Hire technical co-founder, improve AI</div>
          </div>
          <div className="p-6" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
            <div className="text-3xl font-black mb-2" style={{ color: colors.orange }}>35%</div>
            <div style={{ color: colors.textMuted }}>User Acquisition</div>
            <div className="text-sm mt-2" style={{ color: colors.textSubtle }}>Beta users, validate channels</div>
          </div>
          <div className="p-6" style={{ backgroundColor: colors.darkCard, border: `1px solid ${colors.border}` }}>
            <div className="text-3xl font-black mb-2" style={{ color: colors.orange }}>25%</div>
            <div style={{ color: colors.textMuted }}>Operations</div>
            <div className="text-sm mt-2" style={{ color: colors.textSubtle }}>Infrastructure, legal, runway</div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6">
          <LogoSvg size={72} />
          <div className="text-left">
            <div className="text-4xl font-black">
              YOU<span style={{ color: colors.orange }}>+</span>
            </div>
            <div className="mt-1" style={{ color: colors.textMuted }}>founders@youplus.app</div>
          </div>
        </div>
      </div>
    </div>
  );
}
