// Health check endpoint
export const getHealth = (c) => {
    return c.json({
        status: "YOU+ Active",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
};
// System stats endpoint - NOW SHOWS REAL USER SCHEDULES
export const getStats = async (c) => {
    const env = c.env;
    try {
        const { createScheduler } = await import("@/services/scheduler-engine");
        const scheduler = createScheduler(env);
        const usersNeedingCalls = await scheduler.getUsersNeedingCallsNow();
        return c.json({
            users_needing_daily_reckoning_calls: usersNeedingCalls.dailyReckoning?.length || 0,
            current_time: new Date().toISOString(),
            system_status: "operational - BigBruh daily reckoning system",
            note: "Single daily reckoning call system active!",
        });
    }
    catch (error) {
        return c.json({
            error: "Stats retrieval failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
// Debug endpoint to see user schedules
export const getDebugSchedules = async (c) => {
    const env = c.env;
    try {
        const { createScheduler } = await import("@/services/scheduler-engine");
        const scheduler = createScheduler(env);
        const schedulePreview = await scheduler.getSchedulePreview();
        return c.json({
            message: "Real user schedule preview",
            current_time: new Date().toISOString(),
            ...schedulePreview,
        });
    }
    catch (error) {
        return c.json({
            error: "Schedule preview failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
