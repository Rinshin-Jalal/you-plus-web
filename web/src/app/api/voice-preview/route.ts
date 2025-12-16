import { NextRequest, NextResponse } from 'next/server';

/**
 * Voice Preview API
 * 
 * Generates TTS audio using Cartesia API for voice previews during onboarding.
 * This allows users to hear what each preset voice sounds like before selecting.
 */

const CARTESIA_API_URL = 'https://api.cartesia.ai/tts/bytes';
const CARTESIA_VERSION = '2025-04-16';

export async function POST(request: NextRequest) {
  try {
    const { voiceId, text } = await request.json();

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: 'voiceId and text are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      console.error('CARTESIA_API_KEY not configured');
      return NextResponse.json(
        { error: 'Voice preview service not configured' },
        { status: 500 }
      );
    }

    // Call Cartesia TTS API
    const response = await fetch(CARTESIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Cartesia-Version': CARTESIA_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-2',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId,
        },
        output_format: {
          container: 'mp3',
          bit_rate: 128000,
          sample_rate: 44100,
        },
        language: 'en',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cartesia TTS error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate voice preview' },
        { status: 500 }
      );
    }

    // Get the audio bytes
    const audioBuffer = await response.arrayBuffer();

    // Return as audio response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Voice preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
