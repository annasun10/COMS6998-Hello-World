# Game Library — profiles and authentication

This extends the assignment #2 app in the same repository and uses the existing Supabase project and Vercel project.

- `/`: public game library with a sign-in gate for member features.
- `/login`: Google OAuth sign-in.
- `/auth/callback`: exchanges the OAuth code for a cookie session, then sends users with missing names to `/profile`.
- `/profile`: authenticated profile editor for first name, last name, and an optional photo.
- `/club`: server-protected members page; incomplete profiles must finish onboarding first.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and set your existing Supabase URL and public key. Both `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are supported. Never put a service-role key in the browser environment.
3. Apply the migration and configure Google OAuth below.
4. Run `npm run dev` and visit http://localhost:3000.

## Apply the database migration

Run [`supabase/migrations/202610070001_profiles.sql`](supabase/migrations/202610070001_profiles.sql) once in your existing project's Supabase SQL Editor. The migration runs in a transaction and creates:

- `public.profiles`, keyed by `auth.users.id`, with nullable `first_name`, `last_name`, and `avatar_path`.
- An `AFTER INSERT` trigger on `auth.users` that creates a profile for every new account. Existing accounts are backfilled.
- Policies allowing signed-in users to select and update only their own profile.
- A private `avatars` Storage bucket accepting JPG, PNG, and WebP up to 5 MB, with owner-only upload, read, and delete policies.

Photo bytes live in Storage; only their object paths are saved in Postgres. The profile page uses short-lived signed URLs. Names start empty even when Google provides account metadata, so the user confirms them during onboarding.

See [Supabase's user profile trigger guide](https://supabase.com/docs/guides/auth/managing-user-data) and [Storage access control guide](https://supabase.com/docs/guides/storage/security/access-control).

## Create your own Google OAuth client

1. In Google Cloud Console, use your own project and configure the OAuth consent screen. If the app is in testing, add the accounts you will use as test users.
2. Create an OAuth client of type **Web application**. Add `http://localhost:3000` and your existing Vercel origin to authorized JavaScript origins.
3. For Google's **Authorized redirect URIs**, use the Supabase callback shown in Supabase Authentication → Providers → Google: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. Enable Google in Supabase Authentication → Providers, then paste your Google client ID and client secret there. The secret belongs in Supabase, never in this repository or browser environment variables.
5. In Supabase Authentication → URL Configuration, set Site URL to your deployed app origin and add these exact Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`
   - `https://<your-commit-deployment-domain>/auth/callback` for the deployment you submit.

The app's `redirectTo` is exactly `${window.location.origin}/auth/callback`, without custom query parameters. Google returns to Supabase's `/auth/v1/callback`; Supabase then returns to the app's `/auth/callback` with the OAuth code. These are two distinct redirects in the same flow. Follow [Supabase's Google OAuth setup](https://supabase.com/docs/guides/auth/social-login/auth-google) and [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

## Deploy and submit

Use the existing Vercel project, with the same two public Supabase environment variables. Commit and push the change to the connected GitHub repository to trigger deployment.

In that Vercel project's Deployment Protection settings, disable protection so the submitted deployment is accessible in Incognito. See [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection).

Open the deployment associated with your commit and copy its unique deployment URL from Vercel. Submit that URL, rather than the moving production or branch alias. Add its `/auth/callback` URL to Supabase before testing Google sign-in on it.

## Verification

Run `npm run lint` and `npm run build`. After applying the migration and configuring OAuth:

1. In Incognito, confirm `/` loads and offers sign-in; direct visits to `/club` and `/profile` redirect to `/login`.
2. Sign in with a new Google account. Confirm one profile row was created with that account's UUID and nullable names; the app should prompt for both names.
3. Save both names and confirm `/club` loads. Confirm whitespace-only names are rejected.
4. Update the names and upload a photo in `/profile`. Reload and verify the saved values and photo persist.
5. Confirm oversized files and unsupported image types are rejected.
6. Sign out, then revisit `/club` and confirm it redirects to login again.
7. With two accounts, verify neither can access the other's profile or photo through Supabase's API.

The migration, real OAuth flow, and deployed URL require your Supabase, Google Cloud, and Vercel account configuration; a successful local build alone does not verify those external steps.
