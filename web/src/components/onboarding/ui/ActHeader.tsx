import React, { useEffect, useState } from 'react';

interface ActHeaderProps {
    act: number;
    title: string;
    subtitle?: string;
    onNext: () => void;
}

export function ActHeader({ act, title, subtitle, onNext }: ActHeaderProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        const showTimer = setTimeout(() => setIsVisible(true), 100);
        
        // Auto-advance after 2.5 seconds
        const advanceTimer = setTimeout(() => {
            onNext();
        }, 2500);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(advanceTimer);
        };
    }, [onNext]);

    return (
        <div className={`flex flex-col items-center justify-center text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
            {/* Act number */}
            <div className="mb-4">
                <span className="text-xs uppercase tracking-[0.3em] text-[#F97316]">
                    Act {act} of 7
                </span>
            </div>
            
            {/* Title */}
            <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tight mb-4 text-white">
                {title}
            </h1>
            
            {/* Subtitle */}
            {subtitle && (
                <p className="text-base text-white/50 max-w-md">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
