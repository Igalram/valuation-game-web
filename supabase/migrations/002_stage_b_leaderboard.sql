ALTER TABLE public.leaderboard_scores
  DROP CONSTRAINT IF EXISTS leaderboard_scores_stage_id_check;
ALTER TABLE public.leaderboard_scores
  ADD CONSTRAINT leaderboard_scores_stage_id_check
  CHECK (stage_id ~ '^(A[1-8]|B[1-5])$');

ALTER TABLE public.leaderboard_scores
  DROP CONSTRAINT IF EXISTS leaderboard_scores_score_check;
ALTER TABLE public.leaderboard_scores
  ADD CONSTRAINT leaderboard_scores_score_check
  CHECK (score BETWEEN -800000 AND 800000);

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
    OR requested_stage_id !~ '^(A[1-8]|B[1-5])$'
    OR requested_level NOT BETWEEN 1 AND 6
    OR requested_score NOT BETWEEN -800000 AND 800000
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
