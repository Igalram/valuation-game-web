-- Scores are reported by a browser and cannot prove that gameplay was legitimate.
CREATE TABLE public.leaderboard_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE,
  player_id uuid NOT NULL,
  player_name text NOT NULL CHECK (char_length(btrim(player_name)) BETWEEN 1 AND 28),
  avatar_id text NOT NULL CHECK (avatar_id IN (
    'alex', 'maya', 'jordan', 'sam', 'amara', 'leo', 'nina', 'marcus',
    'sofia', 'dev', 'imani', 'theo', 'lucia', 'kai', 'zara', 'noah',
    'elena', 'ravi', 'cleo', 'milo', 'aya', 'ezra', 'lila', 'andre'
  )),
  stage_id text NOT NULL CHECK (stage_id ~ '^A[1-8]$'),
  level integer NOT NULL CHECK (level BETWEEN 1 AND 6),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 800000),
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leaderboard_scores_stage_score_idx
  ON public.leaderboard_scores (stage_id, score DESC);
CREATE INDEX leaderboard_scores_player_stage_score_idx
  ON public.leaderboard_scores (player_id, stage_id, score DESC);
CREATE INDEX leaderboard_scores_player_submitted_idx
  ON public.leaderboard_scores (player_id, submitted_at DESC, id DESC);
CREATE INDEX leaderboard_scores_submitted_at_idx
  ON public.leaderboard_scores (submitted_at DESC);

ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leaderboard_scores FROM anon, authenticated;
GRANT SELECT ON public.leaderboard_scores TO anon, authenticated;
CREATE POLICY leaderboard_scores_public_read
  ON public.leaderboard_scores
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.leaderboard_submission_limits (
  player_id uuid PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  submission_count integer NOT NULL CHECK (submission_count > 0)
);
ALTER TABLE public.leaderboard_submission_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leaderboard_submission_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_leaderboard_score(
  requested_submission_id uuid,
  requested_player_id uuid,
  requested_player_name text,
  requested_avatar_id text,
  requested_stage_id text,
  requested_level integer,
  requested_score integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rate_limit_passed boolean;
BEGIN
  IF requested_submission_id IS NULL
    OR requested_player_id IS NULL
    OR requested_player_name IS NULL
    OR char_length(btrim(requested_player_name)) NOT BETWEEN 1 AND 28
    OR requested_avatar_id NOT IN (
      'alex', 'maya', 'jordan', 'sam', 'amara', 'leo', 'nina', 'marcus',
      'sofia', 'dev', 'imani', 'theo', 'lucia', 'kai', 'zara', 'noah',
      'elena', 'ravi', 'cleo', 'milo', 'aya', 'ezra', 'lila', 'andre'
    )
    OR requested_stage_id !~ '^A[1-8]$'
    OR requested_level NOT BETWEEN 1 AND 6
    OR requested_score NOT BETWEEN 0 AND 800000
  THEN
    RAISE EXCEPTION 'INVALID_SUBMISSION';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.leaderboard_scores
    WHERE submission_id = requested_submission_id
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.leaderboard_submission_limits AS limits (
    player_id,
    window_started_at,
    submission_count
  )
  VALUES (requested_player_id, now(), 1)
  ON CONFLICT (player_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= now() - interval '1 minute' THEN now()
      ELSE limits.window_started_at
    END,
    submission_count = CASE
      WHEN limits.window_started_at <= now() - interval '1 minute' THEN 1
      ELSE limits.submission_count + 1
    END
  WHERE limits.window_started_at <= now() - interval '1 minute'
    OR limits.submission_count < 6
  RETURNING true INTO rate_limit_passed;

  IF NOT COALESCE(rate_limit_passed, false) THEN
    RAISE EXCEPTION 'RATE_LIMITED';
  END IF;

  INSERT INTO public.leaderboard_scores (
    submission_id,
    player_id,
    player_name,
    avatar_id,
    stage_id,
    level,
    score
  )
  VALUES (
    requested_submission_id,
    requested_player_id,
    btrim(requested_player_name),
    requested_avatar_id,
    requested_stage_id,
    requested_level,
    requested_score
  )
  ON CONFLICT (submission_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_leaderboard_score(uuid, uuid, text, text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_leaderboard_score(uuid, uuid, text, text, text, integer, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.leaderboard_overall()
RETURNS TABLE (
  player_id uuid,
  player_name text,
  avatar_id text,
  level integer,
  score integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH stage_bests AS (
    SELECT scores.player_id, scores.stage_id, max(scores.score) AS best_score
    FROM public.leaderboard_scores AS scores
    GROUP BY scores.player_id, scores.stage_id
  ),
  player_totals AS (
    SELECT bests.player_id, sum(bests.best_score)::integer AS total_score
    FROM stage_bests AS bests
    GROUP BY bests.player_id
  ),
  latest_profiles AS (
    SELECT DISTINCT ON (scores.player_id)
      scores.player_id, scores.player_name, scores.avatar_id, scores.level
    FROM public.leaderboard_scores AS scores
    ORDER BY scores.player_id, scores.submitted_at DESC, scores.id DESC
  )
  SELECT
    profiles.player_id,
    profiles.player_name,
    profiles.avatar_id,
    profiles.level,
    totals.total_score
  FROM player_totals AS totals
  JOIN latest_profiles AS profiles USING (player_id)
  ORDER BY totals.total_score DESC, profiles.player_id
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.leaderboard_stage(requested_stage_id text)
RETURNS TABLE (
  player_id uuid,
  player_name text,
  avatar_id text,
  level integer,
  score integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH stage_bests AS (
    SELECT scores.player_id, max(scores.score)::integer AS best_score
    FROM public.leaderboard_scores AS scores
    WHERE scores.stage_id = requested_stage_id
    GROUP BY scores.player_id
  ),
  latest_profiles AS (
    SELECT DISTINCT ON (scores.player_id)
      scores.player_id, scores.player_name, scores.avatar_id, scores.level
    FROM public.leaderboard_scores AS scores
    JOIN stage_bests AS bests USING (player_id)
    ORDER BY scores.player_id, scores.submitted_at DESC, scores.id DESC
  )
  SELECT
    profiles.player_id,
    profiles.player_name,
    profiles.avatar_id,
    profiles.level,
    bests.best_score
  FROM stage_bests AS bests
  JOIN latest_profiles AS profiles USING (player_id)
  ORDER BY bests.best_score DESC, profiles.player_id
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.leaderboard_overall() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leaderboard_stage(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leaderboard_overall() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_stage(text) TO anon, authenticated;
