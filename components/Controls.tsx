"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shuffle, Download, ChevronDown, ChevronUp, Sun, Sunset, Moon, Sunrise, RotateCcw } from "lucide-react";
import { type TimeOfDay } from "@/lib/timeUtils";
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
  variantSeed?: number;
}

function ControlsComponent({
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
  variantSeed,
}: ControlsProps) {
  const [open, setOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themes = getAllThemes();

  // Determine which lighting preset is active (visual override only, clock remains untouched)
  const currentPreset: "live" | TimeOfDay = visualTimeOverride ?? "live";

  const setPreset = (p: "live" | TimeOfDay) => {
    if (p === "live") {
      onVisualTimeChange(null);
      return;
    }
    onVisualTimeChange(p);
  };

  const seedHex = variantSeed !== undefined ? variantSeed.toString(16).toUpperCase().padStart(6, "0").slice(-6) : undefined;

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
          background: "rgba(15, 16, 18, 0.88)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow:
            "0 20px 50px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* ── Toggle header ──────────────────────────────────────── */}
        <button
          className="flex w-full items-center justify-between px-6 py-3.5 transition-colors duration-200 cursor-pointer group hover:bg-white/5"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle scene controls"
          style={{
            color: "#ECEDEE",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-white group-hover:text-amber-300 transition-colors" />
            <span className="text-xs font-semibold tracking-widest uppercase text-[#ECEDEE]">
              Scene Controls
            </span>
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#889096] group-hover:text-white transition-colors flex items-center gap-1.5">
            <span>{open ? "Close" : "Customize"}</span>
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

                {/* 1. Scene Lighting Selector (Strictly visual — local clock is decoupled) */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#889096]">
                      Scene Lighting
                    </span>
                    <span className="text-[0.68rem] font-mono text-white/55 tracking-normal">
                      Visual only · Clock stays live
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <PresetButton
                      preset="live"
                      icon={<RotateCcw size={13} />}
                      label="Live"
                      isActive={currentPreset === "live"}
                      onClick={() => setPreset("live")}
                      ariaLabel="Sync scenery lighting with live real-time hour"
                    />
                    <PresetButton
                      preset="day"
                      icon={<Sun size={13} />}
                      label="Day"
                      isActive={currentPreset === "day"}
                      onClick={() => setPreset("day")}
                      ariaLabel="Visual day lighting preset"
                    />
                    <PresetButton
                      preset="afternoon"
                      icon={<Sunrise size={13} />}
                      label="Afternoon"
                      isActive={currentPreset === "afternoon"}
                      onClick={() => setPreset("afternoon")}
                      ariaLabel="Visual afternoon lighting preset"
                    />
                    <PresetButton
                      preset="evening"
                      icon={<Sunset size={13} />}
                      label="Evening"
                      isActive={currentPreset === "evening"}
                      onClick={() => setPreset("evening")}
                      ariaLabel="Visual evening lighting preset"
                    />
                    <PresetButton
                      preset="night"
                      icon={<Moon size={13} />}
                      label="Night"
                      isActive={currentPreset === "night"}
                      onClick={() => setPreset("night")}
                      ariaLabel="Visual night lighting preset"
                    />
                  </div>

                  {/* Active override status pill with 1-click reset */}
                  {visualTimeOverride && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[0.68rem] text-amber-200"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Visual lighting override active (Clock stays live)</span>
                      </span>
                      <button
                        onClick={() => setPreset("live")}
                        className="text-amber-100 hover:text-white underline font-mono text-[0.65rem] cursor-pointer ml-2"
                      >
                        Reset to Live
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* 2. Procedural Landscape Controls */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#889096]">
                      Procedural Landscape
                    </span>
                    {seedHex && (
                      <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/70">
                        Seed #{seedHex}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={onRandomizeScenery}
                      disabled={onSaveLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 sm:py-2.5 text-white/85 hover:text-white bg-white/10 hover:bg-white/16 border border-white/15 text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-12 sm:min-h-10"
                      aria-label="Generate new landscape seed"
                    >
                      <Shuffle size={14} />
                      <span>New Seed</span>
                    </button>

                    {onRandomizeAll && (
                      <button
                        onClick={onRandomizeAll}
                        disabled={onSaveLoading}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 sm:py-2.5 text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-12 sm:min-h-10"
                        style={{
                          background: `linear-gradient(135deg, ${COLOR_PALETTE.neon.purple}30, ${COLOR_PALETTE.neon.magenta}30)`,
                          border: `1.5px solid ${COLOR_PALETTE.neon.magenta}60`,
                          color: COLOR_PALETTE.neon.magenta,
                        }}
                        aria-label="Randomize seed and theme"
                      >
                        <Sparkles size={14} />
                        <span>Randomize All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Scene Theme Selector */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#889096]">
                      Theme
                    </span>
                    <button
                      onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                      className="transition-colors cursor-pointer text-xs font-mono flex items-center gap-1 text-[#889096] hover:text-[#ECEDEE]"
                      aria-label="Toggle theme menu"
                      aria-expanded={themeMenuOpen}
                    >
                      <span>{themes.find((t) => t.id === currentTheme)?.name || "Select"}</span>
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
                        {themes.map((t) => {
                          const isSelected = currentTheme === t.id;
                          const todKey = visualTimeOverride ?? "afternoon";
                          const palettePreview = t.palettes?.[todKey] ?? t.palettes?.day;
                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                onThemeChange?.(t.id);
                                setThemeMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-white/20 text-white border border-white/30 shadow-sm"
                                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                              }`}
                              aria-current={isSelected ? "true" : "false"}
                            >
                              <div className="flex flex-col text-left">
                                <div className="font-medium flex items-center gap-1.5">
                                  {t.name}
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
                                </div>
                                <div className="text-[0.7rem] text-white/50 truncate max-w-[190px]">{t.description}</div>
                              </div>
                              {palettePreview && (
                                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                  <span className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: palettePreview.sky[0] }} />
                                  <span className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: palettePreview.primary }} />
                                  <span className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: palettePreview.ground }} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. AMOLED Dark Mode & Save Scenery */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#889096]">
                      AMOLED Mode
                    </span>
                    <span className="text-[0.68rem] text-[#889096]/70">True black (Night scenes)</span>
                  </div>
                  <button
                    onClick={onToggleDarkMode}
                    className={`min-w-[84px] flex items-center justify-center rounded-xl px-3 py-2 text-xs font-medium border transition-all duration-200 cursor-pointer ${
                      darkModeEnabled
                        ? "text-[#0F1011] bg-[#ECEDEE] border-[#ECEDEE] font-bold shadow-sm"
                        : "text-[#ECEDEE]/75 bg-white/[0.06] hover:bg-white/[0.12] border-white/10 hover:text-white"
                    }`}
                    aria-pressed={darkModeEnabled}
                    aria-label="Toggle AMOLED dark mode"
                  >
                    {darkModeEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {/* Save Scenery Button */}
                <button
                  onClick={onSaveScenery}
                  disabled={onSaveLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[#ECEDEE] hover:text-white bg-white/[0.1] hover:bg-white/[0.16] border border-white/18 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-11 shadow-sm"
                  aria-label="Save scenery as PNG image"
                >
                  <Download size={14} />
                  <span>{onSaveLoading ? "Rendering Scenery PNG..." : "Save Scenery Image"}</span>
                </button>

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

// Memoize to prevent unnecessary re-renders when parent updates
const Controls = memo(ControlsComponent);
export default Controls;
