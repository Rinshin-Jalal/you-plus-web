/**
 * VoIP Debug Endpoint
 * Captures debug information from iOS VoIP push handling for background debugging
 */
// In-memory storage for recent debug events (last 100)
const debugEvents = [];
const MAX_EVENTS = 100;
/**
 * POST /debug/voip
 * Receives debug information from iOS VoIP push handling
 */
export async function postVoIPDebug(c) {
    try {
        const debugData = await c.req.json();
        const timestamp = new Date().toISOString();
        const eventWithTimestamp = {
            ...debugData,
            received_at: timestamp,
        };
        // Store in memory (keep last 100 events)
        debugEvents.unshift(eventWithTimestamp);
        if (debugEvents.length > MAX_EVENTS) {
            debugEvents.splice(MAX_EVENTS);
        }
        // Log to console for immediate debugging
        console.log(`\n🚨 iOS VoIP DEBUG [${timestamp}]:`, JSON.stringify(debugData, null, 2));
        // Detailed logging based on event type
        if (debugData.event === "voip_push_received") {
            console.log(`📱 VoIP Push Received - App State: ${getAppStateString(debugData.app_state)}`);
            console.log(`📦 Payload:`, debugData.payload);
        }
        else if (debugData.event === "handling_voip_push") {
            console.log(`⚙️  Handling VoIP Push - App State: ${getAppStateString(debugData.app_state)}`);
        }
        else if (debugData.error) {
            console.log(`❌ VoIP Error: ${debugData.error}`);
        }
        return c.json({
            success: true,
            message: "Debug event logged",
            events_count: debugEvents.length
        });
    }
    catch (error) {
        console.error("❌ Error processing VoIP debug:", error);
        return c.json({
            success: false,
            error: "Failed to process debug event"
        }, 500);
    }
}
/**
 * GET /debug/voip
 * Returns recent VoIP debug events for viewing
 */
export async function getVoIPDebugEvents(c) {
    try {
        const limit = parseInt(c.req.query('limit') || '50');
        const events = debugEvents.slice(0, Math.min(limit, debugEvents.length));
        return c.json({
            success: true,
            events,
            total_events: debugEvents.length,
            oldest_event: debugEvents[debugEvents.length - 1]?.received_at || null,
            newest_event: debugEvents[0]?.received_at || null,
        });
    }
    catch (error) {
        console.error("❌ Error retrieving VoIP debug events:", error);
        return c.json({
            success: false,
            error: "Failed to retrieve debug events"
        }, 500);
    }
}
/**
 * DELETE /debug/voip
 * Clears all stored debug events
 */
export async function clearVoIPDebugEvents(c) {
    try {
        const clearedCount = debugEvents.length;
        debugEvents.length = 0; // Clear array
        console.log(`🧹 Cleared ${clearedCount} VoIP debug events`);
        return c.json({
            success: true,
            message: `Cleared ${clearedCount} debug events`
        });
    }
    catch (error) {
        console.error("❌ Error clearing VoIP debug events:", error);
        return c.json({
            success: false,
            error: "Failed to clear debug events"
        }, 500);
    }
}
/**
 * Helper function to convert iOS app state to readable string
 */
function getAppStateString(appState) {
    switch (appState) {
        case 0: return "Active";
        case 1: return "Inactive";
        case 2: return "Background";
        default: return `Unknown (${appState})`;
    }
}
/**
 * GET /debug/voip/summary
 * Returns a summary of recent VoIP debug activity
 */
export async function getVoIPDebugSummary(c) {
    try {
        const recentEvents = debugEvents.slice(0, 20);
        const eventTypes = recentEvents.reduce((acc, event) => {
            acc[event.event] = (acc[event.event] || 0) + 1;
            return acc;
        }, {});
        const appStates = recentEvents
            .filter(e => e.app_state !== undefined)
            .reduce((acc, event) => {
            const state = getAppStateString(event.app_state);
            acc[state] = (acc[state] || 0) + 1;
            return acc;
        }, {});
        const errors = recentEvents.filter(e => e.error);
        return c.json({
            success: true,
            summary: {
                total_events: debugEvents.length,
                recent_events: recentEvents.length,
                event_types: eventTypes,
                app_states: appStates,
                recent_errors: errors.length,
                last_event: debugEvents[0]?.received_at || null,
            },
            recent_errors: errors.slice(0, 5).map(e => ({
                error: e.error,
                event: e.event,
                received_at: e.received_at,
            })),
        });
    }
    catch (error) {
        console.error("❌ Error generating VoIP debug summary:", error);
        return c.json({
            success: false,
            error: "Failed to generate debug summary"
        }, 500);
    }
}
