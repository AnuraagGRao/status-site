import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";

function makePRNG(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed / 2147483648) % 1;
  };
}

const CYBER_ALPINE_PALETTES: ThemePalettes = {
  day: {
    sky: ["#E0F7FF", "#00BCD4"],
    horizon: "#00ACC1",
    ground: "#006064",
    primary: "#00838F",
    secondary: "#00BCD4",
  },
  afternoon: {
    sky: ["#B2DFDB", "#FF4081"],
    horizon: "#D81B60",
    ground: "#880E4F",
    primary: "#C2185B",
    secondary: "#E91E63",
  },
  evening: {
    sky: ["#7C4DFF", "#FF00FF"],
    horizon: "#7B1FA2",
    ground: "#4A148C",
    primary: "#7B1FA2",
    secondary: "#9C27B0",
  },
  night: {
    sky: ["#0D0D0D", "#1A0033"],
    horizon: "#0A0A0A",
    ground: "#050505",
    primary: "#1A0D26",
    secondary: "#0D1B2A",
  },
};

interface DataStream {
  x: number;
  y: number;
  length: number;
}

function generateDataStreams(seed: number, viewW: number, viewH: number): DataStream[] {
  const rng = makePRNG(seed);
  const streams: DataStream[] = [];

  for (let i = 0; i < 6; i++) {
    streams.push({
      x: rng() * viewW,
      y: rng() * (viewH * 0.6),
      length: rng() * 80 + 60,
    });
  }

  return streams;
}

function CyberAlpineTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const dataStreams = generateDataStreams(variantSeed, viewW, viewH);
  const parallaxDuration = prefersReducedMotion ? 0.1 : 30;
  const gridDuration = prefersReducedMotion ? 0.1 : 8;
  const streamDuration = prefersReducedMotion ? 0.1 : 3;

  const isMoon = tod === "evening" || tod === "night";
  const celestialX = viewW * 0.5;
  const celestialY = viewH * 0.25;

  // Generate random mountain peaks
  const rng = makePRNG(variantSeed);
  const peaks: number[] = [];
  for (let i = 0; i < 12; i++) {
    peaks.push(viewH * (0.3 + rng() * 0.35));
  }

  // Grid line generator
  const gridLines = Array.from({ length: 20 }).map((_, i) => ({
    y: viewH * 0.7 + (i * viewH * 0.3) / 20,
  }));

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
          <stop offset="100%" stopColor={palette.sky[1]} />
        </motion.linearGradient>

        {/* Neon glow filters */}
        <filter id="cyberGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor={palette.secondary} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="glow" in2="SourceGraphic" operator="arithmetic" k2="1" k3="1" />
        </filter>

        <filter id="cyberGlowStrong">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor={palette.secondary} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="glow" in2="SourceGraphic" operator="arithmetic" k2="1" k3="1" />
        </filter>
      </defs>

      {/* Sky gradient */}
      <rect width={viewW} height={viewH} fill="url(#cyberSkyGrad)" />

      {/* Data streams (shooting lines) */}
      {dataStreams.map((stream, i) => (
        <motion.g key={`stream-${i}`} opacity={prefersReducedMotion ? 0 : 1}>
          <motion.line
            x1={stream.x}
            y1={stream.y}
            x2={stream.x}
            y2={stream.y + stream.length}
            stroke={palette.secondary}
            strokeWidth="2"
            animate={{
              y1: prefersReducedMotion ? [stream.y, stream.y] : [stream.y - stream.length, stream.y + stream.length],
              y2: prefersReducedMotion ? [stream.y + stream.length, stream.y + stream.length] : [stream.y, stream.y + stream.length * 2],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: streamDuration + i * 0.5,
              ease: "easeIn",
              repeat: Infinity,
              repeatDelay: 2,
            }}
            filter="url(#cyberGlow)"
          />
        </motion.g>
      ))}

      {/* Polygonal mountain ranges with neon edges */}
      <motion.g
        animate={{
          x: prefersReducedMotion ? [0, 0] : [-20, 20, -20],
        }}
        transition={{
          duration: parallaxDuration,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{ willChange: "transform" }}
      >
        <path
          d={`M0,${peaks[0]} ${peaks.map((peak, i) => `L${(i / peaks.length) * viewW},${peak}`).join(" ")} L${viewW},${viewH * 0.8} L${viewW},${viewH} L0,${viewH} Z`}
          fill={palette.primary}
          stroke={palette.secondary}
          strokeWidth="2"
          filter="url(#cyberGlow)"
        />

        {/* Wireframe details on mountain */}
        {Array.from({ length: peaks.length - 1 }).map((_, i) => (
          <line
            key={`wireframe-${i}`}
            x1={(i / peaks.length) * viewW}
            y1={peaks[i]}
            x2={((i + 1) / peaks.length) * viewW}
            y2={peaks[i + 1]}
            stroke={palette.secondary}
            strokeWidth="1"
            opacity="0.6"
            filter="url(#cyberGlow)"
          />
        ))}
      </motion.g>

      {/* Ground grid lines (moving) */}
      <motion.g opacity="0.4">
        {gridLines.map((line, i) => (
          <motion.line
            key={`grid-${i}`}
            x1={0}
            y1={line.y}
            x2={viewW}
            y2={line.y}
            stroke={palette.secondary}
            strokeWidth="1"
            animate={{
              x1: prefersReducedMotion ? [0, 0] : [-viewW, viewW * 2],
              x2: prefersReducedMotion ? [viewW, viewW] : [viewW, viewW * 3],
              opacity: prefersReducedMotion ? [0.4, 0.4] : [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: gridDuration,
              ease: "linear",
              repeat: Infinity,
            }}
            filter="url(#cyberGlow)"
          />
        ))}
      </motion.g>

      {/* Synthetic sun / moon with grid pattern */}
      {isMoon ? (
        <motion.g>
          {/* Outer glow ring */}
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={60}
            fill="none"
            stroke={palette.secondary}
            strokeWidth="2"
            animate={{
              r: prefersReducedMotion ? [60, 60] : [58, 62, 58],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            filter="url(#cyberGlowStrong)"
          />

          {/* Inner grid */}
          <g>
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`grid-v-${i}`}
                x1={celestialX - 40 + (i * 20)}
                y1={celestialY - 40}
                x2={celestialX - 40 + (i * 20)}
                y2={celestialY + 40}
                stroke={palette.secondary}
                strokeWidth="0.5"
                opacity="0.5"
                filter="url(#cyberGlow)"
              />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`grid-h-${i}`}
                x1={celestialX - 40}
                y1={celestialY - 40 + (i * 20)}
                x2={celestialX + 40}
                y2={celestialY - 40 + (i * 20)}
                stroke={palette.secondary}
                strokeWidth="0.5"
                opacity="0.5"
                filter="url(#cyberGlow)"
              />
            ))}
          </g>

          {/* Center core */}
          <circle cx={celestialX} cy={celestialY} r={20} fill={palette.secondary} opacity="0.7" filter="url(#cyberGlowStrong)" />
        </motion.g>
      ) : (
        <motion.g>
          {/* Outer pulsing ring */}
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={70}
            fill="none"
            stroke={palette.secondary}
            strokeWidth="3"
            animate={{
              r: prefersReducedMotion ? [70, 70] : [65, 75, 65],
              opacity: prefersReducedMotion ? [1, 1] : [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            filter="url(#cyberGlowStrong)"
          />

          {/* Grid pattern sun */}
          <circle cx={celestialX} cy={celestialY} r={50} fill={palette.secondary} opacity="0.2" />
          <g>
            {Array.from({ length: 7 }).map((_, i) => (
              <line
                key={`sun-grid-v-${i}`}
                x1={celestialX - 50 + (i * 16.67)}
                y1={celestialY - 50}
                x2={celestialX - 50 + (i * 16.67)}
                y2={celestialY + 50}
                stroke={palette.secondary}
                strokeWidth="1"
                opacity="0.4"
                filter="url(#cyberGlow)"
              />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line
                key={`sun-grid-h-${i}`}
                x1={celestialX - 50}
                y1={celestialY - 50 + (i * 16.67)}
                x2={celestialX + 50}
                y2={celestialY - 50 + (i * 16.67)}
                stroke={palette.secondary}
                strokeWidth="1"
                opacity="0.4"
                filter="url(#cyberGlow)"
              />
            ))}
          </g>

          {/* Center bright core */}
          <motion.circle
            cx={celestialX}
            cy={celestialY}
            r={20}
            fill={palette.secondary}
            animate={{
              opacity: prefersReducedMotion ? [1, 1] : [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            filter="url(#cyberGlowStrong)"
          />
        </motion.g>
      )}

      {/* Ground fade overlay */}
      <defs>
        <linearGradient id="cyberFade" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.ground} stopOpacity={0} />
          <stop offset="100%" stopColor={palette.ground} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <rect width={viewW} height={viewH} fill="url(#cyberFade)" pointerEvents="none" />
    </motion.svg>
  );
}

export const cyberAlpineTheme: ThemeDefinition = {
  id: "cyber_alpine",
  name: "Cyber Alpine",
  description: "Jagged neon mountains with grid lines and data streams",
  palettes: CYBER_ALPINE_PALETTES,
  renderer: CyberAlpineTheme,
};
