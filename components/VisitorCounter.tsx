"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * VisitorCounter - Animated visitor counter with localStorage persistence
 */
export default function VisitorCounter() {
  const [count, setCount] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // 1. Initial cached value from localStorage for instant render
    const storedCount = localStorage.getItem('visitor-count');
    const localFallback = storedCount ? parseInt(storedCount, 10) : 75;
    setCount(localFallback);

    // 2. Fire hit to live analytics-hub ingestion endpoint
    try {
      const hitUrl = 'https://analytics.anuraaggrao.com/api/hit?project=status-site&path=/';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(hitUrl, JSON.stringify({ project: 'status-site', path: '/' }));
      } else {
        fetch(hitUrl, { method: 'POST', mode: 'no-cors' }).catch(() => {});
      }
    } catch {}

    // 3. Fetch authoritative live visitor count from Cloudflare D1
    fetch('https://analytics.anuraaggrao.com/api/count')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { ok?: boolean; count?: number }) => {
        if (typeof data.count === 'number' && data.count > 0) {
          setCount(data.count);
          localStorage.setItem('visitor-count', data.count.toString());
          setIsLive(true);
        }
      })
      .catch(() => {
        // Increment local fallback on network error
        const next = localFallback + 1;
        setCount(next);
        localStorage.setItem('visitor-count', next.toString());
      })
      .finally(() => {
        setTimeout(() => setIsVisible(true), 300);
      });
  }, []);

  // Split count into digits for animation
  const digits = count.toString().padStart(6, '0').split('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 select-none"
    >
      <div
        className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xl"
        style={{
          background: "rgba(15, 16, 18, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs text-[#889096] font-medium tracking-wider font-mono">VISITORS</span>
        </div>
        <div className="flex gap-1">
          {digits.map((digit, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.6 + index * 0.1,
                ease: "easeOut"
              }}
              className="w-6 h-8 flex items-center justify-center bg-white/[0.08] rounded border border-white/15 shadow-inner"
            >
              <span className="text-sm font-mono font-bold text-[#ECEDEE]">
                {digit}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
