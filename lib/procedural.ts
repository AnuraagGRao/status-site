/**
 * Procedural generation utilities for status-site scenery.
 * Features Mulberry32 PRNG and dynamic SVG path/geometry generators
 * for organic mountains, dunes, shorelines, nebulae, and celestial formations.
 */

/**
 * Fast, high-quality 32-bit pseudo-random number generator (Mulberry32).
 * Produces uniform distribution in [0, 1) with excellent statistical properties.
 */
export function makePRNG(initialSeed: number): () => number {
  let s = (initialSeed >>> 0) || 1;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random float between min and max */
export function rngRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Random integer between min and max (inclusive) */
export function rngInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rngRange(rng, min, max + 1));
}

/** Pick a random item from an array */
export function rngChoice<T>(rng: () => number, array: readonly T[]): T {
  return array[Math.floor(rng() * array.length)];
}

/**
 * Point representation for geometry generation
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Generate a smooth closed SVG polygon/path from points using cubic Catmull-Rom or Bezier interpolation.
 */
export function pointsToSmoothPath(points: Point2D[], closeBottom = true, viewW = 1440, viewH = 900): string {
  if (points.length < 2) return "";

  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  if (closeBottom) {
    const lastX = points[points.length - 1].x;
    d += ` L${lastX.toFixed(1)},${viewH} L${points[0].x.toFixed(1)},${viewH} Z`;
  }

  return d;
}

/**
 * Procedural Mountain Ridge Generator
 * Produces jagged or alpine mountain paths with variable peaks, valleys, and saddles.
 */
