"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Moon, Clock } from "lucide-react";
import { StatusType } from "@/lib/timeUtils";

interface StatusCardProps {
  time: string;
  date: string;
  status: StatusType;
}

const WORKING_TEXT = "Building backend systems, handling server logic, or deploying code.";
const AWAY_TEXT =
  "Grinding Valorant, working on Tetra Overflow Ultra, or deep in creative exploration/rest.";

export default function StatusCard({ time, date, status }: StatusCardProps) {
  const isWorking = status === "working";

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
          className="h-1 w-full"
          animate={{
            background: isWorking
              ? "linear-gradient(90deg,#667eea,#764ba2)"
              : "linear-gradient(90deg,#4facfe,#00f2fe)",
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
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-white/50" />
              <span className="text-white/50 text-xs font-medium tracking-widest uppercase">
                Local Time
              </span>
            </div>
            <span
              className="text-white font-light tracking-tight leading-none select-none"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontFeatureSettings: '"tnum"' }}
            >
              {time}
            </span>
            <span className="text-white/55 text-sm font-light tracking-wide">{date}</span>
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
                  className={`text-xs font-semibold tracking-widest uppercase ${
                    isWorking ? "text-violet-200" : "text-cyan-200"
                  }`}
                >
                  {isWorking ? "Working" : "Away"}
                </motion.span>
              </AnimatePresence>

              {/* Live dot */}
              {isWorking && (
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Status description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="text-white/70 text-sm text-center leading-relaxed font-light max-w-xs"
              >
                {isWorking ? WORKING_TEXT : AWAY_TEXT}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
