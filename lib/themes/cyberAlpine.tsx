import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";
import {
  makePRNG,
  rngRange,
  rngInt,
  generateProceduralRidge,
  generateAtmosphericMotes,
  Point2D,
} from "@/lib/procedural";

const CYBER_ALPINE_PALETTES: ThemePalettes = {
  day: {
    sky: ["#0284c7", "#06b6d4"],
    horizon: "#22d3ee",
    ground: "#082f49",
    primary: "#0369a1",
    secondary: "#06b6d4",
  },
  afternoon: {
    sky: ["#701a75", "#f43f5e"],
    horizon: "#fb7185",
    ground: "#3b0764",
    primary: "#86198f",
    secondary: "#e11d48",
  },
  evening: {
    sky: ["#3b0764", "#c026d3"],
    horizon: "#f0abfc",
    ground: "#18022e",
    primary: "#6b21a8",
    secondary: "#d946ef",
  },
  night: {
    sky: ["#050508", "#1e082b"],
    horizon: "#110e20",
    ground: "#030206",
    primary: "#2e0854",
    secondary: "#00f0ff",
    amoled: {
      sky: ["#000000", "#080210"],
      horizon: "#05000a",
      ground: "#000000",
      primary: "#ff007f",
      secondary: "#00ffff",
    },
  },
};

interface DataStream {
  x: number;
  y: number;
  len: number;
  speed: number;
  color: string;
}

interface CyberPolyhedron {
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

function generateDataStreams(rng: () => number, viewW: number, viewH: number, secondary: string): DataStream[] {
  const streams: DataStream[] = [];
  const colors = [secondary, "#00f0ff", "#ff007f", "#39ff14", "#ffe600"];

  for (let i = 0; i < 14; i++) {
    streams.push({
      x: rngRange(rng, 20, viewW - 20),
      y: rngRange(rng, viewH * 0.05, viewH * 0.55),
      len: rngRange(rng, 50, 110),
      speed: rngRange(rng, 1.8, 3.8),
      color: colors[i % colors.length],
    });
  }
  return streams;
}

function generatePolyhedra(rng: () => number, viewW: number, viewH: number, secondary: string): CyberPolyhedron[] {
  const polyhedra: CyberPolyhedron[] = [];
  const colors = [secondary, "#00ffff", "#ff00aa", "#ffff00"];

  for (let i = 0; i < 6; i++) {
    polyhedra.push({
      x: rngRange(rng, viewW * 0.1, viewW * 0.9),
      y: rngRange(rng, viewH * 0.15, viewH * 0.48),
      size: rngRange(rng, 18, 36),
      color: colors[i % colors.length],
      duration: rngRange(rng, 5, 9),
      delay: rngRange(rng, 0, 3),
    });
  }
  return polyhedra;
}

function CyberAlpineTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const rng = makePRNG(variantSeed);

  // 1. Procedural Synthwave Mountains
  const cyberRidgeFar = generateProceduralRidge(rng, viewW, viewH, {
    baseY: viewH * 0.65,
    minHeight: 130,
    maxHeight: 230,
    peaksCount: 8,
    jaggedness: 0.5,
  });

  const cyberRidgeFore = generateProceduralRidge(rng, viewW, viewH, {
    baseY: viewH * 0.74,
    minHeight: 90,
    maxHeight: 160,
    peaksCount: 11,
    jaggedness: 0.65,
  });

  // 2. Data Streams & Floating Holo-Polyhedra
  const dataStreams = generateDataStreams(rng, viewW, viewH, palette.secondary);
  const polyhedra = generatePolyhedra(rng, viewW, viewH, palette.secondary);

  const cyberSnow = generateAtmosphericMotes(rng, 26, viewW, viewH, {
    colorChoices: [palette.secondary, "#ffffff", "#00f0ff", "#a5f3fc"],
    minSize: 1.5,
    maxSize: 3.5,
    driftXRange: [12, 28],
    driftYRange: [25, 45],
    durationRange: [4, 7],
    baseYRange: [viewH * 0.1, viewH * 0.85],
  });

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * 0.5;
  const celestialY = viewH * (isMoon ? 0.28 : 0.32);
  const sunRadius = 88;

  const parallaxDuration = prefersReducedMotion ? 0.1 : 25;

