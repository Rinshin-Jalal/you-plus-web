import { apiClient, ApiClientError } from './api';
import { supabase } from './supabase';
import { authService } from './auth';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  timezone: string | null;
}

export interface UpdateProfileData {
  name?: string;
  timezone?: string;
}

class AccountService {
  async getProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Fetch additional profile data from backend if needed
      try {
        const response = await apiClient.get<{ user: UserProfile }>('/api/core/profile');
        return response.user;
      } catch {
        // If backend profile fetch fails, return basic info from Supabase
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          onboarding_completed: false,
          timezone: null,
        };
      }
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.put('/api/core/profile', data);
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof ApiClientError) {
        return { success: false, error: error.response?.error || 'Failed to update profile' };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.delete('/api/core/profile');
      
      // Sign out after account deletion using authService for consistency
      await authService.signOut();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error instanceof ApiClientError) {
        return { success: false, error: error.response?.error || 'Failed to delete account' };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    // Delegate to authService for consistent signout (server + client)
    const result = await authService.signOut();
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  }

  getPreferences(): { theme: 'light' | 'dark' | 'system'; notifications: boolean } {
    if (typeof window === 'undefined') {
      return { theme: 'system', notifications: true };
    }

    try {
      const stored = localStorage.getItem('youplus_preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parsing errors
    }

    return { theme: 'system', notifications: true };
  }

  savePreferences(prefs: { theme?: 'light' | 'dark' | 'system'; notifications?: boolean }): void {
    if (typeof window === 'undefined') return;

    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem('youplus_preferences', JSON.stringify(updated));
  }
}

export const accountService = new AccountService();
export default accountService;
