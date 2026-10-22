import { useState, type FormEvent } from "react";
import { PLAYER_AVATARS, type PlayerAvatarId } from "../game/logic/playerProfile";
import PlayerAvatar from "./PlayerAvatar";

type PlayerProfileFormProps = {
  mode: "create" | "edit";
  initialName: string;
  initialAvatarId: PlayerAvatarId;
  onSave: (name: string, avatarId: PlayerAvatarId) => void;
  onCancel?: () => void;
};

function PlayerProfileForm({
  mode,
  initialName,
  initialAvatarId,
  onSave,
  onCancel,
}: PlayerProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatarId, setAvatarId] = useState<PlayerAvatarId>(initialAvatarId);
  const title = mode === "create" ? "Create your player profile" : "Edit your profile";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onSave(cleanName, avatarId);
  };

  return (
    <main className={mode === "create" ? "profile-setup-screen" : "profile-modal-backdrop"}>
      <section
        aria-labelledby="profile-form-title"
        aria-modal={mode === "edit" ? true : undefined}
        className="profile-form-card"
        role={mode === "edit" ? "dialog" : undefined}
      >
        <p className="lesson-kicker">VALUATION LAB</p>
        <h1 id="profile-form-title">{title}</h1>
        <p className="profile-form-description">
          Choose the character who will join you on your valuation journey.
        </p>
        <form onSubmit={submit}>
          <label className="profile-name-label" htmlFor="player-name">Player name</label>
          <input
            autoComplete="nickname"
            id="player-name"
            maxLength={28}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <fieldset className="avatar-options">
            <legend>Choose your avatar</legend>
            <div>
              {PLAYER_AVATARS.map((avatar) => (
                <button
                  aria-label={avatar.name}
                  aria-pressed={avatarId === avatar.id}
                  className={`avatar-option${avatarId === avatar.id ? " selected" : ""}`}
                  key={avatar.id}
                  onClick={() => setAvatarId(avatar.id)}
                  type="button"
                >
                  <PlayerAvatar avatarId={avatar.id} className="avatar-option-art" />
                  <span>{avatar.name}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="profile-form-actions">
            {mode === "edit" && onCancel && (
              <button className="secondary-button" onClick={onCancel} type="button">CANCEL</button>
            )}
            <button className="primary-button" disabled={!name.trim()} type="submit">
              {mode === "create" ? "START PLAYING" : "SAVE PROFILE"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default PlayerProfileForm;
