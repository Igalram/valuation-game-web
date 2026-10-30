import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardEntry = {
  player_id: string;
  player_name: string;
  avatar_id: string;
  level: number;
  score: number;
};

export type ScoreSubmission = {
  playerName: string;
  avatarId: string;
  stageId: string;
  level: number;
  score: number;
};

export const PLAYER_ID_KEY = "valuation-game-web-player-id";

export class LeaderboardUnavailableError extends Error {
  constructor() {
    super("Online leaderboard unavailable. It has not been configured for this game.");
    this.name = "LeaderboardUnavailableError";
  }
}

function getClientConfig(): { url: string; key: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;

  try {
    const parsedUrl = new URL(url);
    const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname);
    if (parsedUrl.protocol !== "https:" && !(parsedUrl.protocol === "http:" && localHost)) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, key };
}

export function isLeaderboardConfigured(): boolean {
  return getClientConfig() !== null;
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  const config = getClientConfig();
  if (!config) throw new LeaderboardUnavailableError();
  client ??= createClient(config.url, config.key);
  return client;
}

export function getOrCreatePlayerId(): string {
  const existing = window.localStorage.getItem(PLAYER_ID_KEY);
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) {
    return existing;
  }
  const playerId = window.crypto.randomUUID();
  window.localStorage.setItem(PLAYER_ID_KEY, playerId);
  return playerId;
}

export async function submitCompletedStage(submission: ScoreSubmission): Promise<void> {
  const supabase = getClient();
  const playerId = getOrCreatePlayerId();
  const { error } = await supabase.functions.invoke("submit-score", {
    body: {
      ...submission,
      playerId,
      submissionId: window.crypto.randomUUID(),
    },
  });
  if (error) throw new Error(error.message || "Score submission failed.");
}

async function fetchRanking(
  rpc: "leaderboard_overall" | "leaderboard_stage",
  stageId?: string,
): Promise<LeaderboardEntry[]> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc(rpc, stageId ? { requested_stage_id: stageId } : {});
  if (error) throw new Error(error.message || "Leaderboard could not be loaded.");
  return (data ?? []) as LeaderboardEntry[];
}

export function fetchOverallLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchRanking("leaderboard_overall");
}

export function fetchStageLeaderboard(stageId: string): Promise<LeaderboardEntry[]> {
  return fetchRanking("leaderboard_stage", stageId);
}
