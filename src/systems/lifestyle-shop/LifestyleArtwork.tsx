import type { LifestyleItem } from "./catalog";

const palette = [
  "#41b7c4",
  "#8badc9",
  "#6b87b3",
  "#c28b6b",
  "#bccbdd",
  "#9ec0ae",
  "#527097",
  "#3c4b6c",
  "#b27197",
  "#d4ac5b",
  "#9977c4",
  "#cd6b79",
];

type LifestyleArtworkProps = {
  item: LifestyleItem;
  className?: string;
};

function LifestyleArtwork({ item, className }: LifestyleArtworkProps) {
  if (item.category === "cars") {
    return (
      <img
        className={className}
        src={`${import.meta.env.BASE_URL}assets/lifestyle/cars/${item.id}.png`}
        alt={item.name}
      />
    );
  }

  const color = palette[item.variant % palette.length]!;
  const common = { className, viewBox: "0 0 240 160", role: "img", "aria-label": item.name };
  return (
    <svg {...common}>
      {item.illustration === "outfit" && (
        <g transform="translate(83 4) scale(.76)">
          <path d="M28 76h42l15 60H21zM28 86l-13 41m58-41 16 41" fill={color} stroke={color} strokeWidth="14" />
          <path d="m38 137-3 57m31-57-3 57" stroke={item.variant < 6 ? "#111d2e" : color} strokeWidth="17" />
          <path d="M49 80v52" stroke="#d2e1eb" strokeWidth="2" />
          {item.variant >= 6 && <path d="m46 81 7 0 2 36-6 5-4-5z" fill="#dcb257" />}
          {item.variant >= 9 && <path d="M64 90v39" stroke="#dcb257" strokeWidth="4" strokeDasharray="2 10" />}
        </g>
      )}
      {item.illustration === "watch" && (
        <g>
          <rect x="104" y="10" width="32" height="140" rx="8" fill={color} />
          <circle cx="120" cy="80" r="43" fill="#dcb257" />
          <circle cx="120" cy="80" r="35" fill="#111d2e" />
          <path d="M120 80V52m0 28 20 11" stroke="#d2e1eb" strokeWidth="4" />
        </g>
      )}
      {item.illustration === "chain" && (
        <g fill="none" stroke={item.variant % 2 ? "#dcb257" : "#d2e1eb"} strokeWidth="9">
          <path d="M55 18a65 58 0 0 0 130 0" />
          <path d="m120 114 15 14-15 18-15-18z" fill="#dcb257" />
        </g>
      )}
      {item.illustration === "glasses" && (
        <g>
          <rect x="30" y="54" width="78" height="53" rx="15" fill={color} />
          <rect x="132" y="54" width="78" height="53" rx="15" fill={color} />
          <rect x="37" y="61" width="64" height="39" rx="10" fill="#111d2e" />
          <rect x="139" y="61" width="64" height="39" rx="10" fill="#111d2e" />
          <path d="M105 68h30" stroke="#dcb257" strokeWidth="5" />
        </g>
      )}
      {item.illustration === "hat" && (
        <g>
          <ellipse cx="120" cy="75" rx="73" ry="49" fill={color} />
          <path d="M52 87h136v14H52z" fill="#111d2e" />
          <ellipse cx="120" cy="110" rx="102" ry="12" fill={color} />
        </g>
      )}
      {["bicycle", "ebike", "motorcycle", "scooter", "atv"].includes(item.illustration) && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="48" cy="118" r="31" stroke="#111d2e" strokeWidth="7" />
          <circle cx="190" cy="118" r="31" stroke="#111d2e" strokeWidth="7" />
          {(item.illustration === "bicycle" || item.illustration === "ebike") ? (
            <g stroke={color} strokeWidth="6">
              <path d="m48 118 41-55 39 55H48l41-55 76 2-10 53 34 0M75 60h29m61 5 8-22" />
              {item.illustration === "ebike" && <rect x="99" y="80" width="20" height="23" rx="3" fill="#dcb257" />}
            </g>
          ) : item.illustration === "scooter" ? (
            <path d="m63 111 93 0 13-69m-12 0 29 0" stroke={color} strokeWidth="12" />
          ) : (
            <g stroke={color} strokeWidth="8">
              <path d="m51 96 27-31 75-3 30 40-59 9z" fill={color} />
              <path d="M75 60h57m30 0 13-23" stroke="#111d2e" strokeWidth="12" />
              {item.illustration === "atv" && <path d="M49 53h141v16H49z" fill="#dcb257" stroke="#dcb257" />}
            </g>
          )}
        </g>
      )}
      {item.illustration === "skateboard" && (
        <g>
          <rect x="25" y="65" width="190" height="30" rx="15" fill={color} />
          <circle cx="58" cy="105" r="12" fill="#d2e1eb" />
          <circle cx="182" cy="105" r="12" fill="#d2e1eb" />
        </g>
      )}
      {item.illustration === "surfboard" && (
        <g>
          <ellipse cx="120" cy="79" rx="33" ry="75" fill={color} />
          <path d="M120 17v123" stroke="#dcb257" strokeWidth="7" />
        </g>
      )}
      {item.illustration === "basketball" && (
        <g>
          <circle cx="120" cy="80" r="65" fill="#d58244" stroke="#111d2e" strokeWidth="3" />
          <path d="M55 80h130M120 15v130m-34-130a100 100 0 0 1 0 130m68-130a100 100 0 0 0 0 130" fill="none" stroke="#111d2e" strokeWidth="3" />
        </g>
      )}
      {item.illustration === "toolbox" && (
        <g>
          <path d="M94 35h52v30H94z" fill="#d2e1eb" />
          <rect x="35" y="62" width="170" height="78" rx="8" fill={color} />
          <path d="M35 86h170" stroke="#111d2e" strokeWidth="4" />
          <rect x="112" y="77" width="16" height="25" rx="3" fill="#dcb257" />
        </g>
      )}
      {item.illustration === "golf" && (
        <g>
          <path d="m91 122-15-104m38 104L99 18m38 104-15-104" stroke="#d2e1eb" strokeWidth="4" />
          <path d="m76 18 19-3m4 3 19-3m4 3 19-3" stroke="#d2e1eb" strokeWidth="8" />
          <rect x="78" y="66" width="83" height="80" rx="12" fill={color} />
          <path d="M90 80v65" stroke="#dcb257" strokeWidth="4" />
        </g>
      )}
      {item.illustration === "jetski" && (
        <g>
          <path d="m15 102 198-23 17 19-47 41H66z" fill={color} />
          <path d="m67 98 42-47h49l29 38" fill="#d2e1eb" />
          <path d="m120 52 26-17" stroke="#111d2e" strokeWidth="6" />
        </g>
      )}
      {item.illustration === "sports" && (
        <g>
          <rect x="28" y="83" width="115" height="64" rx="16" fill={color} />
          <ellipse cx="178" cy="54" rx="33" ry="40" fill="none" stroke="#d2e1eb" strokeWidth="5" />
          <path d="m175 92-31 55" stroke="#dcb257" strokeWidth="7" />
          <circle cx="79" cy="66" r="19" fill="#dcb257" />
        </g>
      )}
      {item.illustration === "house" && (
        <g>
          <rect x="30" y="55" width="180" height="99" fill={color} />
          <path d="m16 57 104-49 104 49z" fill="#111d2e" />
          <rect x="105" y="100" width="31" height="54" fill="#111d2e" />
          <rect x="49" y="78" width="30" height="31" fill="#dcb257" />
          <rect x="155" y="78" width="30" height="31" fill="#dcb257" />
          {item.variant >= 3 && <path d="M70 53v100m124-100v100" stroke="#d2e1eb" strokeWidth="11" />}
        </g>
      )}
    </svg>
  );
}

export default LifestyleArtwork;