export function generateProceduralRidge(
  rng: () => number,
  viewW: number,
  viewH: number,
  options: {
    baseY: number; // e.g. viewH * 0.65
    minHeight: number; // peak height above baseY (positive)
    maxHeight: number;
    peaksCount: number; // 6 - 12
    margin?: number;
    jaggedness?: number; // 0 (smooth) to 1 (jagged)
  }
): { path: string; peaks: Point2D[]; points: Point2D[] } {
  const margin = options.margin ?? 80;
  const totalW = viewW + margin * 2;
  const count = options.peaksCount;
  const stepX = totalW / count;

  const points: Point2D[] = [];
  const peaks: Point2D[] = [];

  points.push({ x: -margin, y: options.baseY + rngRange(rng, -15, 15) });

  for (let i = 0; i <= count; i++) {
    const isPeak = i % 2 === 1;
    const xBase = -margin + i * stepX;
    const xJitter = rngRange(rng, -stepX * 0.25, stepX * 0.25);
    const x = Math.max(-margin, Math.min(viewW + margin, xBase + xJitter));

    let y: number;
    if (isPeak) {
      const peakH = rngRange(rng, options.minHeight, options.maxHeight);
      y = options.baseY - peakH;
      peaks.push({ x, y });
    } else {
      // Valley / saddle
      const saddleH = rngRange(rng, options.minHeight * 0.2, options.minHeight * 0.55);
      y = options.baseY - saddleH;
    }

    // Add optional micro-ridges for jaggedness
    if (options.jaggedness && options.jaggedness > 0.3 && i > 0) {
      const prev = points[points.length - 1];
      const midX = (prev.x + x) / 2 + rngRange(rng, -10, 10);
      const midY = (prev.y + y) / 2 + rngRange(rng, -18 * options.jaggedness, 18 * options.jaggedness);
      points.push({ x: midX, y: midY });
    }

    points.push({ x, y });
  }

  // Build SVG path: line segments for crisp rocky mountains
  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`;
  }
  path += ` L${viewW + margin},${viewH} L${-margin},${viewH} Z`;

  return { path, peaks, points };
}

/**
 * Procedural Rolling Hills / Dunes Generator
 * Produces soft, undulating curves with varied crests and dips.
 */
export function generateProceduralHills(
  rng: () => number,
  viewW: number,
  viewH: number,
  options: {
    baseY: number;
    amplitude: number;
    frequency: number; // typically 3 - 6 control nodes
    margin?: number;
  }
): string {
  const margin = options.margin ?? 100;
  const nodesCount = options.frequency;
  const stepX = (viewW + margin * 2) / nodesCount;

  const points: Point2D[] = [];
  points.push({ x: -margin, y: options.baseY });

  for (let i = 1; i <= nodesCount; i++) {
    const x = -margin + i * stepX + rngRange(rng, -stepX * 0.2, stepX * 0.2);
    const y = options.baseY + rngRange(rng, -options.amplitude, options.amplitude);
    points.push({ x, y });
  }

  return pointsToSmoothPath(points, true, viewW, viewH);
}

/**
 * Procedural Sand Dune with Sharp Knife-Edge Crest
 * Generates wind-sculpted desert dunes with distinct windward and slip face curves.
 */
export function generateProceduralDune(
  rng: () => number,
  viewW: number,
  viewH: number,
  baseY: number,
  crestHeight: number
): { path: string; crestPoints: Point2D[] } {
  const crestPoints: Point2D[] = [];
  const segments = 5;
  const stepX = (viewW + 200) / segments;

  for (let i = 0; i <= segments; i++) {
    const x = -100 + i * stepX + rngRange(rng, -stepX * 0.15, stepX * 0.15);
    // Crest waves up and down
    const y = baseY - (i % 2 === 1 ? crestHeight * rngRange(rng, 0.75, 1.25) : crestHeight * rngRange(rng, 0.2, 0.5));
    crestPoints.push({ x, y });
  }

  const path = pointsToSmoothPath(crestPoints, true, viewW, viewH);
  return { path, crestPoints };
}

/**
 * Procedural Skyscraper Data Structure
 */
export interface Skyscraper {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  spireHeight: number;
  antennaX: number;
  antennaY: number;
  windowRows: number;
  windowCols: number;
  litWindows: boolean[][];
  hasSign: boolean;
  signText?: string;
  signColor?: string;
  hasBeacon: boolean;
  beaconColor?: string;
  setbackW?: number;
  setbackH?: number;
}

/**
 * Procedural Skyline Generator
 * Produces multi-layered urban building silhouettes with randomized architectural profiles,
 * antenna spires, glowing window matrixes, and neon signage.
 */
export function generateProceduralSkyline(
  rng: () => number,
  viewW: number,
  viewH: number,
  options: {
    baseY: number;
    minH: number;
    maxH: number;
    minW?: number;
    maxW?: number;
    gap?: number;
    signProbability?: number;
  }
): Skyscraper[] {
  const minW = options.minW ?? 70;
  const maxW = options.maxW ?? 140;
  const gap = options.gap ?? 8;
  const signProb = options.signProbability ?? 0.35;
  const signTexts = ["01", "KEI", "RAD", "NEO", "77", "◈", "//", "CYBER", "SYS"];
  const signColors = ["#00f0ff", "#ff007f", "#39ff14", "#ffe600", "#c084fc"];

  const buildings: Skyscraper[] = [];
  let curX = -40;
  let id = 0;

  while (curX < viewW + 50) {
    const w = rngRange(rng, minW, maxW);
    const h = rngRange(rng, options.minH, options.maxH);
    const y = options.baseY - h;

    const hasSpire = rng() > 0.45;
    const spireHeight = hasSpire ? rngRange(rng, 25, 70) : 0;
    const antennaX = curX + w * (hasSpire ? rngRange(rng, 0.3, 0.7) : 0.5);
    const antennaY = y - spireHeight;

    const windowRows = rngInt(rng, 5, 12);
    const windowCols = rngInt(rng, 3, 6);
    const litWindows: boolean[][] = [];
    for (let r = 0; r < windowRows; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < windowCols; c++) {
        row.push(rng() > 0.4);
      }
      litWindows.push(row);
    }

    const hasSign = rng() < signProb;
    const hasBeacon = hasSpire || rng() > 0.5;

    const hasSetback = rng() > 0.5;
    const setbackW = hasSetback ? w * rngRange(rng, 0.6, 0.85) : undefined;
    const setbackH = hasSetback ? h * rngRange(rng, 0.15, 0.3) : undefined;

    buildings.push({
      id: id++,
      x: curX,
      y,
      w,
      h,
      spireHeight,
      antennaX,
      antennaY,
      windowRows,
      windowCols,
      litWindows,
      hasSign,
      signText: hasSign ? rngChoice(rng, signTexts) : undefined,
      signColor: hasSign ? rngChoice(rng, signColors) : undefined,
      hasBeacon,
      beaconColor: rng() > 0.3 ? "#ef4444" : "#ffffff",
      setbackW,
      setbackH,
    });

    curX += w + gap + rngRange(rng, 0, 10);
  }

  return buildings;
}

/**
 * Atmospheric Mote / Particle
 */
export interface AtmosphericMote {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
}

/**
 * Procedural Atmospheric Motes Generator
 * Produces organic floating motes (pollen, spores, embers, dust, snowflakes, cosmic sparks).
 */
export function generateAtmosphericMotes(
  rng: () => number,
  count: number,
  viewW: number,
  viewH: number,
  options: {
    colorChoices: string[];
    minSize?: number;
    maxSize?: number;
    driftXRange?: [number, number];
    driftYRange?: [number, number];
    durationRange?: [number, number];
    baseYRange?: [number, number];
  }
): AtmosphericMote[] {
  const minSize = options.minSize ?? 1.5;
  const maxSize = options.maxSize ?? 3.5;
  const driftXRange = options.driftXRange ?? [-12, 12];
  const driftYRange = options.driftYRange ?? [-24, -8];
  const durationRange = options.durationRange ?? [4, 8];
  const yMin = options.baseYRange ? options.baseYRange[0] : 0;
  const yMax = options.baseYRange ? options.baseYRange[1] : viewH;

  const motes: AtmosphericMote[] = [];
  for (let i = 0; i < count; i++) {
    motes.push({
      id: i,
      x: rngRange(rng, 0, viewW),
      y: rngRange(rng, yMin, yMax),
      size: rngRange(rng, minSize, maxSize),
      color: rngChoice(rng, options.colorChoices),
      duration: rngRange(rng, durationRange[0], durationRange[1]),
      delay: rngRange(rng, 0, 5),
      driftX: rngRange(rng, driftXRange[0], driftXRange[1]),
      driftY: rngRange(rng, driftYRange[0], driftYRange[1]),
      opacity: rngRange(rng, 0.4, 0.9),
    });
  }
  return motes;
}

/**
 * Rain Streak Data Structure
 */
export interface RainStreak {
  id: number;
  x: number;
  y: number;
  len: number;
  speed: number;
  opacity: number;
  color: string;
}

/**
 * Procedural Rain Streaks Generator
 */
export function generateRainStreaks(
  rng: () => number,
  count: number,
  viewW: number,
  viewH: number,
  options?: {
    minLen?: number;
    maxLen?: number;
    speedRange?: [number, number];
    colorChoices?: string[];
  }
): RainStreak[] {
  const minLen = options?.minLen ?? 18;
  const maxLen = options?.maxLen ?? 42;
  const speedRange = options?.speedRange ?? [1.2, 2.4];
  const colors = options?.colorChoices ?? ["#00f0ff", "#38bdf8", "#e0f2fe", "#a5f3fc"];

  const streaks: RainStreak[] = [];
  for (let i = 0; i < count; i++) {
    streaks.push({
      id: i,
      x: rngRange(rng, -20, viewW + 20),
      y: rngRange(rng, -50, viewH + 50),
      len: rngRange(rng, minLen, maxLen),
      speed: rngRange(rng, speedRange[0], speedRange[1]),
      opacity: rngRange(rng, 0.25, 0.75),
      color: rngChoice(rng, colors),
    });
  }
  return streaks;
}

