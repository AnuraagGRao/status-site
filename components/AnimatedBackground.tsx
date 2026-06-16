"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TimeOfDay } from "@/lib/timeUtils";
import { SCENE_WIDTH, SCENE_HEIGHT } from "@/lib/sceneConstants";

/* ─── Palette definitions ─────────────────────────────────────────── */
const PALETTES: Record<
  TimeOfDay,
  { sky: [string, string]; horizon: string; ground: string; hill: string; hill2: string }
> = {
  day: {
    sky: ["#4FC3F7", "#81D4FA"],
    horizon: "#E3F2FD",
    ground: "#C8E6C9",
    hill: "#A5D6A7",
    hill2: "#81C784",
  },
  afternoon: {
    sky: ["#29B6F6", "#FFD54F"],
    horizon: "#FFF8E1",
    ground: "#DCEDC8",
    hill: "#AED581",
    hill2: "#9CCC65",
  },
  evening: {
    sky: ["#FF7043", "#7B1FA2"],
    horizon: "#FFCCBC",
    ground: "#BCAAA4",
    hill: "#8D6E63",
    hill2: "#795548",
  },
  night: {
    sky: ["#1A237E", "#311B92"],
    horizon: "#283593",
    ground: "#1B5E20",
    hill: "#1B5E20",
    hill2: "#2E7D32",
  },
};

/* ─── Cloud shapes (normalised 0–1 coords) ─────────────────────────── */
interface Cloud {
  id: number;
  y: number; // fractional viewport height (0.05–0.35)
  scale: number;
  speed: number; // pixels per second
  startX: number; // initial left offset
  opacity: number;
  color: string;
}

const CLOUDS: Cloud[] = [
  { id: 0, y: 0.08, scale: 1.2, speed: 28, startX: -200, opacity: 0.9, color: "white" },
  { id: 1, y: 0.16, scale: 0.8, speed: 18, startX: 300, opacity: 0.75, color: "white" },
  { id: 2, y: 0.24, scale: 1.0, speed: 22, startX: 700, opacity: 0.85, color: "white" },
  { id: 3, y: 0.12, scale: 0.65, speed: 15, startX: 1100, opacity: 0.6, color: "white" },
];

/* ─── Star positions (seeded so they don't jump on re-render) ──────── */
//
// Star (cx, cy) values are generated with two deterministic integer sequences
// derived from the star index.  Using two different prime-based multipliers
// gives good distribution across the canvas without needing Math.random():
//   cx: (i × 5087.796 mod 1000) / 10   → 0 – 100 % of viewport width
//   cy: (i × 1264.9  mod 600) / 12     → 0 – 50 % of viewport height (upper half only)
const STAR_X_SPREAD = 137.508 * 37; // ≈ 5087.796 — spreads 80 stars evenly across 100 %
const STAR_Y_SPREAD = 97.3 * 13;    // ≈ 1264.9   — keeps stars in the upper sky half
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  cx: ((i * STAR_X_SPREAD) % 1000) / 10,
  cy: ((i * STAR_Y_SPREAD) % 600) / 12,
  r: 0.8 + (i % 3) * 0.6,
  delay: (i * 0.17) % 3,
  duration: 1.5 + (i % 5) * 0.5,
}));

/* ─── CloudPuff: single fluffy cloud made of circles ──────────────── */
function CloudPuff({
  cloud,
  tod,
  viewW,
  viewH,
}: {
  cloud: Cloud;
  tod: TimeOfDay;
  viewW: number;
  viewH: number;
}) {
  const cloudColor =
    tod === "evening"
      ? "#FFAB91"
      : tod === "night"
      ? "rgba(255,255,255,0.15)"
      : "white";

  const travelDist = viewW + 400; // px the cloud travels before wrapping
  const duration = travelDist / cloud.speed;

  return (
    <motion.g
      key={`cloud-${cloud.id}-${tod}`}
      initial={{ x: cloud.startX }}
      animate={{ x: cloud.startX + travelDist }}
      transition={{
        duration,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      }}
    >
      {/* Cloud puff made of 5 overlapping ellipses */}
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
          fill={cloudColor}
          opacity={cloud.opacity}
        />
      ))}
    </motion.g>
  );
}

/* Shooting-star repeat interval in seconds.
 * ~9 s gives a pleasant "occasional but not rare" cadence without
 * feeling mechanical.  Kept as a constant (not Math.random) so the
 * value is stable across re-renders (React purity requirement). */
const SHOOTING_STAR_DELAY = 9.4;

/* ─── ShootingStar ─────────────────────────────────────────────────── */
function ShootingStar({ viewW, viewH }: { viewW: number; viewH: number }) {
  return (
    <motion.line
      x1={viewW * 0.7}
      y1={viewH * 0.05}
      x2={viewW * 0.7 + 120}
      y2={viewH * 0.05 + 60}
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 1] }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: SHOOTING_STAR_DELAY,
      }}
    />
  );
}

/* ─── Main component ───────────────────────────────────────────────── */
interface AnimatedBackgroundProps {
  tod: TimeOfDay;
  bgRef?: React.RefObject<SVGSVGElement | null>;
}

