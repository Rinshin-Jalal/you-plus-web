/**
 * Future You Call Mode Configurations
 *
 * Single daily reckoning call configuration using Future You voice.
 * All other call types removed.
 */
import { OpenerConfig } from "./prompt-templates";
export declare const DAILY_RECKONING_CONFIG: OpenerConfig;
export declare const DAILY_RECKONING_GOALS: string[];
export declare const CALL_CONFIGURATIONS: {
    readonly daily_reckoning: {
        readonly opener: OpenerConfig;
        readonly goals: string[];
        readonly toolSet: "consequence_delivery";
        readonly duration: "60-90 seconds";
    };
};
