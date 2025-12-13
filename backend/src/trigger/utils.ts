/**
 * Utility functions for onboarding processing
 */

export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function base64ToBuffer(audioBase64: string): { buffer: Buffer; mimeType: string; extension: string } {
  let cleanBase64 = audioBase64;
  let mimeType = "audio/webm";
  
  if (audioBase64.startsWith("data:")) {
    const match = audioBase64.match(/data:([^;]+);/);
    if (match?.[1]) {
      mimeType = match[1];
    }
  }
  
  if (audioBase64.includes(",")) {
    cleanBase64 = audioBase64.split(",")[1] ?? audioBase64;
  }
  
  const buffer = Buffer.from(cleanBase64, "base64");
  
  const extensionMap: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
  };
  const extension = extensionMap[mimeType] || "webm";
  
  return { buffer, mimeType, extension };
}

export function isBase64Audio(s: string): boolean {
  return s.startsWith("data:") || !s.startsWith("http");
}
