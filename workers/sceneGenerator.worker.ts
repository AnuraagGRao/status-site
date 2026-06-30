/**
 * Web Worker for heavy procedural generation
 * Offloads PRNG calculations and coordinate generation from main thread
 * Improves performance for complex themes with many animated elements
 */

// ── PRNG (Linear Congruential Generator) ──
function makePRNG(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed / 2147483648) % 1;
  };
}

// ── Type Definitions ──

export interface Star {
  id: number;
  cx: string;
  cy: string;
  r: number;
  duration: number;
  delay: number;
}

export interface Cloud {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  opacity: number;
  duration: number;
}

export interface Bird {
  id: number;
  startX: string;
  startY: string;
  endX: string;
  endY: string;
  duration: number;
  delay: number;
  size: number;
}

export interface Rock {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
}

export interface Bush {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
}

export interface Nebula {
  id: number;
  cx: string;
  cy: string;
  r: number;
  color: string;
  duration: number;
  delay: number;
}

export interface Seashell {
  id: number;
  x: string;
  y: string;
  size: number;
  rotation: number;
  color: string;
  duration: number;
  delay: number;
}

export interface DesertPlant {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
}

export interface NeonBox {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
}

// ── Generator Functions ──

function generateStars(seed: number, count: number = 60): Star[] {
  const rng = makePRNG(seed);
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
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

function generateClouds(seed: number, count: number = 8): Cloud[] {
  const rng = makePRNG(seed);
  const clouds: Cloud[] = [];

  for (let i = 0; i < count; i++) {
    clouds.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 30 + 5}%`,
      width: rng() * 120 + 80,
      height: rng() * 40 + 30,
      opacity: rng() * 0.4 + 0.3,
      duration: rng() * 40 + 60,
    });
  }

  return clouds;
}

function generateBirds(seed: number, count: number = 6): Bird[] {
  const rng = makePRNG(seed);
  const birds: Bird[] = [];

  for (let i = 0; i < count; i++) {
    const startX = rng() * 100;
    const startY = rng() * 30 + 10;
    birds.push({
      id: i,
      startX: `${startX}%`,
      startY: `${startY}%`,
      endX: `${(startX + rng() * 40 - 20)}%`,
      endY: `${(startY + rng() * 10 - 5)}%`,
      duration: rng() * 15 + 20,
      delay: rng() * 10,
      size: rng() * 8 + 12,
    });
  }

  return birds;
}

function generateRocks(seed: number, count: number = 12, colors: string[]): Rock[] {
  const rng = makePRNG(seed);
  const rocks: Rock[] = [];

  for (let i = 0; i < count; i++) {
    rocks.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 25 + 65}%`,
      width: rng() * 30 + 20,
      height: rng() * 25 + 15,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 1.5 + 3.5,
      delay: rng() * 2,
    });
  }

  return rocks;
}

function generateBushes(seed: number, count: number = 10, colors: string[]): Bush[] {
  const rng = makePRNG(seed);
  const bushes: Bush[] = [];

  for (let i = 0; i < count; i++) {
    bushes.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 20 + 70}%`,
      width: rng() * 40 + 30,
      height: rng() * 30 + 20,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 0.5 + 3,
      delay: rng() * 2,
    });
  }

  return bushes;
}

function generateNebulae(seed: number, count: number = 7, colors: string[]): Nebula[] {
  const rng = makePRNG(seed);
  const nebulae: Nebula[] = [];

  for (let i = 0; i < count; i++) {
    nebulae.push({
      id: i,
      cx: `${rng() * 100}%`,
      cy: `${rng() * 100}%`,
      r: rng() * 150 + 100,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 4 + 6,
      delay: rng() * 3,
    });
  }

  return nebulae;
}

function generateSeashells(seed: number, count: number = 15, colors: string[]): Seashell[] {
  const rng = makePRNG(seed);
  const seashells: Seashell[] = [];

  for (let i = 0; i < count; i++) {
    seashells.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 15 + 75}%`,
      size: rng() * 10 + 8,
      rotation: rng() * 360,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 1.5 + 2.5,
      delay: rng() * 2,
    });
  }

  return seashells;
}

function generateDesertPlants(seed: number, count: number = 12, colors: string[]): DesertPlant[] {
  const rng = makePRNG(seed);
  const plants: DesertPlant[] = [];

  for (let i = 0; i < count; i++) {
    plants.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 20 + 70}%`,
      width: rng() * 15 + 10,
      height: rng() * 25 + 15,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 1 + 2.5,
      delay: rng() * 2,
    });
  }

  return plants;
}

function generateNeonBoxes(seed: number, count: number = 20, colors: string[]): NeonBox[] {
  const rng = makePRNG(seed);
  const boxes: NeonBox[] = [];

  for (let i = 0; i < count; i++) {
    boxes.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 100}%`,
      width: rng() * 50 + 30,
      height: rng() * 50 + 30,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 2 + 2,
      delay: rng() * 3,
    });
  }

  return boxes;
}

// ── Message Handler ──

export interface GenerateRequest {
  type: "generate";
  elementType: "stars" | "clouds" | "birds" | "rocks" | "bushes" | "nebulae" | "seashells" | "desert_plants" | "neon_boxes";
  seed: number;
  count?: number;
  colors?: string[];
}

export interface GenerateResponse {
  type: "generated";
  elementType: string;
  data: Star[] | Cloud[] | Bird[] | Rock[] | Bush[] | Nebula[] | Seashell[] | DesertPlant[] | NeonBox[];
}

self.onmessage = (e: MessageEvent<GenerateRequest>) => {
  const { type, elementType, seed, count, colors = [] } = e.data;

  if (type !== "generate") return;

  let data: Star[] | Cloud[] | Bird[] | Rock[] | Bush[] | Nebula[] | Seashell[] | DesertPlant[] | NeonBox[];

  switch (elementType) {
    case "stars":
      data = generateStars(seed, count);
      break;
    case "clouds":
      data = generateClouds(seed, count);
      break;
    case "birds":
      data = generateBirds(seed, count);
      break;
    case "rocks":
      data = generateRocks(seed, count || 12, colors);
      break;
    case "bushes":
      data = generateBushes(seed, count || 10, colors);
      break;
    case "nebulae":
      data = generateNebulae(seed, count || 7, colors);
      break;
    case "seashells":
      data = generateSeashells(seed, count || 15, colors);
      break;
    case "desert_plants":
      data = generateDesertPlants(seed, count || 12, colors);
      break;
    case "neon_boxes":
      data = generateNeonBoxes(seed, count || 20, colors);
      break;
    default:
      return;
  }

  const response: GenerateResponse = {
    type: "generated",
    elementType,
    data,
  };

  self.postMessage(response);
};

export {};
