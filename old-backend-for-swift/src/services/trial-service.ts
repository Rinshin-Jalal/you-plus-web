/**
 * Trial Service
 * 
 * Handles all trial-related business logic including:
 * - Checking if user is in active trial
 * - Calculating days remaining
 * - Starting trials for new users
 * - Checking if trial has expired
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface TrialStatus {
  inTrial: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  daysRemaining: number;
  isExpired: boolean;
}

export class TrialService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Check if user is currently in an active trial period
   */
  async checkTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('trial_start_date, trial_end_date')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching trial status:', error);
        return {
          inTrial: false,
          trialStartDate: null,
          trialEndDate: null,
          daysRemaining: 0,
          isExpired: false,
        };
      }

      const { trial_start_date, trial_end_date } = data;

      // No trial dates means never been in trial
      if (!trial_start_date || !trial_end_date) {
        return {
          inTrial: false,
          trialStartDate: null,
          trialEndDate: null,
          daysRemaining: 0,
          isExpired: false,
        };
      }

      const now = new Date();
      const endDate = new Date(trial_end_date);
      const inTrial = endDate > now;
      const daysRemaining = inTrial
        ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        inTrial,
        trialStartDate: trial_start_date,
        trialEndDate: trial_end_date,
        daysRemaining,
        isExpired: !inTrial && trial_end_date !== null,
      };
    } catch (error) {
      console.error('Trial service error:', error);
      throw error;
    }
  }

  /**
   * Start a trial for a new user (7 days from now)
   */
  async startTrial(userId: string, durationDays: number = 7): Promise<void> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { error } = await this.supabase
        .from('users')
        .update({
          trial_start_date: startDate.toISOString(),
          trial_end_date: endDate.toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error starting trial:', error);
        throw error;
      }

      console.log(`✅ Trial started for user ${userId}: ${durationDays} days`);
    } catch (error) {
      console.error('Start trial error:', error);
      throw error;
    }
  }

  /**
   * Check if user has access (either active trial OR active subscription)
   */
  async hasAccess(
    userId: string,
    subscriptionInfo: { hasActiveSubscription: boolean }
  ): Promise<{
    hasAccess: boolean;
    reason: 'subscription' | 'trial' | 'none';
    trialStatus?: TrialStatus;
  }> {
    // 1. Check subscription first (most common case for paying users)
    if (subscriptionInfo.hasActiveSubscription) {
      return {
        hasAccess: true,
        reason: 'subscription',
      };
    }

    // 2. Check trial status
    const trialStatus = await this.checkTrialStatus(userId);

    if (trialStatus.inTrial) {
      return {
        hasAccess: true,
        reason: 'trial',
        trialStatus,
      };
    }

    // 3. No access
    return {
      hasAccess: false,
      reason: 'none',
      trialStatus,
    };
  }

  /**
   * Get trial days remaining (returns 0 if not in trial)
   */
  async getDaysRemaining(userId: string): Promise<number> {
    const status = await this.checkTrialStatus(userId);
    return status.daysRemaining;
  }

  /**
   * Check if user's trial has expired (returns false if never had trial)
   */
  async isTrialExpired(userId: string): Promise<boolean> {
    const status = await this.checkTrialStatus(userId);
    return status.isExpired;
  }
}

/**
 * Factory function to create TrialService instance
 */
export function createTrialService(supabase: SupabaseClient): TrialService {
  return new TrialService(supabase);
}
