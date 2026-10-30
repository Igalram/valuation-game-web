# Online leaderboard setup

The leaderboard is an optional Supabase feature. Until a project is configured and the migration and Edge Function are deployed, the game continues to use its existing local save and displays an **Online leaderboard unavailable** message. No online leaderboard is active merely by adding these files.

Scores use the game's existing performance points at the moment an eight-question substage is completed. Cash, career earnings, Lifestyle items, and existing saved games are not submitted. Overall ranking adds each player's best score for each substage, so replaying a substage cannot increase that substage's contribution beyond the player's best attempt.

## 1. Create a free Supabase project

1. Create an account at [supabase.com](https://supabase.com/) and create a new project on the free plan.
2. Choose a project name, a strong database password, and a nearby region. Keep the database password private; the game does not need it.
3. Wait until the project reports that it is ready.

## 2. Execute the SQL migration

Apply the migrations in order: [001_leaderboard.sql](./supabase/migrations/001_leaderboard.sql), then [002_stage_b_leaderboard.sql](./supabase/migrations/002_stage_b_leaderboard.sql). The second migration extends the existing leaderboard to the B1–B5 substages and preserves negative performance-point totals.

**Using the Supabase Dashboard:** open the project's SQL Editor and run each migration in order, first `001_leaderboard.sql`, then `002_stage_b_leaderboard.sql`.

**Using the Supabase CLI:** install and authenticate the CLI, then from this repository run:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migrations create the scores table, public read-only RLS access, aggregate ranking RPCs, and a service-role-only score submission RPC with a per-player rate limit. Anonymous and authenticated clients are explicitly not granted insert, update, or delete access to scores. Both Stage A and B1–B5 are valid score selections.

## 3. Deploy the Edge Function

The function source is [supabase/functions/submit-score/index.ts](./supabase/functions/submit-score/index.ts). The function validates every required field and invokes the restricted database RPC with server-side credentials. Its entry in [supabase/config.toml](./supabase/config.toml) disables platform JWT verification because this game has no player accounts and the newer publishable key is not a user JWT. The endpoint is intentionally public; its validation, database rate limit, and server-only credentials are the controls, not user authentication.

From the repository root, deploy it:

```sh
supabase functions deploy submit-score
```

Supabase provides `SUPABASE_URL` to deployed functions. Ensure the function has the `SUPABASE_SERVICE_ROLE_KEY` secret set in Supabase's Edge Function secrets. If it is not already present in the project's Edge Function secrets, retrieve the service-role key from the project's API settings and set it with:

```sh
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Do not put that key in this repository, `.env.local`, a GitHub Actions secret used by the frontend build, or any `VITE_` variable. Only the Edge Function may use it.

## 4. Obtain the project URL and public key

In the Supabase Dashboard, open **Project Settings → API** (or **API Keys** in the newer dashboard).

- Copy the **Project URL**.
- Copy either the legacy **anon/public** key or the newer **publishable** key. Both work as the value of `VITE_SUPABASE_ANON_KEY`.

These are public browser credentials. RLS and the restricted submission function provide the actual access controls; the public key is not a service-role secret.

## 5. Configure local development

Copy `.env.example` to `.env.local` and fill in the two values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

`.env.local` is ignored by Git. Restart the Vite dev server after changing environment values. Do not add a service-role key or database password to this file.

Start local development with:

```sh
npm run dev
```

## 6. Configure GitHub Actions

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public or publishable key |

The GitHub Pages workflow passes these two repository secrets directly to the Vite production build. Local `.env.local` values are not automatically available in GitHub Actions. The Vite build embeds these public values in the downloadable site, as expected; never supply a service-role key here. Re-run or push a deployment after setting the secrets.

## 7. Test submission and retrieval

1. Confirm the migration succeeded and that `submit-score` is deployed with its required service-role secret.
2. Run locally with the `.env.local` values and start a **new game**. Existing saves and prior completed substages are deliberately not imported or submitted.
3. Complete all eight questions of a substage. Its performance points are submitted once at the completion transition; replaying it submits a new attempt, while the ranking still uses only the best result for that player and substage.
4. Open **HALL OF FAME**. Check **Overall Ranking** and **Stage Ranking**, then select a Stage A or B1–B5 substage. The rankings are retrieved through database RPCs, not by downloading the scores table into the browser.
5. To test a clean deployment, configure the same two public values in GitHub Actions, deploy the Pages workflow, and open the deployed site. A working local `.env.local` does not configure the hosted build.
6. Without Supabase configuration, open **HALL OF FAME** to verify the friendly unavailable state. This does not indicate a live or operational leaderboard.

## 8. Cheating limitations

The Edge Function validates score shape, bounds, player identity format, avatar and stage identifiers, and submission IDs. The database deduplicates submission IDs and applies a basic rate limit per persistent player UUID. Anonymous users can read rankings but cannot directly write, update, or delete rows.

However, questions, answers, elapsed time, progression, and score calculation run in the player's browser. A player can modify browser code or send a fabricated but valid-looking score to the public Edge Function. The random player UUID is an identifier, not authentication, and a determined player could create another one. Therefore the leaderboard is suitable for a small educational game but scores must **not** be treated as verified, cheat-proof competition results. Stronger integrity would require trusted server-side gameplay and score verification.
