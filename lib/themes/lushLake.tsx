import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";
import {
  makePRNG,
  rngRange,
  rngInt,
  generateProceduralRidge,
  generateProceduralHills,
  generateAtmosphericMotes,
  Point2D,
} from "@/lib/procedural";

// ── Palettes ─────────────────────────────────────────────────────
const LUSH_LAKE_PALETTES: ThemePalettes = {
  day: {
    sky: ["#38bdf8", "#bae6fd"],
    horizon: "#e0f2fe",
    ground: "#15803d",
    primary: "#166534",
    secondary: "#14532d",
  },
  afternoon: {
    sky: ["#0284c7", "#fde047"],
    horizon: "#fef08a",
    ground: "#4d7c0f",
    primary: "#3f6212",
    secondary: "#365314",
  },
  evening: {
    sky: ["#f97316", "#581c87"],
    horizon: "#fbcfe8",
    ground: "#3730a3",
    primary: "#1e1b4b",
    secondary: "#0f172a",
  },
  night: {
    sky: ["#090d16", "#1e1b4b"],
    horizon: "#1e293b",
    ground: "#064e3b",
    primary: "#022c22",
    secondary: "#011612",
    amoled: {
      sky: ["#000000", "#05070d"],
      horizon: "#050505",
      ground: "#021208",
      primary: "#010a04",
      secondary: "#000502",
    },
  },
};

// ── Data structures for procedural generation ──────────────────────
interface Star {
  id: number;
  cx: number;
  cy: number;
  r: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface Constellation {
  from: Point2D;
  to: Point2D;
}

interface Cloud {
  id: number;
  y: number;
  scale: number;
  speed: number;
  startX: number;
  opacity: number;
  puffs: { cx: number; cy: number; rx: number; ry: number }[];
}

interface Tree {
  x: number;
  h: number;
  w: number;
  baseY: number;
  tilt: number;
  swaySpeed: number;
  shade: string;
}

interface Firefly {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface Reed {
  x: number;
  h: number;
  tilt: number;
}

function generateStars(rng: () => number, viewW: number, viewH: number): { stars: Star[]; constellations: Constellation[] } {
  const stars: Star[] = [];
  const starCount = 85;

  for (let i = 0; i < starCount; i++) {
    stars.push({
      id: i,
      cx: rngRange(rng, 10, viewW - 10),
      cy: rngRange(rng, 10, viewH * 0.48),
      r: rngRange(rng, 0.6, 2.2),
      duration: rngRange(rng, 2, 4.5),
      delay: rngRange(rng, 0, 3),
      opacity: rngRange(rng, 0.4, 1),
    });
  }

  // Generate 2 subtle constellation lines connecting nearby stars
  const constellations: Constellation[] = [];
  for (let i = 0; i < 4; i++) {
    const s1 = stars[rngInt(rng, 0, 20)];
    const s2 = stars[rngInt(rng, 0, 20)];
    const dist = Math.hypot(s1.cx - s2.cx, s1.cy - s2.cy);
    if (dist > 30 && dist < 140) {
      constellations.push({
        from: { x: s1.cx, y: s1.cy },
        to: { x: s2.cx, y: s2.cy },
      });
    }
  }

  return { stars, constellations };
}

function generateClouds(rng: () => number, viewW: number): Cloud[] {
  const clouds: Cloud[] = [];
  const count = rngInt(rng, 4, 6);

  for (let i = 0; i < count; i++) {
    const scale = rngRange(rng, 0.7, 1.3);
    const puffs = [
      { cx: 0, cy: 0, rx: 55 * scale, ry: 35 * scale },
      { cx: 45 * scale, cy: -12 * scale, rx: 42 * scale, ry: 30 * scale },
      { cx: -42 * scale, cy: -8 * scale, rx: 38 * scale, ry: 26 * scale },
      { cx: 85 * scale, cy: 6 * scale, rx: 32 * scale, ry: 22 * scale },
      { cx: -78 * scale, cy: 6 * scale, rx: 30 * scale, ry: 20 * scale },
    ];

    clouds.push({
      id: i,
      y: rngRange(rng, 0.08, 0.32),
      scale,
      speed: rngRange(rng, 18, 32),
      startX: -250 + rng() * (viewW + 400),
      opacity: rngRange(rng, 0.45, 0.75),
      puffs,
    });
  }

  return clouds;
}

function generateForest(
  rng: () => number,
  viewW: number,
  viewH: number,
  primaryColor: string,
  secondaryColor: string
): Tree[] {
  const trees: Tree[] = [];
  const count = rngInt(rng, 36, 48);

  // Cluster trees in organic groves across the terrain
  for (let i = 0; i < count; i++) {
    // Generate cluster centers
    const cluster = i % 4;
    const clusterCenter = (viewW / 4) * cluster + viewW * 0.12;
    const xSpread = viewW * 0.18;
    const x = Math.max(10, Math.min(viewW - 10, clusterCenter + rngRange(rng, -xSpread, xSpread)));

    const isForeground = i % 3 === 0;
    const baseY = viewH * (isForeground ? rngRange(rng, 0.88, 0.94) : rngRange(rng, 0.84, 0.88));
    const h = isForeground ? rngRange(rng, 70, 110) : rngRange(rng, 45, 75);
    const w = h * rngRange(rng, 0.28, 0.38);

    trees.push({
      x,
      h,
      w,
      baseY,
      tilt: rngRange(rng, -1.8, 1.8),
      swaySpeed: rngRange(rng, 3.5, 6),
      shade: isForeground ? secondaryColor : primaryColor,
    });
  }

  // Sort back-to-front so foreground trees overlap background trees naturally
  return trees.sort((a, b) => a.baseY - b.baseY);
}

function generateFireflies(rng: () => number, viewW: number, viewH: number): Firefly[] {
  const fireflies: Firefly[] = [];
  for (let i = 0; i < 22; i++) {
    fireflies.push({
      id: i,
      x: rngRange(rng, viewW * 0.05, viewW * 0.95),
      y: rngRange(rng, viewH * 0.72, viewH * 0.94),
      size: rngRange(rng, 1.8, 3.2),
      duration: rngRange(rng, 2.5, 5),
      delay: rngRange(rng, 0, 4),
    });
  }
  return fireflies;
}

function generateReeds(rng: () => number, viewW: number, viewH: number): Reed[] {
  const reeds: Reed[] = [];
  for (let i = 0; i < 28; i++) {
    reeds.push({
      x: rngRange(rng, -10, viewW + 10),
      h: rngRange(rng, 18, 38),
      tilt: rngRange(rng, -6, 6),
    });
  }
  return reeds;
}

// ── Component ────────────────────────────────────────────────────────
function LushLakeTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const rng = makePRNG(variantSeed);

