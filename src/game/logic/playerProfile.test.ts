import { describe, expect, it } from "vitest";
import { getPlayerAvatar, isPlayerAvatarId, PLAYER_AVATARS } from "./playerProfile";

describe("player avatar catalog", () => {
  it("provides 24 permanent, distinct identities with replaceable art keys", () => {
    const ids = PLAYER_AVATARS.map(({ id }) => id);
    const portraitKeys = PLAYER_AVATARS.map(({ portraitAsset }) => portraitAsset);
    const characterKeys = PLAYER_AVATARS.map(({ fullBodyAsset }) => fullBodyAsset);

    expect(PLAYER_AVATARS).toHaveLength(24);
    expect(new Set(ids).size).toBe(24);
    expect(new Set(portraitKeys).size).toBe(24);
    expect(new Set(characterKeys).size).toBe(24);
    expect(ids.every(isPlayerAvatarId)).toBe(true);
    expect(getPlayerAvatar("unknown-avatar").id).toBe(PLAYER_AVATARS[0].id);
  });
});
