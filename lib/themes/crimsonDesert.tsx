import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";
import {
  makePRNG,
  rngRange,
  rngInt,
  generateProceduralDune,
  generateAtmosphericMotes,
  Point2D,
} from "@/lib/procedural";

const CRIMSON_DESERT_PALETTES: ThemePalettes = {
  day: {
    sky: ["#f59e0b", "#fde68a"],
    horizon: "#fef3c7",
    ground: "#b45309",
    primary: "#d97706",
    secondary: "#92400e",
  },
  afternoon: {
    sky: ["#ea580c", "#fbbf24"],
    horizon: "#fed7aa",
    ground: "#9a3412",
    primary: "#c2410c",
    secondary: "#7c2d12",
  },
  evening: {
    sky: ["#991b1b", "#4c0519"],
    horizon: "#fda4af",
    ground: "#7f1d1d",
    primary: "#881337",
    secondary: "#4c0519",
  },
  night: {
    sky: ["#09090b", "#18181b"],
    horizon: "#27272a",
    ground: "#292524",
    primary: "#44403c",
    secondary: "#1c1917",
    amoled: {
      sky: ["#000000", "#09090b"],
      horizon: "#121212",
      ground: "#0c0a09",
      primary: "#1c1917",
      secondary: "#080706",
    },
  },
};

// ── Data structures for procedural desert ──────────────────────────
interface Mesa {
  x: number;
  topY: number;
  topW: number;
  baseW: number;
  height: number;
}

interface Saguaro {
  x: number;
  y: number;
  height: number;
  trunkW: number;
  arms: {
    side: "left" | "right";
    armY: number;
    armLen: number;
    armHeight: number;
  }[];
}

interface DesertRock {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface Star {
  id: number;
  cx: number;
  cy: number;
  r: number;
  duration: number;
  delay: number;
}

interface ShootingStar {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  duration: number;
  delay: number;
}

function generateMesas(rng: () => number, viewW: number, viewH: number): Mesa[] {
  const mesas: Mesa[] = [];
  const count = rngInt(rng, 3, 5);
  const stepX = viewW / count;

  for (let i = 0; i < count; i++) {
    const x = stepX * i + rngRange(rng, stepX * 0.15, stepX * 0.65);
    const height = rngRange(rng, 80, 160);
    const topY = viewH * 0.62 - height;
    const topW = rngRange(rng, 90, 220);
    const baseW = topW + rngRange(rng, 60, 130);

    mesas.push({ x, topY, topW, baseW, height });
  }

  return mesas;
}

function generateCacti(rng: () => number, viewW: number, viewH: number): Saguaro[] {
  const cacti: Saguaro[] = [];
  const count = rngInt(rng, 5, 8);

  for (let i = 0; i < count; i++) {
    const isForeground = i % 2 === 0;
    const x = rngRange(rng, viewW * 0.08, viewW * 0.92);
    const y = viewH * (isForeground ? rngRange(rng, 0.86, 0.94) : rngRange(rng, 0.78, 0.84));
    const height = isForeground ? rngRange(rng, 100, 150) : rngRange(rng, 60, 95);
    const trunkW = height * 0.12;

    const armCount = rngInt(rng, 1, 3);
    const arms: Saguaro["arms"] = [];

    for (let a = 0; a < armCount; a++) {
      arms.push({
        side: a % 2 === 0 ? "left" : "right",
        armY: height * rngRange(rng, 0.4, 0.65),
        armLen: trunkW * rngRange(rng, 1.8, 2.8),
        armHeight: height * rngRange(rng, 0.35, 0.55),
      });
    }

    cacti.push({ x, y, height, trunkW, arms });
  }

  return cacti.sort((a, b) => a.y - b.y);
}

function generateDesertRocks(rng: () => number, viewW: number, viewH: number, color: string): DesertRock[] {
  const rocks: DesertRock[] = [];
  const count = rngInt(rng, 8, 14);

  for (let i = 0; i < count; i++) {
    rocks.push({
      x: rngRange(rng, viewW * 0.05, viewW * 0.95),
      y: viewH * rngRange(rng, 0.78, 0.95),
      w: rngRange(rng, 18, 45),
      h: rngRange(rng, 12, 28),
      color,
    });
  }

  return rocks;
}

function generateDesertStars(rng: () => number, viewW: number, viewH: number): { stars: Star[]; shootingStars: ShootingStar[] } {
  const stars: Star[] = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      id: i,
      cx: rngRange(rng, 10, viewW - 10),
      cy: rngRange(rng, 10, viewH * 0.52),
      r: rngRange(rng, 0.6, 2.2),
      duration: rngRange(rng, 2, 4),
      delay: rngRange(rng, 0, 3),
    });
  }

  const shootingStars: ShootingStar[] = [];
  for (let i = 0; i < 3; i++) {
    const x1 = rngRange(rng, viewW * 0.2, viewW * 0.8);
    const y1 = rngRange(rng, viewH * 0.05, viewH * 0.25);
    shootingStars.push({
      x1,
      y1,
      x2: x1 - rngRange(rng, 120, 220),
      y2: y1 + rngRange(rng, 60, 110),
      duration: rngRange(rng, 1.2, 2),
      delay: rngRange(rng, 2, 8),
    });
  }

  return { stars, shootingStars };
}

function CrimsonDesertTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const rng = makePRNG(variantSeed);

  // Procedural Mesas in background
  const mesas = generateMesas(rng, viewW, viewH);

  // Procedural Layered Dunes (3 distinct sand dune ridges with unique seed-based contours)
  const duneFar = generateProceduralDune(rng, viewW, viewH, viewH * 0.68, 60);
  const duneMid = generateProceduralDune(rng, viewW, viewH, viewH * 0.78, 80);
  const duneFore = generateProceduralDune(rng, viewW, viewH, viewH * 0.88, 70);

  // Procedural Cacti & Rocks
  const cacti = generateCacti(rng, viewW, viewH);
  const rocks = generateDesertRocks(rng, viewW, viewH, palette.secondary);
  const { stars, shootingStars } = generateDesertStars(rng, viewW, viewH);

  const desertEmbers = generateAtmosphericMotes(rng, 24, viewW, viewH, {
    colorChoices: [palette.primary, palette.secondary, "#fb923c", "#fde047", "#fca5a5"],
    minSize: 1.2,
    maxSize: 3.2,
    driftXRange: [-16, 20],
    driftYRange: [-36, -14],
    durationRange: [4, 7],
    baseYRange: [viewH * 0.55, viewH * 0.92],
  });

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * (0.5 + (variantSeed % 20) * 0.015);
  const celestialY = viewH * (isMoon ? 0.22 : 0.28);

  const parallaxDuration = prefersReducedMotion ? 0.1 : 28;

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
          <stop offset="60%" stopColor={palette.sky[1]} />
          <stop offset="100%" stopColor={palette.horizon} />
        </motion.linearGradient>

        <linearGradient id="duneShadeFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.primary} stopOpacity="0.85" />
          <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="duneShadeFore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ground} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>

        <filter id="desertSunGlow">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="heatHazeBand">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.12" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* ── 1. Sky Gradient ─────────────────────────────────────── */}
      <rect width={viewW} height={viewH} fill="url(#desertSkyGrad)" />

      {/* ── 2. Desert Night Sky: Stars & Shooting Stars ─────────── */}
      {tod === "night" && (
        <g>
          {stars.map((s) => (
            <motion.circle
              key={`star-${s.id}`}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="#ffffff"
              animate={{ opacity: prefersReducedMotion ? 0.8 : [0.2, 0.9, 0.2] }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Shooting Stars / Meteors */}
          {shootingStars.map((ss, i) => (
            <motion.line
              key={`meteor-${i}`}
              x1={ss.x1}
              y1={ss.y1}
              x2={ss.x2}
              y2={ss.y2}
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      pathLength: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }
              }
              transition={{
                duration: ss.duration,
                delay: ss.delay,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeOut",
              }}
            />
          ))}
        </g>
      )}

      {/* ── 3. Celestial Body: Desert Sun or Moon ───────────────── */}
      {isMoon ? (
        <g filter="url(#desertSunGlow)">
          <circle cx={celestialX} cy={celestialY} r={52} fill="#fed7aa" />
          <circle cx={celestialX} cy={celestialY} r={58} fill={palette.horizon} opacity="0.3" />
          {/* Subtle lunar maria craters */}
          <circle cx={celestialX - 14} cy={celestialY - 12} r={10} fill="#fca5a5" opacity="0.35" />
          <circle cx={celestialX + 12} cy={celestialY + 8} r={14} fill="#fca5a5" opacity="0.3" />
          <circle cx={celestialX + 6} cy={celestialY - 18} r={8} fill="#fca5a5" opacity="0.25" />
        </g>
      ) : (
        <g filter="url(#desertSunGlow)">
          {/* Pulsating solar corona */}
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={85}
            fill={palette.horizon}
            opacity="0.25"
            animate={{
              r: prefersReducedMotion ? [85, 85] : [80, 95, 80],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          />
          <circle cx={celestialX} cy={celestialY} r={56} fill="#ffffff" />
          <circle cx={celestialX} cy={celestialY} r={62} fill={palette.primary} opacity="0.45" />
        </g>
      )}

      {/* ── 4. Procedural Sandstone Mesas & Buttes ───────────────── */}
      <g opacity="0.75">
        {mesas.map((m, idx) => {
          const halfTop = m.topW / 2;
          const halfBase = m.baseW / 2;
          const baseY = viewH * 0.68;

          return (
            <polygon
              key={`mesa-${idx}`}
              points={`
                ${m.x - halfTop},${m.topY}
                ${m.x + halfTop},${m.topY}
                ${m.x + halfBase},${baseY}
                ${m.x - halfBase},${baseY}
              `}
              fill={palette.primary}
            />
          );
        })}
      </g>

      {/* ── 5. Atmospheric Heat Haze (Day / Afternoon) ──────────── */}
      {(tod === "day" || tod === "afternoon") && (
        <rect
          x="0"
          y={viewH * 0.52}
          width={viewW}
          height={viewH * 0.16}
          fill={palette.horizon}
          opacity="0.18"
          filter="url(#heatHazeBand)"
        />
      )}

      {/* ── 6. Distant Sand Dunes ────────────────────────────────── */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-8, 8, -8] }}
        transition={{ duration: parallaxDuration * 1.3, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <path d={duneFar.path} fill="url(#duneShadeFar)" />
      </motion.g>

      {/* ── 7. Midground Sweeping Dunes ─────────────────────────── */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-16, 16, -16] }}
        transition={{ duration: parallaxDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <path d={duneMid.path} fill={palette.ground} opacity="0.95" />

        {/* Dune crest highlight line */}
        <path
          d={duneMid.path.split(" L")[0]}
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.25"
          fill="none"
        />
      </motion.g>

      {/* ── 8. Weathered Desert Boulders & Rocks ────────────────── */}
      {rocks.map((r, i) => (
        <g key={`rock-${i}`}>
          <ellipse
            cx={r.x}
            cy={r.y + r.h * 0.3}
            rx={r.w * 0.8}
            ry={r.h * 0.3}
            fill="rgba(0,0,0,0.2)"
          />
          <polygon
            points={`
              ${r.x - r.w / 2},${r.y}
              ${r.x - r.w * 0.2},${r.y - r.h}
              ${r.x + r.w * 0.3},${r.y - r.h * 0.9}
              ${r.x + r.w / 2},${r.y}
            `}
            fill={r.color}
          />
        </g>
      ))}

      {/* ── 9. Foreground Sand Dunes ────────────────────────────── */}
      <path d={duneFore.path} fill="url(#duneShadeFore)" />

      {/* ── 10. Procedural Saguaro Cacti ────────────────────────── */}
      {cacti.map((c, i) => {
        const halfTrunk = c.trunkW / 2;
        const cactusColor = palette.secondary;
        const cactusShade = tod === "night" ? "#0f0e0e" : "#451a03";

        return (
          <g key={`cactus-${i}`}>
            {/* Base shadow */}
            <ellipse
              cx={c.x}
              cy={c.y}
              rx={c.trunkW * 1.6}
              ry={c.trunkW * 0.45}
              fill="rgba(0,0,0,0.3)"
            />

            {/* Main trunk */}
            <rect
              x={c.x - halfTrunk}
              y={c.y - c.height}
              width={c.trunkW}
              height={c.height}
              rx={halfTrunk}
              fill={cactusColor}
            />

            {/* Trunk ribbing line */}
            <line
              x1={c.x}
              y1={c.y - c.height + 4}
              x2={c.x}
              y2={c.y - 2}
              stroke={cactusShade}
              strokeWidth="1.5"
              opacity="0.4"
            />

            {/* Branching arms */}
            {c.arms.map((arm, ai) => {
              const armW = c.trunkW * 0.85;
              const isLeft = arm.side === "left";
              const elbowX = isLeft ? c.x - arm.armLen : c.x + arm.armLen;
              const elbowY = c.y - arm.armY;
              const topY = elbowY - arm.armHeight;

              return (
                <path
                  key={`arm-${ai}`}
                  d={`
                    M${c.x},${elbowY}
                    H${elbowX}
                    V${topY}
                  `}
                  fill="none"
                  stroke={cactusColor}
                  strokeWidth={armW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </g>
        );
      })}

      {/* ── 11. Rolling Tumbleweed (Animated) ────────────────────── */}
      <motion.g
        animate={
          prefersReducedMotion
            ? { x: viewW * 0.3 }
            : {
                x: [-100, viewW + 150],
                rotate: [0, 1080],
                y: [0, -18, 0, -14, 0],
              }
        }
        transition={{
          x: { duration: 16, repeat: Infinity, ease: "linear" },
          rotate: { duration: 16, repeat: Infinity, ease: "linear" },
          y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ transformOrigin: "center" }}
      >
        <ellipse
          cx={100}
          cy={viewH * 0.89}
          rx={16}
          ry={15}
          fill="none"
          stroke={palette.primary}
          strokeWidth="1.6"
          strokeDasharray="4 3"
        />
        <circle
          cx={100}
          cy={viewH * 0.89}
          r={10}
          fill="none"
          stroke={palette.secondary}
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
      </motion.g>

      {/* ── Rising Thermal Embers & Dust ────────────────────────── */}
      {desertEmbers.map((ember) => (
        <motion.circle
          key={`ember-${ember.id}`}
          cx={ember.x}
          cy={ember.y}
          r={ember.size}
          fill={ember.color}
          opacity={ember.opacity}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [ember.y, ember.y + ember.driftY, ember.y],
                  x: [ember.x, ember.x + ember.driftX, ember.x],
                  opacity: [0.1, ember.opacity, 0.1],
                  scale: [0.8, 1.35, 0.8],
                }
          }
          transition={{
            duration: ember.duration,
            delay: ember.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
}

export const crimsonDesertTheme: ThemeDefinition = {
  id: "crimson_desert",
  name: "Crimson Desert",
  description: "Procedural sandstone mesas, knife-edge dunes, saguaro cacti, and tumbleweeds",
  palettes: CRIMSON_DESERT_PALETTES,
  renderer: CrimsonDesertTheme,
};
