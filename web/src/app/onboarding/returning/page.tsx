'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';

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
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <GrainOverlay />
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-mono text-black/60">Preparing your welcome back...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <GrainOverlay />
                <div className="text-center">
                    <p className="font-mono text-red-500 mb-4">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { personalized, history } = data;
    const currentQuestion = personalized.questions[questionIndex];

    return (
        <div className="fixed inset-0 bg-white text-black font-sans flex flex-col z-[100]">
            <GrainOverlay />

            {/* Header */}
            <div className="relative z-10 px-8 py-8 flex justify-between items-center bg-white/90 backdrop-blur-sm border-b border-black/5">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                        <span className="font-mono font-bold text-sm">
                            {step === 'welcome' ? 'HI' : step === 'complete' ? '!' : questionIndex + 1}
                        </span>
                    </div>
                    {step === 'questions' && (
                        <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-black transition-all duration-500 ease-out" 
                                style={{ width: `${((questionIndex + 1) / personalized.questions.length) * 100}%` }} 
                            />
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => router.push('/dashboard')} 
                    className="text-xs font-mono font-bold text-black/30 hover:text-black uppercase tracking-widest transition-colors"
                >
                    Skip
                </button>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-grow overflow-y-auto flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full">
                
                {/* Welcome Step */}
                {step === 'welcome' && (
                    <div className="text-center animate-fade-in">
                        <h1 className="font-mono text-3xl md:text-4xl font-bold mb-6">
                            {personalized.welcomeMessage}
                        </h1>
                        
                        {personalized.summaryOfPast && (
                            <p className="font-mono text-lg text-black/60 mb-8">
                                {personalized.summaryOfPast}
                            </p>
                        )}

                        {history.daysSinceActive && (
                            <p className="font-mono text-sm text-black/40 mb-12">
                                It&apos;s been {history.daysSinceActive} days. Let&apos;s get back on track.
                            </p>
                        )}

                        <Button 
                            variant="primary" 
                            onClick={handleStartQuestions}
                            className="min-w-[200px]"
                        >
                            Let&apos;s Go
                        </Button>
                    </div>
                )}

                {/* Questions Step */}
                {step === 'questions' && currentQuestion && (
                    <div className="w-full text-center animate-fade-in" key={currentQuestion.id}>
                        <h2 className="font-mono text-2xl md:text-3xl font-medium mb-12">
                            {currentQuestion.question}
                        </h2>

                        {currentQuestion.type === 'text' && (
                            <input
                                type="text"
                                className="w-full bg-transparent border-b-4 border-black/10 py-4 text-2xl md:text-3xl font-mono text-black focus:outline-none focus:border-black text-center"
                                placeholder={currentQuestion.placeholder}
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleNextQuestion()}
                                autoFocus
                            />
                        )}

                        {currentQuestion.type === 'slider' && (
                            <div className="w-full max-w-md mx-auto">
                                <div className="text-6xl font-mono font-bold mb-8">
                                    {answers[currentQuestion.id] || currentQuestion.default || currentQuestion.min}
                                    <span className="text-2xl text-black/40 ml-2">min</span>
                                </div>
                                <input
                                    type="range"
                                    min={currentQuestion.min}
                                    max={currentQuestion.max}
                                    value={answers[currentQuestion.id] || currentQuestion.default || currentQuestion.min}
                                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-black/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full"
                                />
                                <div className="flex justify-between text-sm font-mono text-black/40 mt-2">
                                    <span>{currentQuestion.min} min</span>
                                    <span>{currentQuestion.max} min</span>
                                </div>
                            </div>
                        )}

                        {currentQuestion.type === 'time' && (
                            <input
                                type="time"
                                className="bg-transparent border-b-4 border-black/10 py-4 text-4xl font-mono text-black focus:outline-none focus:border-black text-center"
                                value={answers[currentQuestion.id] || currentQuestion.default || '21:00'}
                                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                            />
                        )}

                        <Button 
                            variant="primary" 
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
                        <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-8 rounded-full">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="font-mono text-2xl md:text-3xl font-bold mb-4">
                            Welcome Back!
                        </h2>
                        <p className="font-mono text-lg text-black/60">
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
