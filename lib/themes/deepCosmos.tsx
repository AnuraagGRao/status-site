import { motion } from "framer-motion";
import { ThemeDefinition, ThemePalettes, ThemeComponentProps } from "./themeTypes";

function makePRNG(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed / 2147483648) % 1;
  };
}

const DEEP_COSMOS_PALETTES: ThemePalettes = {
  day: {
    sky: ["#1a0033", "#330066"],
    horizon: "#4d0099",
    ground: "#220055",
    primary: "#6600cc",
    secondary: "#9933ff",
  },
  afternoon: {
    sky: ["#330066", "#660099"],
    horizon: "#9933ff",
    ground: "#440088",
    primary: "#7722dd",
    secondary: "#bb44ff",
  },
  evening: {
    sky: ["#440088", "#660099"],
    horizon: "#9933ff",
    ground: "#330066",
    primary: "#6600cc",
    secondary: "#ff33cc",
  },
  night: {
    sky: ["#0a0a15", "#1a0033"],
    horizon: "#0d001a",
    ground: "#050510",
    primary: "#330066",
    secondary: "#1a0033",
  },
};

interface Star {
  x: number;
  y: number;
  r: number;
  color: string;
  duration: number;
  delay: number;
}

interface Nebula {
  cx: string;
  cy: string;
  r: number;
  color: string;
  duration: number;
}

function generateStars(seed: number): Star[] {
  const rng = makePRNG(seed);
  const stars: Star[] = [];
  const starCount = 100;

  const colors = ["#FF00FF", "#00FFFF", "#00FF00", "#FFFF00", "#FF0080", "#00FF80"];

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: rng() * 100,
      y: rng() * 100,
      r: rng() * 1.2 + 0.3,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 3 + 2,
      delay: rng() * 5,
    });
  }

  return stars;
}

function generateNebulae(seed: number): Nebula[] {
  const rng = makePRNG(seed);
  const nebulae: Nebula[] = [];

  const nebulaNoise = [
    { color: "#FF00FF", cx: "25%", cy: "20%" },
    { color: "#00FFFF", cx: "75%", cy: "30%" },
    { color: "#FF00AA", cx: "15%", cy: "50%" },
    { color: "#00FF55", cx: "85%", cy: "45%" },
  ];

  return nebulaNoise.map((n) => ({
    ...n,
    r: 150,
    duration: rng() * 8 + 6,
  }));
}

