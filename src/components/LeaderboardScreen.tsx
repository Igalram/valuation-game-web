import { useEffect, useRef, useState } from "react";
import PlayerAvatar from "./PlayerAvatar";
import { STAGE_A } from "../game/definitions/stages";
import {
  fetchOverallLeaderboard,
  fetchStageLeaderboard,
  getOrCreatePlayerId,
  isLeaderboardConfigured,
  type LeaderboardEntry,
} from "../leaderboard/service";

type RankingMode = "overall" | "stage";
type RankingState =
  | { status: "loading" }
  | { status: "loaded"; entries: LeaderboardEntry[] }
  | { status: "error"; message: string };

function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<RankingMode>("overall");
  const [stageId, setStageId] = useState(STAGE_A[0]!.id);
  const [ranking, setRanking] = useState<RankingState>({ status: "loading" });
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const cache = useRef(new Map<string, LeaderboardEntry[]>());
  const requestId = useRef(0);

  useEffect(() => {
    try {
      setPlayerId(getOrCreatePlayerId());
    } catch {
      setPlayerId(null);
    }
  }, []);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    if (!isLeaderboardConfigured()) {
      setRanking({ status: "error", message: "Online leaderboard unavailable. It has not been configured for this game." });
      return;
    }

    const cacheKey = mode === "overall" ? "overall" : `stage:${stageId}`;
    const cachedEntries = cache.current.get(cacheKey);
    if (cachedEntries) {
      setRanking({ status: "loaded", entries: cachedEntries });
      return;
    }

    setRanking({ status: "loading" });
    const request = mode === "overall"
      ? fetchOverallLeaderboard()
      : fetchStageLeaderboard(stageId);
    void request.then((entries) => {
      cache.current.set(cacheKey, entries);
      if (requestId.current === currentRequest) setRanking({ status: "loaded", entries });
    }).catch((error: unknown) => {
      if (requestId.current !== currentRequest) return;
      setRanking({
        status: "error",
        message: error instanceof Error ? error.message : "The leaderboard could not be loaded. Please try again.",
      });
    });
  }, [mode, retryCount, stageId]);

  return (
    <main className="leaderboard-screen">
      <section className="leaderboard-card" aria-labelledby="leaderboard-title">
        <header className="leaderboard-header">
          <div>
            <p className="eyebrow">VALUATION LAB</p>
            <h1 id="leaderboard-title">HALL OF FAME</h1>
          </div>
          <button className="secondary-button" onClick={onBack} type="button">BACK</button>
        </header>

        <div className="leaderboard-controls" aria-label="Leaderboard ranking mode">
          <button
            aria-pressed={mode === "overall"}
            className={mode === "overall" ? "leaderboard-mode active" : "leaderboard-mode"}
            onClick={() => setMode("overall")}
            type="button"
          >
            OVERALL RANKING
          </button>
          <button
            aria-pressed={mode === "stage"}
            className={mode === "stage" ? "leaderboard-mode active" : "leaderboard-mode"}
            onClick={() => setMode("stage")}
            type="button"
          >
            STAGE RANKING
          </button>
          {mode === "stage" && (
            <label className="leaderboard-stage-select">
              Stage
              <select value={stageId} onChange={(event) => setStageId(event.target.value as typeof stageId)}>
                {STAGE_A.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.id} · {stage.title}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {ranking.status === "loading" && (
          <p className="leaderboard-state" role="status">Loading leaderboard…</p>
        )}
        {ranking.status === "error" && (
          <div className="leaderboard-state leaderboard-error" role="alert">
            <p>{ranking.message}</p>
            {isLeaderboardConfigured() && (
              <button className="secondary-button" onClick={() => setRetryCount((count) => count + 1)} type="button">
                TRY AGAIN
              </button>
            )}
          </div>
        )}
        {ranking.status === "loaded" && ranking.entries.length === 0 && (
          <p className="leaderboard-state">No scores yet. Complete a substage to claim your place!</p>
        )}
        {ranking.status === "loaded" && ranking.entries.length > 0 && (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th scope="col">RANK</th>
                  <th scope="col">PLAYER</th>
                  <th scope="col">LEVEL</th>
                  <th scope="col">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {ranking.entries.map((entry, index) => (
                  <tr className={entry.player_id === playerId ? "current-player" : ""} key={entry.player_id}>
                    <td>#{index + 1}</td>
                    <td>
                      <span className="leaderboard-player">
                        <PlayerAvatar avatarId={entry.avatar_id} className="leaderboard-avatar" />
                        <span>{entry.player_name}</span>
                        {entry.player_id === playerId && <span className="you-label">YOU</span>}
                      </span>
                    </td>
                    <td>{entry.level}</td>
                    <td>{entry.score.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="leaderboard-footnote">
          Overall scores use your best result in each completed substage.
        </p>
      </section>
    </main>
  );
}

export default LeaderboardScreen;
