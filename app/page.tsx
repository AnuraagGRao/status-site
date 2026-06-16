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

export default function Home() {
  /* ── Time state ─────────────────────────────────────────────────── */
  const [now, setNow] = useState<Date>(() => new Date());
  const [overrideTime, setOverrideTime] = useState<Date | null>(null);
  const [toast, setToast] = useState(false);
  const bgRef = useRef<SVGSVGElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const status = getStatus(effectiveTime);
  const tod: TimeOfDay = getTimeOfDay(effectiveTime);
  const timeStr = formatTime(effectiveTime);
  const dateStr = formatDate(effectiveTime);

  /* ── Save scenery ───────────────────────────────────────────────── */
  const handleSave = useCallback(() => {
    const svgEl = bgRef.current;
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SCENE_WIDTH;
      canvas.height = SCENE_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `scenery-${tod}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        setToast(true);
        setTimeout(() => setToast(false), 2800);
      }, "image/png");
    };
    img.src = url;
  }, [tod]);

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
        <AnimatedBackground tod={tod} bgRef={bgRef} />
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
            Anuraag&apos;s Status
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
          onSaveScenery={handleSave}
        />
      </div>

      {/* ── Toast notification ───────────────────────────────────── */}
      <Toast visible={toast} message="Scenery saved!" />
    </main>
  );
}
