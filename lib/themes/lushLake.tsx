import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";

// ── LCG PRNG ────────────────────────────────────────────────────────
function makePRNG(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed / 2147483648) % 1;
  };
}

// ── Palettes ─────────────────────────────────────────────────────
const LUSH_LAKE_PALETTES: ThemePalettes = {
  day: {
    sky: ["#4FC3F7", "#81D4FA"],
    horizon: "#E3F2FD",
    ground: "#C8E6C9",
    primary: "#A5D6A7",
    secondary: "#81C784",
  },
  afternoon: {
    sky: ["#29B6F6", "#FFD54F"],
    horizon: "#FFF8E1",
    ground: "#DCEDC8",
    primary: "#AED581",
    secondary: "#9CCC65",
  },
  evening: {
    sky: ["#FF7043", "#7B1FA2"],
    horizon: "#FFCCBC",
    ground: "#BCAAA4",
    primary: "#8D6E63",
    secondary: "#795548",
  },
  night: {
    sky: ["#1A237E", "#311B92"],
    horizon: "#283593",
    ground: "#1B5E20",
    primary: "#1B5E20",
    secondary: "#2E7D32",
    amoled: {
      sky: ["#000000", "#000000"],
      horizon: "#000000",
      ground: "#000000",
      primary: "#020202",
      secondary: "#050505",
    },
  },
};

// ── Star generator (for night sky) ──────────────────────────────────
interface Star {
  id: number;
  cx: string;
  cy: string;
  r: number;
  duration: number;
  delay: number;
}

function generateStars(seed: number): Star[] {
  const rng = makePRNG(seed);
  const stars: Star[] = [];
  const starCount = 60;

  for (let i = 0; i < starCount; i++) {
    stars.push({
      id: i,
      cx: `${rng() * 100}%`,
      cy: `${rng() * 40}%`,
      r: rng() * 1.5 + 0.5,
      duration: rng() * 2 + 2,
      delay: rng() * 3,
    });
  }

  return stars;
}

// ── Cloud generator ─────────────────────────────────────────────────
interface Cloud {
  id: number;
  y: number;
  scale: number;
  speed: number;
  startX: number;
  opacity: number;
}

function generateClouds(seed: number): Cloud[] {
  const rng = makePRNG(seed);
  const clouds: Cloud[] = [];
  const cloudCount = 5;

  for (let i = 0; i < cloudCount; i++) {
    clouds.push({
      id: i,
      y: rng() * 0.3 + 0.05,
      scale: rng() * 0.6 + 0.5,
      speed: rng() * 20 + 15,
      startX: -200 + rng() * 1400,
      opacity: rng() * 0.5 + 0.4,
    });
  }

  return clouds;
}

// ── Tree generator ──────────────────────────────────────────────────
interface Tree {
  x: number;
  h: number;
}

function generateTrees(seed: number, viewW: number): Tree[] {
  const rng = makePRNG(seed);
  const trees: Tree[] = [];
  const treeCount = 35;

  for (let i = 0; i < treeCount; i++) {
    trees.push({
      x: (rng() * viewW * 1.3 - viewW * 0.15),
      h: rng() * 60 + 40,
    });
  }

  return trees;
}

// ── Bush generator ──────────────────────────────────────────────────
interface Bush {
  x: number;
  scale: number;
}

function generateBushes(seed: number, viewW: number): Bush[] {
  const rng = makePRNG(seed);
  const bushes: Bush[] = [];
  const bushCount = 25;

  for (let i = 0; i < bushCount; i++) {
    bushes.push({
      x: rng() * viewW * 1.2 - viewW * 0.1,
      scale: rng() * 0.5 + 0.6,
    });
  }

  return bushes;
}

// ── Rock generator ──────────────────────────────────────────────────
interface Rock {
  x: number;
  size: number;
}

function generateRocks(seed: number, viewW: number): Rock[] {
  const rng = makePRNG(seed);
  const rocks: Rock[] = [];
  const rockCount = 18;

  for (let i = 0; i < rockCount; i++) {
    rocks.push({
      x: rng() * viewW * 1.1 - viewW * 0.05,
      size: rng() * 12 + 6,
    });
  }

  return rocks;
}

// ── Bird generator ──────────────────────────────────────────────────
interface Bird {
  id: number;
  startX: number;
  y: number;
  speed: number;
  scale: number;
}

function generateBirds(seed: number, viewW: number): Bird[] {
  const rng = makePRNG(seed);
  const birds: Bird[] = [];
  const birdCount = 6;

  for (let i = 0; i < birdCount; i++) {
    birds.push({
      id: i,
      startX: -100 + rng() * (viewW + 200),
      y: rng() * 0.4 + 0.1,
      speed: rng() * 80 + 60,
      scale: rng() * 0.3 + 0.7,
    });
  }

  return birds;
}

