/**
 * BEHAVIORAL PATTERN ANALYSIS - SUPER MVP
 *
 * Generates behavioral intelligence from Super MVP simplified schema.
 * Focuses on streak tracking and performance patterns without bloated metrics.
 */
/**
 * Generates behavioral pattern analysis from memory insights and identity status data (Super MVP)
 *
 * Super MVP Changes:
 * - Removed trust_percentage (psychological pressure mechanism removed)
 * - Removed promises_made_count, promises_broken_count (simplified tracking)
 * - Uses current_streak_days, total_calls_completed, last_call_at only
 */
export function generateBehavioralIntelligence(memoryInsights, streakPattern, identityStatus, identity) {
    let intelligence = "## Behavioral Pattern Analysis\n\n";
    // Excuse pattern analysis from insights
    const excuseCount = memoryInsights.countsByType?.excuse || 0;
    const topExcuseCount = memoryInsights.topExcuseCount7d || 0;
    if (topExcuseCount > 0) {
        intelligence += "**Recurring Excuse Patterns**:\n";
        intelligence += `- ${topExcuseCount} excuse instances detected in last 7 days\n`;
        intelligence += `- ${excuseCount} total excuse pattern types identified\n`;
        // Use emerging patterns if available
        const excusePatterns = memoryInsights.emergingPatterns?.filter(p => p.sampleText && p.recentCount > 0) || [];
        excusePatterns.slice(0, 3).forEach((pattern, i) => {
            intelligence += `${i + 1}. "${pattern.sampleText}" (used ${pattern.recentCount}x recently) - *This is their go-to escape route*\n`;
        });
        intelligence += "\n";
    }
    // Performance pattern analysis
    const kept = streakPattern.filter(p => p.status === "kept").length;
    const broken = streakPattern.filter(p => p.status === "broken").length;
    const total = kept + broken;
    const successRate = total > 0 ? Math.round((kept / total) * 100) : 0;
    intelligence += `**Seven-Day Performance**: ${kept} kept, ${broken} broken (${successRate}% success rate)\n`;
    if (successRate >= 80) {
        intelligence += "**Pattern Assessment**: Strong consistency - ready for commitment escalation\n";
    }
    else if (successRate >= 60) {
        intelligence += "**Pattern Assessment**: Moderate reliability - needs reinforcement protocols\n";
    }
    else if (successRate >= 40) {
        intelligence += "**Pattern Assessment**: Inconsistent execution - requires intervention strategies\n";
    }
    else {
        intelligence += "**Pattern Assessment**: Critical failure state - emergency accountability needed\n";
    }
    // Super MVP Status - Simplified tracking only
    const currentStreak = identityStatus?.current_streak_days || 0;
    const totalCallsCompleted = identityStatus?.total_calls_completed || 0;
    const lastCallAt = identityStatus?.last_call_at;
    intelligence += `\n**Current Streak**: ${currentStreak} days\n`;
    intelligence += `**Total Calls Completed**: ${totalCallsCompleted}\n`;
    intelligence += `**Last Call**: ${lastCallAt || 'Never'}\n\n`;
    return intelligence;
}
/**
 * Generates pattern analysis from recent promise performance
 */
export function generatePatternAnalysis(recentPattern) {
    if (recentPattern.length === 0) {
        return "No pattern data available.";
    }
    const keptCount = recentPattern.filter((p) => p.status === "kept").length;
    const brokenCount = recentPattern.filter((p) => p.status === "broken").length;
    const pendingCount = recentPattern.filter((p) => p.status === "pending").length;
    let analysis = `RECENT PATTERN (${recentPattern.length} promises):\n`;
    analysis += `✅ Kept: ${keptCount}\n`;
    analysis += `❌ Broken: ${brokenCount}\n`;
    analysis += `⏳ Pending: ${pendingCount}\n`;
    const successRate = recentPattern.length > 0
        ? Math.round((keptCount / (keptCount + brokenCount)) * 100)
        : 0;
    if (successRate >= 80) {
        analysis += `\n🔥 SUCCESS RATE: ${successRate}% - You're building momentum!`;
    }
    else if (successRate >= 60) {
        analysis += `\n⚠️ SUCCESS RATE: ${successRate}% - Room for improvement.`;
    }
    else {
        analysis += `\n🚨 SUCCESS RATE: ${successRate}% - Pattern needs immediate attention.`;
    }
    return analysis;
}
/**
 * Generates memory context from memory insights structure
 */
export function generateMemoryInsightsContext(memoryInsights) {
    if (!memoryInsights || Object.keys(memoryInsights.countsByType || {}).length === 0) {
        return "No significant memory patterns detected.";
    }
    let context = "";
    // Excuse patterns from insights
    const excuseCount = memoryInsights.countsByType?.excuse || 0;
    const topExcuseCount = memoryInsights.topExcuseCount7d || 0;
    if (topExcuseCount > 0) {
        context += "RECURRING EXCUSE INSIGHTS:\n";
        context += `- ${topExcuseCount} excuse instances in last 7 days\n`;
        context += `- ${excuseCount} distinct excuse pattern types\n`;
        // Use emerging patterns for specific examples
        const excusePatterns = memoryInsights.emergingPatterns?.filter(p => p.sampleText && p.recentCount > 0) || [];
        excusePatterns.slice(0, 3).forEach((pattern, i) => {
            context += `${i + 1}. "${pattern.sampleText}" (${pattern.recentCount}x recently)\n`;
        });
        context += "\n";
    }
    // Other content types
    const otherTypes = Object.entries(memoryInsights.countsByType || {})
        .filter(([type]) => type !== 'excuse')
        .filter(([, count]) => count > 0);
    if (otherTypes.length > 0) {
        context += "OTHER BEHAVIORAL PATTERNS:\n";
        otherTypes.forEach(([type, count]) => {
            context += `- ${type}: ${count} instances detected\n`;
        });
        context += "\n";
    }
    // Emerging pattern analysis
    if (memoryInsights.emergingPatterns && memoryInsights.emergingPatterns.length > 0) {
        const growingPatterns = memoryInsights.emergingPatterns.filter(p => p.growthFactor > 1.5);
        if (growingPatterns.length > 0) {
            context += "ESCALATING PATTERNS (Growth Factor > 1.5x):\n";
            growingPatterns.slice(0, 2).forEach((pattern, i) => {
                context += `${i + 1}. "${pattern.sampleText}" - ${pattern.growthFactor.toFixed(1)}x growth\n`;
            });
        }
    }
    return context;
}
