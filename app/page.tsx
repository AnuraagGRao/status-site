"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

import AnimatedBackground from "@/components/AnimatedBackground";
import StatusCard from "@/components/StatusCard";
import Controls from "@/components/Controls";
import Toast from "@/components/Toast";

import {
  getStatus,
  getTimeOfDay,
  formatTime,
  formatDate,
  type TimeOfDay,
} from "@/lib/timeUtils";
import { SCENE_WIDTH, SCENE_HEIGHT } from "@/lib/sceneConstants";
import { usePageVisibility } from "@/lib/hooks/usePageVisibility";
import { useSaveScenery } from "@/lib/hooks/useSaveScenery";
import { usePrefersDarkMode } from "@/lib/hooks/usePrefersDarkMode";
import { getThemeNames, type ThemeName } from "@/lib/themes";

export default function Home() {
  /* ── Time state ─────────────────────────────────────────────────── */
  const [now, setNow] = useState<Date>(() => new Date());
  const [overrideTime, setOverrideTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState(false);
  const bgRef = useRef<SVGSVGElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sceneVariant, setSceneVariant] = useState<number>(1);
  const [theme, setTheme] = useState<ThemeName>("lush_lake");

  // Dark mode: auto-detect from prefers-color-scheme, can be toggled
  const prefersDark = usePrefersDarkMode();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const effectiveDarkMode = mounted ? darkMode : prefersDark;

  // Page visibility: catch up clock when tab becomes visible
  usePageVisibility(
    useCallback(() => {
      setNow(new Date());
    }, [])
  );

  // Save scenery with error handling and loading state
  const { isLoading: saveLoading, error: saveError, save: handleSaveAction, reset: resetSaveState } = useSaveScenery(
    bgRef,
    "scenery",
    () => {
      setToast(true);
      setTimeout(() => setToast(false), 2800);
    },
    (error) => {
      console.error("Save failed:", error);
      // Error is shown in Controls via saveError prop
    }
  );

  // Avoid hydration mismatch by rendering stable placeholders on the server
  useEffect(() => {
    setMounted(true);
    // On first mount, apply user's color scheme preference
    setDarkMode(prefersDark);
  }, [prefersDark]);

  /* Live clock — only ticks when no override is active */
  useEffect(() => {
    if (overrideTime) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [overrideTime]);

  /* Effective time: manual override wins, otherwise live clock */
  const effectiveTime = overrideTime ?? now;
  // Stable fallback date (midday avoids TZ day-boundary shifts)
  const fallbackDate = new Date("2020-01-01T12:00:00");

  const status = mounted ? getStatus(effectiveTime) : ("away" as const);
  const tod: TimeOfDay = mounted ? getTimeOfDay(effectiveTime) : ("afternoon" as TimeOfDay);
  const timeStr = mounted ? formatTime(effectiveTime) : "--:--:--";
  const dateStr = mounted ? formatDate(effectiveTime) : formatDate(fallbackDate);

  // Deterministic variant seed: depends on date + time-of-day (stable across minutes)
  const variantSeed = mounted
    ? (() => {
        const d = effectiveTime;
        const start = new Date(d.getFullYear(), 0, 0);
        const diff = d.getTime() - start.getTime();
        const dayOfYear = Math.floor(diff / 86400000);
        const todIdx = tod === "day" ? 1 : tod === "afternoon" ? 2 : tod === "evening" ? 3 : 4;
        // Mix in a user-randomized scene variant so time/status remain unchanged
        return ((dayOfYear * 97 + todIdx * 7919) ^ (sceneVariant >>> 0)) >>> 0;
      })()
    : 1;

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center">
      {/* ── Animated background ──────────────────────────────────── */}
      <motion.div
        key={tod}
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
      >
        <AnimatedBackground
          tod={tod}
          bgRef={bgRef}
          variantSeed={variantSeed}
          darkMode={effectiveDarkMode}
          themeName={theme}
        />
      </motion.div>

      {/* ── Content layer ────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-lg px-4 flex flex-col items-center gap-4">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-2"
        >
          <h1
            className="text-white/90 font-semibold tracking-tight"
            style={{ fontSize: "clamp(1.1rem, 3vw, 1.4rem)" }}
          >
            Status
          </h1>
          <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">
            Activity Tracker
          </p>
        </motion.div>

        {/* Status card */}
        <StatusCard time={timeStr} date={dateStr} status={status} />

        {/* Scene controls */}
        <Controls
          overrideTime={overrideTime}
          onTimeChange={setOverrideTime}
          onSaveScenery={handleSaveAction}
          onSaveLoading={saveLoading}
          onSaveError={saveError}
          onRandomizeScenery={() => setSceneVariant((v) => (v * 1664525 + 1013904223) >>> 0)}
          darkModeEnabled={effectiveDarkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      </div>

      {/* ── Toast notification ───────────────────────────────────── */}
      <Toast visible={toast} message="Scenery saved!" />
    </main>
  );
}