function DeepCosmosTheme(props: ThemeComponentProps) {
  const { tod, palette, viewW, viewH, variantSeed, prefersReducedMotion } = props;

  const stars = generateStars(variantSeed);
  const nebulae = generateNebulae(variantSeed);
  const parallaxDuration = prefersReducedMotion ? 0.1 : 40;
  const nebulaDuration = prefersReducedMotion ? 0.1 : 15;

  const planetX = viewW * 0.6;
  const planetY = viewH * 0.72;
  const planetR = 90;

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <motion.linearGradient id="cosmosSkyGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </motion.linearGradient>

        {/* Nebula blur filters */}
        <filter id="nebulaBlur">
          <feGaussianBlur stdDeviation="20" result="blur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
        </filter>

        {/* Star glow */}
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Radial gradients for planet rings */}
        <radialGradient id="planetGrad">
          <stop offset="0%" stopColor="#FF00FF" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#00FFFF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base cosmic sky */}
      <rect width={viewW} height={viewH} fill="url(#cosmosSkyGrad)" />

      {/* Nebula clouds (animated opacity cycling) */}
      {nebulae.map((nebula, i) => (
        <motion.g key={`nebula-${i}`}>
          <motion.circle
            cx={nebula.cx}
            cy={nebula.cy}
            r={nebula.r}
            fill={nebula.color}
            filter="url(#nebulaBlur)"
            animate={{
              opacity: prefersReducedMotion ? [0.3, 0.3] : [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: nebulaDuration + i * 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </motion.g>
      ))}

      {/* Dense star field with twinkling */}
      <motion.g
        animate={{
          y: prefersReducedMotion ? [0, 0] : [-10, 10, -10],
        }}
        transition={{
          duration: parallaxDuration * 1.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{ willChange: "transform" }}
      >
        {stars.map((star) => (
          <motion.circle
            key={`star-${star.x}-${star.y}`}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.r}
            fill={star.color}
            filter="url(#starGlow)"
            animate={{
              opacity: prefersReducedMotion ? [1, 1] : [0.3, 1, 0.3],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.g>

      {/* Giant ringed planet on horizon */}
      <motion.g
        animate={{
          y: prefersReducedMotion ? [0, 0] : [-5, 5, -5],
        }}
        transition={{
          duration: parallaxDuration * 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{ willChange: "transform" }}
      >
        {/* Planet shadow base */}
        <ellipse cx={planetX} cy={planetY + 20} rx={planetR + 20} ry={15} fill="rgba(0,0,0,0.4)" />

        {/* Outer ring 1 (tilted) */}
        <motion.ellipse
          cx={planetX}
          cy={planetY}
          rx={180}
          ry={25}
          fill="none"
          stroke="#FF00FF"
          strokeWidth="4"
          opacity="0.6"
          animate={{
            rotate: prefersReducedMotion ? [0, 0] : [0, 360],
          }}
          transition={{
            duration: 45,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{
            transformOrigin: `${planetX}px ${planetY}px`,
            willChange: "transform",
          }}
        />

        {/* Outer ring 2 (different angle) */}
        <motion.ellipse
          cx={planetX}
          cy={planetY}
          rx={160}
          ry={20}
          fill="none"
          stroke="#00FFFF"
          strokeWidth="2"
          opacity="0.4"
          animate={{
            rotate: prefersReducedMotion ? [0, 0] : [0, -360],
          }}
          transition={{
            duration: 60,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{
            transformOrigin: `${planetX}px ${planetY}px`,
            willChange: "transform",
          }}
        />

        {/* Planet sphere */}
        <motion.circle
          cx={planetX}
          cy={planetY}
          r={planetR}
          fill="url(#planetGrad)"
          animate={{
            opacity: prefersReducedMotion ? [0.8, 0.8] : [0.7, 1, 0.7],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Planet details (atmospheric bands) */}
        {[0, 1, 2, 3].map((i) => (
          <ellipse
            key={`band-${i}`}
            cx={planetX}
            cy={planetY - planetR / 2 + (i * planetR) / 2}
            rx={planetR - 10}
            ry={planetR / 4}
            fill="none"
            stroke="#FF00FF"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Planet core glow */}
        <circle cx={planetX - 20} cy={planetY - 20} r={30} fill="#FFFF00" opacity="0.15" filter="url(#nebulaBlur)" />
      </motion.g>

      {/* Distant nebula swirls */}
      <motion.g opacity="0.3">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.circle
            key={`back-nebula-${i}`}
            cx={`${25 + i * 40}%`}
            cy="70%"
            r={200}
            fill="#6600CC"
            animate={{
              opacity: prefersReducedMotion ? [0.3, 0.3] : [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 10 + i * 3,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i,
            }}
            filter="url(#nebulaBlur)"
          />
        ))}
      </motion.g>

      {/* Space depth fade */}
      <defs>
        <linearGradient id="cosmosFade" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={palette.horizon} stopOpacity={0} />
          <stop offset="100%" stopColor={palette.horizon} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      <rect width={viewW} height={viewH} fill="url(#cosmosFade)" pointerEvents="none" />
    </motion.svg>
  );
}

export const deepCosmosTheme: ThemeDefinition = {
  id: "deep_cosmos",
  name: "Deep Cosmos",
  description: "Swirling nebulae, dense star fields, and a magnificent ringed gas giant",
  palettes: DEEP_COSMOS_PALETTES,
  renderer: DeepCosmosTheme,
};