  // 1. Procedural Mountain Ridges
  const distantRidge = generateProceduralRidge(rng, viewW, viewH, {
    baseY: viewH * 0.62,
    minHeight: 120,
    maxHeight: 220,
    peaksCount: 8,
    jaggedness: 0.45,
  });

  const midRidge = generateProceduralRidge(rng, viewW, viewH, {
    baseY: viewH * 0.73,
    minHeight: 90,
    maxHeight: 170,
    peaksCount: 10,
    jaggedness: 0.6,
  });

  // 2. Procedural Near Hills
  const nearHillsPath = generateProceduralHills(rng, viewW, viewH, {
    baseY: viewH * 0.82,
    amplitude: 35,
    frequency: 5,
  });

  const shorelinePath = generateProceduralHills(rng, viewW, viewH, {
    baseY: viewH * 0.89,
    amplitude: 15,
    frequency: 4,
  });

  // 3. Sky & Flora Generators
  const { stars, constellations } = generateStars(rng, viewW, viewH);
  const clouds = generateClouds(rng, viewW);
  const forest = generateForest(rng, viewW, viewH, palette.primary, palette.secondary);
  const fireflies = generateFireflies(rng, viewW, viewH);
  const reeds = generateReeds(rng, viewW, viewH);
  const daytimeSpores = generateAtmosphericMotes(rng, 18, viewW, viewH, {
    colorChoices: ["#fef08a", "#dcfce7", "#ffffff", "#bbf7d0"],
    minSize: 1.2,
    maxSize: 2.8,
    driftXRange: [-18, 18],
    driftYRange: [-15, 10],
    durationRange: [5, 9],
    baseYRange: [viewH * 0.45, viewH * 0.88],
  });

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * (0.75 + (variantSeed % 15) * 0.01);
  const celestialY = viewH * (isMoon ? 0.18 : 0.24);

  const parallaxDuration = prefersReducedMotion ? 0.1 : 24;

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <motion.linearGradient id="lushSkyGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="65%" stopColor={palette.sky[1]} />
          <stop offset="100%" stopColor={palette.horizon} />
        </motion.linearGradient>

        <linearGradient id="lakeWaterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.horizon} stopOpacity="0.8" />
          <stop offset="30%" stopColor={palette.sky[1]} stopOpacity="0.7" />
          <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id="mountainFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.primary} stopOpacity="0.9" />
          <stop offset="85%" stopColor={palette.horizon} stopOpacity="0.6" />
        </linearGradient>

        <filter id="lushCelestialGlow">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="fireflyGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── 1. Sky Gradient ─────────────────────────────────────── */}
      <rect width={viewW} height={viewH} fill="url(#lushSkyGrad)" />

