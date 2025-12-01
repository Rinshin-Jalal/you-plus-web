class StorageService {
  private STORAGE_KEY = 'youplus_onboarding_data';

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

  async saveVoice(blob: Blob, id: string) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          // In a real app, you'd upload this to a server.
          // For now, we save small clips to local storage or just log it.
          // WARNING: LocalStorage has a 5MB limit. Saving audio here is risky for long clips.
          // We will mock saving by logging for this demo to avoid QuotaExceededError.
          console.log(`[Mock Save] Voice Note ${id} saved (${blob.size} bytes)`);
          
          // Optionally save metadata
          const meta = this.getData();
          meta[`voice_${id}`] = {
            timestamp: Date.now(),
            size: blob.size,
            type: blob.type
          };
          this.saveData(meta);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const storageService = new StorageService();
