
import React, { useState } from 'react';
import { Typewriter } from './Typewriter';

export const CommentarySection = ({ lines, onNext }: { lines: string[], onNext: () => void }) => {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);

    const handleLineComplete = () => {
        if (currentLineIndex < lines.length - 1) {
            setTimeout(() => {
                setCurrentLineIndex(prev => prev + 1);
            }, 800);
        } else {
            setTimeout(() => {
                onNext();
            }, 2000);
        }
    };

    return (
        <div className="space-y-8 text-left w-full max-w-2xl min-h-[300px] flex flex-col justify-center">
            {lines.map((line, i) => (
                i <= currentLineIndex && (
                    <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {i < currentLineIndex ? (
                            <span className="font-mono text-black text-xl md:text-2xl leading-relaxed font-medium opacity-50">
                                {line}
                            </span>
                        ) : (
                            <Typewriter 
                                text={line} 
                                speed={35} 
                                onComplete={handleLineComplete} 
                            />
                        )}
                    </div>
                )
            ))}
        </div>
    );
};
