/**
 * Runtime Type Validation for External API Integrations
 *
 * This file provides runtime validation utilities for external API integrations
 * like ElevenLabs, OpenAI, Supabase, etc. It ensures type safety when consuming
 * external APIs and handles validation errors gracefully.
 */
import { z } from "zod";
export declare const ExternalApiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: any;
    }, {
        code: string;
        message: string;
        details?: any;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        latency: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: any;
    }, {
        code: string;
        message: string;
        details?: any;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        latency: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: any;
    }, {
        code: string;
        message: string;
        details?: any;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        latency: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }>>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: any;
    }, {
        code: string;
        message: string;
        details?: any;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        latency: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: any;
    }, {
        code: string;
        message: string;
        details?: any;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        latency: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        latency?: number | undefined;
    }>>;
}>[k_1]; } : never>;
export type ExternalApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata?: {
        requestId?: string;
        timestamp: string;
        latency?: number;
    };
};
export declare const ElevenLabsVoiceSchema: z.ZodObject<{
    voice_id: z.ZodString;
    name: z.ZodString;
    samples: z.ZodArray<z.ZodObject<{
        sample_id: z.ZodString;
        file_name: z.ZodString;
        mime_type: z.ZodString;
        size_bytes: z.ZodNumber;
        hash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }, {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }>, "many">;
    category: z.ZodString;
    fine_tuning: z.ZodObject<{
        model_id: z.ZodOptional<z.ZodString>;
        is_allowed_to_fine_tune: z.ZodBoolean;
        finetuning_state: z.ZodString;
        verification_attempts: z.ZodArray<z.ZodAny, "many">;
        verification_failures: z.ZodArray<z.ZodString, "many">;
        verification_attempts_count: z.ZodNumber;
        manual_verification_requested: z.ZodBoolean;
        language: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    }, {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    }>;
    labels: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    preview_url: z.ZodOptional<z.ZodString>;
    available_for_tiers: z.ZodArray<z.ZodString, "many">;
    settings: z.ZodObject<{
        stability: z.ZodNumber;
        similarity_boost: z.ZodNumber;
        style: z.ZodOptional<z.ZodNumber>;
        use_speaker_boost: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    }, {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    }>;
    sharing: z.ZodObject<{
        status: z.ZodString;
        history_item_sample_id: z.ZodOptional<z.ZodString>;
        original_voice_id: z.ZodOptional<z.ZodString>;
        public_owner_id: z.ZodOptional<z.ZodString>;
        liked_by_count: z.ZodNumber;
        cloned_by_count: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        labels: z.ZodRecord<z.ZodString, z.ZodString>;
        created_at_unix: z.ZodNumber;
        share_link_id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    }, {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    }>;
    safety_control: z.ZodOptional<z.ZodString>;
    voice_verification: z.ZodObject<{
        requires_verification: z.ZodBoolean;
        is_verified: z.ZodBoolean;
        verification_failures: z.ZodArray<z.ZodString, "many">;
        verification_attempts_count: z.ZodNumber;
        language: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    }, {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    }>;
    permission_on_resource: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    voice_id: string;
    samples: {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }[];
    fine_tuning: {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    };
    labels: Record<string, string>;
    available_for_tiers: string[];
    settings: {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    };
    sharing: {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    };
    voice_verification: {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    };
    permission_on_resource: string;
    description?: string | undefined;
    preview_url?: string | undefined;
    safety_control?: string | undefined;
}, {
    name: string;
    category: string;
    voice_id: string;
    samples: {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }[];
    fine_tuning: {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    };
    labels: Record<string, string>;
    available_for_tiers: string[];
    settings: {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    };
    sharing: {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    };
    voice_verification: {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    };
    permission_on_resource: string;
    description?: string | undefined;
    preview_url?: string | undefined;
    safety_control?: string | undefined;
}>;
export declare const ElevenLabsCloneRequestSchema: z.ZodObject<{
    name: z.ZodString;
    files: z.ZodArray<z.ZodString, "many">;
    description: z.ZodOptional<z.ZodString>;
    labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    files: string[];
    description?: string | undefined;
    labels?: Record<string, string> | undefined;
}, {
    name: string;
    files: string[];
    description?: string | undefined;
    labels?: Record<string, string> | undefined;
}>;
export declare const ElevenLabsCloneResponseSchema: z.ZodObject<{
    voice_id: z.ZodString;
    name: z.ZodString;
    samples: z.ZodArray<z.ZodObject<{
        sample_id: z.ZodString;
        file_name: z.ZodString;
        mime_type: z.ZodString;
        size_bytes: z.ZodNumber;
        hash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }, {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }>, "many">;
    category: z.ZodString;
    fine_tuning: z.ZodObject<{
        model_id: z.ZodOptional<z.ZodString>;
        is_allowed_to_fine_tune: z.ZodBoolean;
        finetuning_state: z.ZodString;
        verification_attempts: z.ZodArray<z.ZodAny, "many">;
        verification_failures: z.ZodArray<z.ZodString, "many">;
        verification_attempts_count: z.ZodNumber;
        manual_verification_requested: z.ZodBoolean;
        language: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    }, {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    }>;
    labels: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    preview_url: z.ZodOptional<z.ZodString>;
    available_for_tiers: z.ZodArray<z.ZodString, "many">;
    settings: z.ZodObject<{
        stability: z.ZodNumber;
        similarity_boost: z.ZodNumber;
        style: z.ZodOptional<z.ZodNumber>;
        use_speaker_boost: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    }, {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    }>;
    sharing: z.ZodObject<{
        status: z.ZodString;
        history_item_sample_id: z.ZodOptional<z.ZodString>;
        original_voice_id: z.ZodOptional<z.ZodString>;
        public_owner_id: z.ZodOptional<z.ZodString>;
        liked_by_count: z.ZodNumber;
        cloned_by_count: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        labels: z.ZodRecord<z.ZodString, z.ZodString>;
        created_at_unix: z.ZodNumber;
        share_link_id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    }, {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    }>;
    safety_control: z.ZodOptional<z.ZodString>;
    voice_verification: z.ZodObject<{
        requires_verification: z.ZodBoolean;
        is_verified: z.ZodBoolean;
        verification_failures: z.ZodArray<z.ZodString, "many">;
        verification_attempts_count: z.ZodNumber;
        language: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    }, {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    }>;
    permission_on_resource: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    voice_id: string;
    samples: {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }[];
    fine_tuning: {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    };
    labels: Record<string, string>;
    available_for_tiers: string[];
    settings: {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    };
    sharing: {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    };
    voice_verification: {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    };
    permission_on_resource: string;
    description?: string | undefined;
    preview_url?: string | undefined;
    safety_control?: string | undefined;
}, {
    name: string;
    category: string;
    voice_id: string;
    samples: {
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }[];
    fine_tuning: {
        is_allowed_to_fine_tune: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        manual_verification_requested: boolean;
        language?: string | undefined;
        model_id?: string | undefined;
    };
    labels: Record<string, string>;
    available_for_tiers: string[];
    settings: {
        stability: number;
        similarity_boost: number;
        use_speaker_boost: boolean;
        style?: number | undefined;
    };
    sharing: {
        status: string;
        labels: Record<string, string>;
        liked_by_count: number;
        cloned_by_count: number;
        created_at_unix: number;
        name?: string | undefined;
        description?: string | undefined;
        history_item_sample_id?: string | undefined;
        original_voice_id?: string | undefined;
        public_owner_id?: string | undefined;
        share_link_id?: string | undefined;
    };
    voice_verification: {
        verification_failures: string[];
        verification_attempts_count: number;
        requires_verification: boolean;
        is_verified: boolean;
        language?: string | undefined;
    };
    permission_on_resource: string;
    description?: string | undefined;
    preview_url?: string | undefined;
    safety_control?: string | undefined;
}>;
export type ElevenLabsVoice = z.infer<typeof ElevenLabsVoiceSchema>;
export type ElevenLabsCloneRequest = z.infer<typeof ElevenLabsCloneRequestSchema>;
export type ElevenLabsCloneResponse = z.infer<typeof ElevenLabsCloneResponseSchema>;
export declare const OpenAIMessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant"]>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "user" | "system" | "assistant";
}, {
    content: string;
    role: "user" | "system" | "assistant";
}>;
export declare const OpenAICompletionRequestSchema: z.ZodObject<{
    model: z.ZodString;
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["system", "user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "user" | "system" | "assistant";
    }, {
        content: string;
        role: "user" | "system" | "assistant";
    }>, "many">;
    temperature: z.ZodOptional<z.ZodNumber>;
    max_tokens: z.ZodOptional<z.ZodNumber>;
    top_p: z.ZodOptional<z.ZodNumber>;
    frequency_penalty: z.ZodOptional<z.ZodNumber>;
    presence_penalty: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    model: string;
    messages: {
        content: string;
        role: "user" | "system" | "assistant";
    }[];
    temperature?: number | undefined;
    max_tokens?: number | undefined;
    top_p?: number | undefined;
    frequency_penalty?: number | undefined;
    presence_penalty?: number | undefined;
}, {
    model: string;
    messages: {
        content: string;
        role: "user" | "system" | "assistant";
    }[];
    temperature?: number | undefined;
    max_tokens?: number | undefined;
    top_p?: number | undefined;
    frequency_penalty?: number | undefined;
    presence_penalty?: number | undefined;
}>;
export declare const OpenAICompletionResponseSchema: z.ZodObject<{
    id: z.ZodString;
    object: z.ZodString;
    created: z.ZodNumber;
    model: z.ZodString;
    choices: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        message: z.ZodObject<{
            role: z.ZodEnum<["system", "user", "assistant"]>;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
            role: "user" | "system" | "assistant";
        }, {
            content: string;
            role: "user" | "system" | "assistant";
        }>;
        finish_reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: {
            content: string;
            role: "user" | "system" | "assistant";
        };
        index: number;
        finish_reason?: string | undefined;
    }, {
        message: {
            content: string;
            role: "user" | "system" | "assistant";
        };
        index: number;
        finish_reason?: string | undefined;
    }>, "many">;
    usage: z.ZodObject<{
        prompt_tokens: z.ZodNumber;
        completion_tokens: z.ZodNumber;
        total_tokens: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }, {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }>;
}, "strip", z.ZodTypeAny, {
    object: string;
    id: string;
    created: number;
    model: string;
    choices: {
        message: {
            content: string;
            role: "user" | "system" | "assistant";
        };
        index: number;
        finish_reason?: string | undefined;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}, {
    object: string;
    id: string;
    created: number;
    model: string;
    choices: {
        message: {
            content: string;
            role: "user" | "system" | "assistant";
        };
        index: number;
        finish_reason?: string | undefined;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}>;
export declare const OpenAIEmbeddingRequestSchema: z.ZodObject<{
    model: z.ZodString;
    input: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    encoding_format: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    input: string | string[];
    model: string;
    encoding_format?: string | undefined;
}, {
    input: string | string[];
    model: string;
    encoding_format?: string | undefined;
}>;
export declare const OpenAIEmbeddingResponseSchema: z.ZodObject<{
    object: z.ZodString;
    data: z.ZodArray<z.ZodObject<{
        object: z.ZodString;
        index: z.ZodNumber;
        embedding: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        object: string;
        index: number;
        embedding: number[];
    }, {
        object: string;
        index: number;
        embedding: number[];
    }>, "many">;
    model: z.ZodString;
    usage: z.ZodObject<{
        prompt_tokens: z.ZodNumber;
        total_tokens: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        prompt_tokens: number;
        total_tokens: number;
    }, {
        prompt_tokens: number;
        total_tokens: number;
    }>;
}, "strip", z.ZodTypeAny, {
    object: string;
    data: {
        object: string;
        index: number;
        embedding: number[];
    }[];
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}, {
    object: string;
    data: {
        object: string;
        index: number;
        embedding: number[];
    }[];
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}>;
export type OpenAIMessage = z.infer<typeof OpenAIMessageSchema>;
export type OpenAICompletionRequest = z.infer<typeof OpenAICompletionRequestSchema>;
export type OpenAICompletionResponse = z.infer<typeof OpenAICompletionResponseSchema>;
export type OpenAIEmbeddingRequest = z.infer<typeof OpenAIEmbeddingRequestSchema>;
export type OpenAIEmbeddingResponse = z.infer<typeof OpenAIEmbeddingResponseSchema>;
export declare const SupabaseAuthResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
    }, {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
    }>;
    session: z.ZodObject<{
        access_token: z.ZodString;
        refresh_token: z.ZodString;
        expires_in: z.ZodNumber;
        token_type: z.ZodString;
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            created_at: string;
            updated_at: string;
            email: string;
        }, {
            id: string;
            created_at: string;
            updated_at: string;
            email: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            email: string;
        };
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    }, {
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            email: string;
        };
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
    };
    session: {
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            email: string;
        };
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    };
}, {
    user: {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
    };
    session: {
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            email: string;
        };
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    };
}>;
export declare const SupabaseErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodAny>;
    hint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    details?: any;
    hint?: string | undefined;
}, {
    code: string;
    message: string;
    details?: any;
    hint?: string | undefined;
}>;
export type SupabaseAuthResponse = z.infer<typeof SupabaseAuthResponseSchema>;
export type SupabaseError = z.infer<typeof SupabaseErrorSchema>;
export declare class ExternalApiValidator {
    static validateResponse<T>(schema: z.ZodType<T>, response: unknown, service: string): T;
    static validateRequest<T>(schema: z.ZodType<T>, request: unknown, service: string): T;
    static createSafeApiCall<T>(schema: z.ZodType<T>, service: string): (response: unknown) => T;
}
export declare const ElevenLabsValidator: {
    validateCloneResponse: (response: unknown) => {
        name: string;
        category: string;
        voice_id: string;
        samples: {
            sample_id: string;
            file_name: string;
            mime_type: string;
            size_bytes: number;
            hash: string;
        }[];
        fine_tuning: {
            is_allowed_to_fine_tune: boolean;
            finetuning_state: string;
            verification_attempts: any[];
            verification_failures: string[];
            verification_attempts_count: number;
            manual_verification_requested: boolean;
            language?: string | undefined;
            model_id?: string | undefined;
        };
        labels: Record<string, string>;
        available_for_tiers: string[];
        settings: {
            stability: number;
            similarity_boost: number;
            use_speaker_boost: boolean;
            style?: number | undefined;
        };
        sharing: {
            status: string;
            labels: Record<string, string>;
            liked_by_count: number;
            cloned_by_count: number;
            created_at_unix: number;
            name?: string | undefined;
            description?: string | undefined;
            history_item_sample_id?: string | undefined;
            original_voice_id?: string | undefined;
            public_owner_id?: string | undefined;
            share_link_id?: string | undefined;
        };
        voice_verification: {
            verification_failures: string[];
            verification_attempts_count: number;
            requires_verification: boolean;
            is_verified: boolean;
            language?: string | undefined;
        };
        permission_on_resource: string;
        description?: string | undefined;
        preview_url?: string | undefined;
        safety_control?: string | undefined;
    };
    validateCloneRequest: (request: unknown) => {
        name: string;
        files: string[];
        description?: string | undefined;
        labels?: Record<string, string> | undefined;
    };
    validateVoice: (response: unknown) => {
        name: string;
        category: string;
        voice_id: string;
        samples: {
            sample_id: string;
            file_name: string;
            mime_type: string;
            size_bytes: number;
            hash: string;
        }[];
        fine_tuning: {
            is_allowed_to_fine_tune: boolean;
            finetuning_state: string;
            verification_attempts: any[];
            verification_failures: string[];
            verification_attempts_count: number;
            manual_verification_requested: boolean;
            language?: string | undefined;
            model_id?: string | undefined;
        };
        labels: Record<string, string>;
        available_for_tiers: string[];
        settings: {
            stability: number;
            similarity_boost: number;
            use_speaker_boost: boolean;
            style?: number | undefined;
        };
        sharing: {
            status: string;
            labels: Record<string, string>;
            liked_by_count: number;
            cloned_by_count: number;
            created_at_unix: number;
            name?: string | undefined;
            description?: string | undefined;
            history_item_sample_id?: string | undefined;
            original_voice_id?: string | undefined;
            public_owner_id?: string | undefined;
            share_link_id?: string | undefined;
        };
        voice_verification: {
            verification_failures: string[];
            verification_attempts_count: number;
            requires_verification: boolean;
            is_verified: boolean;
            language?: string | undefined;
        };
        permission_on_resource: string;
        description?: string | undefined;
        preview_url?: string | undefined;
        safety_control?: string | undefined;
    };
};
export declare const OpenAIValidator: {
    validateCompletionResponse: (response: unknown) => {
        object: string;
        id: string;
        created: number;
        model: string;
        choices: {
            message: {
                content: string;
                role: "user" | "system" | "assistant";
            };
            index: number;
            finish_reason?: string | undefined;
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    validateCompletionRequest: (request: unknown) => {
        model: string;
        messages: {
            content: string;
            role: "user" | "system" | "assistant";
        }[];
        temperature?: number | undefined;
        max_tokens?: number | undefined;
        top_p?: number | undefined;
        frequency_penalty?: number | undefined;
        presence_penalty?: number | undefined;
    };
    validateEmbeddingResponse: (response: unknown) => {
        object: string;
        data: {
            object: string;
            index: number;
            embedding: number[];
        }[];
        model: string;
        usage: {
            prompt_tokens: number;
            total_tokens: number;
        };
    };
    validateEmbeddingRequest: (request: unknown) => {
        input: string | string[];
        model: string;
        encoding_format?: string | undefined;
    };
};
export declare const SupabaseValidator: {
    validateAuthResponse: (response: unknown) => {
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            email: string;
        };
        session: {
            user: {
                id: string;
                created_at: string;
                updated_at: string;
                email: string;
            };
            access_token: string;
            refresh_token: string;
            expires_in: number;
            token_type: string;
        };
    };
    validateError: (response: unknown) => {
        code: string;
        message: string;
        details?: any;
        hint?: string | undefined;
    };
};
