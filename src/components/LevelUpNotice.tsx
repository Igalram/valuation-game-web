import { useEffect, useRef } from "react";
import type { CareerLevel } from "../game/logic/career";
import type { PlayerAvatarId } from "../game/logic/playerProfile";
import PlayerAvatar from "./PlayerAvatar";

type LevelUpNoticeProps = {
  level: CareerLevel;
  avatarId: PlayerAvatarId;
  onContinue: () => void;
};

function LevelUpNotice({ level, avatarId, onContinue }: LevelUpNoticeProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => buttonRef.current?.focus(), []);

  return (
    <div className="promotion-backdrop">
      <section aria-labelledby="level-up-title" aria-modal="true" className="promotion-card" role="dialog">
        <PlayerAvatar avatarId={avatarId} className="promotion-avatar" />
        <p className="lesson-kicker">CAREER MILESTONE</p>
        <h2 id="level-up-title">LEVEL UP!</h2>
        <strong className="promotion-level">LEVEL {level.level}</strong>
        <p className="promotion-title">{level.title}</p>
        <button className="primary-button" onClick={onContinue} ref={buttonRef} type="button">
          CONTINUE
        </button>
      </section>
    </div>
  );
}

export default LevelUpNotice;
