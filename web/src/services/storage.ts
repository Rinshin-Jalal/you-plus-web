import { apiClient, ApiClientError } from './api';
import { mergeAudioBlobs } from '@/utils/audioMerge';
import { ConversionCompleteSchema } from '@/schemas/onboarding';
import { withRetry, isOnline } from '@/utils/retry';

const isDev = process.env.NODE_ENV === 'development';

export type PushProgress = {
  step: 'validating' | 'merging_audio' | 'uploading' | 'complete' | 'error';
  message: string;
  attempt?: number;
  maxAttempts?: number;
  retryingIn?: number;
  isOffline?: boolean;
};

export type PushResult = {
  success: boolean;
  error?: string;
  isRetryable?: boolean;
  errorCode?: 'network' | 'timeout' | 'validation' | 'server' | 'unknown';
};

// In-memory cache for voice blobs (Blobs can't be stored in localStorage)
// These are used to merge audio on the client side before sending
const voiceBlobCache: Map<string, Blob> = new Map();

class StorageService {
  private STORAGE_KEY = 'youplus_onboarding_data';
  private VOICE_KEY = 'youplus_onboarding_voice';

  saveData(data: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.error('Failed to save data');
    }
  }

  getData(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Save voice recording as base64 to localStorage
  // Also caches the raw Blob for later merging
  async saveVoice(blob: Blob, stepId: string): Promise<string> {
    // Cache the raw blob for merging later
    voiceBlobCache.set(stepId, blob);
    if (isDev) console.log(`[Storage] Cached voice blob: ${stepId} (${blob.size} bytes)`);
    
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
          if (isDev) console.log(`[Storage] Voice ${stepId} saved (${blob.size} bytes)`);
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

  // Get cached voice blob (for merging)
  getVoiceBlob(stepId: string): Blob | undefined {
    return voiceBlobCache.get(stepId);
  }

  // Get all cached voice blobs
  getAllVoiceBlobs(): Map<string, Blob> {
    return voiceBlobCache;
  }

  // Merge all voice recordings into a single WAV blob
  // Returns base64 data URL of the merged audio
  async getMergedVoiceRecording(): Promise<string | null> {
    const voiceFieldsForCloning = [
      'future_self_intro_recording',
      'why_recording', 
      'pledge_recording'
    ];

    // Collect blobs from cache
    const blobs: Blob[] = [];
    for (const fieldName of voiceFieldsForCloning) {
      const blob = voiceBlobCache.get(fieldName);
      if (blob) {
        blobs.push(blob);
        if (isDev) console.log(`[Storage] Found blob for merging: ${fieldName} (${blob.size} bytes)`);
      }
    }

    if (blobs.length === 0) {
      console.warn('[Storage] No voice blobs found in cache for merging');
      // Fallback: try to convert base64 back to blobs
      const voiceData = this.getVoiceData();
      for (const fieldName of voiceFieldsForCloning) {
        const data = voiceData[fieldName]?.data;
        if (data) {
          try {
            const blob = await this.base64ToBlob(data);
            blobs.push(blob);
            if (isDev) console.log(`[Storage] Converted base64 to blob: ${fieldName} (${blob.size} bytes)`);
          } catch (e) {
            console.error(`[Storage] Failed to convert ${fieldName} to blob:`, e);
          }
        }
      }
    }

    if (blobs.length === 0) {
      console.error('[Storage] No voice recordings available for merging');
      return null;
    }

    if (isDev) console.log(`[Storage] Merging ${blobs.length} voice recordings...`);

    try {
      const mergedBlob = await mergeAudioBlobs(blobs);
      if (isDev) console.log(`[Storage] Merged audio: ${mergedBlob.size} bytes, type: ${mergedBlob.type}`);

      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (isDev) console.log(`[Storage] Merged audio base64 length: ${base64.length}`);
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(mergedBlob);
      });
    } catch (error) {
      console.error('[Storage] Failed to merge voice recordings:', error);
      return null;
    }
  }

  // Helper: Convert base64 data URL to Blob
  private async base64ToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  // Get all voice recordings
  getVoiceData(): Record<string, { data: string; timestamp: number; size: number; type: string }> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.VOICE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
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
    // Clear the blob cache
    voiceBlobCache.clear();
    if (isDev) console.log('[Storage] Onboarding data cleared');
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
  // Supports progress callbacks and automatic retry with exponential backoff
  async pushOnboardingData(
    options: {
      onProgress?: (progress: PushProgress) => void;
      maxRetries?: number;
    } = {}
  ): Promise<PushResult> {
    const { onProgress, maxRetries = 3 } = options;
    const { formData, voiceData } = this.getAllOnboardingData();
    
    if (!this.hasOnboardingData()) {
      if (isDev) console.log('[Storage] No onboarding data to push');
      return { success: true };
    }

    // Check network status upfront
    if (!isOnline()) {
      onProgress?.({
        step: 'error',
        message: 'No internet connection. Please check your connection and try again.',
        isOffline: true,
      });
      return {
        success: false,
        error: 'No internet connection',
        isRetryable: true,
        errorCode: 'network',
      };
    }

    // Step 1: Validate and prepare data
    onProgress?.({
      step: 'validating',
      message: 'Preparing your data...',
    });

    // Data is already stored with field names, no mapping needed
    const dataToSend: Record<string, unknown> = { ...formData };

    // Add user's timezone (from browser)
    // This is critical for scheduling calls at the correct local time
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      dataToSend['timezone'] = timezone;
      if (isDev) console.log(`[Storage] Added timezone: ${timezone}`);
    } catch (e) {
      console.warn('[Storage] Could not detect timezone, using UTC');
      dataToSend['timezone'] = 'UTC';
    }

    // Add individual voice recordings (stored by field name)
    // Voice recordings are stored with keys like 'future_self_intro_recording', 'why_recording', 'pledge_recording'
    if (isDev) console.log('[Storage] Voice data keys:', Object.keys(voiceData));
    for (const [fieldName, voiceInfo] of Object.entries(voiceData)) {
      if (voiceInfo.data) {
        dataToSend[fieldName] = voiceInfo.data;
        if (isDev) console.log(`[Storage] Added voice field: ${fieldName} (${voiceInfo.size} bytes)`);
      }
    }

    // Step 2: Merge voice recordings
    onProgress?.({
      step: 'merging_audio',
      message: 'Processing your voice recordings...',
    });

    // Merge all voice recordings into a single audio file for voice cloning
    // This is done client-side because WebM concatenation requires proper audio processing
    if (isDev) console.log('[Storage] Merging voice recordings for voice cloning...');
    try {
      const mergedVoice = await this.getMergedVoiceRecording();
      if (mergedVoice) {
        dataToSend['merged_voice_recording'] = mergedVoice;
        if (isDev) console.log(`[Storage] Added merged voice recording (${mergedVoice.length} chars base64)`);
      } else {
        console.warn('[Storage] Could not create merged voice recording');
      }
    } catch (mergeError) {
      console.error('[Storage] Failed to merge voice recordings:', mergeError);
      // Continue without merged audio - backend can fall back to single recording
    }

    if (isDev) console.log('[Storage] Onboarding data fields being sent:', Object.keys(dataToSend));
    
    // Validate required voice recordings
    const requiredVoiceFields = ['future_self_intro_recording', 'why_recording', 'pledge_recording'];
    const missingVoice = requiredVoiceFields.filter(field => !dataToSend[field]);
    if (missingVoice.length > 0) {
      console.warn('[Storage] Missing required voice recordings:', missingVoice);
    }

    const parsed = ConversionCompleteSchema.safeParse(dataToSend);
    if (!parsed.success) {
      console.error('[Storage] Onboarding payload validation failed:', parsed.error.flatten());
      onProgress?.({
        step: 'error',
        message: 'Some of your data is incomplete. Please go back and fill in all required fields.',
      });
      return {
        success: false,
        error: 'Invalid onboarding data. Please complete all required fields.',
        isRetryable: false,
        errorCode: 'validation',
      };
    }

    // Step 3: Upload with retry
    onProgress?.({
      step: 'uploading',
      message: 'Creating your Future Self...',
      attempt: 1,
      maxAttempts: maxRetries,
    });

    try {
      // Send to backend API with automatic retry
      await withRetry(
        async () => {
          await apiClient.post('/api/onboarding/conversion/complete', parsed.data);
        },
        {
          maxAttempts: maxRetries,
          initialDelay: 2000,
          maxDelay: 15000,
          backoffMultiplier: 2,
          isRetryable: (error) => {
            if (error instanceof ApiClientError) {
              return error.isRetryable;
            }
            return true;
          },
          onRetry: (attempt, error, nextDelay) => {
            const errorMessage = error instanceof ApiClientError
              ? error.userMessage
              : 'Connection issue';
            
            onProgress?.({
              step: 'uploading',
              message: `${errorMessage}. Retrying...`,
              attempt: attempt + 1,
              maxAttempts: maxRetries,
              retryingIn: nextDelay,
              isOffline: !isOnline(),
            });
          },
        }
      );
      
      // Clear local data after successful push
      this.clearOnboardingData();
      if (isDev) console.log('[Storage] Onboarding data pushed successfully');
      
      onProgress?.({
        step: 'complete',
        message: 'Your Future Self is ready!',
      });
      
      return { success: true };
    } catch (error: unknown) {
      console.error('[Storage] Failed to push onboarding data:', error);
      
      let errorMessage = 'Failed to save your data. Please try again.';
      let errorCode: PushResult['errorCode'] = 'unknown';
      let isRetryable = true;

      if (error instanceof ApiClientError) {
        errorMessage = error.userMessage;
        isRetryable = error.isRetryable;
        
        if (error.isTimeout) {
          errorCode = 'timeout';
        } else if (error.isNetworkError) {
          errorCode = 'network';
        } else if (error.statusCode >= 500) {
          errorCode = 'server';
        }
      }

      onProgress?.({
        step: 'error',
        message: errorMessage,
        isOffline: !isOnline(),
      });

      return {
        success: false,
        error: errorMessage,
        isRetryable,
        errorCode,
      };
    }
  }
}

export const storageService = new StorageService();
