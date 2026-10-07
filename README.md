# Side Quest NYC

An extension of the assignment #2 game library and assignment #3 Google authentication/profile app. Side Quest NYC generates short, shareable NYC mini-adventures and lets signed-in users rate them.

## Product decisions

Sam is a Columbia junior who wants something fun to do without planning an entire weekend. Neighborhood and mood inputs make a generated idea relevant; free public-space activities keep the concept accessible. A short caption is easy to copy into a group chat, and a three-step mini-plan makes it actionable. New and Top rated feeds support discovery and return visits without manufacturing engagement. Top rated ranks the most recent 60 ideas by upvotes minus downvotes.

Compared with a caption-only experience like Crackd.ai, this app adds a useful next step: a caption paired with an activity plan. Voting asks a specific question—“Would go” or “Pass”—so the community signals whether the content is appealing. AI ideas are labeled and do not claim current venue details. We avoid named businesses, opening hours, prices, and current events because generation is not a live travel search.

No PM feedback has been supplied yet. Record feedback and follow-up changes in `docs/pm-feedback.md` after the Feedback Group session.

## Features and routes

- `/` redirects to `/quests`, the public AI idea feed.
- `/quests`: generation form, neighborhood filter, New/Top rated views, caption copying, and voting.
- `/games`: preserves the assignment #2 game library.
- `/login`, `/auth/callback`, `/profile`, `/club`: existing Google OAuth, name onboarding, profile photos, and protected members page.

Generation and voting require authentication and a completed profile. Every vote is an INSERT into `quest_votes` tied to the AI quest and authenticated user. A composite primary key enforces one vote per account per quest. Votes cannot be changed or deleted, and users can vote on their own ideas.

AI output is saved in `quests`. The exact system prompt and user preferences are saved in `generation_requests`, visible only to their owner. Prompts are displayed privately on the creator's own cards. Generation requests are recorded without an app-level attempt limit. Provider failure or malformed output is never published as fake AI content.

## Configure the existing Supabase project

Run these migrations once, in order, in **Supabase → SQL Editor**:

1. `supabase/migrations/202610070001_profiles.sql` if assignment #3's profiles migration has not already been applied. Do not rerun it if it succeeded previously.
2. `supabase/migrations/202610070002_side_quests.sql` for assignment #4.
3. `supabase/migrations/202610070003_allow_self_votes.sql` to allow voting on your own ideas.
4. `supabase/migrations/202610070004_remove_generation_limit.sql` to remove the generation attempt limit.

The second migration enables RLS on **every existing public-schema table** and revokes browser-role table privileges by default. It replaces policies on games and profiles with the explicit app rules. Other public tables retain their policies but have no anon/authenticated/PUBLIC table grants. Managed Supabase schemas such as `auth` are not modified. Review access separately if your project includes unrelated applications.

| Data | Anonymous | Signed-in user | Trusted server |
| --- | --- | --- | --- |
| Games, generated quests | Read | Read | Admin access |
| Profiles | None | Read own; update own name/photo fields | Trigger/admin |
| Generation requests/prompts | None | Read own; record through authenticated RPC | Admin access |
| Votes | None | Read own; insert own once on any quest | Admin access |
| Aggregate vote counts | Read through bounded feed RPC | Same | Same |
| Avatar Storage objects | None | Own folder only | Admin access |

Only the server can publish generated output. Its service-role client is instantiated **after** user authentication, input validation, request recording, and a successful Gemini response. Browsers cannot insert, update, or delete quests. The aggregate feed function exposes counts, never individual voters. See [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Environment variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`: create one in [Google AI Studio](https://aistudio.google.com/apikey).
- `SUPABASE_SERVICE_ROLE_KEY`: the existing project's service-role key from Supabase's API Keys settings. Use only the server environment.
- Optional `GEMINI_MODEL` (defaults to `gemini-3.8-flash`). Use a model available to your API project with structured JSON output support.

Never prefix the last three variables with `NEXT_PUBLIC_` or commit real keys. Configure the same variables in the existing Vercel project's relevant production/preview environments, then redeploy. Generation uses the REST API with a 45-second timeout and low thinking effort for the default model and validates structured output before saving. See [Gemini structured output documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). Quotas and API billing depend on your Google account configuration.

Run `npm install` then `npm run dev`.

## Google OAuth

Keep your existing Google OAuth web client. Google Cloud's authorized redirect URI is the Supabase provider callback: `https://<project-ref>.supabase.co/auth/v1/callback`. Client ID and secret belong in Supabase Authentication → Providers → Google.

In Supabase Authentication → URL Configuration, set Site URL to the production Vercel origin. Allow these exact app callbacks:

- `http://localhost:3000/auth/callback`
- `https://<production-domain>/auth/callback`
- `https://<commit-deployment-domain>/auth/callback`

The application's OAuth `redirectTo` is the current browser origin plus `/auth/callback`, with no custom parameters. Each commit deployment has a different domain and must be allowed before sign-in works there. [Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).

## Validate

- `npm run lint`
- `npx tsc --noEmit`
- `node --experimental-strip-types --test tests/quest-validation.test.mjs` (Node 22.6+).
- `npm run build`; in environments that restrict Turbopack port binding, use `npm run build -- --webpack`.
- After migrating, run `supabase/tests/side_quests_rls.sql` in SQL Editor. This transactional test creates temporary fixture accounts, exercises anonymous and cross-account restrictions, duplicate vote rejection, permitted self-votes, and more than five generation requests; it rolls back its data at the end. If an assertion fails, issue `ROLLBACK` before retrying.

Then verify live with two Google accounts and an Incognito window:

1. Anonymous visitors can read the feed but cannot generate or vote, including direct API requests.
2. A signed-in user completes their name onboarding and generates an idea. Confirm a private prompt row and public quest row share an ID.
3. Another account casts a vote. Confirm a new row with the voter's UUID, quest ID, and `1` or `-1`; counts update and persist after reload.
4. Double submissions create only one vote. Self-votes are allowed. Forged user IDs, editing/deleting votes, and direct browser quest inserts are rejected.
5. Another account cannot read the first account's profile, prompt, vote history, or avatar.
6. Verify pending/error states and that more than five generation attempts are allowed. A failed provider call must not create a quest.
7. Sign out and verify `/club` and `/profile` redirect to login.

## Deploy and submit

Use the existing Vercel project connected to this GitHub repository. Apply SQL and add server secrets before deployment. Commit and push the changes to trigger the existing integration, or deploy through your existing Vercel account.

Disable Vercel Deployment Protection on the existing project so the submission is accessible in Incognito. Copy the unique deployment URL for this commit from Vercel, allow its `/auth/callback` URL in Supabase, test it, and submit that deployment URL rather than the moving production alias.

Account settings, remote migrations, API calls, and the deployed URL must be verified with account access; local compilation does not establish that these external steps are complete.
