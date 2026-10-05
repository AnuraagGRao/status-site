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
    it("returns 'working' during evening shift on weekday", () => {
      const date = new Date("2024-01-01T20:00:00"); // Monday 8pm
      expect(getStatus(date)).toBe("working");
    });

    it("returns 'working' during overnight tail on Tuesday morning", () => {
      const date = new Date("2024-01-02T01:00:00"); // Tuesday 1am
      expect(getStatus(date)).toBe("working");
    });

    it("returns 'away' outside work hours (e.g. afternoon)", () => {
      const date = new Date("2024-01-01T14:00:00"); // Monday 2pm
      expect(getStatus(date)).toBe("away");
    });

    it("returns 'away' on weekend evening", () => {
      const date = new Date("2024-01-06T20:00:00"); // Saturday 8pm
      expect(getStatus(date)).toBe("away");
    });
  });

  describe("formatTime", () => {
    it("formats time with 12-hour AM/PM and leading zeros", () => {
      const date = new Date("2024-01-01T09:05:03");
      const formatted = formatTime(date);
      expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}\s+(AM|PM)$/);
      expect(formatted).toContain("09:05:03");
      expect(formatted).toContain("AM");
    });

    it("formats afternoon time with PM", () => {
      const date = new Date("2024-01-01T14:30:45");
      const formatted = formatTime(date);
      expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}\s+(AM|PM)$/);
      expect(formatted).toContain("02:30:45");
      expect(formatted).toContain("PM");
    });
  });

  describe("formatDate", () => {
    it("formats date with weekday, full month name and day", () => {
      const date = new Date("2024-01-15T14:00:00");
      const formatted = formatDate(date);
      expect(formatted).toBe("Monday, January 15");
    });

    it("formats date correctly for different months", () => {
      const date = new Date("2024-06-30T14:00:00");
      const formatted = formatDate(date);
      expect(formatted).toBe("Sunday, June 30");
    });
  });
});
