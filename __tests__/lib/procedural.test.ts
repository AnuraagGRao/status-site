import { describe, it, expect } from "vitest";
import {
  makePRNG,
  rngRange,
  rngInt,
  rngChoice,
  generateProceduralRidge,
  generateProceduralHills,
  generateProceduralDune,
} from "@/lib/procedural";

describe("Procedural Utilities", () => {
  describe("makePRNG", () => {
    it("produces deterministic numbers for the same seed", () => {
      const rng1 = makePRNG(42);
      const rng2 = makePRNG(42);

      const seq1 = [rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it("produces different numbers for different seeds", () => {
      const rng1 = makePRNG(42);
      const rng2 = makePRNG(999);

      expect(rng1()).not.toEqual(rng2());
    });

    it("generates numbers in [0, 1) range", () => {
      const rng = makePRNG(12345);
      for (let i = 0; i < 50; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe("Range helpers", () => {
    it("rngRange produces numbers within min and max", () => {
      const rng = makePRNG(777);
      for (let i = 0; i < 20; i++) {
        const val = rngRange(rng, 10, 25);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThanOrEqual(25);
      }
    });

    it("rngInt produces integers within min and max", () => {
      const rng = makePRNG(888);
      for (let i = 0; i < 20; i++) {
        const val = rngInt(rng, 5, 12);
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThanOrEqual(12);
      }
    });

    it("rngChoice picks elements from array", () => {
      const rng = makePRNG(999);
      const items = ["a", "b", "c", "d"];
      const picked = rngChoice(rng, items);
      expect(items).toContain(picked);
    });
  });

  describe("Geometry Generators", () => {
    const viewW = 1440;
    const viewH = 900;

    it("generateProceduralRidge produces valid SVG path and peak coordinates", () => {
      const rng = makePRNG(101);
      const ridge = generateProceduralRidge(rng, viewW, viewH, {
        baseY: 600,
        minHeight: 100,
        maxHeight: 200,
        peaksCount: 8,
      });

      expect(ridge.path).toMatch(/^M/);
      expect(ridge.path).toContain("Z");
      expect(ridge.peaks.length).toBeGreaterThan(0);
      ridge.peaks.forEach((p) => {
        expect(p.y).toBeLessThan(600); // Peaks are higher than baseline
      });
    });

    it("generateProceduralHills produces smooth closed SVG path", () => {
      const rng = makePRNG(202);
      const hills = generateProceduralHills(rng, viewW, viewH, {
        baseY: 700,
        amplitude: 30,
        frequency: 5,
      });

      expect(hills).toMatch(/^M/);
      expect(hills).toContain("C"); // Bezier curves
      expect(hills).toContain("Z");
    });

    it("generateProceduralDune produces knife-edge crest and path", () => {
      const rng = makePRNG(303);
      const dune = generateProceduralDune(rng, viewW, viewH, 700, 50);

      expect(dune.path).toMatch(/^M/);
      expect(dune.crestPoints.length).toBeGreaterThan(2);
    });
  });
});
