import { UserContext, BigBruhhTone, Identity } from "@/types/database";
/** Minimal configuration – only the fields we actually use */
interface SimpleToneConfig {
    encouragementThreshold: number;
    interventionThreshold: number;
}
/** Public entry point */
export declare function calculateOptimalTone(userContext: UserContext, config?: SimpleToneConfig): BigBruhhTone;
/** Exported utilities for other modules */
export declare function getToneDescription(tone: BigBruhhTone): string;
export declare function generateBigBruhIdentity(identity: Identity | null, tone: BigBruhhTone): string;
export {};