      {/* ── 2. Stars & Constellations (Night Only) ──────────────── */}
      {tod === "night" && (
        <motion.g
          animate={{ x: prefersReducedMotion ? 0 : [-6, 6, -6] }}
          transition={{ duration: parallaxDuration * 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Subtle constellation lines */}
          {constellations.map((c, i) => (
            <line
              key={`const-${i}`}
              x1={c.from.x}
              y1={c.from.y}
              x2={c.to.x}
              y2={c.to.y}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
          ))}

          {/* Stars */}
          {stars.map((s) => (
            <motion.circle
              key={`star-${s.id}`}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="#ffffff"
              animate={{ opacity: prefersReducedMotion ? [s.opacity, s.opacity] : [0.25, s.opacity, 0.25] }}
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

      {/* ── 3. Celestial Body (Sun / Moon) ──────────────────────── */}
      {isMoon ? (
        <g filter="url(#lushCelestialGlow)">
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={38}
            fill="#f1f5f9"
            animate={{ opacity: [0.92, 1, 0.92] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
          />
          {/* Moon crescent cutout */}
          <circle cx={celestialX + 16} cy={celestialY - 8} r={32} fill={palette.sky[0]} />
        </g>
      ) : (
        <g filter="url(#lushCelestialGlow)">
          {/* Radiant Sun halo */}
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={65}
            fill={palette.primary}
            opacity="0.25"
            animate={{ r: prefersReducedMotion ? [65, 65] : [60, 72, 60], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          />
          <circle cx={celestialX} cy={celestialY} r={42} fill="#ffffff" />
          <circle cx={celestialX} cy={celestialY} r={46} fill={palette.primary} opacity="0.4" />
        </g>
      )}

      {/* ── 4. Drifting Cumulus Clouds ──────────────────────────── */}
      {tod !== "night" &&
        clouds.map((cloud) => (
          <motion.g
            key={`cloud-${cloud.id}`}
            style={{ willChange: "transform" }}
            animate={{
              x: prefersReducedMotion
                ? [cloud.startX, cloud.startX]
                : [cloud.startX, cloud.startX + viewW + 500],
            }}
            transition={{
              duration: prefersReducedMotion ? 0.1 : (viewW + 500) / cloud.speed,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            {cloud.puffs.map((p, pi) => (
              <ellipse
                key={pi}
                cx={p.cx}
                cy={cloud.y * viewH + p.cy}
                rx={p.rx}
                ry={p.ry}
                fill="#ffffff"
                opacity={cloud.opacity}
              />
            ))}
          </motion.g>
        ))}

      {/* ── 5. Distant Mountain Range (Procedural) ─────────────── */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-8, 8, -8] }}
        transition={{ duration: parallaxDuration * 1.3, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <path d={distantRidge.path} fill="url(#mountainFade)" opacity="0.6" />
      </motion.g>

      {/* ── 6. Midground Jagged Mountain Range ──────────────────── */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-14, 14, -14] }}
        transition={{ duration: parallaxDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <path d={midRidge.path} fill={palette.primary} opacity="0.9" />

        {/* Alpine snowcaps / light facets on major peaks */}
        {midRidge.peaks.map((p, idx) => (
          <polygon
            key={`peak-cap-${idx}`}
            points={`${p.x},${p.y} ${p.x - 22},${p.y + 40} ${p.x + 18},${p.y + 36}`}
            fill="#ffffff"
            opacity={tod === "night" ? "0.15" : "0.55"}
          />
        ))}
      </motion.g>

      {/* ── 7. Rolling Hills Layer ───────────────────────────────── */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-20, 20, -20] }}
        transition={{ duration: parallaxDuration * 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <path d={nearHillsPath} fill={palette.secondary} />
      </motion.g>

      {/* ── 8. Lake Water Surface & Mirror Reflections ──────────── */}
      <rect x="0" y={viewH * 0.82} width={viewW} height={viewH * 0.18} fill="url(#lakeWaterGrad)" />

      {/* Animated Water Shimmer Waves */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-30, 30, -30] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      >
        <line
          x1={viewW * 0.1}
          y1={viewH * 0.85}
          x2={viewW * 0.85}
          y2={viewH * 0.85}
          stroke="#ffffff"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <line
          x1={viewW * 0.2}
          y1={viewH * 0.875}
          x2={viewW * 0.7}
          y2={viewH * 0.875}
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.25"
        />
        <line
          x1={viewW * 0.35}
          y1={viewH * 0.9}
          x2={viewW * 0.9}
          y2={viewH * 0.9}
          stroke="#ffffff"
          strokeWidth="1.8"
          opacity="0.2"
        />
      </motion.g>

      {/* ── 9. Near Shoreline Ground ────────────────────────────── */}
      <path d={shorelinePath} fill={palette.ground} opacity="0.95" />

      {/* Shoreline Reeds & Cattails */}
      {reeds.map((reed, idx) => (
        <motion.path
          key={`reed-${idx}`}
          d={`M${reed.x},${viewH * 0.89} Q${reed.x + reed.tilt},${viewH * 0.89 - reed.h * 0.6} ${reed.x + reed.tilt * 1.5},${viewH * 0.89 - reed.h}`}
          stroke={palette.primary}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: prefersReducedMotion
              ? undefined
              : [
                  `M${reed.x},${viewH * 0.89} Q${reed.x + reed.tilt},${viewH * 0.89 - reed.h * 0.6} ${reed.x + reed.tilt * 1.5},${viewH * 0.89 - reed.h}`,
                  `M${reed.x},${viewH * 0.89} Q${reed.x - reed.tilt},${viewH * 0.89 - reed.h * 0.6} ${reed.x - reed.tilt * 1.2},${viewH * 0.89 - reed.h}`,
                  `M${reed.x},${viewH * 0.89} Q${reed.x + reed.tilt},${viewH * 0.89 - reed.h * 0.6} ${reed.x + reed.tilt * 1.5},${viewH * 0.89 - reed.h}`,
                ],
          }}
          transition={{ duration: 4 + (idx % 3), repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* ── 10. Procedural Conifer Forest ───────────────────────── */}
      {forest.map((tree, i) => {
        const trunkW = Math.max(3.5, tree.w * 0.2);
        const trunkH = Math.max(10, tree.h * 0.2);
        const tier1H = tree.h * 0.42;
        const tier2H = tree.h * 0.68;
        const tier3H = tree.h;

        return (
          <motion.g
            key={`tree-${i}`}
            style={{
              transformOrigin: `${tree.x}px ${tree.baseY}px`,
              willChange: "transform",
            }}
            animate={{
              rotate: prefersReducedMotion ? tree.tilt : [tree.tilt - 1.2, tree.tilt + 1.2, tree.tilt - 1.2],
            }}
            transition={{
              duration: tree.swaySpeed,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Trunk */}
            <rect
              x={tree.x - trunkW / 2}
              y={tree.baseY - trunkH}
              width={trunkW}
              height={trunkH}
              fill="#271c19"
            />
            {/* Bottom Foliage Tier */}
            <polygon
              points={`${tree.x},${tree.baseY - tier1H} ${tree.x - tree.w},${tree.baseY - trunkH + 2} ${tree.x + tree.w},${tree.baseY - trunkH + 2}`}
              fill={tree.shade}
            />
            {/* Middle Foliage Tier */}
            <polygon
              points={`${tree.x},${tree.baseY - tier2H} ${tree.x - tree.w * 0.75},${tree.baseY - tier1H + 12} ${tree.x + tree.w * 0.75},${tree.baseY - tier1H + 12}`}
              fill={tree.shade}
            />
            {/* Top Foliage Tier */}
            <polygon
              points={`${tree.x},${tree.baseY - tier3H} ${tree.x - tree.w * 0.5},${tree.baseY - tier2H + 10} ${tree.x + tree.w * 0.5},${tree.baseY - tier2H + 10}`}
              fill={tree.shade}
            />
          </motion.g>
        );
      })}

      {/* ── 11. Glowing Fireflies (Evening & Night) ─────────────── */}
      {(tod === "evening" || tod === "night") &&
        fireflies.map((ff) => (
          <motion.circle
            key={`ff-${ff.id}`}
            cx={ff.x}
            cy={ff.y}
            r={ff.size}
            fill="#a3e635"
            filter="url(#fireflyGlow)"
            animate={{
              y: prefersReducedMotion ? ff.y : [ff.y, ff.y - 18, ff.y],
              x: prefersReducedMotion ? ff.x : [ff.x - 8, ff.x + 8, ff.x - 8],
              opacity: [0.15, 0.95, 0.15],
              scale: [0.8, 1.25, 0.8],
            }}
            transition={{
              duration: ff.duration,
              delay: ff.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* ── 12. Floating Spores & Pollen (Day & Afternoon) ──────── */}
      {(tod === "day" || tod === "afternoon") &&
        daytimeSpores.map((spore) => (
          <motion.circle
            key={`spore-${spore.id}`}
            cx={spore.x}
            cy={spore.y}
            r={spore.size}
            fill={spore.color}
            opacity={spore.opacity}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    y: [spore.y, spore.y + spore.driftY, spore.y],
                    x: [spore.x, spore.x + spore.driftX, spore.x],
                    opacity: [0.1, spore.opacity, 0.1],
                  }
            }
            transition={{
              duration: spore.duration,
              delay: spore.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
    </motion.svg>
  );
}

export const lushLakeTheme: ThemeDefinition = {
  id: "lush_lake",
  name: "Lush Lake",
  description: "Procedural alpine ridges, conifer forests, mirror water, and fireflies",
  palettes: LUSH_LAKE_PALETTES,
  renderer: LushLakeTheme,
};
