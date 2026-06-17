"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Shuffle, Download, ChevronDown, ChevronUp, Sun, Sunset, Moon, Sunrise } from "lucide-react";
import { type TimeOfDay } from "@/lib/timeUtils";
import { getSecondaryTextColorForPalette } from "@/lib/colorUtils";
import { PresetButton } from "@/components/PresetButton";
import { getAllThemes, type ThemeName } from "@/lib/themes";
import { PaletteConfig } from "@/lib/themes/themeTypes";
import { COLOR_PALETTE } from "@/lib/colorPalette";

interface ControlsProps {
  /** Visual time override for backgrounds (independent of displayed time) */
  visualTimeOverride: TimeOfDay | null;
  onVisualTimeChange: (tod: TimeOfDay | null) => void;
  onSaveScenery: () => void;
  onSaveLoading?: boolean;
  onSaveError?: string | null;
  onRandomizeScenery: () => void;
  onRandomizeAll?: () => void;
  darkModeEnabled: boolean;
  onToggleDarkMode: () => void;
  currentTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
  palette?: PaletteConfig;
}

export default function Controls({
  visualTimeOverride,
  onVisualTimeChange,
  onSaveScenery,
  onSaveLoading = false,
  onSaveError,
  onRandomizeScenery,
  onRandomizeAll,
  darkModeEnabled,
  onToggleDarkMode,
  currentTheme = "lush_lake",
  onThemeChange,
  palette,
}: ControlsProps) {
  const [open, setOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themes = getAllThemes();

  // Determine which preset is active (based on visual override, not actual time)
  const currentPreset: "live" | TimeOfDay = visualTimeOverride ?? "live";

  // Compute text colors based on palette
  const secondaryText = palette ? getSecondaryTextColorForPalette(palette.sky) : "#e0e0e0";

  const setPreset = (p: "live" | TimeOfDay) => {
    if (p === "live") {
      onVisualTimeChange(null);
      return;
    }
    onVisualTimeChange(p);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md mx-auto"
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
        }}
      >
        {/* ── Toggle header ──────────────────────────────────────── */}
        <button
          className="flex w-full items-center justify-between px-6 py-3.5 transition-colors duration-200 cursor-pointer"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle scene controls"
          style={{
            color: `${secondaryText}b3`,
            textShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span className="text-xs font-medium tracking-widest uppercase">Scene Controls</span>
          </div>
          <span>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {/* ── Expandable body ────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="controls-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5 flex flex-col gap-4">
                <div className="h-px bg-white/10" />

                {/* Preset time selector — responsive grid */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs tracking-widest uppercase" style={{ color: `${secondaryText}80` }}>Time Preset</span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <PresetButton
                      preset="live"
                      icon={<Clock size={14} />}
                      label="Live"
                      isActive={currentPreset === "live"}
                      onClick={() => setPreset("live")}
                      ariaLabel="Use live system time"
                    />
                    <PresetButton
                      preset="day"
                      icon={<Sun size={14} />}
                      label="Day"
                      isActive={currentPreset === "day"}
                      onClick={() => setPreset("day")}
                      ariaLabel="Set to daytime"
                    />
                    <PresetButton
                      preset="afternoon"
                      icon={<Sunrise size={14} />}
                      label="Afternoon"
                      isActive={currentPreset === "afternoon"}
                      onClick={() => setPreset("afternoon")}
                      ariaLabel="Set to afternoon"
                    />
                    <PresetButton
                      preset="evening"
                      icon={<Sunset size={14} />}
                      label="Evening"
                      isActive={currentPreset === "evening"}
                      onClick={() => setPreset("evening")}
                      ariaLabel="Set to evening"
                    />
                    <PresetButton
                      preset="night"
                      icon={<Moon size={14} />}
                      label="Night"
                      isActive={currentPreset === "night"}
                      onClick={() => setPreset("night")}
                      ariaLabel="Set to night"
                    />
                  </div>
                </div>

                {/* Dark Mode toggle */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs tracking-widest uppercase" style={{ color: `${secondaryText}80` }}>Dark Mode</span>
                  <button
                    onClick={onToggleDarkMode}
                    className={`min-w-[96px] flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 sm:py-2 text-xs font-medium border transition-all duration-200 cursor-pointer min-h-12 sm:min-h-10 ${
                      darkModeEnabled
                        ? "text-white bg-white/20 border-white/30"
                        : "text-white/70 bg-white/10 hover:bg-white/14 border-white/15 hover:text-white"
                    }`}
                    aria-pressed={darkModeEnabled}
                    aria-label="Toggle dark mode"
                  >
                    {darkModeEnabled ? "On" : "Off"}
                  </button>
                </div>

                {/* Theme selector */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-widest uppercase" style={{ color: `${secondaryText}80` }}>Scene Theme</span>
                    <button
                      onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                      className="transition-colors"
                      style={{ color: `${secondaryText}b3` }}
                      aria-label="Toggle theme menu"
                      aria-expanded={themeMenuOpen}
                    >
                      {themeMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {themeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1.5"
                      >
                        {themes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              onThemeChange?.(t.id);
                              setThemeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${
                              currentTheme === t.id
                                ? "bg-white/25 text-white border border-white/30"
                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                            }`}
                            aria-current={currentTheme === t.id ? "true" : "false"}
                          >
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-white/50 truncate">{t.description}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={onRandomizeScenery}
                    disabled={onSaveLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 sm:py-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/16 border border-white/15 text-xs font-medium tracking-wide transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-12 sm:min-h-10"
                    aria-label="Randomize scenery only"
                  >
                    <Shuffle size={14} />
                    <span className="hidden sm:inline">Randomize Scenery</span>
                    <span className="sm:hidden">Randomize</span>
                  </button>
{onRandomizeAll && (
                    <button
                      onClick={onRandomizeAll}
                      disabled={onSaveLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 sm:py-2.5 text-xs font-medium tracking-wide transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-12 sm:min-h-10"
                      style={{
                        background: `linear-gradient(135deg, ${COLOR_PALETTE.neon.purple}25, ${COLOR_PALETTE.neon.magenta}25)`,
                        border: `2px solid ${COLOR_PALETTE.neon.magenta}60`,
                        color: COLOR_PALETTE.neon.magenta,
                      }}
                      aria-label="Randomize everything including theme"
                    >
                      <Shuffle size={14} />
                      <span className="hidden sm:inline">Randomize All</span>
                      <span className="sm:hidden">All</span>
                    </button>
                  )}

                  
                  <button
                    onClick={onSaveScenery}
                    disabled={onSaveLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 sm:py-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/16 border border-white/15 text-xs font-medium tracking-wide transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-12 sm:min-h-10"
                    aria-label="Save scenery as image"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">{onSaveLoading ? "Saving..." : "Save Scenery"}</span>
                    <span className="sm:hidden">{onSaveLoading ? "Saving..." : "Save"}</span>
                  </button>
                </div>

                {/* Save error feedback */}
                {onSaveError && (
                  <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-xs text-red-200">
                    {onSaveError}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
