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
        
        // Auto-advance after 2 seconds
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
            <div className="mb-6">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-black/40">
                    Act {act} of 7
                </span>
            </div>
            
            {/* Title */}
            <h1 className="font-display font-extrabold text-4xl md:text-6xl uppercase tracking-tight mb-4 text-black">
                {title}
            </h1>
            
            {/* Subtitle */}
            {subtitle && (
                <p className="font-mono text-lg md:text-xl text-black/40">
                    {subtitle}
                </p>
            )}
            
            {/* Decorative line */}
            <div className="mt-8 w-24 h-1 rounded-full bg-black" />
        </div>
    );
}
