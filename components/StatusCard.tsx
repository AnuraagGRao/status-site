"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Moon, Clock } from "lucide-react";
import { StatusType } from "@/lib/timeUtils";
import { getTextColorForPalette, getSecondaryTextColorForPalette } from "@/lib/colorUtils";
import { PaletteConfig } from "@/lib/themes/themeTypes";
import { COLOR_PALETTE } from "@/lib/colorPalette";

interface StatusCardProps {
  time: string;
  date: string;
  status: StatusType;
  palette?: PaletteConfig;
}

const WORKING_ITEMS = [
  "Debugging",
  "Diving into new repos",
  "Deploying code"
];

const AWAY_ITEMS = [
  "Grinding Valorant",
  "Playing single player games",
  "Just taking a break from the screen",
  "Sleeping lol"
];

function StatusCardComponent({ time, date, status, palette }: StatusCardProps) {
  const isWorking = status === "working";
  const items = isWorking ? WORKING_ITEMS : AWAY_ITEMS;
  
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const isAlternateDirection = currentItemIndex % 2 === 1;

  // Compute colors based on palette
  const { mainText, secondaryText } = useMemo(() => {
    if (!palette) {
      return {
        mainText: "#ffffff",
        secondaryText: "#e0e0e0",
      };
    }
    return {
      mainText: getTextColorForPalette(palette.sky),
      secondaryText: getSecondaryTextColorForPalette(palette.sky),
    };
  }, [palette]);

  useEffect(() => {
    // Cycle through items every 3 seconds
    const interval = setInterval(() => {
      setCurrentItemIndex((prev) => (prev + 1) % items.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md mx-auto"
    >
      {/* Glassmorphic card */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow:
            "0 8px 48px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        {/* Top accent bar */}
        <motion.div
          className="h-1.5 w-full"
          animate={{
            background: isWorking
              ? `linear-gradient(90deg, ${COLOR_PALETTE.neon.purple}, ${COLOR_PALETTE.neon.magenta})`
              : `linear-gradient(90deg, ${COLOR_PALETTE.neon.cyan}, ${COLOR_PALETTE.neon.cyan})`,
          }}
          transition={{ duration: 1 }}
        />

        <div className="px-8 py-8 flex flex-col gap-6">
          {/* ── Clock section ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap justify-center">
              <Clock size={13} style={{ color: `${secondaryText}90` }} />
              <span
                className="text-[0.7rem] font-medium tracking-[0.14em] uppercase"
                style={{ fontFamily: "var(--font-mono)", color: `${secondaryText}90` }}
              >
                Local Time
              </span>
              <span
                className="text-[0.62rem] font-mono uppercase px-2 py-0.5 rounded-full border border-white/10 bg-white/5 tracking-wider"
                style={{ color: `${secondaryText}99` }}
              >
                IST · UTC+5:30
              </span>
            </div>
            <span
              className="font-medium tracking-tight leading-none select-none"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(2.4rem, 5.5vw, 3.4rem)",
                fontFeatureSettings: '"tnum"',
                color: mainText,
                textShadow: `0 2px 10px rgba(0,0,0,0.25)`,
              }}
              suppressHydrationWarning
            >
              {time}
            </span>
            <span
              className="text-[0.8rem] font-normal tracking-wider uppercase mt-1"
              style={{
                fontFamily: "var(--font-mono)",
                color: `${secondaryText}cc`,
                textShadow: `0 1px 4px rgba(0,0,0,0.1)`,
              }}
              suppressHydrationWarning
            >
              {date}
            </span>
          </motion.div>

          {/* ── Divider ───────────────────────────────── */}
          <div className="h-px bg-white/15" />

          {/* ── Status section ────────────────────────── */}
          <div className="flex flex-col items-center gap-4">
            {/* Status label */}
            <motion.div
              animate={{
                background: isWorking
                  ? "rgba(102,126,234,0.2)"
                  : "rgba(79,172,254,0.2)",
              }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <AnimatePresence mode="wait">
                {isWorking ? (
                  <motion.span
                    key="work-icon"
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 15 }}
                    transition={{ duration: 0.35, ease: "backOut" }}
                  >
                    <Briefcase size={15} className="text-violet-300" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="away-icon"
                    initial={{ scale: 0, rotate: 15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -15 }}
                    transition={{ duration: 0.35, ease: "backOut" }}
                  >
                    <Moon size={15} className="text-cyan-300" />
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.span
                  key={status}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-mono)", color: mainText }}
                >
                  {isWorking ? "Working" : "Away"}
                </motion.span>
              </AnimatePresence>

              {/* Live pulsing dot */}
              {isWorking ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400/80" />
              )}
            </motion.div>

            {/* Status description with smooth luxury transition */}
            <div className="min-h-[1.5rem] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${status}-${currentItemIndex}`}
                  initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="text-sm text-center leading-relaxed font-light max-w-xs origin-center"
                  style={{ color: `${secondaryText}d9` }}
                  role="status"
                  aria-live="polite"
                  aria-label={`Currently ${isWorking ? 'working on' : 'doing'}: ${items[currentItemIndex]}`}
                >
                  {items[currentItemIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders when parent updates
const StatusCard = memo(StatusCardComponent);
export default StatusCard;
