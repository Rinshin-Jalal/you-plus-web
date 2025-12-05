import { Context } from "hono";

// Health check endpoint
export const getHealth = (c: Context) => {
  return c.json({
    status: "YOU+ Active",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
};

// System stats endpoint - Simplified for agent-based architecture
export const getStats = async (c: Context) => {
  return c.json({
    current_time: new Date().toISOString(),
    system_status: "operational",
    note: "Agent handles all call scheduling via Supabase",
  });
};