export default function AnimatedBackground({ tod, bgRef }: AnimatedBackgroundProps) {
  const palette = PALETTES[tod];
  const viewW = SCENE_WIDTH;
  const viewH = SCENE_HEIGHT;

  // Sun/Moon position: higher (smaller y) at midday, lower at twilight
  const celestialY = tod === "day" ? 80 : tod === "afternoon" ? 140 : tod === "evening" ? 320 : 60;
  const celestialX = tod === "day" ? 900 : tod === "afternoon" ? 700 : tod === "evening" ? 200 : 1100;
  const isMoon = tod === "night";

  return (
    <motion.svg
      ref={bgRef}
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* Sky gradient — animate gradient stops between palettes */}
        <motion.linearGradient
          id="skyGrad"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </motion.linearGradient>

        {/* Moon glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Sky background ─────────────────────────────────────────── */}
      <motion.rect
        width={viewW}
        height={viewH}
        fill="url(#skyGrad)"
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Stars (night only) ─────────────────────────────────────── */}
      <AnimatePresence>
        {tod === "night" &&
          STARS.map((s) => (
            <motion.circle
              key={`star-${s.id}`}
              cx={`${s.cx}%`}
              cy={`${s.cy}%`}
              r={s.r}
              fill="white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
      </AnimatePresence>

      {/* ── Shooting star (night only) ─────────────────────────────── */}
      <AnimatePresence>
        {tod === "night" && <ShootingStar viewW={viewW} viewH={viewH} />}
      </AnimatePresence>

      {/* ── Celestial body (Sun / Moon) ────────────────────────────── */}
      <motion.g
        animate={{ cx: celestialX, cy: celestialY }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        {isMoon ? (
          <>
            {/* Moon */}
            <motion.circle
              cx={celestialX}
              cy={celestialY}
              r={44}
              fill="#E8EAF6"
              filter="url(#glow)"
              animate={{ cx: celestialX, cy: celestialY }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            {/* Crescent cutout */}
            <motion.circle
              cx={celestialX + 18}
              cy={celestialY - 10}
              r={36}
              fill={palette.sky[0]}
              animate={{ cx: celestialX + 18, cy: celestialY - 10 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </>
        ) : (
          <>
            {/* Sun glow halo */}
            <motion.circle
              cx={celestialX}
              cy={celestialY}
              r={80}
              fill={tod === "evening" ? "#FF7043" : "#FFD740"}
              opacity={0.18}
              animate={{ cx: celestialX, cy: celestialY, r: [75, 85, 75] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Sun core */}
            <motion.circle
              cx={celestialX}
              cy={celestialY}
              r={44}
              fill={tod === "evening" ? "#FF6D00" : "#FFD740"}
              filter="url(#glow)"
              animate={{ cx: celestialX, cy: celestialY }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </>
        )}
      </motion.g>

      {/* ── Clouds (day, afternoon, evening) ──────────────────────── */}
      <AnimatePresence>
        {tod !== "night" &&
          CLOUDS.map((cloud) => (
            <CloudPuff
              key={`cloud-${cloud.id}-${tod}`}
              cloud={cloud}
              tod={tod}
              viewW={viewW}
              viewH={viewH}
            />
          ))}
      </AnimatePresence>

      {/* ── Horizon fade ───────────────────────────────────────────── */}
      <defs>
        <linearGradient id="horizonFade" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.horizon} stopOpacity={0} />
          <stop offset="100%" stopColor={palette.horizon} stopOpacity={0.7} />
        </linearGradient>
      </defs>
      <rect x={0} y={viewH * 0.45} width={viewW} height={viewH * 0.2} fill="url(#horizonFade)" />

      {/* ── Far hill ───────────────────────────────────────────────── */}
      <motion.path
        d={`M0,${viewH * 0.72} 
            C${viewW * 0.1},${viewH * 0.52} ${viewW * 0.25},${viewH * 0.48} ${viewW * 0.38},${viewH * 0.56}
            C${viewW * 0.5},${viewH * 0.64} ${viewW * 0.6},${viewH * 0.58} ${viewW * 0.72},${viewH * 0.5}
            C${viewW * 0.85},${viewH * 0.42} ${viewW * 0.95},${viewH * 0.55} ${viewW},${viewH * 0.6}
            L${viewW},${viewH} L0,${viewH} Z`}
        fill={palette.hill}
        animate={{ fill: palette.hill }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Near hill ──────────────────────────────────────────────── */}
      <motion.path
        d={`M0,${viewH * 0.85} 
            C${viewW * 0.08},${viewH * 0.68} ${viewW * 0.18},${viewH * 0.62} ${viewW * 0.3},${viewH * 0.7}
            C${viewW * 0.42},${viewH * 0.78} ${viewW * 0.55},${viewH * 0.65} ${viewW * 0.65},${viewH * 0.72}
            C${viewW * 0.78},${viewH * 0.8} ${viewW * 0.9},${viewH * 0.69} ${viewW},${viewH * 0.76}
            L${viewW},${viewH} L0,${viewH} Z`}
        fill={palette.hill2}
        animate={{ fill: palette.hill2 }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Ground ─────────────────────────────────────────────────── */}
      <motion.rect
        x={0}
        y={viewH * 0.88}
        width={viewW}
        height={viewH * 0.12}
        fill={palette.ground}
        animate={{ fill: palette.ground }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Simple pine trees ──────────────────────────────────────── */}
      {[120, 280, 420, 980, 1150, 1300].map((x, i) => {
        const h = 90 + (i % 3) * 30;
        const baseY = viewH * 0.88;
        const treeColor = tod === "night" ? "#1B5E20" : tod === "evening" ? "#4E342E" : "#388E3C";
        return (
          <motion.g key={`tree-${i}`} animate={{ fill: treeColor }} transition={{ duration: 1.5 }}>
            <polygon
              points={`${x},${baseY - h} ${x - 28},${baseY} ${x + 28},${baseY}`}
              fill={treeColor}
            />
            <polygon
              points={`${x},${baseY - h - 30} ${x - 18},${baseY - h + 20} ${x + 18},${baseY - h + 20}`}
              fill={treeColor}
            />
          </motion.g>
        );
      })}
    </motion.svg>
  );
}
