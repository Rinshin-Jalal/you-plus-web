'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { storageService, type PushProgress, type PushResult } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { PhoneInput, isValidE164 } from '@/components/shared/PhoneInput';
import { apiClient } from '@/services/api';
import paymentService from '@/services/payment';
import { Phone, X, Check, RefreshCw, WifiOff, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';
import { FullPageLoader, SavingOverlay } from '@/components/ui/Loaders';
import { OnboardingMascot } from '@/components/onboarding/ui/OnboardingMascot';
import { formatCountdown } from '@/utils/retry';
import { analytics } from '@/services/analytics';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Setup Page - The gateway after onboarding
 * 
 * Flow:
 * 1. Check if authenticated → if not, redirect to /auth/login?next=/setup
 * 2. Check if subscribed → if not, redirect to /checkout
 * 3. Push onboarding data to backend (with engaging loading experience)
 * 4. Collect phone number
 * 5. Redirect to dashboard
 */

type SetupStep = 'checking' | 'pushing' | 'phone' | 'complete' | 'error';

// ═══════════════════════════════════════════════════════════════════════════
// ENGAGING LOADING MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

interface LoadingMessage {
  text: string;
  subtext?: string;
  duration: number; // ms to show this message
}

const LOADING_MESSAGES: LoadingMessage[] = [
  {
    text: "Creating your Future Self...",
    subtext: "The version of you that already won",
    duration: 3000
  },
  {
    text: "Learning your voice...",
    subtext: "So your Future Self sounds exactly like you",
    duration: 4000
  },
  {
    text: "Every champion was once a contender who refused to give up",
    duration: 3500
  },
  {
    text: "Mapping your transformation...",
    subtext: "From who you are to who you're becoming",
    duration: 3000
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    duration: 3500
  },
  {
    text: "Building your accountability system...",
    subtext: "No more letting yourself off the hook",
    duration: 3000
  },
  {
    text: "You're not starting from scratch. You're starting from experience.",
    duration: 3500
  },
  {
    text: "Preparing your daily check-ins...",
    subtext: "Small promises kept → Big transformations",
    duration: 3000
  },
  {
    text: "The only person you are destined to become is the person you decide to be",
    duration: 3500
  },
  {
    text: "Almost there...",
    subtext: "Your Future Self is ready to meet you",
    duration: 5000
  },
];

// Fun facts / micro-stories that appear and disappear
const MICRO_STORIES = [
  "Did you know? It takes 66 days on average to form a new habit.",
  "The word 'discipline' comes from 'disciple' — someone who learns.",
  "Navy SEALs say: 'When you think you're done, you're only 40% done.'",
  "James Clear wrote Atomic Habits while working a day job.",
  "Arnold visualized his success every single day for years.",
  "Kobe Bryant started practicing at 4am. Every. Single. Day.",
  "Your brain can't tell the difference between vivid imagination and reality.",
  "The compound effect: 1% better daily = 37x better in a year.",
  "Most people overestimate 1 year, underestimate 10 years.",
  "Warren Buffett reads 500 pages a day. He calls it 'compound knowledge.'",
];

// ═══════════════════════════════════════════════════════════════════════════
// ENGAGING LOADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface EngagingLoaderProps {
  isProcessing: boolean;
  progress?: PushProgress | null;
}

