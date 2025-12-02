# Google OAuth Setup Guide for You+

To enable "Sign in with Google", you need to configure Google Cloud Platform and Supabase.

## Step 1: Google Cloud Platform (GCP) Configuration

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "YouPlus Web").
3.  **OAuth Consent Screen**:
    *   Navigate to **APIs & Services > OAuth consent screen**.
    *   Select **External** user type and click **Create**.
    *   Fill in the App Information (App name, User support email).
    *   Add your developer contact email.
    *   Click **Save and Continue**.
    *   (Optional) Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
    *   Click **Save and Continue**.
    *   **Test Users**: Add your own email address to test while in "Testing" mode.
4.  **Credentials**:
    *   Navigate to **APIs & Services > Credentials**.
    *   Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
    *   Application type: **Web application**.
    *   Name: "Supabase Auth".
    *   **Authorized JavaScript origins**:
        *   `http://localhost:3000` (for local dev)
        *   `https://<your-project-ref>.supabase.co` (Supabase project URL)
    *   **Authorized redirect URIs**:
        *   `https://<your-project-ref>.supabase.co/auth/v1/callback`
    *   Click **Create**.
    *   **Copy the Client ID and Client Secret**.

## Step 2: Supabase Dashboard Configuration

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Navigate to **Authentication > Providers**.
4.  Select **Google**.
5.  **Enable** Google provider.
6.  Paste the **Client ID** and **Client Secret** from GCP.
7.  Click **Save**.

## Step 3: URL Configuration

1.  In Supabase Dashboard, go to **Authentication > URL Configuration**.
2.  **Site URL**: Set this to your production URL (e.g., `https://youplus.app`).
3.  **Redirect URLs**:
    *   Add `http://localhost:3000/auth/callback`
    *   Add `https://youplus.app/auth/callback` (for production)
4.  Click **Save**.

## Step 4: Environment Variables

Ensure your `web/.env.local` has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

(Note: The app currently uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `src/services/supabase.ts`, but standard Next.js client-side env vars should be prefixed with `NEXT_PUBLIC_` if used in client components. The current implementation seems to use a custom service that reads `process.env`, which works in Next.js if configured in `next.config.js` or if using Server Components, but for client-side usage, `NEXT_PUBLIC_` is safer/standard. However, the current code in `supabase.ts` reads `process.env.SUPABASE_URL` directly. If this file is imported in a Client Component, Next.js might inline it if it's in `next.config.js` env, otherwise it might be undefined.)

**Recommendation**: Update `.env.local` to use `NEXT_PUBLIC_` prefixes and update `src/services/supabase.ts` to use them.

## Troubleshooting

*   **400: redirect_uri_mismatch**: Check that the Authorized redirect URI in GCP matches *exactly* what Supabase expects (`https://<project-ref>.supabase.co/auth/v1/callback`).
*   **Auth error on callback**: Check the browser console. Ensure `http://localhost:3000/auth/callback` is in the "Redirect URLs" list in Supabase.
