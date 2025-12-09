'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { WitnessLogo } from '@/components/ui/WitnessLogo';

interface Question {
    id: string;
    question: string;
    type: 'text' | 'slider' | 'time';
    placeholder?: string;
    min?: number;
    max?: number;
    default?: number | string;
}

interface PersonalizedContent {
    welcomeMessage: string;
    summaryOfPast: string | null;
    questions: Question[];
    encouragement: string;
}

interface ReturningUserData {
    success: boolean;
    isReturningUser: boolean;
    history: {
        name: string;
        previousGoal: string | null;
        daysSinceActive: number | null;
    };
    personalized: PersonalizedContent;
}

export default function ReturningUserOnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ReturningUserData | null>(null);
    const [step, setStep] = useState<'welcome' | 'questions' | 'complete'>('welcome');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReturningUserData();
    }, []);

    const fetchReturningUserData = async () => {
        try {
            const response = await apiClient.get<ReturningUserData>('/api/onboarding/returning');
            setData(response);
            
            // Set default values for answers
            const defaults: Record<string, string | number> = {};
            response.personalized.questions.forEach(q => {
                if (q.default !== undefined) {
                    defaults[q.id] = q.default;
                }
            });
            setAnswers(defaults);
        } catch (err) {
            console.error('Failed to fetch returning user data:', err);
            setError('Failed to load your personalized experience. Redirecting...');
            // Fallback to regular onboarding
            setTimeout(() => router.push('/onboarding'), 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuestions = () => {
        setStep('questions');
    };

    const handleNextQuestion = () => {
        if (!data) return;
        
        if (questionIndex < data.personalized.questions.length - 1) {
            setQuestionIndex(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setSubmitting(true);
        try {
            // Save answers to backend
            await apiClient.post('/api/onboarding/conversion/complete', {
                answers,
                isReturningUser: true,
            });
            setStep('complete');
            // Redirect to dashboard after brief celebration
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (err) {
            console.error('Failed to save onboarding:', err);
            // Still go to dashboard
            router.push('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
                <GrainOverlay />
                <div className="text-center relative z-10">
                    <div className="mb-6">
                        <WitnessLogo size="lg" animate={true} />
                    </div>
                    <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/50 text-sm">Preparing your welcome back...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
                <GrainOverlay />
                <div className="text-center relative z-10">
                    <p className="text-red-400 mb-4">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { personalized, history } = data;
    const currentQuestion = personalized.questions[questionIndex];

    return (
        <div className="fixed inset-0 bg-[#0A0A0A] text-white font-sans flex flex-col z-[100]">
            <GrainOverlay />

            {/* Header */}
            <div className="relative z-10 px-6 md:px-12 h-16 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-6">
                    <WitnessLogo size="xs" showWordmark />
                    {step === 'questions' && (
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="h-0.5 w-20 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#F97316] transition-all duration-500 ease-out" 
                                    style={{ width: `${((questionIndex + 1) / personalized.questions.length) * 100}%` }} 
                                />
                            </div>
                            <span className="text-xs text-white/40">
                                {questionIndex + 1}/{personalized.questions.length}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-grow overflow-y-auto flex flex-col items-center justify-center px-6 max-w-xl mx-auto w-full">
                
                {/* Welcome Step */}
                {step === 'welcome' && (
                    <div className="text-center animate-fade-in">
                        <div className="mb-8">
                            <WitnessLogo size="lg" animate={true} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-6">
                            {personalized.welcomeMessage}
                        </h1>
                        
                        {personalized.summaryOfPast && (
                            <p className="text-base text-white/60 mb-6">
                                {personalized.summaryOfPast}
                            </p>
                        )}

                        {history.daysSinceActive && (
                            <p className="text-sm text-white/40 mb-10">
                                It&apos;s been {history.daysSinceActive} days. Let&apos;s get back on track.
                            </p>
                        )}

                        <Button 
                            variant="accent" 
                            onClick={handleStartQuestions}
                        >
                            LET&apos;S GO
                        </Button>
                    </div>
                )}

                {/* Questions Step */}
                {step === 'questions' && currentQuestion && (
                    <div className="w-full text-center animate-fade-in" key={currentQuestion.id}>
                        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-white">
                            {currentQuestion.question}
                        </h2>

                        {currentQuestion.type === 'text' && (
                            <input
                                type="text"
                                className="w-full bg-transparent border-b-4 border-white/10 py-4 text-2xl md:text-3xl text-white focus:outline-none focus:border-[#F97316] text-center transition-colors"
                                placeholder={currentQuestion.placeholder}
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleNextQuestion()}
                                autoFocus
                            />
                        )}

                        {currentQuestion.type === 'slider' && (
                            <div className="w-full max-w-md mx-auto">
                                <div className="text-6xl font-bold mb-8 text-white">
                                    {answers[currentQuestion.id] || currentQuestion.default || currentQuestion.min}
                                    <span className="text-2xl text-white/40 ml-2">min</span>
                                </div>
                                <input
                                    type="range"
                                    min={currentQuestion.min}
                                    max={currentQuestion.max}
                                    value={answers[currentQuestion.id] || currentQuestion.default || currentQuestion.min}
                                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#F97316] [&::-webkit-slider-thumb]:rounded-full"
                                />
                                <div className="flex justify-between text-sm text-white/40 mt-2">
                                    <span>{currentQuestion.min} min</span>
                                    <span>{currentQuestion.max} min</span>
                                </div>
                            </div>
                        )}

                        {currentQuestion.type === 'time' && (
                            <input
                                type="time"
                                className="bg-transparent border-b-4 border-white/10 py-4 text-4xl text-white focus:outline-none focus:border-[#F97316] text-center transition-colors"
                                value={answers[currentQuestion.id] || currentQuestion.default || '21:00'}
                                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                            />
                        )}

                        <Button 
                            variant="accent" 
                            onClick={handleNextQuestion}
                            className="mt-12 min-w-[200px]"
                            disabled={submitting}
                        >
                            {questionIndex < personalized.questions.length - 1 ? 'Next' : 'Complete'}
                        </Button>
                    </div>
                )}

                {/* Complete Step */}
                {step === 'complete' && (
                    <div className="text-center animate-fade-in">
                        <div className="mb-8">
                            <WitnessLogo size="2xl" animate={true} />
                        </div>
                        <div className="w-20 h-20 bg-[#F97316] text-[#0A0A0A] flex items-center justify-center mx-auto mb-8 rounded-full">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                            Welcome Back!
                        </h2>
                        <p className="text-lg text-white/60">
                            {personalized.encouragement}
                        </p>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
