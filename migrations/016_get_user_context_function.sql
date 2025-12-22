-- ============================================================================
-- Migration 016: Get User Context Function
-- ============================================================================
-- 
-- Creates a Supabase function to fetch all user context data in a single call.
-- This replaces the multiple HTTP requests in the Python agent with a single
-- database function call, improving performance and reducing latency.
--
-- Returns:
--   - users: Basic user info (id, name, timezone, call_time)
--   - future_self: Complete future self identity data
--   - pillars: Array of all future_self_pillars
--   - status: User status (streaks, stats, trust score)
--   - call_history: Last 14 days of call analytics
--   - pillar_checkins: Last 14 days of pillar check-ins
--
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_context_for_call(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_users jsonb;
  v_future_self jsonb;
  v_pillars jsonb;
  v_status jsonb;
  v_call_history jsonb;
  v_pillar_checkins jsonb;
BEGIN
  -- Fetch users table data
  SELECT jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'timezone', u.timezone,
    'call_time', u.call_time
  ) INTO v_users
  FROM users u
  WHERE u.id = p_user_id;

  -- Fetch future_self data
  SELECT row_to_json(fs.*)::jsonb INTO v_future_self
  FROM future_self fs
  WHERE fs.user_id = p_user_id
  LIMIT 1;

  -- Fetch future_self_pillars (array)
  SELECT COALESCE(jsonb_agg(row_to_json(fsp.*)), '[]'::jsonb) INTO v_pillars
  FROM future_self_pillars fsp
  WHERE fsp.user_id = p_user_id;

  -- Fetch status data
  SELECT row_to_json(s.*)::jsonb INTO v_status
  FROM status s
  WHERE s.user_id = p_user_id
  LIMIT 1;

  -- Fetch recent call analytics (last 14 days)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'promise_kept', ca.promise_kept,
        'tomorrow_commitment', ca.tomorrow_commitment,
        'created_at', ca.created_at,
        'call_type', ca.call_type
      )
      ORDER BY ca.created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_call_history
  FROM call_analytics ca
  WHERE ca.user_id = p_user_id
    AND ca.created_at >= now() - interval '14 days'
  LIMIT 14;

  -- Fetch recent pillar check-ins (last 14 days)
  SELECT COALESCE(
    jsonb_agg(
      row_to_json(pc.*)
      ORDER BY pc.checked_at DESC
    ),
    '[]'::jsonb
  ) INTO v_pillar_checkins
  FROM pillar_checkins pc
  WHERE pc.user_id = p_user_id
    AND pc.checked_at >= now() - interval '14 days'
  LIMIT 50;

  -- Build final result
  v_result := jsonb_build_object(
    'users', COALESCE(v_users, '{}'::jsonb),
    'future_self', COALESCE(v_future_self, '{}'::jsonb),
    'pillars', COALESCE(v_pillars, '[]'::jsonb),
    'status', COALESCE(v_status, '{}'::jsonb),
    'call_history', COALESCE(v_call_history, '[]'::jsonb),
    'pillar_checkins', COALESCE(v_pillar_checkins, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_user_context_for_call IS 'Fetches complete user context for agent calls: users, future_self, pillars, status, last 14 days of call history, and last 14 days of pillar check-ins. Returns JSONB object matching Python agent context structure.';

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- 
-- NEW FUNCTION:
--   - get_user_context(user_id uuid) -> jsonb
--
-- USAGE:
--   SELECT get_user_context('user-uuid-here');
--
-- RETURNS:
--   {
--     "users": {"id": "...", "name": "...", "timezone": "...", "call_time": "..."},
--     "future_self": {...all future_self columns...},
--     "pillars": [{...pillar 1...}, {...pillar 2...}],
--     "status": {...all status columns...},
--     "call_history": [
--       {"promise_kept": true, "tomorrow_commitment": "...", "created_at": "...", "call_type": "..."},
--       ...
--     ],
--     "pillar_checkins": [
--       {"id": "...", "pillar_id": "...", "showed_up": true, "what_happened": "...", "checked_at": "...", ...},
--       ...
--     ]
--   }
--
-- PERFORMANCE:
--   - Single database round-trip instead of 5 HTTP requests
--   - Uses SECURITY DEFINER to bypass RLS (for service role calls)
--   - Efficient JSON aggregation
--
-- ============================================================================