// ── Component ────────────────────────────────────────────────────────
function LushLakeTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const GEN_CLOUDS = generateClouds(variantSeed);
  const GEN_TREES = generateTrees(variantSeed, viewW);
  const GEN_STARS = generateStars(variantSeed);
  const GEN_BUSHES = generateBushes(variantSeed + 1, viewW);
  const GEN_ROCKS = generateRocks(variantSeed + 2, viewW);
  const GEN_BIRDS = generateBirds(variantSeed + 3, viewW);

  const cloudDuration = prefersReducedMotion ? 0.1 : 6;
  const parallaxDuration = prefersReducedMotion ? 0.1 : 20;

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * 0.85;
  const celestialY = viewH * (isMoon ? 0.14 : 0.25);

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <motion.linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </motion.linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {tod !== "night" && (
          <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.sky[1]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={palette.primary} stopOpacity="0.2" />
          </linearGradient>
        )}
      </defs>

      {/* Sky gradient */}
      <rect width={viewW} height={viewH} fill="url(#skyGrad)" />

      {/* Stars (night only) */}
      {tod === "night" && (
        <motion.g
          animate={{ x: [-10, 10, -10] }}
          transition={{
            duration: parallaxDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ willChange: "transform" }}
        >
          {GEN_STARS.map((s) => (
            <motion.circle
              key={`star-${s.id}`}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="white"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.g>
      )}

      {/* Far mountains */}
      <motion.g
        animate={{ x: [-8, 8, -8] }}
        transition={{
          duration: parallaxDuration * 1.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: "transform" }}
      >
        <path
          d={`M-50,${viewH * 0.68} Q${viewW * 0.25},${viewH * 0.58} ${viewW * 0.5},${viewH * 0.65} T${viewW + 50},${viewH * 0.68} L${viewW + 50},${viewH} L-50,${viewH} Z`}
          fill={palette.primary}
        />
      </motion.g>

      {/* Near hills */}
      <motion.g
        animate={{ x: [-16, 16, -16] }}
        transition={{
          duration: parallaxDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: "transform" }}
      >
        <path
          d={`M-50,${viewH * 0.82} Q${viewW * 0.25},${viewH * 0.76} ${viewW * 0.5},${viewH * 0.81} T${viewW + 50},${viewH * 0.82} L${viewW + 50},${viewH} L-50,${viewH} Z`}
          fill={palette.secondary}
        />
      </motion.g>

      {/* Water layer */}
      {tod !== "night" && (
        <motion.g>
          <rect x="0" y={viewH * 0.86} width={viewW} height={viewH * 0.14} fill={`url(#riverGrad)`} />
          {/* Shimmer */}
          <motion.rect
            x={-160}
            y={viewH * 0.86}
            width={viewW + 320}
            height={viewH * 0.14}
            fill="rgba(255,255,255,0.08)"
            animate={{ x: prefersReducedMotion ? [-80, -80, -80] : [-80, 80, -80] }}
            transition={{
              duration: cloudDuration,
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ willChange: "transform" }}
          />
        </motion.g>
      )}

      {/* Clouds */}
      {tod !== "night" &&
        GEN_CLOUDS.map((cloud) => (
          <motion.g
            key={`cloud-${cloud.id}`}
            style={{ willChange: "transform" }}
            animate={{
              x: prefersReducedMotion ? [cloud.startX, cloud.startX] : [cloud.startX, cloud.startX + viewW + 400],
              y: prefersReducedMotion ? [-3, -3] : [-3, 2],
            }}
            transition={{
              duration: prefersReducedMotion ? 0.1 : (viewW + 400) / cloud.speed,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            {[
              { cx: 0, cy: 0, rx: 40 * cloud.scale, ry: 28 * cloud.scale },
              { cx: 38 * cloud.scale, cy: -10 * cloud.scale, rx: 32 * cloud.scale, ry: 24 * cloud.scale },
              { cx: -35 * cloud.scale, cy: -5 * cloud.scale, rx: 28 * cloud.scale, ry: 20 * cloud.scale },
              { cx: 70 * cloud.scale, cy: 5 * cloud.scale, rx: 24 * cloud.scale, ry: 18 * cloud.scale },
              { cx: -65 * cloud.scale, cy: 5 * cloud.scale, rx: 22 * cloud.scale, ry: 16 * cloud.scale },
            ].map((e, i) => (
              <ellipse
                key={i}
                cx={e.cx}
                cy={cloud.y * viewH + e.cy}
                rx={e.rx}
                ry={e.ry}
                fill="white"
                opacity={cloud.opacity}
              />
            ))}
          </motion.g>
        ))}

      {/* Rocks */}
      {GEN_ROCKS.map((rock, i) => (
        <motion.g key={`rock-${i}`} animate={{ y: prefersReducedMotion ? [0, 0] : [0, 3, 0] }} transition={{ duration: 4 + i * 0.3, ease: "easeInOut", repeat: Infinity }}>
          <ellipse cx={rock.x} cy={viewH * 0.89 + rock.size * 0.3} rx={rock.size} ry={rock.size * 0.4} fill="#555" opacity="0.7" />
          <motion.ellipse cx={rock.x} cy={viewH * 0.89} rx={rock.size * 0.9} ry={rock.size * 0.35} fill="#666" opacity="0.8" animate={{ opacity: prefersReducedMotion ? [0.8, 0.8] : [0.7, 0.9, 0.7] }} transition={{ duration: 3.5 + i * 0.2, ease: "easeInOut", repeat: Infinity }} />
        </motion.g>
      ))}

      {/* Bushes */}
      {GEN_BUSHES.map((bush, i) => {
        const bushY = viewH * 0.87;
        const bushScale = bush.scale;
        return (
          <motion.g key={`bush-${i}`} animate={{ y: prefersReducedMotion ? [0, 0] : [0, 2, 0], scale: prefersReducedMotion ? [1, 1] : [1, 1.05, 1] }} transition={{ duration: 3 + i * 0.25, ease: "easeInOut", repeat: Infinity }}>
            <circle cx={bush.x - 12 * bushScale} cy={bushY} r={14 * bushScale} fill={palette.primary} opacity="0.9" />
            <circle cx={bush.x} cy={bushY - 8 * bushScale} r={16 * bushScale} fill={palette.primary} />
            <circle cx={bush.x + 12 * bushScale} cy={bushY} r={14 * bushScale} fill={palette.primary} opacity="0.9" />
            <ellipse cx={bush.x} cy={bushY + 10 * bushScale} rx={20 * bushScale} ry={4 * bushScale} fill="rgba(0,0,0,0.1)" />
          </motion.g>
        );
      })}

      {/* Birds (day/afternoon only) */}
      {(tod === "day" || tod === "afternoon") &&
        GEN_BIRDS.map((bird) => (
          <motion.g
            key={`bird-${bird.id}`}
            style={{ willChange: "transform" }}
            animate={{
              x: prefersReducedMotion ? [bird.startX, bird.startX] : [bird.startX, bird.startX + viewW + 200],
              y: prefersReducedMotion ? [0, 0] : [0, -4, 0],
            }}
            transition={{
              x: {
                duration: prefersReducedMotion ? 0.1 : (viewW + 200) / bird.speed,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
              },
              y: {
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
              },
            }}
          >
            {/* Bird body - more bird-like shape */}
            <ellipse cx={0} cy={bird.y * viewH} rx={6 * bird.scale} ry={3 * bird.scale} fill="#3a3a3a" />
            {/* Bird head */}
            <circle cx={7 * bird.scale} cy={bird.y * viewH - 1.5 * bird.scale} r={2.5 * bird.scale} fill="#2a2a2a" />
            {/* Bird eye */}
            <circle cx={8.5 * bird.scale} cy={bird.y * viewH - 2 * bird.scale} r={0.5 * bird.scale} fill="#fff" opacity="0.6" />
            {/* Bird beak */}
            <polygon
              points={`${9.5 * bird.scale},${bird.y * viewH - 1.5 * bird.scale} ${11 * bird.scale},${bird.y * viewH - 1 * bird.scale} ${9.5 * bird.scale},${bird.y * viewH - 1 * bird.scale}`}
              fill="#d4a574"
            />
            {/* Left wing - animated flapping */}
            <motion.path
              d={`M${-2 * bird.scale},${bird.y * viewH} Q${-10 * bird.scale},${(bird.y - 0.05) * viewH} ${-14 * bird.scale},${bird.y * viewH}`}
              stroke="#2a2a2a"
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              animate={{
                d: prefersReducedMotion
                  ? [`M${-2 * bird.scale},${bird.y * viewH} Q${-10 * bird.scale},${(bird.y - 0.05) * viewH} ${-14 * bird.scale},${bird.y * viewH}`]
                  : [
                      `M${-2 * bird.scale},${bird.y * viewH} Q${-10 * bird.scale},${(bird.y - 0.1) * viewH} ${-14 * bird.scale},${bird.y * viewH}`,
                      `M${-2 * bird.scale},${bird.y * viewH} Q${-10 * bird.scale},${(bird.y - 0.02) * viewH} ${-14 * bird.scale},${bird.y * viewH}`,
                      `M${-2 * bird.scale},${bird.y * viewH} Q${-10 * bird.scale},${(bird.y - 0.1) * viewH} ${-14 * bird.scale},${bird.y * viewH}`,
                    ],
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            {/* Right wing - animated flapping */}
            <motion.path
              d={`M${2 * bird.scale},${bird.y * viewH} Q${10 * bird.scale},${(bird.y - 0.05) * viewH} ${14 * bird.scale},${bird.y * viewH}`}
              stroke="#2a2a2a"
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              animate={{
                d: prefersReducedMotion
                  ? [`M${2 * bird.scale},${bird.y * viewH} Q${10 * bird.scale},${(bird.y - 0.05) * viewH} ${14 * bird.scale},${bird.y * viewH}`]
                  : [
                      `M${2 * bird.scale},${bird.y * viewH} Q${10 * bird.scale},${(bird.y - 0.1) * viewH} ${14 * bird.scale},${bird.y * viewH}`,
                      `M${2 * bird.scale},${bird.y * viewH} Q${10 * bird.scale},${(bird.y - 0.02) * viewH} ${14 * bird.scale},${bird.y * viewH}`,
                      `M${2 * bird.scale},${bird.y * viewH} Q${10 * bird.scale},${(bird.y - 0.1) * viewH} ${14 * bird.scale},${bird.y * viewH}`,
                    ],
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            {/* Bird tail */}
            <path
              d={`M${-6 * bird.scale},${bird.y * viewH} L${-10 * bird.scale},${(bird.y + 0.03) * viewH}`}
              stroke="#2a2a2a"
              strokeWidth={1}
              fill="none"
              strokeLinecap="round"
            />
          </motion.g>
        ))}

      {/* Trees */}
      {GEN_TREES.map((t, i) => {
        const baseY = viewH * (0.88 + (i % 7) * 0.002);
        const w = 18 + ((i % 3) * 8);
        const trunkW = Math.max(4, Math.floor(w * 0.25));
        const trunkH = Math.max(10, Math.floor(t.h * 0.18));
        const tilt = ((i % 5) - 2) * 0.6;
        const treeColor = palette.primary;

        return (
          <motion.g
            key={`tree-${i}`}
            style={{
              transformOrigin: `${t.x}px ${baseY}px`,
              willChange: "transform",
            }}
            animate={{
              rotate: prefersReducedMotion ? [tilt, tilt] : [tilt, -tilt],
            }}
            transition={{
              duration: (4 + (i % 6) * 0.35) * (prefersReducedMotion ? 0.1 : 1),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <rect x={t.x - trunkW / 2} y={baseY - trunkH} width={trunkW} height={trunkH} fill="#4E342E" />
            <polygon points={`${t.x},${baseY - t.h} ${t.x - w},${baseY - trunkH} ${t.x + w},${baseY - trunkH}`} fill={treeColor} />
            <polygon points={`${t.x},${baseY - t.h + 28} ${t.x - w * 0.7},${baseY - trunkH + 22} ${t.x + w * 0.7},${baseY - trunkH + 22}`} fill={treeColor} />
            <polygon points={`${t.x},${baseY - t.h + 54} ${t.x - w * 0.45},${baseY - trunkH + 42} ${t.x + w * 0.45},${baseY - trunkH + 42}`} fill={treeColor} />
          </motion.g>
        );
      })}

      {/* Sun / Moon */}
      {isMoon ? (
        <>
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={44}
            fill="#E8EAF6"
            filter="url(#glow)"
            animate={{ opacity: [0.95, 1, 0.95] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
          <circle cx={celestialX + 18} cy={celestialY - 10} r={36} fill={palette.sky[0]} />
        </>
      ) : (
        <>
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={80}
            fill={palette.primary}
            opacity={0.18}
            animate={{ r: [75, 85, 75] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={50}
            fill={palette.primary}
            filter="url(#glow)"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
        </>
      )}

      {/* Horizon fade */}
      <defs>
        <linearGradient id="horizonFade" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.horizon} stopOpacity={0} />
          <stop offset="100%" stopColor={palette.horizon} stopOpacity={0.7} />
        </linearGradient>
      </defs>
      <rect width={viewW} height={viewH} fill="url(#horizonFade)" pointerEvents="none" />
    </motion.svg>
  );
}

export const lushLakeTheme: ThemeDefinition = {
  id: "lush_lake",
  name: "Lush Lake",
  description: "Rolling hills, trees, and a serene lake with floating clouds",
  palettes: LUSH_LAKE_PALETTES,
  renderer: LushLakeTheme,
};
