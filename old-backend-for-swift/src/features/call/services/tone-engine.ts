// Simplified Tone Engine – core logic only

import { UserContext, UserPromise, BigBruhhTone, Identity } from "@/types/database";

/** Minimal configuration – only the fields we actually use */
interface SimpleToneConfig {
  encouragementThreshold: number; // score >= this => Encouraging
  interventionThreshold: number; // score <= this => Confrontational
}

const DEFAULT_SIMPLE_CONFIG: SimpleToneConfig = {
  encouragementThreshold: 30,
  interventionThreshold: -20,
};

/** Public entry point */
export function calculateOptimalTone(
  userContext: UserContext,
  config: SimpleToneConfig = DEFAULT_SIMPLE_CONFIG
): BigBruhhTone {
  // 1️⃣ Basic performance – success rate (0‑100)
  const successRate = computeSuccessRate(userContext.recentStreakPattern ?? []);

  // 2️⃣ Streak health – simple mapping
  const streakDays = userContext.identityStatus?.current_streak_days ?? 0;
  const streakScore = streakDays >= 7 ? 30 : streakDays >= 3 ? 0 : -30; // high, medium, low

  // 3️⃣ Collapse risk – inverted streak logic (no streak = high risk)
  const collapseScore = streakDays === 0 ? 100 : streakDays < 3 ? 70 : streakDays < 7 ? 30 : 0;

  // 4️⃣ Aggregate a single numeric score (simple weighted sum)
  const toneScore =
    successRate * 0.5 + // success matters most
    streakScore * 0.3 +
    (100 - collapseScore) * 0.2; // lower collapse => better tone

  // 5️⃣ Choose tone based on thresholds
  if (toneScore >= config.encouragementThreshold) return "Encouraging";
  if (toneScore <= config.interventionThreshold) return "Confrontational";
  // Default fallback – use ColdMirror for medium/high risk
  return collapseScore > 50 ? "ColdMirror" : "Confrontational";
}

/** Helper – compute % of kept promises */
function computeSuccessRate(promises: UserPromise[]): number {
  if (promises.length === 0) return 0;
  const completed = promises.filter((p) => p.status !== "pending");
  const kept = completed.filter((p) => p.status === "kept").length;
  return completed.length > 0 ? (kept / completed.length) * 100 : 0;
}

/** Exported utilities for other modules */
export function getToneDescription(tone: BigBruhhTone): string {
  switch (tone) {
    case "Encouraging":
      return "warm and encouraging yet uncompromisingly honest";
    case "Confrontational":
      return "direct and authoritative with strategic emphasis";
    case "ColdMirror":
      return "detached and factual with measured pauses";
    default:
      return "balanced and professional";
  }
}

export function generateBigBruhIdentity(identity: Identity | null, tone: BigBruhhTone): string {
  const base = identity?.name ?? "User";
  const map: Record<BigBruhhTone, string> = {
    Encouraging: `${base}'s future self – supportive but honest`,
    Confrontational: `${base}'s future self – disciplined and firm`,
    ColdMirror: `${base}'s future self – brutally honest`,
  };
  return map[tone] ?? `${base}'s future self`;
}