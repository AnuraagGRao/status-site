/**
 * Time utility functions for status and scene logic.
 * All logic is based on local system time.
 */

export type StatusType = "working" | "away";
export type TimeOfDay = "day" | "afternoon" | "evening" | "night";

/** Returns total minutes since midnight for a given Date. */
export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Determines working status.
 * "Working" = Mon–Fri, 17:30–01:30 (crosses midnight).
 * The 01:30 AM end falls on the NEXT calendar day.
 *
 * Shift start days: 1 (Mon) – 5 (Fri)
 * The overnight tail lands on days: 2 (Tue) – 6 (Sat)
 */
export function getStatus(date: Date): StatusType {
  const day = date.getDay(); // 0=Sun … 6=Sat
  const mins = minutesSinceMidnight(date);

  const shiftStart = 17 * 60 + 30; // 17:30
  const shiftEnd = 1 * 60 + 30; // 01:30

  // Evening part of shift: Mon(1)–Fri(5) on or after 17:30
  const isEveningShift = day >= 1 && day <= 5 && mins >= shiftStart;

  // Overnight tail: Tue(2)–Sat(6) before 01:30
  const isOvernightTail = day >= 2 && day <= 6 && mins <= shiftEnd;

  return isEveningShift || isOvernightTail ? "working" : "away";
}

/**
 * Maps current hour to a time-of-day scene.
 * day        06:00–11:59
 * afternoon  12:00–16:59
 * evening    17:00–19:59
 * night      20:00–05:59
 */
export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "day";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

/** Returns a random hour 0-23 as a Date set to that hour on today. */
export function randomTime(): Date {
  const d = new Date();
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

/** Returns a display string like "11:42:07 PM" using system locale. */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Returns a display string like "Monday, June 16" */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
