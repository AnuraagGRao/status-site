import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";
import {
  makePRNG,
  rngRange,
  rngInt,
  generateAtmosphericMotes,
  Point2D,
} from "@/lib/procedural";

const DEEP_COSMOS_PALETTES: ThemePalettes = {
  day: {
    sky: ["#0f172a", "#312e81"],
    horizon: "#4338ca",
    ground: "#1e1b4b",
    primary: "#6366f1",
    secondary: "#a855f7",
  },
  afternoon: {
    sky: ["#18022e", "#4a044e"],
    horizon: "#701a75",
    ground: "#2e1065",
    primary: "#a21caf",
    secondary: "#ec4899",
  },
  evening: {
    sky: ["#030712", "#1e1b4b"],
    horizon: "#3730a3",
    ground: "#0f172a",
    primary: "#818cf8",
    secondary: "#c084fc",
  },
  night: {
    sky: ["#030206", "#09090b"],
    horizon: "#18181b",
    ground: "#050508",
    primary: "#a855f7",
    secondary: "#06b6d4",
    amoled: {
      sky: ["#000000", "#030206"],
      horizon: "#050508",
      ground: "#000000",
      primary: "#ec4899",
      secondary: "#00f0ff",
    },
  },
};

interface Star {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  duration: number;
  delay: number;
}

interface ConstellationLink {
  from: Point2D;
  to: Point2D;
}

interface NebulaCloud {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
  rotate: number;
}

interface CompanionMoon {
  cx: number;
  cy: number;
  r: number;
  color: string;
}

interface Comet {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  duration: number;
  delay: number;
}

function generateStarfield(
  rng: () => number,
  viewW: number,
  viewH: number
): { stars: Star[]; constellations: ConstellationLink[] } {
  const stars: Star[] = [];
  const starColors = ["#ffffff", "#e0e7ff", "#fef08a", "#67e8f9", "#f472b6"];

  for (let i = 0; i < 140; i++) {
    stars.push({
      id: i,
      x: rngRange(rng, 10, viewW - 10),
      y: rngRange(rng, 10, viewH - 10),
      r: rngRange(rng, 0.6, 2.4),
      color: starColors[Math.floor(rng() * starColors.length)],
      duration: rngRange(rng, 2, 5),
      delay: rngRange(rng, 0, 4),
    });
  }

  // Constellations connecting nearby bright stars
  const constellations: ConstellationLink[] = [];
  for (let i = 0; i < 6; i++) {
    const s1 = stars[rngInt(rng, 0, 35)];
    const s2 = stars[rngInt(rng, 0, 35)];
    const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
    if (dist > 40 && dist < 180) {
      constellations.push({
        from: { x: s1.x, y: s1.y },
        to: { x: s2.x, y: s2.y },
      });
    }
  }

  return { stars, constellations };
}

function generateNebulae(rng: () => number, viewW: number, viewH: number, primary: string, secondary: string): NebulaCloud[] {
  const nebulae: NebulaCloud[] = [];
  const colors = [primary, secondary, "#8b5cf6", "#06b6d4", "#ec4899", "#3b82f6"];

  for (let i = 0; i < 7; i++) {
    nebulae.push({
      cx: rngRange(rng, viewW * 0.15, viewW * 0.85),
      cy: rngRange(rng, viewH * 0.15, viewH * 0.85),
      rx: rngRange(rng, 220, 380),
      ry: rngRange(rng, 140, 260),
      color: colors[i % colors.length],
      opacity: rngRange(rng, 0.12, 0.25),
      rotate: rngRange(rng, -45, 45),
    });
  }

  return nebulae;
}

function generateComets(rng: () => number, viewW: number, viewH: number): Comet[] {
  const comets: Comet[] = [];
  for (let i = 0; i < 2; i++) {
    const x1 = rngRange(rng, viewW * 0.3, viewW * 0.85);
    const y1 = rngRange(rng, viewH * 0.05, viewH * 0.35);
    comets.push({
      x1,
      y1,
      x2: x1 - rngRange(rng, 160, 260),
      y2: y1 + rngRange(rng, 90, 160),
      duration: rngRange(rng, 1.4, 2.2),
      delay: rngRange(rng, 3, 9),
    });
  }
  return comets;
}

