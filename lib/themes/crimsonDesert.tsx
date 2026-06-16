import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";

function makePRNG(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed / 2147483648) % 1;
  };
}

const CRIMSON_DESERT_PALETTES: ThemePalettes = {
  day: {
    sky: ["#87CEEB", "#F5DEB3"],
    horizon: "#FFD700",
    ground: "#D2B48C",
    primary: "#CD853F",
    secondary: "#DEB887",
  },
  afternoon: {
    sky: ["#F5DEB3", "#FF6B6B"],
    horizon: "#FF8C00",
    ground: "#D2691E",
    primary: "#8B4513",
    secondary: "#A0522D",
  },
  evening: {
    sky: ["#FF4500", "#8B0000"],
    horizon: "#DC143C",
    ground: "#654321",
    primary: "#4B0000",
    secondary: "#8B4513",
  },
  night: {
    sky: ["#1a0033", "#0d001a"],
    horizon: "#1a0d00",
    ground: "#0d0606",
    primary: "#1a0d00",
    secondary: "#2d1a0d",
  },
};

interface Cactus {
  x: number;
  height: number;
  armCount: number;
}

interface Dune {
  offset: number;
  scale: number;
  opacity: number;
}

function generateCacti(seed: number, viewW: number): Cactus[] {
  const rng = makePRNG(seed);
  const cacti: Cactus[] = [];

  for (let i = 0; i < 5; i++) {
    cacti.push({
      x: (rng() * viewW * 0.8) + viewW * 0.1,
      height: rng() * 60 + 80,
      armCount: Math.floor(rng() * 4) + 2,
    });
  }

  return cacti;
}

function generateDunes(seed: number): Dune[] {
  const rng = makePRNG(seed);
  const dunes: Dune[] = [];

  for (let i = 0; i < 4; i++) {
    dunes.push({
      offset: rng() * 20 - 10,
      scale: 1 - i * 0.15,
      opacity: 0.9 - i * 0.15,
    });
  }

  return dunes;
}

function CrimsonDesertTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const cacti = generateCacti(variantSeed, viewW);
  const dunes = generateDunes(variantSeed);
  const parallaxDuration = prefersReducedMotion ? 0.1 : 25;
  const hazeDuration = prefersReducedMotion ? 0.1 : 12;

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * 0.5;
  const celestialY = viewH * (isMoon ? 0.4 : 0.2);

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <motion.linearGradient id="desertSkyGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </motion.linearGradient>

        <filter id="desertGlow">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Heat haze distortion */}
        <filter id="heatHaze">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" seed={variantSeed} />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Sand dust particles */}
        <filter id="dustNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width={viewW} height={viewH} fill="url(#desertSkyGrad)" />

      {/* Heat haze band (optional day/afternoon effect) */}
      {(tod === "day" || tod === "afternoon") && (
        <motion.rect
          y={viewH * 0.45}
          width={viewW}
          height={viewH * 0.2}
          fill={palette.horizon}
          opacity="0.15"
          filter="url(#heatHaze)"
          animate={{
            y: prefersReducedMotion ? [viewH * 0.45, viewH * 0.45] : [viewH * 0.43, viewH * 0.47, viewH * 0.45],
          }}
          transition={{
            duration: hazeDuration,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      )}

      {/* Layered dunes (parallax effect) */}
      {dunes.map((dune, i) => (
        <motion.g
          key={`dune-${i}`}
          animate={{
            x: prefersReducedMotion ? [0, 0] : [-dune.offset * 2, dune.offset * 2, -dune.offset * 2],
          }}
          transition={{
            duration: parallaxDuration * (1 + i * 0.2),
            ease: "easeInOut",
            repeat: Infinity,
          }}
          style={{ willChange: "transform" }}
        >
          <path
            d={`M0,${viewH * (0.65 + i * 0.08)} Q${viewW * 0.25},${viewH * (0.60 + i * 0.08)} ${viewW * 0.5},${viewH * (0.65 + i * 0.08)} T${viewW},${viewH * (0.65 + i * 0.08)} L${viewW},${viewH} L0,${viewH} Z`}
            fill={palette.primary}
            opacity={dune.opacity}
            style={{
              filter: i === 0 && tod === "night" ? "url(#dustNoise)" : "none",
            }}
          />
        </motion.g>
      ))}

      {/* Cacti */}
      {cacti.map((cactus, i) => (
        <g key={`cactus-${i}`}>
          {/* Main stem */}
          <rect x={cactus.x - 8} y={viewH * 0.75 - cactus.height} width={16} height={cactus.height} fill="#556B2F" rx="4" />

          {/* Segmented details */}
          {Array.from({ length: Math.floor(cactus.height / 15) }).map((_, seg) => (
            <circle key={`seg-${seg}`} cx={cactus.x} cy={viewH * 0.75 - cactus.height + seg * 15} r="6" fill="none" stroke="#6B8E23" strokeWidth="1" />
          ))}

          {/* Arms */}
          {Array.from({ length: cactus.armCount }).map((_, arm) => {
            const armY = viewH * 0.75 - (cactus.height * (arm + 1)) / (cactus.armCount + 1);
            const side = arm % 2 === 0 ? -1 : 1;
            const armLength = 20 + (arm % 2) * 5;

            return (
              <g key={`arm-${arm}`}>
                <line x1={cactus.x} y1={armY} x2={cactus.x + side * armLength} y2={armY - 8} stroke="#556B2F" strokeWidth="6" strokeLinecap="round" />
                <circle cx={cactus.x + side * armLength} cy={armY - 8} r="4" fill="#6B8E23" />
              </g>
            );
          })}
        </g>
      ))}

      {/* Sun / Moon */}
      {isMoon ? (
        <>
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={50}
            fill="#E8EAF6"
            filter="url(#desertGlow)"
            animate={{
              opacity: prefersReducedMotion ? [1, 1] : [0.9, 1, 0.9],
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          <circle cx={celestialX + 18} cy={celestialY - 12} r={40} fill={palette.sky[0]} />
        </>
      ) : (
        <>
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={80}
            fill={palette.primary}
            opacity="0.2"
            animate={{
              r: prefersReducedMotion ? [80, 80] : [75, 85, 75],
            }}
            transition={{
              duration: 4,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          <circle cx={celestialX} cy={celestialY} r={55} fill={palette.primary} filter="url(#desertGlow)" />
        </>
      )}

      {/* Ground overlay for depth */}
      <defs>
        <linearGradient id="desertFade" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.ground} stopOpacity={0} />
          <stop offset="100%" stopColor={palette.ground} stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <rect width={viewW} height={viewH} fill="url(#desertFade)" pointerEvents="none" />
    </motion.svg>
  );
}

export const crimsonDesertTheme: ThemeDefinition = {
  id: "crimson_desert",
  name: "Crimson Desert",
  description: "Rolling dunes, majestic cacti, and a dramatic low-horizon sunset",
  palettes: CRIMSON_DESERT_PALETTES,
  renderer: CrimsonDesertTheme,
};
