import { Env } from "@/index";
/**
 * RevenueCat Service for real-time subscription validation using REST API
 * No SDK needed - uses RevenueCat's REST API directly for server-side validation
 */
export declare class RevenueCatService {
    private apiKey;
    private baseUrl;
    constructor(env: Env);
    /**
     * Check if a user has an active subscription using RevenueCat REST API
     */
    hasActiveSubscription(userId: string): Promise<{
        hasActiveSubscription: boolean;
        entitlement?: string;
        expirationDate?: string;
        isTrial?: boolean;
        error?: string;
    }>;
    /**
     * Get detailed subscriber information
     */
    getSubscriberInfo(userId: string): Promise<any>;
}
/**
 * Create RevenueCat service instance
 */
export declare function createRevenueCatService(env: Env): RevenueCatService;
