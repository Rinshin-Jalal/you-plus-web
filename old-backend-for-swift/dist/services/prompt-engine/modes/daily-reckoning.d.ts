import { TransmissionMood, UserContext } from "@/types/database";
import { CallModeResult } from "../types";
/**
 * Daily Reckoning call mode - FUTURE YOU WISE MENTOR
 * The single accountability call that determines streak status through wise accountability
 */
export declare function generateDailyReckoningMode(userContext: UserContext, tone: TransmissionMood): CallModeResult;
