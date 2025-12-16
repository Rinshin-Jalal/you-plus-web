'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { accountService, type UserProfile } from '@/services/account';
import paymentService, { type SubscriptionStatus } from '@/services/payment';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { WitnessLogo } from '@/components/ui/WitnessLogo';

interface Plan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  price_cents: number;
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
  is_recurring: boolean;
  features: string[];
}

function SettingsContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState(true);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    const profileData = await accountService.getProfile();
    if (profileData) {
      setProfile(profileData);
      setName(profileData.name || '');
      setTimezone(profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    setIsLoading(false);
  }, []);

  const loadPreferences = useCallback(() => {
    const prefs = accountService.getPreferences();
    setTheme(prefs.theme);
    setNotifications(prefs.notifications);
  }, []);

  const loadSubscription = useCallback(async () => {
    const sub = await paymentService.getSubscriptionStatus();
    setSubscription(sub);
  }, []);

  useEffect(() => {
    loadProfile();
    loadPreferences();
    loadSubscription();
  }, [loadProfile, loadPreferences, loadSubscription]);

  // If we have a subscription, preload plans so we can show the correct interval label (/wk, /6mo, etc.)
  useEffect(() => {
    if (!subscription) return;
    if (plans.length > 0) return;
    // Fire and forget
    void (async () => {
      await loadPlans();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription]);

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    const fetchedPlans = await paymentService.getPlans();
    setPlans(fetchedPlans as Plan[]);
    setIsLoadingPlans(false);
  };

  const handleShowPlanSelector = async () => {
    if (plans.length === 0) {
      await loadPlans();
    }
    setShowPlanSelector(true);
  };

  const handleChangePlan = async (newPlanId: string) => {
    setIsChangingPlan(true);
    setMessage(null);

    const result = await paymentService.changePlan(newPlanId);

    if (result.success) {
      setMessage({ type: 'success', text: `Plan changed to ${result.newPlan?.name || 'new plan'} successfully!` });
      setShowPlanSelector(false);
      await loadSubscription();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to change plan' });
    }

    setIsChangingPlan(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    const result = await accountService.updateProfile({ name, timezone });

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }

    setIsSaving(false);
  };

  const handleSavePreferences = () => {
    accountService.savePreferences({ theme, notifications });
    setMessage({ type: 'success', text: 'Preferences saved' });
  };

  const handleSignOut = async () => {
    const result = await accountService.signOut();
    if (result.success) {
      router.push('/auth/login');
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to sign out' });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const result = await accountService.deleteAccount();

    if (result.success) {
      router.push('/auth/login');
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete account' });
      setShowDeleteConfirm(false);
    }
    setIsDeleting(false);
  };

  const handleManageBilling = async () => {
    try {
      const portalUrl = await paymentService.getCustomerPortalUrl();
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        setMessage({ type: 'error', text: 'Unable to open billing portal. Please try again.' });
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      setMessage({ type: 'error', text: 'Failed to open billing portal' });
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getPlanIntervalLabel = (p?: Partial<Plan> | null) => {
    if (!p) return null;
    const interval = p.interval;
    const count = p.interval_count ?? 1;
    if (interval === 'week') return 'wk';
    if (interval === 'month' && count === 6) return '6mo';
    if (interval === 'month') return 'mo';
    if (interval === 'year') return 'yr';
    return interval || null;
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative">
      <GrainOverlay />
      
      {/* Navigation */}
      <nav className="border-b border-white/10 relative z-10">
        <div className="max-w-[800px] mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </Link>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316]">
            Account
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 text-white">
            SETTINGS
          </h1>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-8 p-4 border ${
            message.type === 'success' 
              ? 'border-white/30 bg-white/5' 
              : 'border-red-500/50 bg-red-500/10'
          }`}>
            <p className={message.type === 'success' ? 'text-white' : 'text-red-400'}>
              {message.text}
            </p>
          </div>
        )}

        <div className="space-y-8">
          
          {/* Profile Section */}
          <section className="border border-white/10 p-8">
            <h2 className="text-lg font-black uppercase tracking-wide mb-6">Profile</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-white/50 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full p-4 border border-white/10 bg-white/5 text-white/50"
                />
                <p className="text-xs text-white/40 mt-2">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-white/50 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full p-4 border border-white/20 bg-[#0A0A0A] text-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-white/50 mb-2">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-4 border border-white/20 bg-[#0A0A0A] text-white focus:outline-none focus:border-[#F97316]"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#0A0A0A]">
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-[#F97316] text-black py-4 px-8 font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="border border-white/10 p-8">
            <h2 className="text-lg font-black uppercase tracking-wide mb-6">Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-white/50 mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full p-4 border border-white/20 bg-[#0A0A0A] text-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="system" className="bg-[#0A0A0A]">System</option>
                  <option value="light" className="bg-[#0A0A0A]">Light</option>
                  <option value="dark" className="bg-[#0A0A0A]">Dark</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-white/10">
                <div>
                  <p className="font-bold text-white">Notifications</p>
                  <p className="text-sm text-white/50">Receive push notifications for reminders</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-14 h-8 transition-colors ${
                    notifications ? 'bg-[#F97316]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white transition-transform ${
                      notifications ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleSavePreferences}
                className="bg-[#F97316] text-black py-4 px-8 font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="border border-white/10 p-8">
            <h2 className="text-lg font-black uppercase tracking-wide mb-6">Subscription & Billing</h2>
            
            {subscription && (
              <div className="mb-6 p-6 border border-white/20 bg-white/5">
                {(() => {
                  const currentPlan = plans.find(
                    (p) => subscription.planId === p.id || subscription.planId === p.product_id
                  );
                  const suffix = getPlanIntervalLabel(currentPlan);
                  return (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white text-lg">
                      {subscription.planName || 'Current Plan'}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      Status:{' '}
                      <span className={subscription.status === 'active' ? 'text-[#F97316]' : 'text-red-400'}>
                        {subscription.status?.toUpperCase()}
                      </span>
                    </p>
                    {subscription.currentPeriodEnd && (
                      <p className="text-sm text-white/60">
                        Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {subscription.amountCents && (
                    <p className="text-2xl font-black text-white">
                      {formatPrice(subscription.amountCents, subscription.currency)}
                      {suffix && <span className="text-sm font-normal text-white/50">/{suffix}</span>}
                    </p>
                  )}
                </div>
                  );
                })()}
              </div>
            )}

            {showPlanSelector && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-bold text-white">Change Plan</p>
                  <button
                    onClick={() => setShowPlanSelector(false)}
                    className="text-white/60 hover:text-white text-sm uppercase tracking-wide"
                  >
                    Cancel
                  </button>
                </div>
                
                {isLoadingPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map((plan) => {
                      const isCurrentPlan = subscription?.planId === plan.id || subscription?.planId === plan.product_id;
                      const priceCents = plan.price_cents || plan.price || 0;
                      const suffix = getPlanIntervalLabel(plan);
                      
                      return (
                        <div
                          key={plan.id}
                          className={`p-5 border ${
                            isCurrentPlan 
                              ? 'border-[#F97316] bg-white/5' 
                              : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-white flex items-center gap-3">
                                {plan.name}
                                {isCurrentPlan && (
                                  <span className="text-xs bg-[#F97316] text-black px-2 py-1 font-bold uppercase">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-white/60">{plan.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-white text-xl">
                                {formatPrice(priceCents, plan.currency)}
                                <span className="text-sm font-normal text-white/50">
                                  {suffix ? `/${suffix}` : ''}
                                </span>
                              </p>
                              {!isCurrentPlan && subscription?.hasActiveSubscription && (
                                <button
                                  onClick={() => handleChangePlan(plan.product_id || plan.id)}
                                  disabled={isChangingPlan}
                                  className="mt-2 text-sm border border-white/20 px-4 py-2 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                  {isChangingPlan ? 'Changing...' : 'Switch'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {subscription?.hasActiveSubscription && !showPlanSelector && (
                <button
                  onClick={handleShowPlanSelector}
                  className="w-full py-4 border border-white/20 text-white font-bold uppercase tracking-wide hover:bg-white/5 transition-colors"
                >
                  Change Plan
                </button>
              )}
              <button
                onClick={handleManageBilling}
                className="w-full py-4 border border-white/20 text-white font-bold uppercase tracking-wide hover:bg-white/5 transition-colors"
              >
                Manage Billing & Payment Methods
              </button>
            </div>
          </section>

          {/* Sign Out Section */}
          <section className="border border-white/10 p-8">
            <h2 className="text-lg font-black uppercase tracking-wide mb-6">Sign Out</h2>
            
            {showSignOutConfirm ? (
              <div className="space-y-4">
                <p className="text-white/60">Are you sure you want to sign out?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="py-4 px-8 border border-white/20 text-white font-bold uppercase tracking-wide hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="py-4 px-8 bg-[#F97316] text-black font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors"
                  >
                    Yes, Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full py-4 border border-white/20 text-white font-bold uppercase tracking-wide hover:bg-white/5 transition-colors"
              >
                Sign Out
              </button>
            )}
          </section>

          {/* Danger Zone */}
          <section className="border border-red-500/50 p-8">
            <h2 className="text-lg font-black uppercase tracking-wide mb-2 text-red-400">Danger Zone</h2>
            <p className="text-white/60 text-sm mb-6">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-red-400 font-bold">
                  Are you absolutely sure you want to delete your account?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="py-4 px-8 border border-white/20 text-white font-bold uppercase tracking-wide hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="py-4 px-8 bg-red-600 text-white font-bold uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="py-4 px-8 border border-red-500/50 text-red-400 font-bold uppercase tracking-wide hover:bg-red-500/10 transition-colors"
              >
                Delete Account
              </button>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
