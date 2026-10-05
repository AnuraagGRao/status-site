/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useLayoutEffect, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

import AnimatedBackground from "@/components/AnimatedBackground";
import StatusCard from "@/components/StatusCard";
import Controls from "@/components/Controls";
import Toast from "@/components/Toast";
import VisitorCounter from "@/components/VisitorCounter";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

import {
  getStatus,
  getTimeOfDay,
  formatTime,
  formatDate,
  type TimeOfDay,
} from "@/lib/timeUtils";
import { usePageVisibility } from "@/lib/hooks/usePageVisibility";
import { useSaveScenery } from "@/lib/hooks/useSaveScenery";
import { usePrefersDarkMode } from "@/lib/hooks/usePrefersDarkMode";
import { getTextColorForPalette, getSecondaryTextColorForPalette } from "@/lib/colorUtils";
import { type ThemeName, getThemeNames, THEME_REGISTRY } from "@/lib/themes";

export default function Home() {
  /* ── Time state ─────────────────────────────────────────────────── */
  const [now, setNow] = useState<Date>(() => new Date());
  const [visualTimeOverride, setVisualTimeOverride] = useState<TimeOfDay | null>(null);
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
  const { isLoading: saveLoading, error: saveError, save: handleSaveAction } = useSaveScenery(
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
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (mounted) {
      setDarkMode(prefersDark);
    }
  }, [prefersDark, mounted]);

  /* Live clock — always ticks to show current time */
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* Effective time: always use live system time (no overrides) */
  const effectiveTime = now;
  // Stable fallback date (midday avoids TZ day-boundary shifts)
  const fallbackDate = new Date("2020-01-01T12:00:00");

  const status = mounted ? getStatus(effectiveTime) : ("away" as const);
  const tod: TimeOfDay = mounted ? (visualTimeOverride ?? getTimeOfDay(effectiveTime)) : ("afternoon" as TimeOfDay);
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

  const PRESET_CYCLE: Array<TimeOfDay | null> = [null, "day", "afternoon", "evening", "night"];

  const handleNextPreset = useCallback(() => {
    setVisualTimeOverride((current) => {
      const idx = PRESET_CYCLE.indexOf(current);
      const nextIdx = (idx + 1) % PRESET_CYCLE.length;
      return PRESET_CYCLE[nextIdx];
    });
  }, []);

  const handlePrevPreset = useCallback(() => {
    setVisualTimeOverride((current) => {
      const idx = PRESET_CYCLE.indexOf(current);
      const prevIdx = (idx - 1 + PRESET_CYCLE.length) % PRESET_CYCLE.length;
      return PRESET_CYCLE[prevIdx];
    });
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex flex-col items-center justify-center py-12 px-4">
      {/* ── Animated background ──────────────────────────────────── */}
      <motion.div
        key={tod}
        className="fixed inset-0 z-0 pointer-events-none"
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
      <div className="relative z-10 w-full max-w-lg px-2 sm:px-4 flex flex-col items-center gap-4">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-1 flex flex-col items-center"
        >
          <span
            className="text-[0.7rem] font-bold tracking-[0.14em] uppercase mb-1"
            style={{
              fontFamily: "var(--font-mono)",
              color: mounted ? (THEME_REGISTRY[theme].palettes[tod]?.sky ? getSecondaryTextColorForPalette(THEME_REGISTRY[theme].palettes[tod].sky) : "#ffffff") + "90" : "#ffffff90",
              textShadow: `0 1px 4px rgba(0,0,0,0.15)`,
            }}
          >
            01 · Live Status
          </span>
          <h1
            className="tracking-tight"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 600,
              color: mounted ? (THEME_REGISTRY[theme].palettes[tod]?.sky ? getTextColorForPalette(THEME_REGISTRY[theme].palettes[tod].sky) : "#ffffff") : "#ffffff",
              textShadow: `0 2px 12px rgba(0,0,0,0.25)`,
            }}
          >
            Status
          </h1>
          <p
            className="text-[0.72rem] tracking-[0.12em] uppercase mt-0.5 opacity-75"
            style={{
              fontFamily: "var(--font-mono)",
              color: mounted ? (THEME_REGISTRY[theme].palettes[tod]?.sky ? getSecondaryTextColorForPalette(THEME_REGISTRY[theme].palettes[tod].sky) : "#ffffff") : "#ffffff",
            }}
          >
            Activity Tracker
          </p>
        </motion.div>

        {/* Status card */}
        <StatusCard time={timeStr} date={dateStr} status={status} palette={mounted ? THEME_REGISTRY[theme].palettes[tod] : undefined} />

        {/* Scene controls */}
        <Controls
          visualTimeOverride={visualTimeOverride}
          onVisualTimeChange={setVisualTimeOverride}
          onSaveScenery={handleSaveAction}
          onSaveLoading={saveLoading}
          onSaveError={saveError}
          onRandomizeScenery={() => setSceneVariant((v) => (v * 1664525 + 1013904223) >>> 0)}
          onRandomizeAll={() => {
            setSceneVariant((v) => (v * 1664525 + 1013904223) >>> 0);
            const themeNames = getThemeNames();
            const randomThemeIdx = Math.floor(Math.random() * themeNames.length);
            setTheme(themeNames[randomThemeIdx]);
          }}
          darkModeEnabled={effectiveDarkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
          currentTheme={theme}
          onThemeChange={setTheme}
          palette={mounted ? THEME_REGISTRY[theme].palettes[tod] : undefined}
        />

        {/* Back to portfolio link */}
        <motion.a
          href="https://anuraaggrao.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-3 text-[0.75rem] font-medium uppercase tracking-wider text-white/70 hover:text-white transition-all px-4 py-2 rounded-full border border-white/10 hover:border-white/25 bg-black/30 hover:bg-black/50 backdrop-blur-md shadow-sm flex items-center gap-1.5 cursor-pointer"
          style={{ fontFamily: "var(--font-mono)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
          <span>Back to Portfolio</span>
        </motion.a>
      </div>

      {/* ── Toast notification ───────────────────────────────────── */}
      <Toast visible={toast} message="Scenery saved!" />

      {/* ── Visitor Counter ──────────────────────────────────────── */}
      <VisitorCounter />

      {/* ── Keyboard Shortcuts ───────────────────────────────────── */}
      <KeyboardShortcuts
        onSaveScenery={handleSaveAction}
        onToggleDarkMode={() => setDarkMode((v) => !v)}
        onRandomizeScenery={() => setSceneVariant((v) => (v * 1664525 + 1013904223) >>> 0)}
        onNextTimePreset={handleNextPreset}
        onPrevTimePreset={handlePrevPreset}
      />
    </main>
  );
}
