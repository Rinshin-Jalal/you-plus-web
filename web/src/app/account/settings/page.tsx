'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { accountService, type UserProfile } from '@/services/account';
import paymentService, { type SubscriptionStatus } from '@/services/payment';

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

  useEffect(() => {
    loadProfile();
    loadPreferences();
    loadSubscription();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    const profileData = await accountService.getProfile();
    if (profileData) {
      setProfile(profileData);
      setName(profileData.name || '');
      setTimezone(profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    setIsLoading(false);
  };

  const loadPreferences = () => {
    const prefs = accountService.getPreferences();
    setTheme(prefs.theme);
    setNotifications(prefs.notifications);
  };

  const loadSubscription = async () => {
    const sub = await paymentService.getSubscriptionStatus();
    setSubscription(sub);
  };

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
      // Reload subscription to get updated info
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

  // Get list of common timezones
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
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/10 rounded w-1/4"></div>
        <div className="h-48 bg-white/10 rounded"></div>
        <div className="h-48 bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-white/20 text-white hover:bg-white/10">
          Back to Dashboard
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'border-white/20 bg-white/5 text-white'
              : 'border-red-600/50 bg-red-900/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <Card className="p-6 bg-[#111] border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white/50"
            />
            <p className="text-xs text-white/50 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz} className="bg-[#111] text-white">
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" onClick={handleSaveProfile} disabled={isSaving} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </Card>

      {/* Preferences Section */}
      <Card className="p-6 bg-[#111] border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="system" className="bg-[#111] text-white">System</option>
              <option value="light" className="bg-[#111] text-white">Light</option>
              <option value="dark" className="bg-[#111] text-white">Dark</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white text-sm">Notifications</p>
              <p className="text-white/50 text-xs">
                Receive push notifications for reminders
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? 'bg-[#F97316]' : 'bg-white/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <Button variant="primary" onClick={handleSavePreferences} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
            Save Preferences
          </Button>
        </div>
      </Card>

      {/* Subscription & Billing Section */}
      <Card className="p-6 bg-[#111] border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">Subscription & Billing</h2>
        
        {/* Current Subscription Info */}
        {subscription && (
          <div className="mb-4 p-4 border border-white/20 rounded-lg bg-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-white">
                  {subscription.planName || 'Current Plan'}
                </p>
                <p className="text-sm text-white/60">
                  Status: <span className={subscription.status === 'active' ? 'text-[#F97316]' : 'text-red-400'}>
                    {subscription.status}
                  </span>
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-white/60">
                    Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscription.amountCents && (
                <p className="text-lg font-bold text-white">
                  {formatPrice(subscription.amountCents, subscription.currency)}/mo
                </p>
              )}
            </div>
          </div>
        )}

        {/* Plan Selector */}
        {showPlanSelector && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium text-white">Change Plan</p>
              <button
                onClick={() => setShowPlanSelector(false)}
                className="text-white/60 hover:text-white text-sm"
              >
                Cancel
              </button>
            </div>
            
            {isLoadingPlans ? (
              <div className="animate-pulse space-y-2">
                <div className="h-16 bg-white/10 rounded"></div>
                <div className="h-16 bg-white/10 rounded"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => {
                  const isCurrentPlan = subscription?.planId === plan.id || subscription?.planId === plan.product_id;
                  const priceCents = plan.price_cents || plan.price || 0;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg ${
                        isCurrentPlan ? 'border-[#F97316] bg-[#F97316]/10' : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">
                            {plan.name}
                            {isCurrentPlan && (
                              <span className="ml-2 text-xs bg-[#F97316] text-white px-2 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-white/60">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">
                            {formatPrice(priceCents, plan.currency)}
                            <span className="text-sm font-normal text-white/60">
                              /{plan.interval || 'month'}
                            </span>
                          </p>
                          {!isCurrentPlan && subscription?.hasActiveSubscription && (
                            <Button
                              variant="outline"
                              onClick={() => handleChangePlan(plan.product_id || plan.id)}
                              disabled={isChangingPlan}
                              className="mt-2 text-sm border-white/20 text-white hover:bg-white/10"
                            >
                              {isChangingPlan ? 'Changing...' : 'Switch'}
                            </Button>
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

        {/* Action Buttons */}
        <div className="space-y-2">
          {subscription?.hasActiveSubscription && !showPlanSelector && (
            <Button
              variant="outline"
              onClick={handleShowPlanSelector}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Change Plan
            </Button>
          )}
          <Button variant="outline" onClick={handleManageBilling} className="w-full border-white/20 text-white hover:bg-white/10">
            Manage Billing & Payment Methods
          </Button>
        </div>
      </Card>

      {/* Sign Out */}
      <Card className="p-6 bg-[#111] border-white/20">
        <Button variant="outline" onClick={handleSignOut} className="w-full border-white/20 text-white hover:bg-white/10">
          Sign Out
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 bg-[#111] border-red-600/50">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-white/60 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        {showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="text-red-400 text-sm font-medium">
              Are you absolutely sure you want to delete your account?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-400 border-red-600/50 hover:bg-red-900/20"
          >
            Delete Account
          </Button>
        )}
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0D0D0D] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <SettingsContent />
        </div>
      </div>
    </AuthGuard>
  );
}
