import { Env } from "@/index";

/**
 * RevenueCat Service for real-time subscription validation using REST API
 * No SDK needed - uses RevenueCat's REST API directly for server-side validation
 */
export class RevenueCatService {
 private apiKey: string;
 private baseUrl = "https://api.revenuecat.com/v1";

 constructor(env: Env) {
  const apiKey = env.REVENUECAT_API_KEY;
  
  if (!apiKey) {
   console.warn(
    "⚠️ REVENUECAT_API_KEY not set - subscription validation disabled",
   );
   this.apiKey = "";
  } else {
   this.apiKey = apiKey;
  }
 }

 /**
  * Check if a user has an active subscription using RevenueCat REST API
  */
 async hasActiveSubscription(userId: string): Promise<{
  hasActiveSubscription: boolean;
  entitlement?: string;
  expirationDate?: string;
  isTrial?: boolean;
  error?: string;
 }> {
  // 🔓 DEVELOPMENT BYPASS: Skip subscription checks entirely in development
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  if (isDevelopment || !this.apiKey) {
   console.warn(
    `🔓 ${isDevelopment ? 'DEVELOPMENT MODE' : 'API KEY MISSING'}: Bypassing subscription check for user ${userId}`,
   );
   return {
    hasActiveSubscription: true,
    entitlement: "dev_override_premium",
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    isTrial: false,
    error: isDevelopment ? "dev_bypass_active" : "API key missing",
   };
  }

  try {
   console.log(`🔍 Making RevenueCat v1 API call for user: ${userId}`);
   console.log(`🔑 API Key exists: ${this.apiKey ? 'YES' : 'NO'}`);
   console.log(`🔑 API Key length: ${this.apiKey ? this.apiKey.length : 0}`);
   console.log(`🔑 API Key starts with: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'N/A'}`);
   
   const response = await fetch(`${this.baseUrl}/subscribers/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
     "Authorization": this.apiKey,
     "Content-Type": "application/json",
    },
   });
   
   console.log(`📡 RevenueCat API response status: ${response.status}`);

   if (!response.ok) {
    console.error(
     `RevenueCat API error: ${response.status} ${response.statusText}`,
    );
    return {
     hasActiveSubscription: false,
     error: `API error: ${response.status}`,
    };
   }

   const data = await response.json();
   console.log(`📊 RevenueCat v1 API response data:`, JSON.stringify(data, null, 2));
   
   // v1 API response format
   const subscriber = data.subscriber;

   if (!subscriber) {
    console.warn(`No subscriber found for user ${userId}`);
    return { hasActiveSubscription: false };
   }

   // Check for active entitlements in v1 format (check expiration date)
   const entitlements = subscriber.entitlements || {};
   const now = new Date();
   
   const activeEntitlements = Object.values(entitlements).filter((
    entitlement: any,
   ) => {
    if (!entitlement.expires_date) return false; // No expiration date
    const expiresDate = new Date(entitlement.expires_date);
    return expiresDate > now; // Not expired
   });

   console.log(`Found ${Object.keys(entitlements).length} total entitlements, ${activeEntitlements.length} active`);

   if (activeEntitlements.length === 0) {
    console.log(`No active entitlements for user ${userId}`);
    return { hasActiveSubscription: false };
   }

   // Get the most valuable active entitlement
   const primaryEntitlement = activeEntitlements[0] as any;

   return {
    hasActiveSubscription: true,
    entitlement: primaryEntitlement.product_identifier,
    expirationDate: primaryEntitlement.expires_date,
    isTrial: primaryEntitlement.period_type === "trial",
   };
  } catch (error) {
   console.error("RevenueCat subscription check failed:", error);
   // Fail-safe: return false on errors to prevent unauthorized access
   return {
    hasActiveSubscription: false,
    error: `Network/API error: ${error}`,
   };
  }
 }

 /**
  * Get detailed subscriber information
  */
 async getSubscriberInfo(userId: string) {
  if (!this.apiKey) {
   throw new Error("REVENUECAT_API_KEY is required for subscriber info");
  }

  try {
   const response = await fetch(`${this.baseUrl}/subscribers/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
     "Authorization": this.apiKey,
     "Content-Type": "application/json",
    },
   });

   if (!response.ok) {
    throw new Error(`RevenueCat API error: ${response.status}`);
   }

   return await response.json();
  } catch (error) {
   console.error("Failed to get subscriber info:", error);
   throw error;
  }
 }
}

/**
 * Create RevenueCat service instance
 */
export function createRevenueCatService(env: Env): RevenueCatService {
 return new RevenueCatService(env);
}
