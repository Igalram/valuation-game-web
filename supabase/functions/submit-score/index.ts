import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const avatarIds = new Set([
  "alex", "maya", "jordan", "sam", "amara", "leo", "nina", "marcus",
  "sofia", "dev", "imani", "theo", "lucia", "kai", "zara", "noah",
  "elena", "ravi", "cleo", "milo", "aya", "ezra", "lila", "andre",
]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const stagePattern = /^(A[1-8]|B[1-5])$/;

function response(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return response({ error: "Method not allowed." }, 405);
  }

  let payload: unknown;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return response({ error: "Request body is too large." }, 413);
  }
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return response({ error: "Request body could not be read." }, 400);
  }
  if (new TextEncoder().encode(rawBody).length > 4096) {
    return response({ error: "Request body is too large." }, 413);
  }
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return response({ error: "Request body must be valid JSON." }, 400);
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return response({ error: "Request body must be an object." }, 400);
  }

  const body = payload as Record<string, unknown>;
  const expectedFields = [
    "avatarId",
    "level",
    "playerId",
    "playerName",
    "score",
    "stageId",
    "submissionId",
  ];
  const actualFields = Object.keys(body).sort();
  const playerName = typeof body.playerName === "string" ? body.playerName.trim() : "";
  const validScore =
    typeof body.score === "number" &&
    Number.isInteger(body.score) &&
    body.score >= -800_000 &&
    body.score <= 800_000;
  const validLevel =
    typeof body.level === "number" &&
    Number.isInteger(body.level) &&
    body.level >= 1 &&
    body.level <= 6;

  if (
    actualFields.length !== expectedFields.length ||
    actualFields.some((field, index) => field !== expectedFields[index]) ||
    typeof body.playerId !== "string" ||
    !uuidPattern.test(body.playerId) ||
    typeof body.submissionId !== "string" ||
    !uuidPattern.test(body.submissionId) ||
    playerName.length < 1 ||
    playerName.length > 28 ||
    /[\u0000-\u001f\u007f]/.test(playerName) ||
    typeof body.avatarId !== "string" ||
    !avatarIds.has(body.avatarId) ||
    typeof body.stageId !== "string" ||
    !stagePattern.test(body.stageId) ||
    !validLevel ||
    !validScore
  ) {
    return response({ error: "Score submission contains invalid fields." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Required server-side Supabase environment variables are missing.");
    return response({ error: "Score submission is temporarily unavailable." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("submit_leaderboard_score", {
    requested_submission_id: body.submissionId,
    requested_player_id: body.playerId,
    requested_player_name: playerName,
    requested_avatar_id: body.avatarId,
    requested_stage_id: body.stageId,
    requested_level: body.level,
    requested_score: body.score,
  });

  if (error) {
    if (error.message.includes("RATE_LIMITED")) {
      return response({ error: "Too many scores were submitted. Please wait a minute." }, 429);
    }
    console.error("Score submission RPC failed:", error.message);
    return response({ error: "Score submission could not be completed." }, 500);
  }

  // Client-reported points are not proof that the underlying gameplay was cheat-free.
  return response({ accepted: data === true, duplicate: data === false }, 200);
});
