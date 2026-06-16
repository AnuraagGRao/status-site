import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";

function makePRNG(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed / 2147483648) % 1;
  };
}

const TROPICAL_BEACH_PALETTES: ThemePalettes = {
  day: {
    sky: ["#87CEEB", "#E0F6FF"],
    horizon: "#FFE082",
    ground: "#F4D03F",
    primary: "#FF9800",
    secondary: "#FB8C00",
  },
  afternoon: {
    sky: ["#00BCD4", "#FFE082"],
    horizon: "#FFEB3B",
    ground: "#FFD54F",
    primary: "#FF6F00",
    secondary: "#FF8F00",
  },
  evening: {
    sky: ["#FF7043", "#FF5722"],
    horizon: "#FFB74D",
    ground: "#A1887F",
    primary: "#D32F2F",
    secondary: "#C62828",
  },
  night: {
    sky: ["#0D47A1", "#1A237E"],
    horizon: "#1B5E20",
    ground: "#263238",
    primary: "#1A237E",
    secondary: "#0D47A1",
  },
};

interface PalmTree {
  x: number;
  trunkHeight: number;
  leavesScale: number;
}

function generatePalmTrees(seed: number, viewW: number): PalmTree[] {
  const rng = makePRNG(seed);
  const palms: PalmTree[] = [];

  for (let i = 0; i < 4; i++) {
    palms.push({
      x: (rng() * viewW * 0.8) + viewW * 0.1,
      trunkHeight: rng() * 40 + 60,
      leavesScale: rng() * 0.4 + 0.8,
    });
  }

  return palms;
}

function TropicalBeachTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const palms = generatePalmTrees(variantSeed, viewW);
  const parallaxDuration = prefersReducedMotion ? 0.1 : 20;
  const waveDuration = prefersReducedMotion ? 0.1 : 8;

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * 0.2;
  const celestialY = viewH * (isMoon ? 0.3 : 0.2);

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
          <stop offset="100%" stopColor={palette.sky[1]} />
        </motion.linearGradient>

        <filter id="beachGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width={viewW} height={viewH} fill="url(#beachSkyGrad)" />

      {/* Distant horizon band */}
      <rect y={viewH * 0.5} width={viewW} height={viewH * 0.15} fill={palette.horizon} opacity="0.4" />

      {/* Ocean waves (animated) */}
      <motion.g style={{ willChange: "transform" }}>
        {/* Wave 1 */}
        <motion.path
          d={`M0,${viewH * 0.6} Q${viewW * 0.25},${viewH * 0.55} ${viewW * 0.5},${viewH * 0.6} T${viewW},${viewH * 0.6} L${viewW},${viewH} L0,${viewH} Z`}
          fill={palette.primary}
          animate={{
            d: prefersReducedMotion
              ? [`M0,${viewH * 0.6} Q${viewW * 0.25},${viewH * 0.55} ${viewW * 0.5},${viewH * 0.6} T${viewW},${viewH * 0.6} L${viewW},${viewH} L0,${viewH} Z`]
              : [
                  `M0,${viewH * 0.6} Q${viewW * 0.25},${viewH * 0.55} ${viewW * 0.5},${viewH * 0.6} T${viewW},${viewH * 0.6} L${viewW},${viewH} L0,${viewH} Z`,
                  `M0,${viewH * 0.62} Q${viewW * 0.25},${viewH * 0.57} ${viewW * 0.5},${viewH * 0.62} T${viewW},${viewH * 0.62} L${viewW},${viewH} L0,${viewH} Z`,
                  `M0,${viewH * 0.6} Q${viewW * 0.25},${viewH * 0.55} ${viewW * 0.5},${viewH * 0.6} T${viewW},${viewH * 0.6} L${viewW},${viewH} L0,${viewH} Z`,
                ],
          }}
          transition={{
            duration: waveDuration,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Wave 2 (offset) */}
        <motion.path
          d={`M0,${viewH * 0.68} Q${viewW * 0.25},${viewH * 0.64} ${viewW * 0.5},${viewH * 0.68} T${viewW},${viewH * 0.68} L${viewW},${viewH} L0,${viewH} Z`}
          fill={palette.secondary}
          opacity="0.6"
          animate={{
            d: prefersReducedMotion
              ? [`M0,${viewH * 0.68} Q${viewW * 0.25},${viewH * 0.64} ${viewW * 0.5},${viewH * 0.68} T${viewW},${viewH * 0.68} L${viewW},${viewH} L0,${viewH} Z`]
              : [
                  `M0,${viewH * 0.68} Q${viewW * 0.25},${viewH * 0.64} ${viewW * 0.5},${viewH * 0.68} T${viewW},${viewH * 0.68} L${viewW},${viewH} L0,${viewH} Z`,
                  `M0,${viewH * 0.66} Q${viewW * 0.25},${viewH * 0.62} ${viewW * 0.5},${viewH * 0.66} T${viewW},${viewH * 0.66} L${viewW},${viewH} L0,${viewH} Z`,
                  `M0,${viewH * 0.68} Q${viewW * 0.25},${viewH * 0.64} ${viewW * 0.5},${viewH * 0.68} T${viewW},${viewH * 0.68} L${viewW},${viewH} L0,${viewH} Z`,
                ],
          }}
          transition={{
            duration: waveDuration * 1.3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </motion.g>

      {/* Sandy shore curve */}
      <path d={`M0,${viewH * 0.72} Q${viewW * 0.5},${viewH * 0.70} ${viewW},${viewH * 0.72} L${viewW},${viewH} L0,${viewH} Z`} fill={palette.ground} />

      {/* Palm trees */}
      {palms.map((palm, i) => (
        <motion.g
          key={`palm-${i}`}
          style={{
            transformOrigin: `${palm.x}px ${viewH * 0.72}px`,
            willChange: "transform",
          }}
          animate={{
            rotate: prefersReducedMotion ? [0, 0] : [-2, 2, -2],
          }}
          transition={{
            duration: (3 + i * 0.5) * (prefersReducedMotion ? 0.1 : 1),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Trunk */}
          <rect x={palm.x - 6} y={viewH * 0.72 - palm.trunkHeight} width={12} height={palm.trunkHeight} fill="#8D6E63" />

          {/* Palm leaves (fronds) */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const length = 50 * palm.leavesScale;
            const endX = palm.x + Math.cos(rad) * length;
            const endY = viewH * 0.72 - palm.trunkHeight + Math.sin(rad) * length * 0.5;

            return (
              <line key={`frond-${angle}`} x1={palm.x} y1={viewH * 0.72 - palm.trunkHeight} x2={endX} y2={endY} stroke="#558B2F" strokeWidth="3" strokeLinecap="round" />
            );
          })}
        </motion.g>
      ))}

      {/* Sun / Moon with reflection shimmer */}
      {isMoon ? (
        <>
          <motion.circle cx={celestialX} cy={celestialY} r={40} fill="#E8EAF6" filter="url(#beachGlow)" animate={{ opacity: [0.95, 1, 0.95] }} transition={{ duration: 2, repeat: Infinity }} />
          <circle cx={celestialX + 16} cy={celestialY - 10} r={32} fill={palette.sky[0]} />

          {/* Moon reflection shimmer on water */}
          <motion.ellipse
            cx={celestialX}
            cy={viewH * 0.82}
            rx={60}
            ry={20}
            fill="white"
            opacity="0.1"
            animate={{
              scaleY: prefersReducedMotion ? [1, 1] : [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </>
      ) : (
        <>
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={60}
            fill={palette.primary}
            opacity="0.2"
            animate={{
              r: prefersReducedMotion ? [60, 60] : [55, 65, 55],
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          <circle cx={celestialX} cy={celestialY} r={40} fill={palette.primary} filter="url(#beachGlow)" />

          {/* Sun reflection shimmer on water */}
          <motion.ellipse
            cx={celestialX}
            cy={viewH * 0.82}
            rx={80}
            ry={15}
            fill={palette.primary}
            opacity="0.15"
            animate={{
              scaleY: prefersReducedMotion ? [1, 1] : [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </>
      )}

      {/* Horizon fade overlay */}
      <defs>
        <linearGradient id="beachFade" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.horizon} stopOpacity={0} />
          <stop offset="100%" stopColor={palette.horizon} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <rect width={viewW} height={viewH} fill="url(#beachFade)" pointerEvents="none" />
    </motion.svg>
  );
}

export const tropicalBeachTheme: ThemeDefinition = {
  id: "tropical_beach",
  name: "Tropical Beach",
  description: "Sunny shores with swaying palm trees and pulsing ocean waves",
  palettes: TROPICAL_BEACH_PALETTES,
  renderer: TropicalBeachTheme,
};
