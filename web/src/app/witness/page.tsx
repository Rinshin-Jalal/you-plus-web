'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { WitnessLogo } from '@/components/ui/WitnessLogo';

const WITNESS_FORMS = [
  { name: 'Honesty Aura', description: 'The original. Pure accountability energy.', unlocked: true },
  { name: 'Shadow Blob', description: 'Unlocked after 7 consecutive days of keeping your word.', unlocked: false },
  { name: 'Clarity Core', description: 'Unlocked when you hit 90% honesty rate for a month.', unlocked: false },
  { name: 'Future Mask', description: 'Unlocked after completing 100 calls.', unlocked: false },
];

const ACCESSORIES = [
  { name: 'Sunglasses', requirement: '10 day streak', unlocked: false },
  { name: 'Headphones', requirement: '25 calls completed', unlocked: false },
  { name: 'Halo', requirement: '100% honesty for 2 weeks', unlocked: false },
  { name: 'Witch Hat', requirement: 'Halloween special', unlocked: false },
  { name: 'Bandit Mask', requirement: 'Catch yourself in 5 excuses', unlocked: false },
  { name: 'Mustache', requirement: '50 day streak', unlocked: false },
  { name: 'Cap', requirement: 'Refer a friend', unlocked: false },
  { name: 'Classic', requirement: 'Default', unlocked: true },
  { name: 'Scarf', requirement: 'Winter special', unlocked: false },
];

export default function WitnessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-20 flex justify-between items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <WitnessLogo size="sm" showWordmark />
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="mb-8">
            <WitnessLogo size="4xl" animate={true} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            THE <span className="text-[#F97316]">WITNESS</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            Your accountability companion. It watches, remembers, and reflects your journey back at you. 
            The more honest you are, the more it evolves.
          </p>
        </div>
      </section>

      {/* Witness Forms */}
      <section className="py-20 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316]">Evolutions</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2">WITNESS FORMS</h2>
            <p className="text-white/40 mt-2">Unlock new forms as you prove your commitment.</p>
          </div>
          
          <div className="mb-8">
            <Image 
              src="/mascot.png" 
              alt="Witness Forms" 
              width={800} 
              height={400} 
              className="w-full max-w-3xl mx-auto rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WITNESS_FORMS.map((form, i) => (
              <div 
                key={i} 
                className={`p-6 border ${form.unlocked ? 'border-[#F97316]/30 bg-[#F97316]/5' : 'border-white/10'} relative`}
              >
                {!form.unlocked && (
                  <div className="absolute top-4 right-4">
                    <Lock size={16} className="text-white/30" />
                  </div>
                )}
                <h3 className={`font-black text-sm mb-2 ${form.unlocked ? 'text-[#F97316]' : 'text-white/50'}`}>
                  {form.name}
                </h3>
                <p className="text-xs text-white/40">{form.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessories */}
      <section className="py-20 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316]">Customization</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2">ACCESSORIES & SKINS</h2>
            <p className="text-white/40 mt-2">Dress up your Witness. Earn accessories through consistency.</p>
          </div>
          
          <div className="mb-8">
            <Image 
              src="/blob-accessories.png" 
              alt="Witness Accessories" 
              width={800} 
              height={600} 
              className="w-full max-w-3xl mx-auto rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {ACCESSORIES.map((acc, i) => (
              <div 
                key={i} 
                className={`p-4 border text-center ${acc.unlocked ? 'border-[#F97316]/30 bg-[#F97316]/5' : 'border-white/10'} relative`}
              >
                {!acc.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock size={12} className="text-white/30" />
                  </div>
                )}
                <h3 className={`font-bold text-xs mb-1 ${acc.unlocked ? 'text-[#F97316]' : 'text-white/50'}`}>
                  {acc.name}
                </h3>
                <p className="text-[10px] text-white/30">{acc.requirement}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lore */}
      <section className="py-20 px-6 md:px-12 border-t border-white/10 bg-[#F97316]">
        <div className="max-w-[800px] mx-auto text-center text-[#0A0A0A]">
          <h2 className="text-2xl md:text-3xl font-black mb-6">THE WITNESS NEVER LIES</h2>
          <p className="text-lg opacity-70 leading-relaxed mb-8">
            The Witness isn&apos;t here to judge you. It doesn&apos;t celebrate your wins or shame your failures. 
            It simply reflects the truth—what you said you&apos;d do, and whether you did it.
          </p>
          <p className="text-lg opacity-70 leading-relaxed">
            Over time, it learns your patterns. It knows when you&apos;re making excuses. 
            It knows when you&apos;re being honest. And slowly, it becomes a mirror for the person you&apos;re becoming.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-12 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-2xl md:text-3xl font-black mb-4">READY TO MEET YOUR WITNESS?</h2>
          <p className="text-white/50 mb-8">Start your accountability journey tonight.</p>
          <button 
            onClick={() => router.push('/onboarding')}
            className="bg-[#F97316] text-black font-black text-lg px-10 py-5 hover:bg-[#FB923C] transition-colors"
          >
            GET STARTED
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center">
        <p className="text-sm text-white/30">
          <button onClick={() => router.push('/')} className="hover:text-white transition-colors">
            Back to home
          </button>
        </p>
      </footer>
    </div>
  );
}
