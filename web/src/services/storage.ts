import { apiClient } from './api';

// Map step IDs to backend field names
const STEP_ID_TO_FIELD: Record<number, string> = {
  4: 'name',
  6: 'goal',
  7: 'goalDeadline',
  8: 'motivationLevel',
  10: 'whyItMattersAudio', // voice step
  12: 'whoDisappointed',
  13: 'biggestObstacle', // "What actually stopped you?"
  14: 'attemptCount',
  15: 'lastAttemptOutcome', // "How does it usually end?"
  16: 'favoriteExcuse',
  17: 'quitTime', // "When do you usually give up?"
  19: 'age',
  20: 'gender',
  21: 'location',
  23: 'successVision', // "What does victory look like?"
  24: 'costOfQuittingAudio', // voice step
  25: 'futureIfNoChange',
  26: 'whatSpent', // "What have you already wasted?"
  27: 'biggestFear', // "What scares you more?"
  30: 'beliefLevel',
  33: 'callsGranted',
  34: 'voiceGranted',
  35: 'dailyCommitment',
  36: 'callTime',
  37: 'strikeLimit',
  39: 'commitmentAudio', // voice step
};

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
    const { formData, voiceData } = this.getAllOnboardingData();
    
    if (!this.hasOnboardingData()) {
      console.log('[Storage] No onboarding data to push');
      return { success: true };
    }

    // Map step IDs to field names
    const mappedData: Record<string, unknown> = {};
    for (const [stepId, value] of Object.entries(formData)) {
      const fieldName = STEP_ID_TO_FIELD[Number(stepId)];
      if (fieldName) {
        mappedData[fieldName] = value;
      } else {
        // Keep unknown fields as-is (might be metadata)
        mappedData[stepId] = value;
      }
    }

    // Map voice recordings to their field names
    const mappedVoice: Record<string, string> = {};
    for (const [stepId, voiceInfo] of Object.entries(voiceData)) {
      const fieldName = STEP_ID_TO_FIELD[Number(stepId)];
      if (fieldName && voiceInfo.data) {
        mappedVoice[fieldName] = voiceInfo.data;
      }
    }

    // Merge voice data into mapped data
    if (mappedVoice.whyItMattersAudio) mappedData.whyItMattersAudio = mappedVoice.whyItMattersAudio;
    if (mappedVoice.costOfQuittingAudio) mappedData.costOfQuittingAudio = mappedVoice.costOfQuittingAudio;
    if (mappedVoice.commitmentAudio) mappedData.commitmentAudio = mappedVoice.commitmentAudio;

    console.log('[Storage] Mapped onboarding data:', Object.keys(mappedData));

    try {
      await apiClient.post('/onboarding/conversion/complete', mappedData);
      
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
