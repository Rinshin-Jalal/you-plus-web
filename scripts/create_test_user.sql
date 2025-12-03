-- ============================================
-- Create Test User for Agent Testing
-- Run this in Supabase SQL Editor
-- ============================================
-- 
-- STEP 1: Create user in Supabase Dashboard first!
--         Authentication > Users > Add User
--         Email: agent-test@yourmail.com
--         Password: TestPassword123!
--
-- STEP 2: Copy the UUID from the created user
--
-- STEP 3: Paste the UUID below and run this script
--
-- ============================================

DO $$
DECLARE
    -- ⚠️ PASTE YOUR AUTH USER ID HERE ⚠️
    test_user_id UUID := 'PASTE-YOUR-AUTH-USER-UUID-HERE';
    
    -- Get email from auth.users (or set manually)
    test_email TEXT;
BEGIN
    -- Fetch email from auth.users
    SELECT email INTO test_email FROM auth.users WHERE id = test_user_id;
    
    IF test_email IS NULL THEN
        RAISE EXCEPTION 'User with ID % not found in auth.users. Create the user in Supabase Dashboard first!', test_user_id;
    END IF;

    RAISE NOTICE 'Found auth user: %', test_email;
    RAISE NOTICE 'Creating test data for user ID: %', test_user_id;

    -- ============================================
    -- 1. INSERT PUBLIC USER
    -- ============================================
    INSERT INTO users (
        id,
        name,
        email,
        subscription_status,
        timezone,
        call_window_start,
        call_window_timezone,
        onboarding_completed,
        onboarding_completed_at,
        phone_number,
        payment_provider,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'Agent Test User',
        test_email,
        'active',                          -- subscription_status: active, trialing, cancelled, past_due
        'Asia/Kolkata',                    -- timezone
        '20:30:00'::TIME,                  -- call_window_start
        'Asia/Kolkata',                    -- call_window_timezone  
        true,                              -- onboarding_completed
        NOW(),                             -- onboarding_completed_at
        '+919876543210',                   -- phone_number (E.164 format)
        'dodopayments',                    -- payment_provider
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Public user created successfully!';

    -- ============================================
    -- 2. INSERT IDENTITY
    -- (This should auto-trigger identity_status creation)
    -- ============================================
    INSERT INTO identity (
        user_id,
        name,
        daily_commitment,
        chosen_path,
        call_time,
        strike_limit,
        why_it_matters_audio_url,
        cost_of_quitting_audio_url,
        commitment_audio_url,
        cartesia_voice_id,
        onboarding_context,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'Agent Test User',
        'Code for 2 hours every day',      -- daily_commitment
        'hopeful',                         -- chosen_path: 'hopeful' or 'doubtful'
        '20:30:00'::TIME,                  -- call_time (evening reckoning)
        3,                                 -- strike_limit (1-5)
        NULL,                              -- why_it_matters_audio_url (optional)
        NULL,                              -- cost_of_quitting_audio_url (optional)
        NULL,                              -- commitment_audio_url (optional)
        NULL,                              -- cartesia_voice_id (will be set after voice cloning)
        jsonb_build_object(
            -- Identity & Aspiration
            'goal', 'Ship my side project and get 100 paying users by March 2025',
            'goal_deadline', '2025-03-31',
            'motivation_level', 9,
            
            -- Pattern Recognition (psychological hooks)
            'attempt_count', 5,
            'attempt_history', 'I always start strong for 2 weeks then lose momentum when work gets busy',
            'favorite_excuse', 'I am too tired after work',
            'who_disappointed', 'My wife who believed in my dreams, and myself',
            'biggest_obstacle', 'Consistency - I get distracted by Netflix and doom scrolling',
            'how_did_quit', 'I would skip one day, feel guilty, then avoid the project entirely',
            'quit_time', 'Usually around week 3',
            'quit_pattern', 'All-or-nothing thinking - if I miss a day I feel like a failure',
            
            -- Demographics
            'age', 28,
            'gender', 'Male',
            'location', 'Bangalore, India',
            'acquisition_source', 'Twitter',
            
            -- The Cost (emotional stakes)
            'success_vision', 'Financial freedom, proving to myself I can finish what I start, making my family proud',
            'future_if_no_change', 'Still stuck in the same 9-5, watching others succeed, full of regret about the time I wasted',
            'what_spent', '["time", "money on courses", "mental energy", "relationships"]',
            'biggest_fear', 'Looking back at 40 and realizing I never even tried',
            
            -- Demo Call Rating
            'demo_call_rating', 5,
            'voice_clone_id', NULL,
            
            -- Commitment Setup
            'witness', 'My wife Priya',
            'will_do_this', true,
            
            -- Permissions
            'permissions', jsonb_build_object(
                'notifications', true,
                'calls', true
            ),
            
            -- Metadata
            'completed_at', NOW()::TEXT,
            'time_spent_minutes', 18
        ),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Identity created successfully!';

    -- ============================================
    -- 3. UPDATE IDENTITY_STATUS (auto-created by trigger)
    -- Set some realistic test values
    -- ============================================
    UPDATE identity_status 
    SET 
        current_streak_days = 7,
        total_calls_completed = 12,
        last_call_at = NOW() - INTERVAL '1 day',
        trust_percentage = 85,
        status_summary = jsonb_build_object(
            'discipline_level', 'building_momentum',
            'notifications', ARRAY['Great streak! Keep it up.'],
            'last_updated', NOW()::TEXT
        ),
        updated_at = NOW()
    WHERE user_id = test_user_id;

    RAISE NOTICE 'Identity status updated successfully!';

    -- ============================================
    -- 4. CREATE A SUBSCRIPTION (for active status)
    -- ============================================
    INSERT INTO subscriptions (
        id,
        user_id,
        status,
        payment_provider,
        provider_subscription_id,
        provider_customer_id,
        plan_id,
        plan_name,
        amount_cents,
        currency,
        started_at,
        current_period_start,
        current_period_end,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_user_id,
        'active',
        'dodopayments',
        'sub_test_' || floor(random() * 100000)::text,
        'cus_test_' || floor(random() * 100000)::text,
        'monthly_pro',
        'Monthly Pro Plan',
        49900,                             -- 499.00 INR in cents
        'INR',
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '7 days',
        NOW() + INTERVAL '23 days',
        jsonb_build_object('test_user', true),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Subscription created successfully!';

    -- ============================================
    -- 5. CREATE SAMPLE PROMISES (optional but realistic)
    -- ============================================
    INSERT INTO promises (user_id, promise_text, due_date, completed, completed_at, created_at, updated_at)
    VALUES 
        (test_user_id, 'Code for 2 hours on the landing page', CURRENT_DATE, true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 day', NOW()),
        (test_user_id, 'Finish the auth flow implementation', CURRENT_DATE + 1, false, NULL, NOW(), NOW());

    RAISE NOTICE 'Promises created successfully!';

    -- ============================================
    -- 6. CREATE SAMPLE CALLS (call history for context)
    -- ============================================
    INSERT INTO calls (
        user_id,
        call_type,
        audio_url,
        duration_sec,
        status,
        call_successful,
        source,
        provider,
        is_retry,
        created_at
    ) VALUES 
        (test_user_id, 'daily_reckoning', 'https://example.com/audio1.mp3', 180, 'completed', 'success', 'livekit', 'livekit', false, NOW() - INTERVAL '1 day'),
        (test_user_id, 'daily_reckoning', 'https://example.com/audio2.mp3', 210, 'completed', 'success', 'livekit', 'livekit', false, NOW() - INTERVAL '2 days'),
        (test_user_id, 'daily_reckoning', 'https://example.com/audio3.mp3', 165, 'completed', 'success', 'livekit', 'livekit', false, NOW() - INTERVAL '3 days');

    RAISE NOTICE 'Call history created successfully!';

    -- ============================================
    -- FINAL OUTPUT
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST USER CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Email: %', test_email;
    RAISE NOTICE 'Phone: +919876543210';
    RAISE NOTICE 'Call Time: 20:30 IST';
    RAISE NOTICE 'Subscription: Active (Monthly Pro)';
    RAISE NOTICE 'Streak: 7 days';
    RAISE NOTICE 'Trust: 85%%';
    RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERIES (run separately)
-- ============================================

-- Check the created user:
-- SELECT * FROM users WHERE email LIKE 'agent-test-%' ORDER BY created_at DESC LIMIT 1;

-- Check identity:
-- SELECT * FROM identity WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%' ORDER BY created_at DESC LIMIT 1);

-- Check identity_status:
-- SELECT * FROM identity_status WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%' ORDER BY created_at DESC LIMIT 1);

-- Check subscription:
-- SELECT * FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%' ORDER BY created_at DESC LIMIT 1);

-- Check promises:
-- SELECT * FROM promises WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%' ORDER BY created_at DESC LIMIT 1);

-- Check calls:
-- SELECT * FROM calls WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%' ORDER BY created_at DESC LIMIT 1);

-- ============================================
-- CLEANUP (when done testing)
-- ============================================
-- Run in this order (reverse of creation):
-- DELETE FROM calls WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%');
-- DELETE FROM promises WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%');
-- DELETE FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%');
-- DELETE FROM identity_status WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%');
-- DELETE FROM identity WHERE user_id = (SELECT id FROM users WHERE email LIKE 'agent-test-%');
-- DELETE FROM users WHERE email LIKE 'agent-test-%';
-- Then delete user from Supabase Dashboard: Authentication > Users
