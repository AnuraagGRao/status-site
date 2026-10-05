import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";
import {
  makePRNG,
  rngRange,
  rngInt,
  generateProceduralHills,
  Point2D,
} from "@/lib/procedural";

const TROPICAL_BEACH_PALETTES: ThemePalettes = {
  day: {
    sky: ["#38bdf8", "#bae6fd"],
    horizon: "#fef08a",
    ground: "#fde047",
    primary: "#0284c7",
    secondary: "#0369a1",
  },
  afternoon: {
    sky: ["#0284c7", "#fb923c"],
    horizon: "#fed7aa",
    ground: "#fbbf24",
    primary: "#0f766e",
    secondary: "#0d9488",
  },
  evening: {
    sky: ["#f97316", "#be185d"],
    horizon: "#fbcfe8",
    ground: "#d97706",
    primary: "#1e1b4b",
    secondary: "#312e81",
  },
  night: {
    sky: ["#030712", "#0f172a"],
    horizon: "#1e293b",
    ground: "#1e293b",
    primary: "#0369a1",
    secondary: "#0c4a6e",
    amoled: {
      sky: ["#000000", "#020617"],
      horizon: "#050d1a",
      ground: "#020c1b",
      primary: "#0284c7",
      secondary: "#00f0ff",
    },
  },
};

interface PalmTree {
  x: number;
  baseY: number;
  trunkHeight: number;
  lean: number;
  scale: number;
  frondCount: number;
}

interface Island {
  x: number;
  w: number;
  h: number;
}

interface Seashell {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  type: "shell" | "starfish";
}

interface BeachBird {
  id: number;
  startX: number;
  y: number;
  scale: number;
  speed: number;
}

function generateIslands(rng: () => number, viewW: number, viewH: number): Island[] {
  const islands: Island[] = [];
  const count = rngInt(rng, 2, 4);

  for (let i = 0; i < count; i++) {
    islands.push({
      x: rngRange(rng, viewW * 0.1, viewW * 0.9),
      w: rngRange(rng, 140, 260),
      h: rngRange(rng, 25, 45),
    });
  }

  return islands;
}

function generatePalmGroves(rng: () => number, viewW: number, viewH: number): PalmTree[] {
  const palms: PalmTree[] = [];
  const count = rngInt(rng, 4, 6);

  for (let i = 0; i < count; i++) {
    // Group palms towards sides for nice framing
    const isLeft = i % 2 === 0;
    const xBase = isLeft ? viewW * rngRange(rng, 0.05, 0.22) : viewW * rngRange(rng, 0.78, 0.95);
    const baseY = viewH * rngRange(rng, 0.86, 0.94);
    const trunkHeight = rngRange(rng, 120, 180);
    const lean = (isLeft ? 1 : -1) * rngRange(rng, 14, 28);
    const scale = rngRange(rng, 0.85, 1.2);

    palms.push({
      x: xBase,
      baseY,
      trunkHeight,
      lean,
      scale,
      frondCount: rngInt(rng, 6, 8),
    });
  }

  return palms;
}

function generateBeachTreasures(rng: () => number, viewW: number, viewH: number): Seashell[] {
  const treasures: Seashell[] = [];
  for (let i = 0; i < 14; i++) {
    treasures.push({
      x: rngRange(rng, viewW * 0.05, viewW * 0.95),
      y: viewH * rngRange(rng, 0.88, 0.96),
      rotation: rngRange(rng, 0, 360),
      scale: rngRange(rng, 0.6, 1.1),
      type: i % 4 === 0 ? "starfish" : "shell",
    });
  }
  return treasures;
}

function generateBeachBirds(rng: () => number, viewW: number): BeachBird[] {
  const birds: BeachBird[] = [];
  for (let i = 0; i < 5; i++) {
    birds.push({
      id: i,
      startX: -100 + rng() * (viewW + 200),
      y: rngRange(rng, 0.12, 0.38),
      scale: rngRange(rng, 0.7, 1.1),
      speed: rngRange(rng, 35, 60),
    });
  }
  return birds;
}

function TropicalBeachTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const rng = makePRNG(variantSeed);

  // 1. Procedural Coastline & Islands
  const islands = generateIslands(rng, viewW, viewH);
  const palms = generatePalmGroves(rng, viewW, viewH);
  const treasures = generateBeachTreasures(rng, viewW, viewH);
  const birds = generateBeachBirds(rng, viewW);

  // Shoreline curve
  const shorePath = generateProceduralHills(rng, viewW, viewH, {
    baseY: viewH * 0.82,
    amplitude: 22,
    frequency: 4,
  });

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * (0.25 + (variantSeed % 15) * 0.02);
  const celestialY = viewH * (isMoon ? 0.2 : 0.26);

  const waveDuration = prefersReducedMotion ? 0.1 : 7;
  const parallaxDuration = prefersReducedMotion ? 0.1 : 24;

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <motion.linearGradient id="beachSkyGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="65%" stopColor={palette.sky[1]} />
          <stop offset="100%" stopColor={palette.horizon} />
        </motion.linearGradient>

        <linearGradient id="oceanDeepGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.secondary} />
          <stop offset="100%" stopColor={palette.primary} />
        </linearGradient>

        <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.horizon} stopOpacity="0.8" />
          <stop offset="25%" stopColor={palette.ground} />
          <stop offset="100%" stopColor={palette.horizon} />
        </linearGradient>

        <filter id="beachSunGlow">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── 1. Sky Gradient ─────────────────────────────────────── */}
      <rect width={viewW} height={viewH} fill="url(#beachSkyGrad)" />

      {/* ── 2. Sun / Moon ───────────────────────────────────────── */}
      {isMoon ? (
        <g filter="url(#beachSunGlow)">
          <circle cx={celestialX} cy={celestialY} r={40} fill="#f8fafc" />
          <circle cx={celestialX + 16} cy={celestialY - 8} r={34} fill={palette.sky[0]} />
        </g>
      ) : (
        <g filter="url(#beachSunGlow)">
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={65}
            fill={palette.horizon}
            opacity="0.3"
            animate={{
              r: prefersReducedMotion ? [65, 65] : [60, 72, 60],
              opacity: [0.25, 0.4, 0.25],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx={celestialX} cy={celestialY} r={44} fill="#ffffff" />
          <circle cx={celestialX} cy={celestialY} r={48} fill={palette.horizon} opacity="0.4" />
        </g>
      )}

      {/* ── 3. Distant Volcanic Islands / Atolls on Horizon ───────── */}
      <g opacity="0.65">
        {islands.map((isle, i) => (
          <ellipse
            key={`isle-${i}`}
            cx={isle.x}
            cy={viewH * 0.62}
            rx={isle.w / 2}
            ry={isle.h}
            fill={palette.secondary}
          />
        ))}
      </g>

      {/* Horizon Sea Plane */}
      <rect
        x="0"
        y={viewH * 0.62}
        width={viewW}
        height={viewH * 0.22}
        fill="url(#oceanDeepGrad)"
      />

      {/* Distant Sailboat Silhouette on Horizon */}
      <g transform={`translate(${viewW * 0.68}, ${viewH * 0.612}) scale(0.75)`} opacity="0.6">
        <polygon points="0,0 24,0 20,6 4,6" fill={palette.secondary} />
        <line x1="12" y1="0" x2="12" y2="-18" stroke={palette.secondary} strokeWidth="1.5" />
        <polygon points="12,-16 22,-3 12,-3" fill="#ffffff" opacity="0.75" />
      </g>

      {/* ── 4. Ocean Waves & Rolling Surf (Animated) ────────────── */}
      <motion.g style={{ willChange: "transform" }}>
        {/* Swell Wave 1 */}
        <motion.path
          d={`M0,${viewH * 0.70} Q${viewW * 0.25},${viewH * 0.68} ${viewW * 0.5},${viewH * 0.70} T${viewW},${viewH * 0.70} L${viewW},${viewH * 0.85} L0,${viewH * 0.85} Z`}
          fill={palette.primary}
          opacity="0.8"
          animate={{
            y: prefersReducedMotion ? [0, 0] : [-4, 4, -4],
          }}
          transition={{ duration: waveDuration, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Breaking Surf Wave 2 */}
        <motion.path
          d={`M0,${viewH * 0.76} Q${viewW * 0.3},${viewH * 0.73} ${viewW * 0.6},${viewH * 0.76} T${viewW},${viewH * 0.76} L${viewW},${viewH * 0.88} L0,${viewH * 0.88} Z`}
          fill={palette.secondary}
          opacity="0.85"
          animate={{
            y: prefersReducedMotion ? [0, 0] : [5, -5, 5],
          }}
          transition={{ duration: waveDuration * 1.25, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Translucent Surf Foam Wash */}
        <motion.path
          d={`M0,${viewH * 0.80} Q${viewW * 0.25},${viewH * 0.78} ${viewW * 0.5},${viewH * 0.80} T${viewW},${viewH * 0.80}`}
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
          animate={{
            strokeWidth: prefersReducedMotion ? [3.5, 3.5] : [2, 5, 2],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: waveDuration, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.g>

      {/* ── 5. Sandy Beach Shoreline ────────────────────────────── */}
      <path d={shorePath} fill="url(#sandGrad)" />

      {/* ── 6. Seashells & Starfish on the Sand ──────────────────── */}
      {treasures.map((item, idx) => (
        <g
          key={`treasure-${idx}`}
          transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}
        >
          {item.type === "starfish" ? (
            <polygon
              points="0,-8 2,-2 8,-2 3,2 5,8 0,4 -5,8 -3,2 -8,-2 -2,-2"
              fill="#fb923c"
              opacity="0.8"
            />
          ) : (
            <path
              d="M-6,0 Q0,-8 6,0 Q4,5 0,6 Q-4,5 -6,0 Z"
              fill="#ffffff"
              opacity="0.65"
            />
          )}
        </g>
      ))}

      {/* ── 7. Soaring Seabirds ─────────────────────────────────── */}
      {(tod === "day" || tod === "afternoon") &&
        birds.map((bird) => (
          <motion.g
            key={`seabird-${bird.id}`}
            style={{ willChange: "transform" }}
            animate={{
              x: prefersReducedMotion
                ? [bird.startX, bird.startX]
                : [bird.startX, bird.startX + viewW + 300],
            }}
            transition={{
              duration: prefersReducedMotion ? 0.1 : (viewW + 300) / bird.speed,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Elegant wing flapping SVG path */}
            <motion.path
              d={`M-14,0 Q-7,-8 0,0 Q7,-8 14,0`}
              stroke="#1e293b"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              transform={`scale(${bird.scale})`}
              animate={{
                d: prefersReducedMotion
                  ? [`M-14,0 Q-7,-8 0,0 Q7,-8 14,0`]
                  : [
                      `M-14,-4 Q-7,-10 0,0 Q7,-10 14,-4`,
                      `M-14,4 Q-7,6 0,0 Q7,6 14,4`,
                      `M-14,-4 Q-7,-10 0,0 Q7,-10 14,-4`,
                    ],
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>
        ))}

      {/* ── 8. Procedural Leaning Coconut Palm Groves ───────────── */}
      {palms.map((palm, i) => {
        const trunkBaseX = palm.x;
        const trunkBaseY = palm.baseY;
        const trunkTopX = palm.x + palm.lean;
        const trunkTopY = palm.baseY - palm.trunkHeight;
        const controlX = palm.x + palm.lean * 0.4;
        const controlY = palm.baseY - palm.trunkHeight * 0.6;

        const frondAngles = [-150, -110, -70, -35, 10, 50, 95];

        return (
          <motion.g
            key={`palm-${i}`}
            style={{
              transformOrigin: `${trunkBaseX}px ${trunkBaseY}px`,
              willChange: "transform",
            }}
            animate={{
              rotate: prefersReducedMotion ? [0, 0] : [-1.5, 1.5, -1.5],
            }}
            transition={{
              duration: 4.5 + (i % 3) * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Shadow at base */}
            <ellipse
              cx={trunkBaseX}
              cy={trunkBaseY}
              rx={18 * palm.scale}
              ry={6 * palm.scale}
              fill="rgba(0,0,0,0.18)"
            />

            {/* Curved Leaning Trunk */}
            <path
              d={`M${trunkBaseX - 5 * palm.scale},${trunkBaseY} Q${controlX - 3 * palm.scale},${controlY} ${trunkTopX - 3 * palm.scale},${trunkTopY} L${trunkTopX + 3 * palm.scale},${trunkTopY} Q${controlX + 3 * palm.scale},${controlY} ${trunkBaseX + 5 * palm.scale},${trunkBaseY} Z`}
              fill="#5c3d2e"
            />

            {/* Coconut cluster */}
            <circle cx={trunkTopX - 3} cy={trunkTopY + 3} r={4.5 * palm.scale} fill="#271810" />
            <circle cx={trunkTopX + 3} cy={trunkTopY + 4} r={4 * palm.scale} fill="#352015" />

            {/* Radiating Palm Fronds */}
            {frondAngles.map((angle, fa) => {
              const rad = (angle * Math.PI) / 180;
              const frondLen = 65 * palm.scale;
              const endX = trunkTopX + Math.cos(rad) * frondLen;
              const endY = trunkTopY + Math.sin(rad) * frondLen + 15;
              const midX = trunkTopX + Math.cos(rad) * frondLen * 0.55;
              const midY = trunkTopY + Math.sin(rad) * frondLen * 0.4 - 10;

              return (
                <path
                  key={`frond-${fa}`}
                  d={`M${trunkTopX},${trunkTopY} Q${midX},${midY} ${endX},${endY}`}
                  stroke={palette.primary}
                  strokeWidth={8 * palm.scale}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
          </motion.g>
        );
      })}
    </motion.svg>
  );
}

export const tropicalBeachTheme: ThemeDefinition = {
  id: "tropical_beach",
  name: "Tropical Beach",
  description: "Procedural coastline, breaking surf, leaning palm groves, islands, and seabirds",
  palettes: TROPICAL_BEACH_PALETTES,
  renderer: TropicalBeachTheme,
};
