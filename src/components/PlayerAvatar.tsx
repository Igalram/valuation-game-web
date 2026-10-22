import { getPlayerAvatar } from "../game/logic/playerProfile";
import { useId } from "react";

type PlayerAvatarProps = {
  avatarId: string;
  className?: string;
};

function PlayerAvatar({ avatarId, className }: PlayerAvatarProps) {
  const avatar = getPlayerAvatar(avatarId);
  const clipId = `player-avatar-${useId()}`;
  const hair = (() => {
    switch (avatar.hairStyle) {
      case "curls":
      case "afro":
        return (
          <g fill={avatar.hair}>
            {Array.from({ length: avatar.hairStyle === "afro" ? 13 : 9 }, (_, index) => {
              const x = avatar.hairStyle === "afro"
                ? 19 + (index % 7) * 9
                : 25 + (index % 5) * 11;
              const y = avatar.hairStyle === "afro"
                ? 29 - (index % 3) * 7
                : 27 + Math.floor(index / 5) * 8;
              return <circle cx={x} cy={y} key={index} r={avatar.hairStyle === "afro" ? 11 : 8} />;
            })}
          </g>
        );
      case "braids":
      case "locs":
        return (
          <g fill={avatar.hair}>
            <path d="M23 39c0-20 10-29 25-29s25 9 25 29l-7 31H30z" />
            {Array.from({ length: 7 }, (_, index) => (
              <path
                d={`M${28 + index * 6} 23q-7 17 0 42`}
                fill="none"
                key={index}
                stroke={avatar.hair}
                strokeLinecap="round"
                strokeWidth={avatar.hairStyle === "locs" ? 6 : 3}
              />
            ))}
          </g>
        );
      case "long":
      case "waves":
        return (
          <g fill={avatar.hair}>
            <path d="M24 42c-3-22 7-33 24-33s27 11 24 33l-4 29H28z" />
            {avatar.hairStyle === "waves" && (
              <path d="M26 47q8-8 0-16m44 16q-8-8 0-16" fill="none" stroke="#ffffff45" strokeWidth="3" />
            )}
          </g>
        );
      case "bob":
        return <path d="M23 40c-2-21 7-31 25-31s27 10 25 31l-4 18-9-8-12 6-12-6-9 8z" fill={avatar.hair} />;
      case "bun":
        return (
          <g fill={avatar.hair}>
            <circle cx="61" cy="15" r="11" />
            <path d="M25 41c-2-21 7-32 23-32s25 11 23 32l-9-11-14 5-12-5z" />
          </g>
        );
      case "pixie":
        return <path d="M25 40c-2-20 7-31 24-31s25 10 23 29l-12-7-9 5-11-5-12 10z" fill={avatar.hair} />;
      case "undercut":
        return <path d="M25 41c0-21 8-32 24-32 16 0 24 11 22 30l-11-11-10 2-9-6-8 13z" fill={avatar.hair} />;
      case "short":
      case "swept":
      default:
        return (
          <path
            d={avatar.hairStyle === "swept"
              ? "M25 40c-2-22 7-31 24-31 16 0 26 11 23 30-8-8-17-12-27-12-6 7-12 10-20 13z"
              : "M25 40c-2-20 7-31 24-31 16 0 24 11 23 30l-8-10-10 5-10-7-9 10z"}
            fill={avatar.hair}
          />
        );
    }
  })();
  const frontHair = (() => {
    switch (avatar.hairStyle) {
      case "curls":
      case "afro":
        return null;
      case "braids":
      case "locs":
        return <path d="M24 41c-2-21 7-32 24-32s26 11 24 32l-10-11-14 5-13-5z" fill={avatar.hair} />;
      case "bob":
        return <path d="M24 42c-3-22 7-33 24-33s27 11 24 33l-10-9-10 4-9-8-10 8z" fill={avatar.hair} />;
      case "bun":
        return <path d="M25 41c-2-20 7-32 23-32 17 0 26 12 23 32l-11-11-12 4-11-5z" fill={avatar.hair} />;
      case "pixie":
        return <path d="M25 41c-2-20 7-32 24-32 16 0 25 11 23 30l-12-6-10 5-10-6-12 10z" fill={avatar.hair} />;
      case "undercut":
        return <path d="M25 41c-2-20 7-32 24-32 16 0 25 11 23 30l-13-8-10 3-9-6-12 13z" fill={avatar.hair} />;
      case "swept":
        return <path d="M25 41c-2-21 7-32 24-32 17 0 27 12 23 33-7-8-16-13-27-14-6 7-12 11-20 13z" fill={avatar.hair} />;
      case "waves":
        return <path d="M24 41c-3-22 7-33 24-33s27 11 24 33l-8-8-8 3-8-8-9 8-9-4z" fill={avatar.hair} />;
      case "long":
      case "short":
      default:
        return <path d="M25 41c-2-20 7-32 24-32 16 0 25 11 23 31l-9-10-10 5-10-7-9 10z" fill={avatar.hair} />;
    }
  })();

  return (
    <svg
      aria-hidden="true"
      className={className}
      data-art-key={avatar.portraitAsset}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="48" cy="48" r="47" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="96" height="96" fill="#20334a" />
        <path d="M8 99c3-24 17-35 40-35s37 11 40 35" fill={avatar.shirt} />
        <path d="M34 62v-9h28v9L48 75z" fill={avatar.skin} />
        {avatar.hairStyle === "long" || avatar.hairStyle === "waves" || avatar.hairStyle === "braids" || avatar.hairStyle === "locs" ? (
          <path d="M24 40c-4 12-3 25 3 33l8-7-2-28zM72 40c4 12 3 25-3 33l-8-7 2-28z" fill={avatar.hair} />
        ) : null}
        {hair}
        <path d="M27 38c0-15 8-24 21-24s21 9 21 24v13c0 14-9 23-21 23s-21-9-21-23z" fill={avatar.skin} />
        {frontHair}
        <path d="M34 43q6-4 12 0M50 43q6-4 12 0" fill="none" stroke={avatar.hair} strokeLinecap="round" strokeWidth="2" />
        <ellipse cx="40" cy="48" rx="2.4" ry="2.8" fill={avatar.eyes} />
        <ellipse cx="56" cy="48" rx="2.4" ry="2.8" fill={avatar.eyes} />
        <path d="M48 50l-1.5 6h3" fill="none" stroke="#a66d50" strokeLinecap="round" strokeWidth="1.5" />
        {avatar.freckles && (
          <g fill="#8d573c">
            <circle cx="34" cy="54" r="1" /><circle cx="38" cy="57" r="1" />
            <circle cx="59" cy="54" r="1" /><circle cx="63" cy="57" r="1" />
          </g>
        )}
        {avatar.facialHair === "mustache" && (
          <path d="M39 58q4-5 9 0 5-5 9 0-2 6-9 3-7 3-9-3z" fill={avatar.hair} />
        )}
        {avatar.facialHair === "beard" && (
          <path d="M30 56q4 4 7 2 11 9 22 0 4 2 7-2-1 15-18 18-17-3-18-18z" fill={avatar.hair} />
        )}
        {avatar.glasses && (
          <g fill="none" stroke="#263247" strokeWidth="2.5">
            {avatar.glasses === "round" ? (
              <><circle cx="40" cy="48" r="7" /><circle cx="56" cy="48" r="7" /></>
            ) : (
              <><rect x="33" y="42" width="14" height="12" rx="2" /><rect x="49" y="42" width="14" height="12" rx="2" /></>
            )}
            <path d="M47 47h2" />
          </g>
        )}
        {!avatar.facialHair && (
          <path d="M42 59q6 5 12 0" fill="none" stroke="#7d3d38" strokeLinecap="round" strokeWidth="2" />
        )}
      </g>
      <circle cx="48" cy="48" r="46.5" fill="none" stroke="#ffffff30" />
    </svg>
  );
}

export default PlayerAvatar;
