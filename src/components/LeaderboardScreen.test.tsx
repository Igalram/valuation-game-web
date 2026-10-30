import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeaderboardScreen from "./LeaderboardScreen";

const leaderboardMocks = vi.hoisted(() => ({
  configured: false,
  fetchOverall: vi.fn(),
  fetchStage: vi.fn(),
}));

vi.mock("../leaderboard/service", () => ({
  fetchOverallLeaderboard: leaderboardMocks.fetchOverall,
  fetchStageLeaderboard: leaderboardMocks.fetchStage,
  getOrCreatePlayerId: () => "00000000-0000-4000-8000-000000000001",
  isLeaderboardConfigured: () => leaderboardMocks.configured,
}));

describe("LeaderboardScreen", () => {
  beforeEach(() => {
    leaderboardMocks.configured = false;
    leaderboardMocks.fetchOverall.mockReset();
    leaderboardMocks.fetchStage.mockReset();
  });

  it("shows a friendly unavailable state and returns to the menu", async () => {
    const onBack = vi.fn();
    render(<LeaderboardScreen onBack={onBack} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Online leaderboard unavailable");
    fireEvent.click(screen.getByRole("button", { name: "BACK" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("loads rankings on demand and highlights the current player", async () => {
    leaderboardMocks.configured = true;
    leaderboardMocks.fetchOverall.mockResolvedValue([{
      player_id: "00000000-0000-4000-8000-000000000001",
      player_name: "Alex",
      avatar_id: "alex",
      level: 2,
      score: 1200,
    }]);
    leaderboardMocks.fetchStage.mockResolvedValue([]);

    render(<LeaderboardScreen onBack={() => undefined} />);
    expect(await screen.findByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();
    expect(leaderboardMocks.fetchOverall).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "STAGE RANKING" }));
    const stageSelect = screen.getByLabelText("Stage");
    fireEvent.change(stageSelect, { target: { value: "A2" } });
    await waitFor(() => {
      expect(leaderboardMocks.fetchStage).toHaveBeenCalledWith("A2");
    });
  });
});
