"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Shuffle, Download, ChevronDown, ChevronUp } from "lucide-react";
import { randomTime } from "@/lib/timeUtils";

interface ControlsProps {
  /** Controlled time override. null = use live system time */
  overrideTime: Date | null;
  onTimeChange: (date: Date | null) => void;
  onSaveScenery: () => void;
}

export default function Controls({ overrideTime, onTimeChange, onSaveScenery }: ControlsProps) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(""); // "HH:MM" string

  /* ── Set time from HH:MM input ──────────────────────────────────── */
  const applyTime = useCallback(
    (value: string) => {
      if (!value) {
        onTimeChange(null);
        return;
      }
      const [hStr, mStr] = value.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return;
      const d = new Date();
      d.setHours(h, m, 0, 0);
      onTimeChange(d);
    },
    [onTimeChange]
  );

  const handleReset = () => {
    setInputVal("");
    onTimeChange(null);
  };

  const handleRandomize = () => {
    const r = randomTime();
    const hh = String(r.getHours()).padStart(2, "0");
    const mm = String(r.getMinutes()).padStart(2, "0");
    setInputVal(`${hh}:${mm}`);
    onTimeChange(r);
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
          className="flex w-full items-center justify-between px-6 py-3.5 text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle scene controls"
        >
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span className="text-xs font-medium tracking-widest uppercase">Scene Controls</span>
          </div>
          <span className="text-white/70">
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

                {/* Time input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="time-override"
                    className="text-white/50 text-xs tracking-widest uppercase"
                  >
                    Set Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="time-override"
                      type="time"
                      value={inputVal}
                      onChange={(e) => {
                        setInputVal(e.target.value);
                        applyTime(e.target.value);
                      }}
                      className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all duration-200 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                      aria-label="Override time"
                    />
                    {overrideTime && (
                      <button
                        onClick={handleReset}
                        className="px-3 py-2.5 rounded-xl text-white/60 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium transition-all duration-200 cursor-pointer"
                        aria-label="Reset to live time"
                      >
                        Live
                      </button>
                    )}
                  </div>
                  {overrideTime && (
                    <p className="text-white/40 text-xs">
                      Previewing a fixed time — live clock paused.
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleRandomize}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/16 border border-white/15 text-xs font-medium tracking-wide transition-all duration-300 ease-out cursor-pointer"
                    aria-label="Randomize scene time"
                  >
                    <Shuffle size={13} />
                    Randomize Scene
                  </button>

                  <button
                    onClick={onSaveScenery}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/16 border border-white/15 text-xs font-medium tracking-wide transition-all duration-300 ease-out cursor-pointer"
                    aria-label="Save scenery as image"
                  >
                    <Download size={13} />
                    Save Scenery
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
