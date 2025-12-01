/**
 * LiveKit Types and Interfaces
 * For JWT tokens, webhooks, and room management
 */
export interface LiveKitWebhookEvent {
    event: LiveKitWebhookEventType;
    createdAt: number;
    room?: RoomFinishedEvent;
    track?: TrackPublishedEvent;
    participant?: ParticipantJoinedEvent;
}
export type LiveKitWebhookEventType = "room_started" | "room_finished" | "participant_joined" | "participant_left" | "track_published" | "track_unpublished" | "recording_finished" | "ingress_started" | "ingress_ended";
export interface RoomFinishedEvent {
    sid: string;
    name: string;
    emptyTimeout: number;
    creationTime: string;
    metadata: string;
    numParticipants: number;
    duration: number;
}
export interface ParticipantJoinedEvent {
    sid: string;
    state: "ACTIVE" | "DISCONNECTED";
    identity: string;
    name: string;
    metadata: string;
    joinedAt: number;
}
export interface ParticipantLeftEvent {
    sid: string;
    state: "ACTIVE" | "DISCONNECTED";
    identity: string;
    name: string;
    metadata: string;
}
export interface TrackPublishedEvent {
    track: Track;
    participant: ParticipantInfo;
}
export interface TrackUnpublishedEvent {
    track: Track;
    participant: ParticipantInfo;
}
export interface Track {
    sid: string;
    type: "audio" | "video" | "data";
    name: string;
    width: number;
    height: number;
    mimeType: string;
    bitrate: number;
    ssrc: number;
    layersSSRC: number[];
}
export interface ParticipantInfo {
    sid: string;
    identity: string;
    state: "ACTIVE" | "DISCONNECTED";
    joinedAt: number;
    name: string;
    version: number;
    permission?: ParticipantPermission;
    region: string;
    isPublisher: boolean;
    isSubscriber: boolean;
    tracks: TrackInfo[];
    metadata: string;
    disconnectReason: number;
}
export interface TrackInfo {
    sid: string;
    type: "audio" | "video" | "data";
    name: string;
    muted: boolean;
    width: number;
    height: number;
    simulcast: boolean;
    layerLocked: boolean;
    layers: VideoLayer[];
}
export interface VideoLayer {
    quality: "low" | "medium" | "high";
    width: number;
    height: number;
    bitrate: number;
    ssrc: number;
}
export interface ParticipantPermission {
    canPublish: boolean;
    canPublishData: boolean;
    canSubscribe: boolean;
    canPublishSources: string[];
    hidden: boolean;
    recorder: boolean;
}
export interface RecordingFinishedEvent {
    roomName: string;
    roomSid: string;
    filename: string;
    location: string;
    duration: number;
    size: number;
    startTime: number;
    endTime: number;
}
export interface LiveKitSessionRecord {
    id?: string;
    user_id: string;
    call_uuid: string;
    room_name: string;
    room_sid?: string;
    participant_identity: string;
    participant_sid?: string;
    call_type: string;
    mood: string;
    cartesia_voice_id: string;
    supermemory_user_id: string;
    started_at?: string;
    ended_at?: string;
    duration_sec?: number;
    status?: "active" | "ended" | "failed";
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}
export interface LiveKitRoomRecord {
    id?: string;
    room_name: string;
    room_sid: string;
    created_at?: string;
    ended_at?: string;
    duration_sec?: number;
    participant_count?: number;
    max_bitrate?: number;
    metadata?: Record<string, unknown>;
}
export interface LiveKitTokenPayload {
    sub: string;
    iat: number;
    exp: number;
    nbf: number;
    video: {
        canPublish: boolean;
        canPublishData: boolean;
        canSubscribe: boolean;
    };
    room: string;
    roomJoin: boolean;
    metadata?: string;
}
export interface AgentDispatchRequest {
    room: string;
    userId: string;
    callUUID: string;
    callType: string;
    mood: string;
    cartesiaVoiceId: string;
    supermemoryUserId: string;
    systemPrompt: string;
    firstMessage: string;
    metadata?: Record<string, unknown>;
}
export interface AgentDispatchResponse {
    agentParticipantId: string;
    dispatchedAt: string;
    status: "dispatched" | "pending" | "failed";
    error?: string;
}
export interface ActiveAgent {
    roomName: string;
    participantId: string;
    dispatchedAt: number;
    status: "active" | "inactive";
    lastHeartbeat?: number;
}
