export function createVoipCallPayload(params) {
    return {
        ...params,
        metadata: {
            ...params.metadata,
            generatedAt: new Date().toISOString(),
            version: "3.0.0", // Bumped for LiveKit migration
            provider: params.roomName ? "livekit" : "elevenlabs",
        },
    };
}
