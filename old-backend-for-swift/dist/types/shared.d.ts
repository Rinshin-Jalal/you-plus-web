/**
 * Shared Types for Frontend-Backend Communication
 *
 * This file contains shared type definitions used by both frontend and backend.
 * These types ensure type safety across the entire application stack.
 */
import { z } from "zod";
export declare const BaseResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    timestamp: string;
    requestId?: string | undefined;
}, {
    success: boolean;
    timestamp: string;
    requestId?: string | undefined;
}>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export declare const SuccessResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}>[k_1]; } : never>;
export type SuccessResponse<T> = BaseResponse & {
    success: true;
    data: T;
    message?: string;
};
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const PaginationMetaSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrev: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}, {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;
export declare const PaginatedResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodLiteral<true>;
    data: z.ZodObject<{
        items: z.ZodArray<T, "many">;
        meta: z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
            hasNext: z.ZodBoolean;
            hasPrev: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        items: T["_output"][];
        meta: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }, {
        items: T["_input"][];
        meta: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: {
        items: T["_output"][];
        meta: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
    timestamp: string;
    message?: string | undefined;
    requestId?: string | undefined;
}, {
    success: true;
    data: {
        items: T["_input"][];
        meta: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
    timestamp: string;
    message?: string | undefined;
    requestId?: string | undefined;
}>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type PaginatedResponse<T> = SuccessResponse<{
    items: T[];
    meta: PaginationMeta;
}>;
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    timezone: z.ZodString;
    onboardingCompleted: z.ZodBoolean;
    subscriptionStatus: z.ZodEnum<["active", "trialing", "cancelled", "past_due"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    email: string;
    timezone: string;
    subscriptionStatus: "active" | "trialing" | "cancelled" | "past_due";
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    name: string;
    email: string;
    timezone: string;
    subscriptionStatus: "active" | "trialing" | "cancelled" | "past_due";
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    callWindowStart: z.ZodOptional<z.ZodString>;
    callWindowTimezone: z.ZodOptional<z.ZodString>;
    voiceCloneId: z.ZodOptional<z.ZodString>;
    pushNotifications: z.ZodDefault<z.ZodBoolean>;
    emailNotifications: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    pushNotifications: boolean;
    emailNotifications: boolean;
    callWindowStart?: string | undefined;
    callWindowTimezone?: string | undefined;
    voiceCloneId?: string | undefined;
}, {
    callWindowStart?: string | undefined;
    callWindowTimezone?: string | undefined;
    voiceCloneId?: string | undefined;
    pushNotifications?: boolean | undefined;
    emailNotifications?: boolean | undefined;
}>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export declare const PromiseStatusSchema: z.ZodEnum<["pending", "kept", "broken"]>;
export declare const PriorityLevelSchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
export declare const PromiseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    text: z.ZodString;
    status: z.ZodEnum<["pending", "kept", "broken"]>;
    priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
    category: z.ZodString;
    targetTime: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    excuseText: z.ZodOptional<z.ZodString>;
    isTimeSpecific: z.ZodBoolean;
    createdDuringCall: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "pending" | "kept" | "broken";
    category: string;
    text: string;
    userId: string;
    priority: "low" | "medium" | "high" | "critical";
    createdDuringCall: boolean;
    createdAt: string;
    updatedAt: string;
    isTimeSpecific: boolean;
    targetTime?: string | undefined;
    excuseText?: string | undefined;
}, {
    id: string;
    status: "pending" | "kept" | "broken";
    category: string;
    text: string;
    userId: string;
    priority: "low" | "medium" | "high" | "critical";
    createdDuringCall: boolean;
    createdAt: string;
    updatedAt: string;
    isTimeSpecific: boolean;
    targetTime?: string | undefined;
    excuseText?: string | undefined;
}>;
export declare const CreatePromiseRequestSchema: z.ZodObject<{
    text: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    category: z.ZodOptional<z.ZodString>;
    targetTime: z.ZodOptional<z.ZodString>;
    isTimeSpecific: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    text: string;
    category?: string | undefined;
    targetTime?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    isTimeSpecific?: boolean | undefined;
}, {
    text: string;
    category?: string | undefined;
    targetTime?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    isTimeSpecific?: boolean | undefined;
}>;
export declare const UpdatePromiseRequestSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "kept", "broken"]>>;
    excuseText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "kept" | "broken" | undefined;
    excuseText?: string | undefined;
}, {
    status?: "pending" | "kept" | "broken" | undefined;
    excuseText?: string | undefined;
}>;
export type Promise = z.infer<typeof PromiseSchema>;
export type PromiseStatus = z.infer<typeof PromiseStatusSchema>;
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;
export type CreatePromiseRequest = z.infer<typeof CreatePromiseRequestSchema>;
export type UpdatePromiseRequest = z.infer<typeof UpdatePromiseRequestSchema>;
export declare const CallTypeSchema: z.ZodEnum<["morning", "evening", "first_call", "apology_call", "emergency", "daily_reckoning"]>;
export declare const CallStatusSchema: z.ZodEnum<["scheduled", "in_progress", "completed", "failed", "missed", "declined"]>;
export declare const CallSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["morning", "evening", "first_call", "apology_call", "emergency", "daily_reckoning"]>;
    status: z.ZodEnum<["scheduled", "in_progress", "completed", "failed", "missed", "declined"]>;
    scheduledAt: z.ZodString;
    startedAt: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    audioUrl: z.ZodOptional<z.ZodString>;
    transcript: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "missed" | "declined" | "failed" | "scheduled" | "in_progress" | "completed";
    type: "daily_reckoning" | "emergency" | "evening" | "morning" | "first_call" | "apology_call";
    userId: string;
    scheduledAt: string;
    duration?: number | undefined;
    transcript?: string | undefined;
    completedAt?: string | undefined;
    metadata?: Record<string, any> | undefined;
    summary?: string | undefined;
    audioUrl?: string | undefined;
    startedAt?: string | undefined;
}, {
    id: string;
    status: "missed" | "declined" | "failed" | "scheduled" | "in_progress" | "completed";
    type: "daily_reckoning" | "emergency" | "evening" | "morning" | "first_call" | "apology_call";
    userId: string;
    scheduledAt: string;
    duration?: number | undefined;
    transcript?: string | undefined;
    completedAt?: string | undefined;
    metadata?: Record<string, any> | undefined;
    summary?: string | undefined;
    audioUrl?: string | undefined;
    startedAt?: string | undefined;
}>;
export type CallType = z.infer<typeof CallTypeSchema>;
export type CallStatus = z.infer<typeof CallStatusSchema>;
export type Call = z.infer<typeof CallSchema>;
export declare const OnboardingStepTypeSchema: z.ZodEnum<["text", "voice", "choice", "dual_sliders", "timezone_selection", "long_press_activate", "time_window_picker", "time_picker"]>;
export declare const OnboardingResponseSchema: z.ZodObject<{
    type: z.ZodEnum<["text", "voice", "choice", "dual_sliders", "timezone_selection", "long_press_activate", "time_window_picker", "time_picker"]>;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>, z.ZodArray<z.ZodAny, "many">]>;
    timestamp: z.ZodString;
    duration: z.ZodOptional<z.ZodNumber>;
    voiceUri: z.ZodOptional<z.ZodString>;
    dbField: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    selectedOption: z.ZodOptional<z.ZodString>;
    sliders: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    value: string | number | boolean | any[] | {};
    type: "text" | "voice" | "choice" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_window_picker" | "time_picker";
    timestamp: string;
    duration?: number | undefined;
    voiceUri?: string | undefined;
    sliders?: number[] | undefined;
    dbField?: string[] | undefined;
    selectedOption?: string | undefined;
}, {
    value: string | number | boolean | any[] | {};
    type: "text" | "voice" | "choice" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_window_picker" | "time_picker";
    timestamp: string;
    duration?: number | undefined;
    voiceUri?: string | undefined;
    sliders?: number[] | undefined;
    dbField?: string[] | undefined;
    selectedOption?: string | undefined;
}>;
export declare const OnboardingStateSchema: z.ZodObject<{
    currentStep: z.ZodNumber;
    responses: z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodEnum<["text", "voice", "choice", "dual_sliders", "timezone_selection", "long_press_activate", "time_window_picker", "time_picker"]>;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>, z.ZodArray<z.ZodAny, "many">]>;
        timestamp: z.ZodString;
        duration: z.ZodOptional<z.ZodNumber>;
        voiceUri: z.ZodOptional<z.ZodString>;
        dbField: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        selectedOption: z.ZodOptional<z.ZodString>;
        sliders: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean | any[] | {};
        type: "text" | "voice" | "choice" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_window_picker" | "time_picker";
        timestamp: string;
        duration?: number | undefined;
        voiceUri?: string | undefined;
        sliders?: number[] | undefined;
        dbField?: string[] | undefined;
        selectedOption?: string | undefined;
    }, {
        value: string | number | boolean | any[] | {};
        type: "text" | "voice" | "choice" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_window_picker" | "time_picker";
        timestamp: string;
        duration?: number | undefined;
        voiceUri?: string | undefined;
        sliders?: number[] | undefined;
        dbField?: string[] | undefined;
        selectedOption?: string | undefined;
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
        type: "text" | "voice" | "choice" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_window_picker" | "time_picker";
        timestamp: string;
        duration?: number | undefined;
        voiceUri?: string | undefined;
        sliders?: number[] | undefined;
        dbField?: string[] | undefined;
        selectedOption?: string | undefined;
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
        type: "text" | "voice" | "choice" | "dual_sliders" | "timezone_selection" | "long_press_activate" | "time_window_picker" | "time_picker";
        timestamp: string;
        duration?: number | undefined;
        voiceUri?: string | undefined;
        sliders?: number[] | undefined;
        dbField?: string[] | undefined;
        selectedOption?: string | undefined;
    }>;
    currentStep: number;
    userName?: string | undefined;
    brotherName?: string | undefined;
    wakeUpTime?: string | undefined;
    userPath?: string | undefined;
    userTimezone?: string | undefined;
    progressPercentage?: number | undefined;
}>;
export type OnboardingStepType = z.infer<typeof OnboardingStepTypeSchema>;
export type OnboardingResponse = z.infer<typeof OnboardingResponseSchema>;
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;
export declare const DeviceMetadataSchema: z.ZodObject<{
    type: z.ZodEnum<["apns", "fcm", "voip"]>;
    deviceModel: z.ZodOptional<z.ZodString>;
    osVersion: z.ZodOptional<z.ZodString>;
    appVersion: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "apns" | "fcm" | "voip";
    timezone?: string | undefined;
    locale?: string | undefined;
    deviceModel?: string | undefined;
    osVersion?: string | undefined;
    appVersion?: string | undefined;
}, {
    type: "apns" | "fcm" | "voip";
    timezone?: string | undefined;
    locale?: string | undefined;
    deviceModel?: string | undefined;
    osVersion?: string | undefined;
    appVersion?: string | undefined;
}>;
export type DeviceMetadata = z.infer<typeof DeviceMetadataSchema>;
export declare const ApiRequestSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    data: T;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        version?: string | undefined;
    }, {
        timestamp: string;
        version?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    data: T;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        version?: string | undefined;
    }, {
        timestamp: string;
        version?: string | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    data: T;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        version?: string | undefined;
    }, {
        timestamp: string;
        version?: string | undefined;
    }>>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    data: T;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        version?: string | undefined;
    }, {
        timestamp: string;
        version?: string | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    data: T;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        version?: string | undefined;
    }, {
        timestamp: string;
        version?: string | undefined;
    }>>;
}>[k_1]; } : never>;
export declare const ApiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<T>;
    message: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodString;
        processingTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        processingTime?: number | undefined;
    }, {
        requestId: string;
        processingTime?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<T>;
    message: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodString;
        processingTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        processingTime?: number | undefined;
    }, {
        requestId: string;
        processingTime?: number | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<T>;
    message: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodString;
        processingTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        processingTime?: number | undefined;
    }, {
        requestId: string;
        processingTime?: number | undefined;
    }>>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<T>;
    message: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodString;
        processingTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        processingTime?: number | undefined;
    }, {
        requestId: string;
        processingTime?: number | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodBoolean;
    timestamp: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<T>;
    message: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodString;
        processingTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        processingTime?: number | undefined;
    }, {
        requestId: string;
        processingTime?: number | undefined;
    }>>;
}>[k_1]; } : never>;
export type ApiRequest<T> = {
    data: T;
    metadata?: {
        timestamp: string;
        version?: string;
    };
};
export type ApiResponse<T> = BaseResponse & {
    data?: T;
    message?: string;
    metadata?: {
        requestId: string;
        processingTime?: number;
    };
};