  // Horizontal scanline slices for synthwave sun
  const sliceCount = 8;
  const slices = Array.from({ length: sliceCount }).map((_, i) => {
    const fraction = (i + 1) / (sliceCount + 1);
    const sliceY = celestialY + sunRadius * (fraction * 1.5 - 0.75);
    const sliceHeight = 2.5 + i * 1.2;
    return { y: sliceY, height: sliceHeight };
  });

  // Perspective Grid Lines
  const gridVanishY = viewH * 0.72;
  const gridLineCount = 18;
  const perspectiveLines = Array.from({ length: gridLineCount }).map((_, i) => {
    const bottomX = (viewW / (gridLineCount - 1)) * i;
    return { bottomX };
  });

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <motion.linearGradient id="cyberSkyGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="70%" stopColor={palette.sky[1]} />
          <stop offset="100%" stopColor={palette.horizon} />
        </motion.linearGradient>

        <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff007f" />
          <stop offset="45%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>

        <linearGradient id="cyberGroundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ground} stopOpacity="0.9" />
          <stop offset="100%" stopColor={palette.primary} stopOpacity="0.98" />
        </linearGradient>

        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="intenseNeonGlow">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── 1. Sky Gradient ─────────────────────────────────────── */}
      <rect width={viewW} height={viewH} fill="url(#cyberSkyGrad)" />

      {/* ── 2. Synthwave Segmented Neon Sun ─────────────────────── */}
      <g filter="url(#intenseNeonGlow)">
        {/* Outer Radiant Sun Halo */}
        <motion.circle
          cx={celestialX}
          cy={celestialY}
          r={sunRadius + 20}
          fill="url(#sunGrad)"
          opacity="0.3"
          animate={{
            r: prefersReducedMotion ? [sunRadius + 20, sunRadius + 20] : [sunRadius + 15, sunRadius + 28, sunRadius + 15],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main Sun Disc */}
        <circle cx={celestialX} cy={celestialY} r={sunRadius} fill="url(#sunGrad)" />

        {/* Horizontal Laser Cutout Slices (Synthwave aesthetic) */}
        {slices.map((slice, i) => (
          <rect
            key={`slice-${i}`}
            x={celestialX - sunRadius - 4}
            y={slice.y}
            width={(sunRadius + 4) * 2}
            height={slice.height}
            fill={palette.sky[1]}
            opacity="0.9"
          />
        ))}
      </g>

      {/* ── 3. Falling Matrix / Cyber Data Streams ──────────────── */}
      <g>
        {dataStreams.map((st, i) => (
          <motion.line
            key={`stream-${i}`}
            x1={st.x}
            y1={st.y}
            x2={st.x}
            y2={st.y + st.len}
            stroke={st.color}
            strokeWidth="1.6"
            strokeLinecap="round"
            filter="url(#neonGlow)"
            animate={
              prefersReducedMotion
                ? { opacity: 0.6 }
                : {
                    y: [0, viewH * 0.4, 0],
                    opacity: [0.2, 0.95, 0.2],
                  }
            }
            transition={{
              duration: st.speed,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </g>

      {/* ── 4. Floating Holographic Wireframe Polyhedra ──────────── */}
      <g>
        {polyhedra.map((poly, idx) => (
          <motion.g
            key={`poly-${idx}`}
            animate={
              prefersReducedMotion
                ? { y: poly.y }
                : {
                    y: [poly.y - 12, poly.y + 12, poly.y - 12],
                    rotate: [0, 180, 360],
                  }
            }
            transition={{
              duration: poly.duration,
              delay: poly.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: `${poly.x}px ${poly.y}px` }}
          >
            {/* Diamond / Octahedron Wireframe */}
            <polygon
              points={`
                ${poly.x},${poly.y - poly.size}
                ${poly.x + poly.size * 0.75},${poly.y}
                ${poly.x},${poly.y + poly.size}
                ${poly.x - poly.size * 0.75},${poly.y}
              `}
              fill="rgba(0,255,255,0.08)"
              stroke={poly.color}
              strokeWidth="1.5"
              filter="url(#neonGlow)"
            />
            <line
              x1={poly.x - poly.size * 0.75}
              y1={poly.y}
              x2={poly.x + poly.size * 0.75}
              y2={poly.y}
              stroke={poly.color}
              strokeWidth="1"
              opacity="0.6"
            />
          </motion.g>
        ))}
      </g>

      {/* ── 5. Far Wireframe Mountain Ridge ─────────────────────── */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-6, 6, -6] }}
        transition={{ duration: parallaxDuration * 1.3, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <path d={cyberRidgeFar.path} fill={palette.primary} opacity="0.8" />
        {/* Neon Wireframe Edge Glow */}
        <path
          d={cyberRidgeFar.path.split(" L")[0]}
          stroke={palette.secondary}
          strokeWidth="2"
          fill="none"
          filter="url(#neonGlow)"
        />
      </motion.g>

      {/* ── 6. Foreground Wireframe Alpine Ridge ────────────────── */}
      <motion.g
        animate={{ x: prefersReducedMotion ? 0 : [-12, 12, -12] }}
        transition={{ duration: parallaxDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <path d={cyberRidgeFore.path} fill={palette.ground} opacity="0.95" />
        {/* Crisp Neon Ridge Crest */}
        <path
          d={cyberRidgeFore.path.split(" L")[0]}
          stroke="#00ffff"
          strokeWidth="2.5"
          fill="none"
          filter="url(#neonGlow)"
        />

        {/* Peak Radio Antennas with Pulsing Beacon Lights */}
        {cyberRidgeFore.peaks.slice(0, 5).map((p, idx) => (
          <g key={`beacon-${idx}`}>
            <line
              x1={p.x}
              y1={p.y}
              x2={p.x}
              y2={p.y - 25}
              stroke="#00ffff"
              strokeWidth="1.8"
            />
            <motion.circle
              cx={p.x}
              cy={p.y - 26}
              r={3.5}
              fill="#ff0055"
              filter="url(#neonGlow)"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, delay: idx * 0.3, repeat: Infinity }}
            />
          </g>
        ))}
      </motion.g>

      {/* ── 7. Perspective Ground Grid (Synthwave Plane) ────────── */}
      <g>
        <rect
          x="0"
          y={gridVanishY}
          width={viewW}
          height={viewH - gridVanishY}
          fill="url(#cyberGroundGrad)"
        />

        {/* Perspective converging lines toward horizon */}
        {perspectiveLines.map((line, idx) => (
          <line
            key={`persp-${idx}`}
            x1={celestialX + (idx - gridLineCount / 2) * 8}
            y1={gridVanishY}
            x2={line.bottomX}
            y2={viewH}
            stroke={palette.secondary}
            strokeWidth="1.2"
            opacity="0.35"
          />
        ))}

        {/* Animated forward-moving horizontal gridlines */}
        <motion.g
          animate={
            prefersReducedMotion
              ? { y: 0 }
              : {
                  y: [0, 40],
                }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const yOffset = gridVanishY + Math.pow((i + 1) / 10, 1.8) * (viewH - gridVanishY);
            return (
              <line
                key={`hgrid-${i}`}
                x1="0"
                y1={yOffset}
                x2={viewW}
                y2={yOffset}
                stroke={palette.secondary}
                strokeWidth={1 + i * 0.25}
                opacity={0.25 + i * 0.08}
              />
            );
          })}
        </motion.g>
      </g>

      {/* ── 8. Drifting Cyber-Snow & Crystal Particles ──────────── */}
      {cyberSnow.map((flake) => (
        <motion.rect
          key={`flake-${flake.id}`}
          x={flake.x}
          y={flake.y}
          width={flake.size}
          height={flake.size}
          fill={flake.color}
          opacity={flake.opacity}
          filter="url(#neonGlow)"
          transform={`rotate(45 ${flake.x} ${flake.y})`}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  x: [flake.x, flake.x + flake.driftX, flake.x],
                  y: [flake.y, flake.y + flake.driftY, flake.y],
                  opacity: [0.15, flake.opacity, 0.15],
                  rotate: [45, 225, 405],
                }
          }
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
}

export const cyberAlpineTheme: ThemeDefinition = {
  id: "cyber_alpine",
  name: "Cyber Alpine",
  description: "Procedural wireframe peaks, synthwave segmented sun, perspective grid, and beacon towers",
  palettes: CYBER_ALPINE_PALETTES,
  renderer: CyberAlpineTheme,
};
