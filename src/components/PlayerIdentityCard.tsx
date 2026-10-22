import { getCareerLevel } from "../game/logic/career";
import type { PlayerAvatarId } from "../game/logic/playerProfile";
import PlayerAvatar from "./PlayerAvatar";

type PlayerIdentityCardProps = {
  name: string;
  avatarId: PlayerAvatarId;
  completedStages: readonly string[];
  availableCash: number;
  onEdit: () => void;
};

function PlayerIdentityCard({
  name,
  avatarId,
  completedStages,
  availableCash,
  onEdit,
}: PlayerIdentityCardProps) {
  const career = getCareerLevel(completedStages);
  return (
    <button
      aria-label={`Edit profile for ${name}`}
      className="player-identity-card"
      onClick={onEdit}
      type="button"
    >
      <PlayerAvatar avatarId={avatarId} className="player-identity-avatar" />
      <span className="player-identity-copy">
        <strong className="player-identity-name">{name}</strong>
        <span className="player-identity-career">LEVEL {career.level} · {career.title.toUpperCase()}</span>
        <span className="player-identity-cash">${availableCash.toLocaleString("en-US")} CASH</span>
      </span>
    </button>
  );
}

export default PlayerIdentityCard;
