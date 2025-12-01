/**
 * LiveKit Types and Interfaces
 * For JWT tokens, webhooks, and room management
 */

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export interface LiveKitWebhookEvent {
  event: LiveKitWebhookEventType;
  createdAt: number; // Unix timestamp in milliseconds
  room?: RoomFinishedEvent;
  track?: TrackPublishedEvent;
  participant?: ParticipantJoinedEvent;
}

export type LiveKitWebhookEventType =
  | "room_started"
  | "room_finished"
  | "participant_joined"
  | "participant_left"
  | "track_published"
  | "track_unpublished"
  | "recording_finished"
  | "ingress_started"
  | "ingress_ended";

// ============================================================================
// ROOM EVENTS
// ============================================================================

export interface RoomFinishedEvent {
  sid: string; // Room SID (unique ID)
  name: string; // Room name
  emptyTimeout: number; // Timeout in seconds
  creationTime: string; // ISO timestamp
  metadata: string; // Custom metadata (JSON string)
  numParticipants: number;
  duration: number; // Duration in seconds
}

// ============================================================================
// PARTICIPANT EVENTS
// ============================================================================

export interface ParticipantJoinedEvent {
  sid: string; // Participant SID
  state: "ACTIVE" | "DISCONNECTED";
  identity: string; // Participant identity
  name: string; // Display name
  metadata: string; // Custom metadata (JSON string)
  joinedAt: number; // Unix timestamp
}

export interface ParticipantLeftEvent {
  sid: string;
  state: "ACTIVE" | "DISCONNECTED";
  identity: string;
  name: string;
  metadata: string;
}

// ============================================================================
// TRACK EVENTS
// ============================================================================

export interface TrackPublishedEvent {
  track: Track;
  participant: ParticipantInfo;
}

export interface TrackUnpublishedEvent {
  track: Track;
  participant: ParticipantInfo;
}

export interface Track {
  sid: string; // Track SID
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

// ============================================================================
// RECORDING EVENTS
// ============================================================================

export interface RecordingFinishedEvent {
  roomName: string;
  roomSid: string;
  filename: string;
  location: string; // File location (S3, etc.)
  duration: number; // Duration in seconds
  size: number; // File size in bytes
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
}

// ============================================================================
// DATABASE STORAGE TYPES
// ============================================================================

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
  started_at?: string; // ISO timestamp
  ended_at?: string; // ISO timestamp
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
  created_at?: string; // ISO timestamp
  ended_at?: string; // ISO timestamp
  duration_sec?: number;
  participant_count?: number;
  max_bitrate?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// JWT TOKEN PAYLOAD TYPES
// ============================================================================

export interface LiveKitTokenPayload {
  sub: string; // Subject (participant identity)
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expiration (Unix timestamp)
  nbf: number; // Not before (Unix timestamp)
  video: {
    canPublish: boolean;
    canPublishData: boolean;
    canSubscribe: boolean;
  };
  room: string; // Room name
  roomJoin: boolean;
  metadata?: string; // Custom metadata (JSON string)
}

// ============================================================================
// AGENT-SPECIFIC TYPES
// ============================================================================

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

// ============================================================================
// AGENT STATE (for tracking active agents)
// ============================================================================

export interface ActiveAgent {
  roomName: string;
  participantId: string;
  dispatchedAt: number; // Unix timestamp
  status: "active" | "inactive";
  lastHeartbeat?: number;
}