function DeepCosmosTheme(props: ThemeComponentProps) {
  const { palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const rng = makePRNG(variantSeed);

  // 1. Procedural Celestial & Deep Space Elements
  const { stars, constellations } = generateStarfield(rng, viewW, viewH);
  const nebulae = generateNebulae(rng, viewW, viewH, palette.primary, palette.secondary);
  const comets = generateComets(rng, viewW, viewH);
  const cosmicSparks = generateAtmosphericMotes(rng, 28, viewW, viewH, {
    colorChoices: ["#ffffff", "#67e8f9", "#f472b6", "#a855f7", "#fde047"],
    minSize: 1.2,
    maxSize: 3.2,
    driftXRange: [-18, 18],
    driftYRange: [-18, 18],
    durationRange: [3.5, 6.5],
  });

  // 2. Planet & Ring Geometry
  const planetX = viewW * (0.65 + (variantSeed % 12) * 0.012);
  const planetY = viewH * 0.62;
  const planetR = 105;

  // Companion Moons
  const moons: CompanionMoon[] = [
    {
      cx: planetX - planetR * 1.8,
      cy: planetY - planetR * 1.2,
      r: 22,
      color: "#94a3b8",
    },
    {
      cx: planetX + planetR * 2.1,
      cy: planetY + planetR * 0.6,
      r: 14,
      color: "#cbd5e1",
    },
  ];

  const ringTilt = -24; // Degrees
  const ringRadiusX = 220;
  const ringRadiusY = 55;

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <motion.linearGradient id="deepSkyGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="60%" stopColor={palette.sky[1]} />
          <stop offset="100%" stopColor={palette.horizon} />
        </motion.linearGradient>

        <radialGradient id="planetSurface" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="45%" stopColor={palette.primary} />
          <stop offset="85%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#030206" />
        </radialGradient>

        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={palette.secondary} stopOpacity="0.1" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="48%" stopColor={palette.primary} stopOpacity="0.8" />
          <stop offset="52%" stopColor="#030206" stopOpacity="0.1" /> {/* Cassini Division */}
          <stop offset="60%" stopColor={palette.secondary} stopOpacity="0.7" />
          <stop offset="90%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor={palette.primary} stopOpacity="0.1" />
        </linearGradient>

        <filter id="cosmosGlow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="nebulaSoft">
          <feGaussianBlur stdDeviation="35" result="blur" />
        </filter>
      </defs>

      {/* ── 1. Cosmic Background Gradient ────────────────────────── */}
      <rect width={viewW} height={viewH} fill="url(#deepSkyGrad)" />

      {/* ── 2. Procedural Deep Stellar Nebulae ─────────────────────── */}
      <g filter="url(#nebulaSoft)">
        {nebulae.map((neb, idx) => (
          <motion.ellipse
            key={`nebula-${idx}`}
            cx={neb.cx}
            cy={neb.cy}
            rx={neb.rx}
            ry={neb.ry}
            fill={neb.color}
            opacity={neb.opacity}
            transform={`rotate(${neb.rotate} ${neb.cx} ${neb.cy})`}
            animate={
              prefersReducedMotion
                ? { opacity: neb.opacity }
                : {
                    opacity: [neb.opacity * 0.8, neb.opacity * 1.25, neb.opacity * 0.8],
                  }
            }
            transition={{ duration: 7 + idx * 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </g>

      {/* ── 3. Procedural Constellation Links ────────────────────── */}
      <g>
        {constellations.map((c, i) => (
          <line
            key={`constel-${i}`}
            x1={c.from.x}
            y1={c.from.y}
            x2={c.to.x}
            y2={c.to.y}
            stroke="rgba(255,255,255,0.24)"
            strokeWidth="0.9"
            strokeDasharray="4 4"
          />
        ))}
      </g>

      {/* ── 4. Starfield (140+ Spectral Stars) ──────────────────── */}
      <g>
        {stars.map((s) => (
          <motion.circle
            key={`star-${s.id}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.color}
            animate={{
              opacity: prefersReducedMotion ? 0.85 : [0.2, 0.95, 0.2],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </g>

      {/* ── 5. Shooting Comets ──────────────────────────────────── */}
      <g>
        {comets.map((cm, i) => (
          <motion.line
            key={`comet-${i}`}
            x1={cm.x1}
            y1={cm.y1}
            x2={cm.x2}
            y2={cm.y2}
            stroke="#a5f3fc"
            strokeWidth="2.2"
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
              duration: cm.duration,
              delay: cm.delay,
              repeat: Infinity,
              repeatDelay: 6,
              ease: "easeOut",
            }}
          />
        ))}
      </g>

      {/* ── 6. Companion Moons ──────────────────────────────────── */}
      {moons.map((m, idx) => (
        <g key={`moon-${idx}`}>
          <circle cx={m.cx} cy={m.cy} r={m.r} fill={m.color} />
          {/* Shadow crescent */}
          <circle cx={m.cx + m.r * 0.35} cy={m.cy + m.r * 0.2} r={m.r * 0.85} fill="#09090b" opacity="0.65" />
        </g>
      ))}

      {/* ── 7. Planetary System: Rings (Back Half) ──────────────── */}
      <g transform={`rotate(${ringTilt} ${planetX} ${planetY})`}>
        {/* Back half of ring (drawn before planet so planet obscures it) */}
        <path
          d={`
            M${planetX - ringRadiusX},${planetY}
            A${ringRadiusX},${ringRadiusY} 0 0,1 ${planetX + ringRadiusX},${planetY}
          `}
          stroke="url(#ringGrad)"
          strokeWidth="32"
          fill="none"
          opacity="0.8"
        />
      </g>

      {/* ── 8. Exoplanet Body & Atmospheric Limb ────────────────── */}
      <g filter="url(#cosmosGlow)">
        {/* Atmospheric Glow */}
        <motion.circle
          cx={planetX}
          cy={planetY}
          r={planetR + 8}
          fill="none"
          stroke={palette.secondary}
          strokeWidth="6"
          opacity="0.5"
          animate={{ opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Planet Sphere */}
        <circle cx={planetX} cy={planetY} r={planetR} fill="url(#planetSurface)" />
      </g>

      {/* ── 9. Planetary System: Rings (Front Half) ─────────────── */}
      <g transform={`rotate(${ringTilt} ${planetX} ${planetY})`}>
        {/* Front half of ring (drawn in front of planet) */}
        <path
          d={`
            M${planetX + ringRadiusX},${planetY}
            A${ringRadiusX},${ringRadiusY} 0 0,1 ${planetX - ringRadiusX},${planetY}
          `}
          stroke="url(#ringGrad)"
          strokeWidth="32"
          fill="none"
          opacity="0.95"
        />
      </g>

      {/* ── 10. Shimmering Stellar Sparks & Cosmic Dust ──────────── */}
      {cosmicSparks.map((spark) => (
        <motion.circle
          key={`spark-${spark.id}`}
          cx={spark.x}
          cy={spark.y}
          r={spark.size}
          fill={spark.color}
          filter="url(#starlightGlow)"
          opacity={spark.opacity}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  x: [spark.x, spark.x + spark.driftX, spark.x],
                  y: [spark.y, spark.y + spark.driftY, spark.y],
                  opacity: [0.1, spark.opacity, 0.1],
                  scale: [0.7, 1.4, 0.7],
                }
          }
          transition={{
            duration: spark.duration,
            delay: spark.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
}

export const deepCosmosTheme: ThemeDefinition = {
  id: "deep_cosmos",
  name: "Deep Cosmos",
  description: "Procedural planetary system with rings, companion moons, stellar nebulae, and comets",
  palettes: DEEP_COSMOS_PALETTES,
  renderer: DeepCosmosTheme,
};
