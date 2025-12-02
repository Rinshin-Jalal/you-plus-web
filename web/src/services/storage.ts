import { apiClient } from './api';

class StorageService {
  private STORAGE_KEY = 'youplus_onboarding_data';
  private VOICE_KEY = 'youplus_onboarding_voice';

  saveData(data: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  }

  getData(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // Save voice recording as base64 to localStorage
  async saveVoice(blob: Blob, stepId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64Data = reader.result as string;
          
          // Get existing voice data
          const voiceData = this.getVoiceData();
          voiceData[stepId] = {
            data: base64Data,
            timestamp: Date.now(),
            size: blob.size,
            type: blob.type
          };
          
          // Save to localStorage
          localStorage.setItem(this.VOICE_KEY, JSON.stringify(voiceData));
          console.log(`[Storage] Voice ${stepId} saved (${blob.size} bytes)`);
          resolve(base64Data);
        } catch (e) {
          console.error('Failed to save voice:', e);
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get all voice recordings
  getVoiceData(): Record<string, { data: string; timestamp: number; size: number; type: string }> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.VOICE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // Get specific voice recording base64
  getVoice(stepId: string): string | null {
    const voiceData = this.getVoiceData();
    return voiceData[stepId]?.data || null;
  }

  // Clear all onboarding data (call after successful push to backend)
  clearOnboardingData() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VOICE_KEY);
    console.log('[Storage] Onboarding data cleared');
  }

  // Check if onboarding data exists
  hasOnboardingData(): boolean {
    if (typeof window === 'undefined') return false;
    const data = this.getData();
    return Object.keys(data).length > 0;
  }

  // Get all onboarding data for push (includes voice as base64)
  getAllOnboardingData(): { formData: Record<string, unknown>; voiceData: Record<string, { data: string; timestamp: number; size: number; type: string }> } {
    return {
      formData: this.getData(),
      voiceData: this.getVoiceData()
    };
  }

  // Push onboarding data to backend (requires auth + paid subscription)
  async pushOnboardingData(): Promise<{ success: boolean; error?: string }> {
    const data = this.getAllOnboardingData();
    
    if (!this.hasOnboardingData()) {
      console.log('[Storage] No onboarding data to push');
      return { success: true };
    }

    try {
      await apiClient.post('/onboarding/conversion/complete', {
        profile_data: data.formData,
        voice_recordings: data.voiceData
      });
      
      // Clear local data after successful push
      this.clearOnboardingData();
      console.log('[Storage] Onboarding data pushed successfully');
      return { success: true };
    } catch (error: unknown) {
      console.error('[Storage] Failed to push onboarding data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to push onboarding data';
      return { success: false, error: errorMessage };
    }
  }
}

export const storageService = new StorageService();
