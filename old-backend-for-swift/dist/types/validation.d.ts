/**
 * API Validation Schemas using Zod
 *
 * This file contains all Zod schemas for validating API requests and responses.
 * These schemas provide runtime type checking and validation for all API endpoints.
 *
 * Using these schemas ensures:
 * 1. Type safety at runtime (not just compile time)
 * 2. Automatic request/response validation
 * 3. Clear error messages for invalid data
 * 4. Self-documenting API contracts
 */
import { z } from "zod";
export declare const BaseResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    timestamp?: string | undefined;
}, {
    success: boolean;
    timestamp?: string | undefined;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<false>;
    error: z.ZodString;
    details: z.ZodOptional<z.ZodString>;
    validationErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        message: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        field: string;
    }, {
        code: string;
        message: string;
        field: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, {
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    subscription_status: z.ZodEnum<["active", "trialing", "cancelled", "past_due"]>;
    timezone: z.ZodString;
    call_window_start: z.ZodOptional<z.ZodString>;
    call_window_timezone: z.ZodOptional<z.ZodString>;
    voice_clone_id: z.ZodOptional<z.ZodString>;
    push_token: z.ZodOptional<z.ZodString>;
    onboarding_completed: z.ZodBoolean;
    onboarding_completed_at: z.ZodOptional<z.ZodString>;
    schedule_change_count: z.ZodNumber;
    voice_reclone_count: z.ZodNumber;
    revenuecat_customer_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    email: string;
    subscription_status: "active" | "trialing" | "cancelled" | "past_due";
    timezone: string;
    onboarding_completed: boolean;
    schedule_change_count: number;
    voice_reclone_count: number;
    voice_clone_id?: string | undefined;
    call_window_start?: string | undefined;
    call_window_timezone?: string | undefined;
    onboarding_completed_at?: string | undefined;
    push_token?: string | undefined;
    revenuecat_customer_id?: string | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    email: string;
    subscription_status: "active" | "trialing" | "cancelled" | "past_due";
    timezone: string;
    onboarding_completed: boolean;
    schedule_change_count: number;
    voice_reclone_count: number;
    voice_clone_id?: string | undefined;
    call_window_start?: string | undefined;
    call_window_timezone?: string | undefined;
    onboarding_completed_at?: string | undefined;
    push_token?: string | undefined;
    revenuecat_customer_id?: string | undefined;
}>;
export declare const PromiseSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    created_at: z.ZodString;
    promise_date: z.ZodString;
    promise_text: z.ZodString;
    status: z.ZodEnum<["pending", "kept", "broken"]>;
    excuse_text: z.ZodOptional<z.ZodString>;
    promise_order: z.ZodNumber;
    priority_level: z.ZodEnum<["low", "medium", "high", "critical"]>;
    category: z.ZodString;
    time_specific: z.ZodBoolean;
    target_time: z.ZodOptional<z.ZodString>;
    created_during_call: z.ZodBoolean;
    parent_promise_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    user_id: string;
    promise_date: string;
    promise_text: string;
    status: "pending" | "kept" | "broken";
    promise_order: number;
    priority_level: "low" | "medium" | "high" | "critical";
    category: string;
    time_specific: boolean;
    created_during_call: boolean;
    excuse_text?: string | undefined;
    target_time?: string | undefined;
    parent_promise_id?: string | undefined;
}, {
    id: string;
    created_at: string;
    user_id: string;
    promise_date: string;
    promise_text: string;
    status: "pending" | "kept" | "broken";
    promise_order: number;
    priority_level: "low" | "medium" | "high" | "critical";
    category: string;
    time_specific: boolean;
    created_during_call: boolean;
    excuse_text?: string | undefined;
    target_time?: string | undefined;
    parent_promise_id?: string | undefined;
}>;
export declare const CreatePromiseRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    promiseText: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    category: z.ZodOptional<z.ZodString>;
    targetTime: z.ZodOptional<z.ZodString>;
    createdDuringCall: z.ZodOptional<z.ZodBoolean>;
    parentPromiseId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    promiseText: string;
    category?: string | undefined;
    targetTime?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    createdDuringCall?: boolean | undefined;
    parentPromiseId?: string | undefined;
}, {
    userId: string;
    promiseText: string;
    category?: string | undefined;
    targetTime?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    createdDuringCall?: boolean | undefined;
    parentPromiseId?: string | undefined;
}>;
export declare const CreatePromiseResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    promiseId: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: true;
    message: string;
    promiseId: string;
    timestamp?: string | undefined;
}, {
    success: true;
    message: string;
    promiseId: string;
    timestamp?: string | undefined;
}>;
export declare const CallRecordingSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    created_at: z.ZodString;
    call_type: z.ZodEnum<["morning", "evening", "first_call", "apology_call", "emergency", "daily_reckoning"]>;
    audio_url: z.ZodString;
    duration_sec: z.ZodNumber;
    confidence_scores: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    conversation_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    transcript_json: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    transcript_summary: z.ZodOptional<z.ZodString>;
    cost_cents: z.ZodOptional<z.ZodNumber>;
    start_time: z.ZodOptional<z.ZodString>;
    end_time: z.ZodOptional<z.ZodString>;
    call_successful: z.ZodOptional<z.ZodEnum<["success", "failure", "unknown"]>>;
    source: z.ZodOptional<z.ZodEnum<["vapi", "elevenlabs"]>>;
    is_retry: z.ZodOptional<z.ZodBoolean>;
    retry_attempt_number: z.ZodOptional<z.ZodNumber>;
    original_call_uuid: z.ZodOptional<z.ZodString>;
    retry_reason: z.ZodOptional<z.ZodEnum<["missed", "declined", "failed"]>>;
    urgency: z.ZodOptional<z.ZodEnum<["high", "critical", "emergency"]>>;
    acknowledged: z.ZodOptional<z.ZodBoolean>;
    acknowledged_at: z.ZodOptional<z.ZodString>;
    timeout_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    user_id: string;
    call_type: "daily_reckoning" | "emergency" | "evening" | "morning" | "first_call" | "apology_call";
    audio_url: string;
    duration_sec: number;
    status?: string | undefined;
    confidence_scores?: Record<string, any> | undefined;
    conversation_id?: string | undefined;
    transcript_json?: Record<string, any> | undefined;
    transcript_summary?: string | undefined;
    cost_cents?: number | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    call_successful?: "success" | "failure" | "unknown" | undefined;
    source?: "vapi" | "elevenlabs" | undefined;
    is_retry?: boolean | undefined;
    retry_attempt_number?: number | undefined;
    original_call_uuid?: string | undefined;
    retry_reason?: "missed" | "declined" | "failed" | undefined;
    urgency?: "high" | "critical" | "emergency" | undefined;
    acknowledged?: boolean | undefined;
    acknowledged_at?: string | undefined;
    timeout_at?: string | undefined;
}, {
    id: string;
    created_at: string;
    user_id: string;
    call_type: "daily_reckoning" | "emergency" | "evening" | "morning" | "first_call" | "apology_call";
    audio_url: string;
    duration_sec: number;
    status?: string | undefined;
    confidence_scores?: Record<string, any> | undefined;
    conversation_id?: string | undefined;
    transcript_json?: Record<string, any> | undefined;
    transcript_summary?: string | undefined;
    cost_cents?: number | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    call_successful?: "success" | "failure" | "unknown" | undefined;
    source?: "vapi" | "elevenlabs" | undefined;
    is_retry?: boolean | undefined;
    retry_attempt_number?: number | undefined;
    original_call_uuid?: string | undefined;
    retry_reason?: "missed" | "declined" | "failed" | undefined;
    urgency?: "high" | "critical" | "emergency" | undefined;
    acknowledged?: boolean | undefined;
    acknowledged_at?: string | undefined;
    timeout_at?: string | undefined;
}>;
export declare const CallConfigRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    callType: z.ZodEnum<["morning", "evening", "first_call", "apology_call"]>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    callType: "evening" | "morning" | "first_call" | "apology_call";
}, {
    userId: string;
    callType: "evening" | "morning" | "first_call" | "apology_call";
}>;
export declare const CallConfigResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    payload: z.ZodObject<{
        callUUID: z.ZodString;
        userId: z.ZodString;
        callType: z.ZodEnum<["morning", "evening", "first_call", "apology_call"]>;
        agentId: z.ZodString;
        mood: z.ZodString;
        handoff: z.ZodObject<{
            initiatedBy: z.ZodEnum<["manual", "scheduled", "triggered"]>;
        }, "strip", z.ZodTypeAny, {
            initiatedBy: "scheduled" | "manual" | "triggered";
        }, {
            initiatedBy: "scheduled" | "manual" | "triggered";
        }>;
        metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
        voiceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        callType: "evening" | "morning" | "first_call" | "apology_call";
        callUUID: string;
        mood: string;
        metadata: Record<string, any>;
        agentId: string;
        handoff: {
            initiatedBy: "scheduled" | "manual" | "triggered";
        };
        voiceId?: string | undefined;
    }, {
        userId: string;
        callType: "evening" | "morning" | "first_call" | "apology_call";
        callUUID: string;
        mood: string;
        metadata: Record<string, any>;
        agentId: string;
        handoff: {
            initiatedBy: "scheduled" | "manual" | "triggered";
        };
        voiceId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    payload: {
        userId: string;
        callType: "evening" | "morning" | "first_call" | "apology_call";
        callUUID: string;
        mood: string;
        metadata: Record<string, any>;
        agentId: string;
        handoff: {
            initiatedBy: "scheduled" | "manual" | "triggered";
        };
        voiceId?: string | undefined;
    };
    timestamp?: string | undefined;
}, {
    success: true;
    payload: {
        userId: string;
        callType: "evening" | "morning" | "first_call" | "apology_call";
        callUUID: string;
        mood: string;
        metadata: Record<string, any>;
        agentId: string;
        handoff: {
            initiatedBy: "scheduled" | "manual" | "triggered";
        };
        voiceId?: string | undefined;
    };
    timestamp?: string | undefined;
}>;
export declare const OnboardingResponseSchema: z.ZodObject<{
    type: z.ZodEnum<["text", "voice", "choice", "multi_select", "slider", "rating_stars", "dual_sliders", "timezone_selection", "long_press_activate", "time_window_picker", "time_picker", "date_picker", "number_stepper"]>;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>, z.ZodArray<z.ZodAny, "many">]>;
    timestamp: z.ZodString;
    duration: z.ZodOptional<z.ZodNumber>;
    voiceUri: z.ZodOptional<z.ZodString>;
    db_field: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    selected_option: z.ZodOptional<z.ZodString>;
    selected_options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sliders: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    rating: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    value: string | number | boolean | any[] | {};
    type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
    timestamp: string;
    duration?: number | undefined;
    db_field?: string[] | undefined;
    voiceUri?: string | undefined;
    selected_option?: string | undefined;
    selected_options?: string[] | undefined;
    sliders?: number[] | undefined;
    rating?: number | undefined;
}, {
    value: string | number | boolean | any[] | {};
    type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
    timestamp: string;
    duration?: number | undefined;
    db_field?: string[] | undefined;
    voiceUri?: string | undefined;
    selected_option?: string | undefined;
    selected_options?: string[] | undefined;
    sliders?: number[] | undefined;
    rating?: number | undefined;
}>;
export declare const OnboardingStateSchema: z.ZodObject<{
    currentStep: z.ZodNumber;
    responses: z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodEnum<["text", "voice", "choice", "multi_select", "slider", "rating_stars", "dual_sliders", "timezone_selection", "long_press_activate", "time_window_picker", "time_picker", "date_picker", "number_stepper"]>;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>, z.ZodArray<z.ZodAny, "many">]>;
        timestamp: z.ZodString;
        duration: z.ZodOptional<z.ZodNumber>;
        voiceUri: z.ZodOptional<z.ZodString>;
        db_field: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        selected_option: z.ZodOptional<z.ZodString>;
        selected_options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sliders: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        rating: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean | any[] | {};
        type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
        timestamp: string;
        duration?: number | undefined;
        db_field?: string[] | undefined;
        voiceUri?: string | undefined;
        selected_option?: string | undefined;
        selected_options?: string[] | undefined;
        sliders?: number[] | undefined;
        rating?: number | undefined;
    }, {
        value: string | number | boolean | any[] | {};
        type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
        timestamp: string;
        duration?: number | undefined;
        db_field?: string[] | undefined;
        voiceUri?: string | undefined;
        selected_option?: string | undefined;
        selected_options?: string[] | undefined;
        sliders?: number[] | undefined;
        rating?: number | undefined;
    }>>;
    userName: z.ZodOptional<z.ZodString>;
    brotherName: z.ZodOptional<z.ZodString>;
    wakeUpTime: z.ZodOptional<z.ZodString>;
    userPath: z.ZodOptional<z.ZodString>;
    userTimezone: z.ZodOptional<z.ZodString>;
    progressPercentage: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    responses: Record<string, {
        value: string | number | boolean | any[] | {};
        type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
        timestamp: string;
        duration?: number | undefined;
        db_field?: string[] | undefined;
        voiceUri?: string | undefined;
        selected_option?: string | undefined;
        selected_options?: string[] | undefined;
        sliders?: number[] | undefined;
        rating?: number | undefined;
    }>;
    currentStep: number;
    userName?: string | undefined;
    brotherName?: string | undefined;
    wakeUpTime?: string | undefined;
    userPath?: string | undefined;
    userTimezone?: string | undefined;
    progressPercentage?: number | undefined;
}, {
    responses: Record<string, {
        value: string | number | boolean | any[] | {};
        type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
        timestamp: string;
        duration?: number | undefined;
        db_field?: string[] | undefined;
        voiceUri?: string | undefined;
        selected_option?: string | undefined;
        selected_options?: string[] | undefined;
        sliders?: number[] | undefined;
        rating?: number | undefined;
    }>;
    currentStep: number;
    userName?: string | undefined;
    brotherName?: string | undefined;
    wakeUpTime?: string | undefined;
    userPath?: string | undefined;
    userTimezone?: string | undefined;
    progressPercentage?: number | undefined;
}>;
export declare const DeviceMetadataSchema: z.ZodObject<{
    type: z.ZodEnum<["apns", "fcm", "voip"]>;
    device_model: z.ZodOptional<z.ZodString>;
    os_version: z.ZodOptional<z.ZodString>;
    app_version: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "apns" | "fcm" | "voip";
    timezone?: string | undefined;
    device_model?: string | undefined;
    os_version?: string | undefined;
    app_version?: string | undefined;
    locale?: string | undefined;
}, {
    type: "apns" | "fcm" | "voip";
    timezone?: string | undefined;
    device_model?: string | undefined;
    os_version?: string | undefined;
    app_version?: string | undefined;
    locale?: string | undefined;
}>;
export declare const OnboardingV3CompleteRequestSchema: z.ZodObject<{
    state: z.ZodObject<{
        currentStep: z.ZodNumber;
        responses: z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodEnum<["text", "voice", "choice", "multi_select", "slider", "rating_stars", "dual_sliders", "timezone_selection", "long_press_activate", "time_window_picker", "time_picker", "date_picker", "number_stepper"]>;
            value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>, z.ZodArray<z.ZodAny, "many">]>;
            timestamp: z.ZodString;
            duration: z.ZodOptional<z.ZodNumber>;
            voiceUri: z.ZodOptional<z.ZodString>;
            db_field: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            selected_option: z.ZodOptional<z.ZodString>;
            selected_options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            sliders: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            rating: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            value: string | number | boolean | any[] | {};
            type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
            timestamp: string;
            duration?: number | undefined;
            db_field?: string[] | undefined;
            voiceUri?: string | undefined;
            selected_option?: string | undefined;
            selected_options?: string[] | undefined;
            sliders?: number[] | undefined;
            rating?: number | undefined;
        }, {
            value: string | number | boolean | any[] | {};
            type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
            timestamp: string;
            duration?: number | undefined;
            db_field?: string[] | undefined;
            voiceUri?: string | undefined;
            selected_option?: string | undefined;
            selected_options?: string[] | undefined;
            sliders?: number[] | undefined;
            rating?: number | undefined;
        }>>;
        userName: z.ZodOptional<z.ZodString>;
        brotherName: z.ZodOptional<z.ZodString>;
        wakeUpTime: z.ZodOptional<z.ZodString>;
        userPath: z.ZodOptional<z.ZodString>;
        userTimezone: z.ZodOptional<z.ZodString>;
        progressPercentage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        responses: Record<string, {
            value: string | number | boolean | any[] | {};
            type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
            timestamp: string;
            duration?: number | undefined;
            db_field?: string[] | undefined;
            voiceUri?: string | undefined;
            selected_option?: string | undefined;
            selected_options?: string[] | undefined;
            sliders?: number[] | undefined;
            rating?: number | undefined;
        }>;
        currentStep: number;
        userName?: string | undefined;
        brotherName?: string | undefined;
        wakeUpTime?: string | undefined;
        userPath?: string | undefined;
        userTimezone?: string | undefined;
        progressPercentage?: number | undefined;
    }, {
        responses: Record<string, {
            value: string | number | boolean | any[] | {};
            type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
            timestamp: string;
            duration?: number | undefined;
            db_field?: string[] | undefined;
            voiceUri?: string | undefined;
            selected_option?: string | undefined;
            selected_options?: string[] | undefined;
            sliders?: number[] | undefined;
            rating?: number | undefined;
        }>;
        currentStep: number;
        userName?: string | undefined;
        brotherName?: string | undefined;
        wakeUpTime?: string | undefined;
        userPath?: string | undefined;
        userTimezone?: string | undefined;
        progressPercentage?: number | undefined;
    }>;
    pushToken: z.ZodOptional<z.ZodString>;
    deviceMetadata: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["apns", "fcm", "voip"]>;
        device_model: z.ZodOptional<z.ZodString>;
        os_version: z.ZodOptional<z.ZodString>;
        app_version: z.ZodOptional<z.ZodString>;
        locale: z.ZodOptional<z.ZodString>;
        timezone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "apns" | "fcm" | "voip";
        timezone?: string | undefined;
        device_model?: string | undefined;
        os_version?: string | undefined;
        app_version?: string | undefined;
        locale?: string | undefined;
    }, {
        type: "apns" | "fcm" | "voip";
        timezone?: string | undefined;
        device_model?: string | undefined;
        os_version?: string | undefined;
        app_version?: string | undefined;
        locale?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    state: {
        responses: Record<string, {
            value: string | number | boolean | any[] | {};
            type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
            timestamp: string;
            duration?: number | undefined;
            db_field?: string[] | undefined;
            voiceUri?: string | undefined;
            selected_option?: string | undefined;
            selected_options?: string[] | undefined;
            sliders?: number[] | undefined;
            rating?: number | undefined;
        }>;
        currentStep: number;
        userName?: string | undefined;
        brotherName?: string | undefined;
        wakeUpTime?: string | undefined;
        userPath?: string | undefined;
        userTimezone?: string | undefined;
        progressPercentage?: number | undefined;
    };
    pushToken?: string | undefined;
    deviceMetadata?: {
        type: "apns" | "fcm" | "voip";
        timezone?: string | undefined;
        device_model?: string | undefined;
        os_version?: string | undefined;
        app_version?: string | undefined;
        locale?: string | undefined;
    } | undefined;
}, {
    state: {
        responses: Record<string, {
            value: string | number | boolean | any[] | {};
            type: "text" | "choice" | "time_window_picker" | "voice" | "multi_select" | "slider" | "rating_stars" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_picker" | "date_picker" | "number_stepper";
            timestamp: string;
            duration?: number | undefined;
            db_field?: string[] | undefined;
            voiceUri?: string | undefined;
            selected_option?: string | undefined;
            selected_options?: string[] | undefined;
            sliders?: number[] | undefined;
            rating?: number | undefined;
        }>;
        currentStep: number;
        userName?: string | undefined;
        brotherName?: string | undefined;
        wakeUpTime?: string | undefined;
        userPath?: string | undefined;
        userTimezone?: string | undefined;
        progressPercentage?: number | undefined;
    };
    pushToken?: string | undefined;
    deviceMetadata?: {
        type: "apns" | "fcm" | "voip";
        timezone?: string | undefined;
        device_model?: string | undefined;
        os_version?: string | undefined;
        app_version?: string | undefined;
        locale?: string | undefined;
    } | undefined;
}>;
export declare const OnboardingV3CompleteResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    completedAt: z.ZodString;
    totalSteps: z.ZodNumber;
    filesProcessed: z.ZodNumber;
    processingWarnings: z.ZodNullable<z.ZodString>;
    identityExtraction: z.ZodObject<{
        success: z.ZodBoolean;
        fieldsExtracted: z.ZodOptional<z.ZodNumber>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        error?: string | undefined;
        fieldsExtracted?: number | undefined;
    }, {
        success: boolean;
        error?: string | undefined;
        fieldsExtracted?: number | undefined;
    }>;
    identityStatusSync: z.ZodObject<{
        success: z.ZodBoolean;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        error?: string | undefined;
    }, {
        success: boolean;
        error?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    message: string;
    completedAt: string;
    totalSteps: number;
    filesProcessed: number;
    processingWarnings: string | null;
    identityExtraction: {
        success: boolean;
        error?: string | undefined;
        fieldsExtracted?: number | undefined;
    };
    identityStatusSync: {
        success: boolean;
        error?: string | undefined;
    };
    timestamp?: string | undefined;
}, {
    success: true;
    message: string;
    completedAt: string;
    totalSteps: number;
    filesProcessed: number;
    processingWarnings: string | null;
    identityExtraction: {
        success: boolean;
        error?: string | undefined;
        fieldsExtracted?: number | undefined;
    };
    identityStatusSync: {
        success: boolean;
        error?: string | undefined;
    };
    timestamp?: string | undefined;
}>;
export declare const SearchMemoriesRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    query: z.ZodString;
    contentType: z.ZodOptional<z.ZodEnum<["excuse", "craving", "demon", "echo", "pattern", "breakthrough"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    query: string;
    limit?: number | undefined;
    contentType?: "pattern" | "excuse" | "craving" | "demon" | "echo" | "breakthrough" | undefined;
}, {
    userId: string;
    query: string;
    limit?: number | undefined;
    contentType?: "pattern" | "excuse" | "craving" | "demon" | "echo" | "breakthrough" | undefined;
}>;
export declare const SearchMemoriesResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    memories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content_type: z.ZodString;
        text_content: z.ZodString;
        similarity_score: z.ZodNumber;
        created_at: z.ZodString;
        metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        metadata: Record<string, any>;
        content_type: string;
        text_content: string;
        similarity_score: number;
    }, {
        id: string;
        created_at: string;
        metadata: Record<string, any>;
        content_type: string;
        text_content: string;
        similarity_score: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    success: true;
    memories: {
        id: string;
        created_at: string;
        metadata: Record<string, any>;
        content_type: string;
        text_content: string;
        similarity_score: number;
    }[];
    timestamp?: string | undefined;
}, {
    success: true;
    memories: {
        id: string;
        created_at: string;
        metadata: Record<string, any>;
        content_type: string;
        text_content: string;
        similarity_score: number;
    }[];
    timestamp?: string | undefined;
}>;
export declare const GetUserContextRequestSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const GetUserContextResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    userContext: z.ZodObject<{
        user: z.ZodObject<{
            id: z.ZodString;
            created_at: z.ZodString;
            updated_at: z.ZodString;
            name: z.ZodString;
            email: z.ZodString;
            subscription_status: z.ZodEnum<["active", "trialing", "cancelled", "past_due"]>;
            timezone: z.ZodString;
            call_window_start: z.ZodOptional<z.ZodString>;
            call_window_timezone: z.ZodOptional<z.ZodString>;
            voice_clone_id: z.ZodOptional<z.ZodString>;
            push_token: z.ZodOptional<z.ZodString>;
            onboarding_completed: z.ZodBoolean;
            onboarding_completed_at: z.ZodOptional<z.ZodString>;
            schedule_change_count: z.ZodNumber;
            voice_reclone_count: z.ZodNumber;
            revenuecat_customer_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            created_at: string;
            updated_at: string;
            name: string;
            email: string;
            subscription_status: "active" | "trialing" | "cancelled" | "past_due";
            timezone: string;
            onboarding_completed: boolean;
            schedule_change_count: number;
            voice_reclone_count: number;
            voice_clone_id?: string | undefined;
            call_window_start?: string | undefined;
            call_window_timezone?: string | undefined;
            onboarding_completed_at?: string | undefined;
            push_token?: string | undefined;
            revenuecat_customer_id?: string | undefined;
        }, {
            id: string;
            created_at: string;
            updated_at: string;
            name: string;
            email: string;
            subscription_status: "active" | "trialing" | "cancelled" | "past_due";
            timezone: string;
            onboarding_completed: boolean;
            schedule_change_count: number;
            voice_reclone_count: number;
            voice_clone_id?: string | undefined;
            call_window_start?: string | undefined;
            call_window_timezone?: string | undefined;
            onboarding_completed_at?: string | undefined;
            push_token?: string | undefined;
            revenuecat_customer_id?: string | undefined;
        }>;
        todayPromises: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            user_id: z.ZodString;
            created_at: z.ZodString;
            promise_date: z.ZodString;
            promise_text: z.ZodString;
            status: z.ZodEnum<["pending", "kept", "broken"]>;
            excuse_text: z.ZodOptional<z.ZodString>;
            promise_order: z.ZodNumber;
            priority_level: z.ZodEnum<["low", "medium", "high", "critical"]>;
            category: z.ZodString;
            time_specific: z.ZodBoolean;
            target_time: z.ZodOptional<z.ZodString>;
            created_during_call: z.ZodBoolean;
            parent_promise_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }, {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }>, "many">;
        yesterdayPromises: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            user_id: z.ZodString;
            created_at: z.ZodString;
            promise_date: z.ZodString;
            promise_text: z.ZodString;
            status: z.ZodEnum<["pending", "kept", "broken"]>;
            excuse_text: z.ZodOptional<z.ZodString>;
            promise_order: z.ZodNumber;
            priority_level: z.ZodEnum<["low", "medium", "high", "critical"]>;
            category: z.ZodString;
            time_specific: z.ZodBoolean;
            target_time: z.ZodOptional<z.ZodString>;
            created_during_call: z.ZodBoolean;
            parent_promise_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }, {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }>, "many">;
        recentStreakPattern: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            user_id: z.ZodString;
            created_at: z.ZodString;
            promise_date: z.ZodString;
            promise_text: z.ZodString;
            status: z.ZodEnum<["pending", "kept", "broken"]>;
            excuse_text: z.ZodOptional<z.ZodString>;
            promise_order: z.ZodNumber;
            priority_level: z.ZodEnum<["low", "medium", "high", "critical"]>;
            category: z.ZodString;
            time_specific: z.ZodBoolean;
            target_time: z.ZodOptional<z.ZodString>;
            created_during_call: z.ZodBoolean;
            parent_promise_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }, {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }>, "many">;
        identity: z.ZodNullable<z.ZodAny>;
        identityStatus: z.ZodNullable<z.ZodAny>;
        stats: z.ZodObject<{
            totalPromises: z.ZodNumber;
            keptPromises: z.ZodNumber;
            brokenPromises: z.ZodNumber;
            successRate: z.ZodNumber;
            currentStreak: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            successRate: number;
            currentStreak: number;
            totalPromises: number;
            keptPromises: number;
            brokenPromises: number;
        }, {
            successRate: number;
            currentStreak: number;
            totalPromises: number;
            keptPromises: number;
            brokenPromises: number;
        }>;
        memoryInsights: z.ZodObject<{
            countsByType: z.ZodRecord<z.ZodString, z.ZodNumber>;
            topExcuseCount7d: z.ZodNumber;
            emergingPatterns: z.ZodArray<z.ZodObject<{
                sampleText: z.ZodString;
                recentCount: z.ZodNumber;
                baselineCount: z.ZodNumber;
                growthFactor: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }, {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            countsByType: Record<string, number>;
            topExcuseCount7d: number;
            emergingPatterns: {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }[];
        }, {
            countsByType: Record<string, number>;
            topExcuseCount7d: number;
            emergingPatterns: {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }[];
        }>;
    }, "strip", z.ZodTypeAny, {
        memoryInsights: {
            countsByType: Record<string, number>;
            topExcuseCount7d: number;
            emergingPatterns: {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }[];
        };
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            name: string;
            email: string;
            subscription_status: "active" | "trialing" | "cancelled" | "past_due";
            timezone: string;
            onboarding_completed: boolean;
            schedule_change_count: number;
            voice_reclone_count: number;
            voice_clone_id?: string | undefined;
            call_window_start?: string | undefined;
            call_window_timezone?: string | undefined;
            onboarding_completed_at?: string | undefined;
            push_token?: string | undefined;
            revenuecat_customer_id?: string | undefined;
        };
        todayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        yesterdayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        recentStreakPattern: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        stats: {
            successRate: number;
            currentStreak: number;
            totalPromises: number;
            keptPromises: number;
            brokenPromises: number;
        };
        identity?: any;
        identityStatus?: any;
    }, {
        memoryInsights: {
            countsByType: Record<string, number>;
            topExcuseCount7d: number;
            emergingPatterns: {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }[];
        };
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            name: string;
            email: string;
            subscription_status: "active" | "trialing" | "cancelled" | "past_due";
            timezone: string;
            onboarding_completed: boolean;
            schedule_change_count: number;
            voice_reclone_count: number;
            voice_clone_id?: string | undefined;
            call_window_start?: string | undefined;
            call_window_timezone?: string | undefined;
            onboarding_completed_at?: string | undefined;
            push_token?: string | undefined;
            revenuecat_customer_id?: string | undefined;
        };
        todayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        yesterdayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        recentStreakPattern: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        stats: {
            successRate: number;
            currentStreak: number;
            totalPromises: number;
            keptPromises: number;
            brokenPromises: number;
        };
        identity?: any;
        identityStatus?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    userContext: {
        memoryInsights: {
            countsByType: Record<string, number>;
            topExcuseCount7d: number;
            emergingPatterns: {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }[];
        };
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            name: string;
            email: string;
            subscription_status: "active" | "trialing" | "cancelled" | "past_due";
            timezone: string;
            onboarding_completed: boolean;
            schedule_change_count: number;
            voice_reclone_count: number;
            voice_clone_id?: string | undefined;
            call_window_start?: string | undefined;
            call_window_timezone?: string | undefined;
            onboarding_completed_at?: string | undefined;
            push_token?: string | undefined;
            revenuecat_customer_id?: string | undefined;
        };
        todayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        yesterdayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        recentStreakPattern: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        stats: {
            successRate: number;
            currentStreak: number;
            totalPromises: number;
            keptPromises: number;
            brokenPromises: number;
        };
        identity?: any;
        identityStatus?: any;
    };
    timestamp?: string | undefined;
}, {
    success: true;
    userContext: {
        memoryInsights: {
            countsByType: Record<string, number>;
            topExcuseCount7d: number;
            emergingPatterns: {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }[];
        };
        user: {
            id: string;
            created_at: string;
            updated_at: string;
            name: string;
            email: string;
            subscription_status: "active" | "trialing" | "cancelled" | "past_due";
            timezone: string;
            onboarding_completed: boolean;
            schedule_change_count: number;
            voice_reclone_count: number;
            voice_clone_id?: string | undefined;
            call_window_start?: string | undefined;
            call_window_timezone?: string | undefined;
            onboarding_completed_at?: string | undefined;
            push_token?: string | undefined;
            revenuecat_customer_id?: string | undefined;
        };
        todayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        yesterdayPromises: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        recentStreakPattern: {
            id: string;
            created_at: string;
            user_id: string;
            promise_date: string;
            promise_text: string;
            status: "pending" | "kept" | "broken";
            promise_order: number;
            priority_level: "low" | "medium" | "high" | "critical";
            category: string;
            time_specific: boolean;
            created_during_call: boolean;
            excuse_text?: string | undefined;
            target_time?: string | undefined;
            parent_promise_id?: string | undefined;
        }[];
        stats: {
            successRate: number;
            currentStreak: number;
            totalPromises: number;
            keptPromises: number;
            brokenPromises: number;
        };
        identity?: any;
        identityStatus?: any;
    };
    timestamp?: string | undefined;
}>;
export declare const VoiceCloneRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    audioData: z.ZodString;
    voiceName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    voiceName: string;
    audioData: string;
}, {
    userId: string;
    voiceName: string;
    audioData: string;
}>;
export declare const VoiceCloneResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    voiceId: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: true;
    message: string;
    voiceId: string;
    timestamp?: string | undefined;
}, {
    success: true;
    message: string;
    voiceId: string;
    timestamp?: string | undefined;
}>;
export declare const TranscribeAudioRequestSchema: z.ZodObject<{
    audioData: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    audioData: string;
    language?: string | undefined;
}, {
    audioData: string;
    language?: string | undefined;
}>;
export declare const TranscribeAudioResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    transcript: z.ZodString;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    success: true;
    transcript: string;
    timestamp?: string | undefined;
    confidence?: number | undefined;
}, {
    success: true;
    transcript: string;
    timestamp?: string | undefined;
    confidence?: number | undefined;
}>;
export declare const PushTokenRequestSchema: z.ZodObject<{
    token: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<["apns", "fcm", "voip"]>>;
    device_model: z.ZodOptional<z.ZodString>;
    os_version: z.ZodOptional<z.ZodString>;
    app_version: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    token: string;
    timezone?: string | undefined;
    type?: "apns" | "fcm" | "voip" | undefined;
    device_model?: string | undefined;
    os_version?: string | undefined;
    app_version?: string | undefined;
    locale?: string | undefined;
}, {
    token: string;
    timezone?: string | undefined;
    type?: "apns" | "fcm" | "voip" | undefined;
    device_model?: string | undefined;
    os_version?: string | undefined;
    app_version?: string | undefined;
    locale?: string | undefined;
}>;
export declare const PushTokenResponseSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: true;
    message: string;
    timestamp?: string | undefined;
}, {
    success: true;
    message: string;
    timestamp?: string | undefined;
}>;
export type CreateUserRequest = z.infer<typeof CreatePromiseRequestSchema>;
export type CreatePromiseResponse = z.infer<typeof CreatePromiseResponseSchema>;
export type CallConfigRequest = z.infer<typeof CallConfigRequestSchema>;
export type CallConfigResponse = z.infer<typeof CallConfigResponseSchema>;
export type OnboardingV3CompleteRequest = z.infer<typeof OnboardingV3CompleteRequestSchema>;
export type OnboardingV3CompleteResponse = z.infer<typeof OnboardingV3CompleteResponseSchema>;
export type SearchMemoriesRequest = z.infer<typeof SearchMemoriesRequestSchema>;
export type SearchMemoriesResponse = z.infer<typeof SearchMemoriesResponseSchema>;
export type GetUserContextRequest = z.infer<typeof GetUserContextRequestSchema>;
export type GetUserContextResponse = z.infer<typeof GetUserContextResponseSchema>;
export type VoiceCloneRequest = z.infer<typeof VoiceCloneRequestSchema>;
export type VoiceCloneResponse = z.infer<typeof VoiceCloneResponseSchema>;
export type TranscribeAudioRequest = z.infer<typeof TranscribeAudioRequestSchema>;
export type TranscribeAudioResponse = z.infer<typeof TranscribeAudioResponseSchema>;
export type PushTokenRequest = z.infer<typeof PushTokenRequestSchema>;
export type PushTokenResponse = z.infer<typeof PushTokenResponseSchema>;
