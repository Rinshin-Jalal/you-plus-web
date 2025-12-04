-- ============================================
-- Add Identity & Test Data for Existing User
-- Run this in Supabase SQL Editor
-- ============================================
-- 
-- For EXISTING users: Just paste their user_id below
-- Creates: users (update), identity, identity_status
--
-- ============================================

DO $$
DECLARE
    -- ⚠️ PASTE YOUR USER ID HERE ⚠️
    test_user_id UUID := '8f6221f8-8a88-4585-870c-9520ee2ed9e5';
    
    test_email TEXT;
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists in public.users
    SELECT EXISTS(SELECT 1 FROM users WHERE id = test_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User with ID % not found in users table!', test_user_id;
    END IF;
    
    -- Get email
    SELECT email INTO test_email FROM users WHERE id = test_user_id;
    
    RAISE NOTICE 'Found user: % (%)', test_email, test_user_id;

    -- ============================================
    -- 1. UPDATE USER with test settings
    -- ============================================
    UPDATE users SET
        subscription_status = 'active',
        timezone = 'Asia/Kolkata',
        call_window_start = '20:30:00'::TIME,
        call_window_timezone = 'Asia/Kolkata',
        onboarding_completed = true,
        onboarding_completed_at = NOW(),
        phone_number = '+919876543210',
        payment_provider = 'dodopayments',
        updated_at = NOW()
    WHERE id = test_user_id;

    RAISE NOTICE 'User updated!';

    -- ============================================
    -- 2. INSERT OR UPDATE IDENTITY
    -- (This should auto-trigger identity_status creation)
    -- ============================================
    INSERT INTO identity (
        user_id,
        name,
        daily_commitment,
        chosen_path,
        call_time,
        strike_limit,
        onboarding_context,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'Agent Test User',
        'Code for 2 hours every day',
        'hopeful',
        '20:30:00'::TIME,
        3,
        jsonb_build_object(
            'goal', 'Ship my side project and get 100 paying users by March 2025',
            'goal_deadline', '2025-03-31',
            'motivation_level', 9,
            'attempt_count', 5,
            'attempt_history', 'I always start strong for 2 weeks then lose momentum when work gets busy',
            'favorite_excuse', 'I am too tired after work',
            'who_disappointed', 'My wife who believed in my dreams, and myself',
            'biggest_obstacle', 'Consistency - I get distracted by Netflix and doom scrolling',
            'how_did_quit', 'I would skip one day, feel guilty, then avoid the project entirely',
            'quit_time', 'Usually around week 3',
            'quit_pattern', 'All-or-nothing thinking - if I miss a day I feel like a failure',
            'age', 28,
            'gender', 'Male',
            'location', 'Bangalore, India',
            'success_vision', 'Financial freedom, proving to myself I can finish what I start',
            'future_if_no_change', 'Still stuck in the same 9-5, watching others succeed, full of regret',
            'biggest_fear', 'Looking back at 40 and realizing I never even tried',
            'witness', 'My wife Priya',
            'will_do_this', true,
            'permissions', jsonb_build_object('notifications', true, 'calls', true),
            'completed_at', NOW()::TEXT,
            'time_spent_minutes', 18
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        daily_commitment = EXCLUDED.daily_commitment,
        chosen_path = EXCLUDED.chosen_path,
        call_time = EXCLUDED.call_time,
        strike_limit = EXCLUDED.strike_limit,
        onboarding_context = EXCLUDED.onboarding_context,
        updated_at = NOW();

    RAISE NOTICE 'Identity created/updated!';

    -- ============================================
    -- 3. UPDATE IDENTITY_STATUS (auto-created by trigger)
    -- ============================================
    UPDATE identity_status 
    SET 
        current_streak_days = 7,
        total_calls_completed = 12,
        last_call_at = NOW() - INTERVAL '1 day',
        updated_at = NOW()
    WHERE user_id = test_user_id;

    RAISE NOTICE 'Identity status updated!';

    -- ============================================
    -- DONE
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST USER READY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Email: %', test_email;
    RAISE NOTICE 'Phone: +919876543210';
    RAISE NOTICE 'Call Time: 20:30 IST';
    RAISE NOTICE 'Streak: 7 days';
    RAISE NOTICE '========================================';

END $$;
