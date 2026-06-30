import { describe, it, expect } from "vitest";
import {
  getTimeOfDay,
  getStatus,
  formatTime,
  formatDate,
} from "@/lib/timeUtils";

describe("timeUtils", () => {
  describe("getTimeOfDay", () => {
    it("returns 'day' for morning hours (6am-11am)", () => {
      const date = new Date("2024-01-01T10:00:00");
      expect(getTimeOfDay(date)).toBe("day");
    });

    it("returns 'afternoon' for afternoon hours (12pm-4pm)", () => {
      const date = new Date("2024-01-01T14:00:00");
      expect(getTimeOfDay(date)).toBe("afternoon");
    });

    it("returns 'evening' for evening hours (5pm-7pm)", () => {
      const date = new Date("2024-01-01T18:00:00");
      expect(getTimeOfDay(date)).toBe("evening");
    });

    it("returns 'night' for night hours (8pm-5am)", () => {
      const date = new Date("2024-01-01T23:00:00");
      expect(getTimeOfDay(date)).toBe("night");
    });

    it("returns 'night' for early morning", () => {
      const date = new Date("2024-01-01T03:00:00");
      expect(getTimeOfDay(date)).toBe("night");
    });
  });

  describe("getStatus", () => {
    it("returns 'working' during work hours on weekday", () => {
      const date = new Date("2024-01-01T14:00:00"); // Monday 2pm
      expect(getStatus(date)).toBe("working");
    });

    it("returns 'away' outside work hours", () => {
      const date = new Date("2024-01-01T22:00:00"); // Monday 10pm
      expect(getStatus(date)).toBe("away");
    });

    it("returns 'away' early morning", () => {
      const date = new Date("2024-01-01T05:00:00"); // Monday 5am
      expect(getStatus(date)).toBe("away");
    });

    it("respects visual time override", () => {
      const date = new Date("2024-01-01T14:00:00"); // Working hours
      expect(getStatus(date, "night")).toBe("away");
    });
  });

  describe("formatTime", () => {
    it("formats time with leading zeros", () => {
      const date = new Date("2024-01-01T09:05:03");
      const formatted = formatTime(date);
      expect(formatted).toMatch(/^\d{1,2}:\d{2}:\d{2}$/);
      expect(formatted.split(":")[1]).toBe("05");
      expect(formatted.split(":")[2]).toBe("03");
    });

    it("formats time without leading zeros for hours", () => {
      const date = new Date("2024-01-01T14:30:45");
      const formatted = formatTime(date);
      expect(formatted).toMatch(/^\d{1,2}:\d{2}:\d{2}$/);
    });
  });

  describe("formatDate", () => {
    it("formats date with full month name", () => {
      const date = new Date("2024-01-15T14:00:00");
      const formatted = formatDate(date);
      expect(formatted).toMatch(/January\s+\d{1,2},\s+\d{4}/);
    });

    it("formats date correctly for different months", () => {
      const date = new Date("2024-06-30T14:00:00");
      const formatted = formatDate(date);
      expect(formatted).toMatch(/June\s+30,\s+2026/);
    });
  });
});
