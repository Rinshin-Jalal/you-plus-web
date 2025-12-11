/**
 * Audio Merge Utility
 * 
 * Merges multiple audio blobs into a single audio file using Web Audio API.
 * This is used to combine voice recordings for higher-quality voice cloning.
 * 
 * The merged audio is exported as WAV format (uncompressed) because:
 * 1. WAV is universally supported by audio APIs including Cartesia
 * 2. No quality loss from re-encoding
 * 3. Simple to create from AudioBuffer
 */

/**
 * Merge multiple audio blobs into a single WAV blob
 * 
 * @param blobs - Array of audio blobs (WebM, MP3, WAV, etc.)
 * @returns Single merged WAV blob
 */
export async function mergeAudioBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs provided');
  }

  if (blobs.length === 1) {
    // Single blob - still convert to WAV for consistency
    return convertToWav(blobs[0]);
  }

  console.log(`[AudioMerge] Merging ${blobs.length} audio files...`);

  // Create AudioContext for decoding
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();

  try {
    // Decode all blobs to AudioBuffers
    const buffers: AudioBuffer[] = [];
    
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      console.log(`[AudioMerge] Decoding audio ${i + 1}/${blobs.length} (${blob.size} bytes, ${blob.type})`);
      
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        buffers.push(audioBuffer);
        console.log(`[AudioMerge] Audio ${i + 1}: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}ch, ${audioBuffer.sampleRate}Hz`);
      } catch (decodeError) {
        console.error(`[AudioMerge] Failed to decode audio ${i + 1}:`, decodeError);
        throw new Error(`Failed to decode audio file ${i + 1}: ${decodeError}`);
      }
    }

    // Use the highest sample rate from all buffers
    const targetSampleRate = Math.max(...buffers.map(b => b.sampleRate));
    
    // Calculate total duration and length
    let totalLength = 0;
    for (const buffer of buffers) {
      // Account for sample rate differences
      const lengthAtTargetRate = Math.ceil(buffer.length * (targetSampleRate / buffer.sampleRate));
      totalLength += lengthAtTargetRate;
    }

    console.log(`[AudioMerge] Total duration: ${(totalLength / targetSampleRate).toFixed(2)}s at ${targetSampleRate}Hz`);

    // Create merged buffer (mono for voice cloning - simpler and smaller)
    const mergedBuffer = audioContext.createBuffer(1, totalLength, targetSampleRate);
    const outputChannel = mergedBuffer.getChannelData(0);

    // Copy each buffer sequentially
    let offset = 0;
    for (const buffer of buffers) {
      // Get mono mix of the source (average all channels)
      const sourceData = getMono(buffer);
      
      // Resample if needed
      if (buffer.sampleRate !== targetSampleRate) {
        const resampled = resample(sourceData, buffer.sampleRate, targetSampleRate);
        outputChannel.set(resampled, offset);
        offset += resampled.length;
      } else {
        outputChannel.set(sourceData, offset);
        offset += sourceData.length;
      }
    }

    // Convert to WAV
    const wavBlob = audioBufferToWav(mergedBuffer);
    console.log(`[AudioMerge] Merged WAV: ${wavBlob.size} bytes (${(mergedBuffer.duration).toFixed(2)}s)`);

    return wavBlob;
  } finally {
    await audioContext.close();
  }
}

/**
 * Convert a single audio blob to WAV format
 */
async function convertToWav(blob: Blob): Promise<Blob> {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBufferToWav(audioBuffer);
  } finally {
    await audioContext.close();
  }
}

/**
 * Get mono channel data from AudioBuffer (average all channels)
 */
function getMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0);
  }

  const mono = new Float32Array(buffer.length);
  const numChannels = buffer.numberOfChannels;

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < buffer.length; i++) {
      mono[i] += channelData[i] / numChannels;
    }
  }

  return mono;
}

/**
 * Simple linear resampling
 */
function resample(data: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.ceil(data.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, data.length - 1);
    const t = srcIndex - srcIndexFloor;
    
    // Linear interpolation
    result[i] = data[srcIndexFloor] * (1 - t) + data[srcIndexCeil] * t;
  }

  return result;
}

/**
 * Convert AudioBuffer to WAV Blob
 * 
 * WAV format is simple:
 * - 44-byte header
 * - Raw PCM samples (16-bit signed integers)
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio samples
  let offset = 44;
  
  // Interleave channels
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i];
      // Clamp and convert to 16-bit signed integer
      const clampedSample = Math.max(-1, Math.min(1, sample));
      const intSample = clampedSample < 0
        ? clampedSample * 0x8000
        : clampedSample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Write a string to DataView at offset
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Get audio duration from a blob (in seconds)
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
  } finally {
    await audioContext.close();
  }
}
