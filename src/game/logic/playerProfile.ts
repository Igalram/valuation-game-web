export type AvatarHairStyle =
  | "swept"
  | "curls"
  | "short"
  | "long"
  | "bob"
  | "braids"
  | "afro"
  | "undercut"
  | "bun"
  | "waves"
  | "locs"
  | "pixie";

export type PlayerAvatar = {
  id: string;
  name: string;
  portraitAsset: string;
  fullBodyAsset: string;
  skin: string;
  hair: string;
  shirt: string;
  hairStyle: AvatarHairStyle;
  eyes: string;
  glasses?: "round" | "square";
  facialHair?: "beard" | "mustache";
  freckles?: boolean;
};

const avatar = <const Id extends string>(
  id: Id,
  name: string,
  skin: string,
  hair: string,
  shirt: string,
  hairStyle: AvatarHairStyle,
  features: Partial<Pick<PlayerAvatar, "eyes" | "glasses" | "facialHair" | "freckles">> = {},
): PlayerAvatar & { id: Id } => ({
  id,
  name,
  portraitAsset: `${id}-portrait-v1`,
  fullBodyAsset: `${id}-character-v1`,
  skin,
  hair,
  shirt,
  hairStyle,
  eyes: "#253044",
  ...features,
});

export const PLAYER_AVATARS = [
  avatar("alex", "Alex", "#f0c6a2", "#30251f", "#41b7c4", "swept"),
  avatar("maya", "Maya", "#d89b72", "#211a24", "#d89b55", "curls", { freckles: true, eyes: "#385c50" }),
  avatar("jordan", "Jordan", "#8d573c", "#201c1a", "#739bd0", "short"),
  avatar("sam", "Sam", "#edbd91", "#a34e35", "#66a47e", "long", { eyes: "#56724c" }),
  avatar("amara", "Amara", "#75472f", "#17151a", "#bb789d", "braids"),
  avatar("leo", "Leo", "#f2d2b4", "#704832", "#d66d5b", "undercut", { facialHair: "mustache" }),
  avatar("nina", "Nina", "#c7835e", "#17151a", "#687fc3", "bob", { glasses: "round", eyes: "#493d32" }),
  avatar("marcus", "Marcus", "#603b2c", "#171717", "#d0a94e", "afro"),
  avatar("sofia", "Sofia", "#f4d8c4", "#9b6043", "#4da99c", "waves", { freckles: true, eyes: "#528174" }),
  avatar("dev", "Dev", "#d9a77c", "#201c1a", "#a37bc8", "bun", { glasses: "square" }),
  avatar("imani", "Imani", "#4e3028", "#111114", "#df765d", "locs", { eyes: "#4c7657" }),
  avatar("theo", "Theo", "#e2b28d", "#513527", "#5587a5", "pixie", { facialHair: "beard" }),
  avatar("lucia", "Lucia", "#d9a27f", "#38232a", "#dc9f5d", "long", { glasses: "square" }),
  avatar("kai", "Kai", "#c88c67", "#191919", "#68a36f", "undercut"),
  avatar("zara", "Zara", "#8c573e", "#1c1718", "#bd7191", "braids", { glasses: "round" }),
  avatar("noah", "Noah", "#f0c8a6", "#a47442", "#5685bd", "waves", { freckles: true, eyes: "#5478a0" }),
  avatar("elena", "Elena", "#efc7a4", "#312129", "#d46972", "bun"),
  avatar("ravi", "Ravi", "#9e6242", "#211b18", "#61a9ae", "short", { facialHair: "beard" }),
  avatar("cleo", "Cleo", "#663e32", "#24161d", "#d1a64d", "afro", { glasses: "round" }),
  avatar("milo", "Milo", "#d69b73", "#6d4939", "#688ac4", "curls", { facialHair: "mustache" }),
  avatar("aya", "Aya", "#f1d3b5", "#532d21", "#8aaf72", "bob"),
  avatar("ezra", "Ezra", "#7c4d38", "#1c1717", "#c87955", "locs", { glasses: "square" }),
  avatar("lila", "Lila", "#c98463", "#201d24", "#648eae", "pixie", { freckles: true }),
  avatar("andre", "Andre", "#4f332d", "#161414", "#b77caa", "short", { facialHair: "beard", glasses: "round" }),
] as const satisfies readonly PlayerAvatar[];

export type PlayerAvatarId = (typeof PLAYER_AVATARS)[number]["id"];

export function getPlayerAvatar(avatarId: string): PlayerAvatar {
  return PLAYER_AVATARS.find(({ id }) => id === avatarId) ?? PLAYER_AVATARS[0];
}

export function isPlayerAvatarId(value: unknown): value is PlayerAvatarId {
  return typeof value === "string" && PLAYER_AVATARS.some(({ id }) => id === value);
}
