import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";
import {
  makePRNG,
  rngRange,
  rngChoice,
  generateProceduralSkyline,
  generateRainStreaks,
  generateAtmosphericMotes,
  Skyscraper,
} from "@/lib/procedural";

const NEON_SKYLINE_PALETTES: ThemePalettes = {
  day: {
    sky: ["#0f172a", "#38bdf8"],
    horizon: "#7dd3fc",
    ground: "#030712",
    primary: "#0284c7",
    secondary: "#38bdf8",
  },
  afternoon: {
    sky: ["#4c0519", "#ea580c"],
    horizon: "#fde047",
    ground: "#1c1917",
    primary: "#e11d48",
    secondary: "#f59e0b",
  },
  evening: {
    sky: ["#1e1b4b", "#701a75"],
    horizon: "#f43f5e",
    ground: "#09090b",
    primary: "#ec4899",
    secondary: "#06b6d4",
  },
  night: {
    sky: ["#030206", "#0c0a1a"],
    horizon: "#1e1035",
    ground: "#000000",
    primary: "#ff007f",
    secondary: "#00f0ff",
    amoled: {
      sky: ["#000000", "#05000a"],
      horizon: "#0a0014",
      ground: "#000000",
      primary: "#ff007f",
      secondary: "#00ffff",
    },
  },
};

interface SteamPuff {
  id: number;
  cx: number;
  cy: number;
  r: number;
  duration: number;
  delay: number;
}

function generateSteam(rng: () => number, buildings: Skyscraper[]): SteamPuff[] {
  const steam: SteamPuff[] = [];
  const selected = buildings.filter((_, idx) => idx % 3 === 0);
  selected.forEach((b, idx) => {
    steam.push({
      id: idx,
      cx: b.x + b.w * 0.4,
      cy: b.y + 4,
      r: rngRange(rng, 10, 20),
      duration: rngRange(rng, 3, 5),
      delay: rngRange(rng, 0, 3),
    });
  });
  return steam;
}

function NeonSkylineTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;
  const rng = makePRNG(variantSeed);

  // 1. Procedural Skyline Layers
  const farSkyline = generateProceduralSkyline(rng, viewW, viewH, {
    baseY: viewH * 0.76,
    minH: 180,
    maxH: 340,
    minW: 80,
    maxW: 160,
    gap: 4,
    signProbability: 0.1,
  });

  const midSkyline = generateProceduralSkyline(rng, viewW, viewH, {
    baseY: viewH * 0.82,
    minH: 130,
    maxH: 260,
    minW: 60,
    maxW: 120,
    gap: 8,
    signProbability: 0.45,
  });

  const foreSkyline = generateProceduralSkyline(rng, viewW, viewH, {
    baseY: viewH * 0.9,
    minH: 80,
    maxH: 170,
    minW: 70,
    maxW: 130,
    gap: 12,
    signProbability: 0.6,
  });

  // 2. Atmospheric Rain & Cyber Fog Particles
  const isNight = tod === "evening" || tod === "night";
  const rainStreaks = generateRainStreaks(rng, isNight ? 55 : 35, viewW, viewH, {
    minLen: 22,
    maxLen: 46,
    speedRange: [1.2, 2.2],
    colorChoices: [palette.secondary, "#ffffff", palette.primary, "#38bdf8"],
  });

  const neonSparks = generateAtmosphericMotes(rng, 24, viewW, viewH, {
    colorChoices: [palette.secondary, palette.primary, "#ffe600", "#39ff14", "#ffffff"],
    minSize: 1.5,
    maxSize: 3.2,
    driftXRange: [-15, 15],
    driftYRange: [-35, -12],
    durationRange: [4, 7],
    baseYRange: [viewH * 0.5, viewH * 0.85],
  });

  const steamVents = generateSteam(rng, midSkyline);

  // Moon / Celestial positioning
  const celestialX = viewW * 0.65;
  const celestialY = viewH * (isNight ? 0.22 : 0.28);
  const celestialRadius = isNight ? 45 : 65;

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* Sky Gradient */}
        <motion.linearGradient id="neonSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="65%" stopColor={palette.sky[1]} />
          <stop offset="100%" stopColor={palette.horizon} />
        </motion.linearGradient>

        {/* City Fog / Smog Glow */}
        <linearGradient id="citySmogGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.horizon} stopOpacity="0" />
          <stop offset="50%" stopColor={palette.primary} stopOpacity="0.25" />
          <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.45" />
        </linearGradient>

        {/* Wet Reflective Waterfront / Pavement */}
        <linearGradient id="wetReflectGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ground} stopOpacity="0.85" />
          <stop offset="40%" stopColor={palette.primary} stopOpacity="0.5" />
          <stop offset="100%" stopColor={palette.ground} stopOpacity="0.98" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="neonSignGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="highBeaconGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── 1. Sky Background ────────────────────────────────────── */}
      <rect width={viewW} height={viewH} fill="url(#neonSkyGrad)" />

      {/* ── 2. Celestial Body (Hazy Cyber Sun / Cyber Moon) ──────── */}
      <g filter="url(#highBeaconGlow)">
        <motion.circle
          cx={celestialX}
          cy={celestialY}
          r={celestialRadius}
          fill={isNight ? "#f8fafc" : palette.horizon}
          opacity={isNight ? 0.85 : 0.9}
        />
        {/* Hazy corona ring */}
        <circle
          cx={celestialX}
          cy={celestialY}
          r={celestialRadius + 22}
          fill="none"
          stroke={palette.secondary}
          strokeWidth="1.5"
          opacity={0.4}
        />
      </g>

      {/* ── 3. Distant Hazy Monoliths (Far Layer) ─────────────────── */}
      <g opacity="0.45">
        {farSkyline.map((b) => (
          <g key={`far-${b.id}`}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h + 200}
              fill={palette.ground}
            />
            {b.spireHeight > 0 && (
              <line
                x1={b.antennaX}
                y1={b.antennaY}
                x2={b.antennaX}
                y2={b.y}
                stroke={palette.primary}
                strokeWidth="1.2"
                opacity="0.6"
              />
            )}
          </g>
        ))}
      </g>

      {/* Atmospheric Mid Fog */}
      <rect
        x="0"
        y={viewH * 0.45}
        width={viewW}
        height={viewH * 0.4}
        fill="url(#citySmogGrad)"
        pointerEvents="none"
      />

      {/* ── 4. Midground Detailed Skyscrapers ────────────────────── */}
      <g opacity="0.8">
        {midSkyline.map((b) => (
          <g key={`mid-${b.id}`}>
            {/* Main Tower Body */}
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h + 200}
              fill="#08070d"
              stroke="#1e1b2e"
              strokeWidth="0.8"
            />

            {/* Setback Step (if architectural setback exists) */}
            {b.setbackW && b.setbackH && (
              <rect
                x={b.x + (b.w - b.setbackW) / 2}
                y={b.y - b.setbackH}
                width={b.setbackW}
                height={b.setbackH}
                fill="#0c0a14"
                stroke="#25213b"
                strokeWidth="0.8"
              />
            )}

            {/* Antenna Spire & Beacon */}
            {b.spireHeight > 0 && (
              <>
                <line
                  x1={b.antennaX}
                  y1={b.antennaY}
                  x2={b.antennaX}
                  y2={b.y}
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                {b.hasBeacon && (
                  <motion.circle
                    cx={b.antennaX}
                    cy={b.antennaY}
                    r="2.5"
                    fill={b.beaconColor || "#ef4444"}
                    filter="url(#highBeaconGlow)"
                    animate={{ opacity: prefersReducedMotion ? 0.8 : [0.2, 1, 0.2] }}
                    transition={{
                      duration: 1.2 + (b.id % 3) * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </>
            )}

            {/* Window Grid */}
            {b.litWindows.map((row, rIdx) => {
              const rowY = b.y + 12 + rIdx * 16;
              if (rowY > viewH * 0.8) return null;
              return row.map((lit, cIdx) => {
                if (!lit) return null;
                const colX = b.x + 8 + cIdx * ((b.w - 16) / b.windowCols);
                return (
                  <rect
                    key={`w-${b.id}-${rIdx}-${cIdx}`}
                    x={colX}
                    y={rowY}
                    width="4.5"
                    height="7"
                    fill={rIdx % 2 === 0 ? palette.secondary : "#fde047"}
                    opacity={0.65}
                    rx="0.5"
                  />
                );
              });
            })}

            {/* Neon Facade Sign */}
            {b.hasSign && b.signText && (
              <g filter="url(#neonSignGlow)">
                <rect
                  x={b.x + 10}
                  y={b.y + b.h * 0.3}
                  width={b.w - 20}
                  height="18"
                  fill="rgba(0,0,0,0.7)"
                  rx="3"
                  stroke={b.signColor || palette.secondary}
                  strokeWidth="1"
                />
                <text
                  x={b.x + b.w / 2}
                  y={b.y + b.h * 0.3 + 13}
                  fill={b.signColor || palette.secondary}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="1.5"
                >
                  {b.signText}
                </text>
              </g>
            )}
          </g>
        ))}
      </g>

      {/* ── 5. Foreground Rooftops & Heavy Architecture ──────────── */}
      <g>
        {foreSkyline.map((b) => (
          <g key={`fore-${b.id}`}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h + 200}
              fill="#030206"
              stroke="#181524"
              strokeWidth="1.2"
            />

            {/* Foreground Antenna Mast */}
            {b.spireHeight > 0 && (
              <line
                x1={b.antennaX}
                y1={b.antennaY}
                x2={b.antennaX}
                y2={b.y}
                stroke="#64748b"
                strokeWidth="2"
              />
            )}

            {/* Rooftop Beacons */}
            {b.hasBeacon && (
              <motion.circle
                cx={b.antennaX}
                cy={b.antennaY}
                r="3"
                fill="#ef4444"
                filter="url(#highBeaconGlow)"
                animate={{ opacity: prefersReducedMotion ? 1 : [0.1, 1, 0.1] }}
                transition={{
                  duration: 0.9 + (b.id % 2) * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* Foreground Window Rows */}
            {b.litWindows.slice(0, 7).map((row, rIdx) => {
              const rowY = b.y + 14 + rIdx * 18;
              if (rowY > viewH * 0.88) return null;
              return row.map((lit, cIdx) => {
                if (!lit) return null;
                const colX = b.x + 10 + cIdx * ((b.w - 20) / b.windowCols);
                return (
                  <rect
                    key={`fw-${b.id}-${rIdx}-${cIdx}`}
                    x={colX}
                    y={rowY}
                    width="6"
                    height="9"
                    fill={cIdx % 2 === 0 ? palette.primary : "#fef08a"}
                    opacity={0.8}
                    rx="1"
                  />
                );
              });
            })}
          </g>
        ))}
      </g>

      {/* ── 6. Rooftop Steam Plumes ───────────────────────────────── */}
      {steamVents.map((s) => (
        <motion.circle
          key={`steam-${s.id}`}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="#cbd5e1"
          opacity={0.2}
          filter="url(#neonSignGlow)"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [0, -45],
                  x: [0, rngRange(rng, 10, 25)],
                  opacity: [0.35, 0],
                  scale: [0.7, 1.8],
                }
          }
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* ── 7. Wet Reflective Highway / Waterfront ────────────────── */}
      <rect
        x="0"
        y={viewH * 0.88}
        width={viewW}
        height={viewH * 0.12}
        fill="url(#wetReflectGrad)"
      />
      {/* Horizontal light shimmer streaks */}
      {Array.from({ length: 14 }).map((_, i) => {
        const lineX = (viewW / 14) * i + rngRange(rng, -20, 20);
        const lineY = viewH * 0.89 + (i % 4) * 6;
        const lineW = rngRange(rng, 35, 90);
        return (
          <motion.line
            key={`refl-${i}`}
            x1={lineX}
            y1={lineY}
            x2={lineX + lineW}
            y2={lineY}
            stroke={i % 2 === 0 ? palette.secondary : palette.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={0.5}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: [0.3, 0.7, 0.3],
                    x1: [lineX - 4, lineX + 4, lineX - 4],
                  }
            }
            transition={{
              duration: 2.5 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* ── 8. Cyberpunk Diagonal Rain Streaks ────────────────────── */}
      {rainStreaks.map((r) => (
        <motion.line
          key={`rain-${r.id}`}
          x1={r.x}
          y1={r.y}
          x2={r.x + 9}
          y2={r.y + r.len}
          stroke={r.color}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={r.opacity}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [r.y - 120, viewH + 60],
                  x: [r.x - 30, r.x + 15],
                }
          }
          transition={{
            duration: r.speed,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* ── 9. Floating Neon Particles / Data Sparks ─────────────── */}
      {neonSparks.map((spark) => (
        <motion.circle
          key={`spark-${spark.id}`}
          cx={spark.x}
          cy={spark.y}
          r={spark.size}
          fill={spark.color}
          filter="url(#neonSignGlow)"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [spark.y, spark.y + spark.driftY, spark.y],
                  x: [spark.x, spark.x + spark.driftX, spark.x],
                  opacity: [0.2, spark.opacity, 0.2],
                  scale: [0.8, 1.4, 0.8],
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

export const neonSkylineTheme: ThemeDefinition = {
  id: "neon_skyline",
  name: "Neon Skyline",
  description: "Procedural cyberpunk megacity, glowing window grids, rooftop beacons, and neon rain",
  palettes: NEON_SKYLINE_PALETTES,
  renderer: NeonSkylineTheme,
};
