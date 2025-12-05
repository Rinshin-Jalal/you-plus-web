-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Voice recordings are stored in Cloudflare R2, not in the database.
-- Path: audio/{user_id}/{step_name}.m4a
-- Public URL: https://audio.yourbigbruhh.app/audio/{user_id}/{step_name}.m4a

CREATE TABLE public.call_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  call_type text NOT NULL,
  mood text NOT NULL,
  call_duration_seconds integer DEFAULT 0,
  call_quality_score numeric DEFAULT 0.50,
  promise_kept boolean,
  tomorrow_commitment text,
  commitment_time text,
  commitment_is_specific boolean DEFAULT false,
  sentiment_trajectory jsonb DEFAULT '[]'::jsonb,
  excuses_detected jsonb DEFAULT '[]'::jsonb,
  quotes_captured jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT call_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT call_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.call_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  memorable_quotes jsonb DEFAULT '[]'::jsonb,
  emotional_peaks jsonb DEFAULT '[]'::jsonb,
  open_loops jsonb DEFAULT '[]'::jsonb,
  last_call_type text,
  call_type_history jsonb DEFAULT '[]'::jsonb,
  narrative_arc text DEFAULT 'early_struggle'::text,
  last_mood text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  current_persona text DEFAULT 'mentor'::text,
  severity_level integer DEFAULT 1 CHECK (severity_level >= 1 AND severity_level <= 4),
  last_commitment text,
  last_commitment_time text,
  last_commitment_specific boolean DEFAULT false,
  CONSTRAINT call_memory_pkey PRIMARY KEY (id),
  CONSTRAINT call_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.excuse_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  excuse_text text NOT NULL,
  excuse_pattern text NOT NULL,
  matches_favorite boolean DEFAULT false,
  confidence numeric DEFAULT 0.80,
  streak_day integer,
  call_type text,
  was_called_out boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT excuse_patterns_pkey PRIMARY KEY (id),
  CONSTRAINT excuse_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.identity (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  daily_commitment text NOT NULL,
  call_time time without time zone NOT NULL,
  onboarding_context jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cartesia_voice_id text,
  CONSTRAINT identity_pkey PRIMARY KEY (id),
  CONSTRAINT identity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.status (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  current_streak_days integer NOT NULL DEFAULT 0,
  total_calls_completed integer NOT NULL DEFAULT 0,
  last_call_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  longest_streak_days integer DEFAULT 0,
  promises_kept_total integer DEFAULT 0,
  promises_broken_total integer DEFAULT 0,
  promises_kept_last_7_days integer DEFAULT 0,
  promises_broken_last_7_days integer DEFAULT 0,
  calls_paused boolean DEFAULT false,
  calls_paused_until timestamp with time zone,
  CONSTRAINT status_pkey PRIMARY KEY (id),
  CONSTRAINT status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  status character varying NOT NULL DEFAULT 'inactive'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'cancelled'::character varying, 'past_due'::character varying, 'pending'::character varying]::text[])),
  payment_provider character varying NOT NULL CHECK (payment_provider::text = ANY (ARRAY['dodopayments'::character varying, 'revenuecat'::character varying]::text[])),
  provider_subscription_id character varying,
  provider_customer_id character varying,
  plan_id character varying,
  plan_name character varying,
  amount_cents integer,
  currency character varying DEFAULT 'INR'::character varying,
  started_at timestamp without time zone,
  current_period_start timestamp without time zone,
  current_period_end timestamp without time zone,
  cancelled_at timestamp without time zone,
  metadata jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name text NOT NULL DEFAULT 'User'::text,
  email text NOT NULL UNIQUE,
  subscription_status text DEFAULT 'trialing'::text CHECK (subscription_status = ANY (ARRAY['active'::text, 'trialing'::text, 'cancelled'::text, 'past_due'::text])),
  timezone text DEFAULT 'UTC'::text,
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at timestamp with time zone,
  payment_provider character varying DEFAULT 'dodopayments'::character varying CHECK (payment_provider::text = ANY (ARRAY['dodopayments'::character varying, 'revenuecat'::character varying]::text[])),
  dodo_customer_id character varying,
  phone_number text CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9]\d{1,14}$'::text),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);