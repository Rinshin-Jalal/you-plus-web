export interface ElevenLabsWebhookEvent {
    type: "post_call_transcription" | "post_call_audio";
    event_timestamp: number;
    data: TranscriptionWebhookData | AudioWebhookData;
}
export interface TranscriptionWebhookData {
    agent_id: string;
    conversation_id: string;
    status: string;
    user_id?: string;
    transcript: ConversationTurn[];
    metadata: CallMetadata;
    analysis: CallAnalysis;
    conversation_initiation_client_data: ConversationClientData;
}
export interface AudioWebhookData {
    agent_id: string;
    conversation_id: string;
    full_audio: string;
}
export interface ConversationTurn {
    role: "agent" | "user";
    message: string;
    tool_calls: any[] | null;
    tool_results: any[] | null;
    feedback: any | null;
    time_in_call_secs: number;
    conversation_turn_metrics: ConversationTurnMetrics | null;
}
export interface ConversationTurnMetrics {
    convai_llm_service_ttfb?: {
        elapsed_time: number;
    };
    convai_llm_service_ttf_sentence?: {
        elapsed_time: number;
    };
}
export interface CallMetadata {
    start_time_unix_secs: number;
    call_duration_secs: number;
    cost: number;
    deletion_settings: {
        deletion_time_unix_secs: number;
        deleted_logs_at_time_unix_secs: number | null;
        deleted_audio_at_time_unix_secs: number | null;
        deleted_transcript_at_time_unix_secs: number | null;
        delete_transcript_and_pii: boolean;
        delete_audio: boolean;
    };
    feedback: {
        overall_score: number | null;
        likes: number;
        dislikes: number;
    };
    authorization_method: string;
    charging: {
        dev_discount: boolean;
    };
    termination_reason: string;
}
export interface CallAnalysis {
    evaluation_criteria_results: Record<string, EvaluationResult>;
    data_collection_results: Record<string, any>;
    call_successful: "success" | "failure" | "unknown";
    transcript_summary: string;
}
export interface EvaluationResult {
    result: "success" | "failure" | "unknown";
    rationale: string;
}
export interface ConversationClientData {
    conversation_config_override: {
        agent: {
            prompt: string | null;
            first_message: string | null;
            language: string;
        };
        tts: {
            voice_id: string | null;
        };
    };
    custom_llm_extra_body: Record<string, any>;
    dynamic_variables: Record<string, any>;
}
export interface CallRecordingElevenLabs {
    id?: string;
    user_id: string;
    promise_id?: string | null;
    created_at?: string;
    call_type: string;
    audio_url: string;
    duration_sec: number;
    transcript?: string | null;
    tone_used?: string | null;
    transcript_text?: string | null;
    call_id?: string | null;
    confidence_scores?: any;
    enforcement_triggered?: any;
    conversation_id?: string;
    agent_id?: string;
    status?: string;
    transcript_json?: ConversationTurn[];
    transcript_summary?: string;
    cost_cents?: number;
    start_time?: string;
    end_time?: string;
    evaluation_results?: Record<string, EvaluationResult>;
    data_collection_results?: Record<string, any>;
    call_successful?: "success" | "failure" | "unknown";
    dynamic_variables?: Record<string, any>;
    issue_category?: string;
    source?: "vapi" | "elevenlabs";
}
export interface ElevenLabsAudioRecord {
    id?: string;
    call_recording_id: string;
    conversation_id: string;
    agent_id: string;
    audio_data?: string | null;
    file_size_bytes: number;
    r2_object_key?: string | null;
    r2_url?: string | null;
    created_at?: string;
}