function EngagingLoader({ isProcessing, progress }: EngagingLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [microStoryIndex, setMicroStoryIndex] = useState(0);
  const [showMicroStory, setShowMicroStory] = useState(false);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [microFadeState, setMicroFadeState] = useState<'in' | 'out'>('in');
  const [dots, setDots] = useState('');

  // Cycle through main messages
  useEffect(() => {
    if (!isProcessing) return;

    const message = LOADING_MESSAGES[messageIndex];
    const duration = message?.duration || 3000;

    // Fade out before changing
    const fadeOutTimer = setTimeout(() => {
      setFadeState('out');
    }, duration - 500);

    // Change message
    const changeTimer = setTimeout(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      setFadeState('in');
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(changeTimer);
    };
  }, [messageIndex, isProcessing]);

  // Show micro stories periodically
  useEffect(() => {
    if (!isProcessing) return;

    const showStory = () => {
      setMicroStoryIndex(Math.floor(Math.random() * MICRO_STORIES.length));
      setShowMicroStory(true);
      setMicroFadeState('in');

      // Hide after 4 seconds
      setTimeout(() => {
        setMicroFadeState('out');
        setTimeout(() => setShowMicroStory(false), 500);
      }, 4000);
    };

    // Show first story after 5 seconds, then every 8 seconds
    const initialDelay = setTimeout(showStory, 5000);
    const interval = setInterval(showStory, 8000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [isProcessing]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const currentMessage = LOADING_MESSAGES[messageIndex];

  // Get progress step label
  const getProgressStepLabel = (step: PushProgress['step']) => {
    switch (step) {
      case 'validating': return 'Preparing data';
      case 'merging_audio': return 'Processing voice';
      case 'uploading': return 'Creating Future Self';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Processing';
    }
  };

  // Get progress percentage
  const getProgressPercentage = (step: PushProgress['step']) => {
    switch (step) {
      case 'validating': return 15;
      case 'merging_audio': return 40;
      case 'uploading': return 70;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F97316]/3 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse-slow" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Animated mascot */}
        <div className="mb-12 relative flex justify-center">
          <OnboardingMascot
            expression="encouraging"
            size="xl"
            animate={true}
          />
        </div>

        {/* Main message */}
        <div
          className={`transition-all duration-500 ${fadeState === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {currentMessage?.text}
            {currentMessage?.text.endsWith('...') ? '' : dots}
          </h1>
          {currentMessage?.subtext && (
            <p className="text-white/50 text-lg">
              {currentMessage.subtext}
            </p>
          )}
        </div>

        {/* Progress steps indicator */}
        {progress && (
          <div className="mt-8 mb-4">
            <div className="flex justify-center gap-2 mb-3">
              {['validating', 'merging_audio', 'uploading'].map((stepName, idx) => {
                const stepOrder = ['validating', 'merging_audio', 'uploading'];
                const currentStepIndex = stepOrder.indexOf(progress.step);
                const isComplete = idx < currentStepIndex || progress.step === 'complete';
                const isCurrent = progress.step === stepName;
                
                return (
                  <div key={stepName} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full transition-colors ${
                        isComplete ? 'bg-[#F97316]' :
                        isCurrent ? 'bg-[#F97316] animate-pulse' :
                        'bg-white/20'
                      }`}
                    />
                    {idx < 2 && <div className={`w-8 h-0.5 ${isComplete ? 'bg-[#F97316]' : 'bg-white/20'}`} />}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-white/60">
              {getProgressStepLabel(progress.step)}
              {progress.attempt && progress.maxAttempts && progress.attempt > 1 && (
                <span className="text-white/40 ml-2">
                  (Attempt {progress.attempt}/{progress.maxAttempts})
                </span>
              )}
            </p>
            {progress.retryingIn && (
              <p className="text-xs text-[#F97316] mt-1">
                Retrying in {formatCountdown(progress.retryingIn)}...
              </p>
            )}
            {progress.isOffline && (
              <div className="flex items-center justify-center gap-2 mt-2 text-yellow-500">
                <WifiOff size={14} />
                <span className="text-xs">Waiting for connection...</span>
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-12 w-full max-w-xs mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            {progress ? (
              <div 
                className="h-full bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage(progress.step)}%` }}
              />
            ) : (
              <div className="h-full bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full animate-progress" />
            )}
          </div>
        </div>

        {/* Micro story popup */}
        {showMicroStory && (
          <div
            className={`mt-12 p-4 bg-white/5 border border-white/10 rounded-lg transition-all duration-500 ${microFadeState === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <p className="text-white/70 text-sm italic">
              "{MICRO_STORIES[microStoryIndex]}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-[#F97316] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 20px) scale(0.9); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes progress {
          0% { width: 0%; }
          10% { width: 15%; }
          30% { width: 35%; }
          50% { width: 55%; }
          70% { width: 70%; }
          90% { width: 85%; }
          100% { width: 95%; }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 12s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }
        .animate-progress {
          animation: progress 30s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { loading: subLoading, isActive, onboardingCompleted } = useSubscription();

  const [step, setStep] = useState<SetupStep>('checking');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushAttempted, setPushAttempted] = useState(false);
  
  // Enhanced state for resilient UX
  const [pushProgress, setPushProgress] = useState<PushProgress | null>(null);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  
  // Analytics tracking
  const hasTrackedStart = useRef(false);
  const setupStartTime = useRef<number>(Date.now());

  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-retry if we were in error state due to network
      if (step === 'error' && pushResult?.errorCode === 'network') {
        handleRetry();
      }
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [step, pushResult?.errorCode]);

  // Step 1: Check authentication
  useEffect(() => {
    if (authLoading) return; // Still loading auth

    if (!isAuthenticated) {
      // Not logged in → redirect to auth with return URL
      const returnUrl = encodeURIComponent('/setup');
      router.replace(`/auth/login?next=${returnUrl}`);
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // Step 2: Check subscription and onboarding status (only after auth is confirmed)
  useEffect(() => {
    if (authLoading || subLoading) return; // Still loading
    if (!isAuthenticated) return; // Not authenticated, will redirect above

    const hasLocalData = storageService.hasOnboardingData();

    // If already onboarded on backend and no local data, go straight to dashboard
    if (onboardingCompleted && !hasLocalData && isActive) {
      if (isDev) console.log('[Setup] Already onboarded and subscribed, redirecting to dashboard');
      router.replace('/dashboard');
      return;
    }

    if (isDev) {
      console.log('Is active:', isActive);
      console.log('Is onboarding completed:', onboardingCompleted);
      console.log('Has local data:', hasLocalData);
    }


    if (!isActive) {
      if (isDev) console.log('[Setup] Not subscribed, redirecting to checkout');

      if (hasLocalData) {
        router.replace('/checkout/welcome');
      } else {
        router.replace('/checkout');
      }
      return;
    }

    // Auth + subscription confirmed → proceed to push data
    if (step === 'checking') {
      // Track setup started (only once)
      if (!hasTrackedStart.current) {
        analytics.setupStarted();
        setupStartTime.current = Date.now();
        hasTrackedStart.current = true;
      }
      setStep('pushing');
    }
  }, [isAuthenticated, authLoading, subLoading, isActive, onboardingCompleted, step, router]);

  // Step 3: Push onboarding data to backend with progress tracking
  useEffect(() => {
    if (step !== 'pushing' || pushAttempted) return;

    const pushData = async () => {
      setPushAttempted(true);
      setPushProgress(null);
      setPushResult(null);

      try {
        // Check if there's onboarding data to push
        if (storageService.hasOnboardingData()) {
          if (isDev) console.log('[Setup] Pushing onboarding data to backend...');

          const result = await storageService.pushOnboardingData({
            onProgress: (progress) => {
              setPushProgress(progress);
              if (isDev) console.log('[Setup] Progress:', progress);
            },
            maxRetries: 3,
          });

          setPushResult(result);

          if (!result.success) {
            console.error('[Setup] Failed to push onboarding data:', result.error);
            analytics.setupFailed(result.error || 'Push failed');
            setError(result.error || 'Failed to save your data. Please try again.');
            setStep('error');
            return;
          }

          if (isDev) console.log('[Setup] Onboarding data pushed successfully');
        } else {
          if (isDev) console.log('[Setup] No onboarding data to push');
        }

        // Move to phone collection
        setStep('phone');
      } catch (err) {
        console.error('[Setup] Error pushing data:', err);
        analytics.setupFailed(err instanceof Error ? err.message : 'Unknown error');
        setError('Something went wrong. Please try again.');
        setStep('error');
      }
    };

    pushData();
  }, [step, pushAttempted]);

  const handlePhoneSubmit = async () => {
    // Validate phone number
    if (!phoneNumber) {
      setPhoneError('Please enter your phone number');
      return;
    }

    if (!isValidE164(phoneNumber)) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    setPhoneError(null);
    setSaving(true);

    try {
      // Save phone number to backend
      await apiClient.put('/api/settings/phone', {
        phone_number: phoneNumber,
      });

      setStep('complete');
      
      // Track setup completed
      const durationSeconds = Math.round((Date.now() - setupStartTime.current) / 1000);
      analytics.setupCompleted(durationSeconds);
      
      // Redirect to dashboard after a brief moment
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error saving phone number:', error);
      setPhoneError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = useCallback(() => {
    setError(null);
    setPushAttempted(false);
    setPushProgress(null);
    setPushResult(null);
    setRetryCount(prev => prev + 1);
    setStep('pushing');
  }, []);

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const portalUrl = await paymentService.getCustomerPortalUrl();
      if (portalUrl) {
        window.open(portalUrl, '_blank');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // Get contextual error help based on error type
  const getErrorHelp = () => {
    if (!pushResult) return null;
    
    switch (pushResult.errorCode) {
      case 'network':
        return {
          icon: WifiOff,
          title: 'Connection Issue',
          description: 'Please check your internet connection and try again.',
          showPortalLink: false,
        };
      case 'timeout':
        return {
          icon: AlertCircle,
          title: 'Request Timed Out',
          description: 'The server is taking too long to respond. This might be due to heavy load.',
          showPortalLink: false,
        };
      case 'server':
        return {
          icon: AlertCircle,
          title: 'Server Issue',
          description: 'Our servers are experiencing issues. Please try again in a few minutes.',
          showPortalLink: true,
        };
      case 'validation':
        return {
          icon: AlertCircle,
          title: 'Incomplete Data',
          description: 'Some required information is missing. You may need to complete onboarding again.',
          showPortalLink: false,
        };
      default:
        return {
          icon: X,
          title: 'Something Went Wrong',
          description: error || 'We couldn\'t save your data. Please try again.',
          showPortalLink: true,
        };
    }
  };

  // Loading states
  if (authLoading || subLoading || step === 'checking') {
    const message =
      authLoading ? 'Checking authentication...' :
        subLoading ? 'Checking subscription...' :
          'Setting up...';

    return <FullPageLoader message={message} />;
  }

  // Engaging loader for the 'pushing' step (voice cloning, transcription, etc.)
  if (step === 'pushing') {
    return <EngagingLoader isProcessing={true} progress={pushProgress} />;
  }

  // Error state with improved UI
  if (step === 'error') {
    const errorHelp = getErrorHelp();
    const ErrorIcon = errorHelp?.icon || X;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
        <div className="max-w-md w-full text-center">
          {/* Offline banner */}
          {!isOnline && (
            <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-center gap-2">
              <WifiOff size={16} className="text-yellow-500" />
              <span className="text-yellow-500 text-sm">You're offline. Waiting for connection...</span>
            </div>
          )}
          
          <div className="w-20 h-20 border border-white/30 flex items-center justify-center mx-auto mb-6 rounded-lg">
            <ErrorIcon className="w-10 h-10 text-white/70" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {errorHelp?.title || 'Something went wrong'}
          </h1>
          
          <p className="text-white/60 mb-2">
            {errorHelp?.description}
          </p>
          
          {retryCount > 0 && (
            <p className="text-white/40 text-sm mb-6">
              Attempt {retryCount + 1} of retrying
            </p>
          )}
          
          {/* Retry info */}
          {pushResult?.isRetryable && (
            <p className="text-[#F97316]/80 text-sm mb-6">
              Don't worry, your data is saved locally and we can try again.
            </p>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              disabled={!isOnline}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={!isOnline ? 'animate-spin opacity-50' : ''} />
              {!isOnline ? 'Waiting for connection...' : 'Try Again'}
            </Button>
            
            {/* Portal link for billing issues */}
            {errorHelp?.showPortalLink && (
              <button
                onClick={handleOpenBillingPortal}
                disabled={isOpeningPortal}
                className="w-full py-3 border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2 rounded"
              >
                <CreditCard size={16} />
                {isOpeningPortal ? 'Opening...' : 'Check Billing Status'}
                <ExternalLink size={14} className="opacity-50" />
              </button>
            )}
            
            {/* Contact support for persistent issues */}
            {retryCount >= 2 && (
              <p className="text-white/40 text-xs mt-4">
                Still having trouble?{' '}
                <a 
                  href="mailto:support@youplus.app" 
                  className="text-[#F97316] hover:underline"
                >
                  Contact support
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      {saving && <SavingOverlay message="Saving your phone..." />}
      <div className="max-w-md w-full">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {['phone', 'complete'].map((s, idx) => (
            <div
              key={s}
              className={`h-2 w-16 rounded transition-colors ${step === s
                ? 'bg-[#F97316]'
                : ['phone', 'complete'].indexOf(step) > idx
                  ? 'bg-[#F97316]/50'
                  : 'bg-white/20'
                }`}
            />
          ))}
        </div>

        {/* Step: Phone Number */}
        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <OnboardingMascot
                  expression="listening"
                  size="lg"
                  animate={true}
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Almost There!
              </h1>
              <p className="text-white/60">
                Add your phone number so your Future Self can call you.
              </p>
            </div>

            <div className="mb-6">
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="Enter your number"
                error={phoneError || undefined}
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePhoneSubmit}
                disabled={saving}
                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Continue'
                )}
              </Button>

            </div>

            <p className="mt-6 text-center text-xs text-white/40">
              We'll only use this for your accountability calls. No spam, ever.
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                <OnboardingMascot
                  expression="proud"
                  size="lg"
                  animate={true}
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                You're All Set!
              </h1>
              <p className="text-white/60 mb-2">
                Your Future Self will call you at your scheduled time.
              </p>
              <p className="text-white/50 text-sm">
                Redirecting to dashboard...
              </p>
            </div>

            <div className="animate-pulse">
              <div className="h-1 w-32 bg-white/20 mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
