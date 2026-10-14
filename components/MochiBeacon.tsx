"use client";

import { useState, useRef } from "react";
import { Sparkles, Activity, Volume2, ExternalLink, X, Heart } from "lucide-react";

export default function MochiBeacon() {
  const [isOpen, setIsOpen] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const zenQuotes = [
    "Zero unhandled promises. Stay calm and sip warm matcha.",
    "True uptime is inner peace: no alert fatigue in the hot springs.",
    "Observability without calm is just noise. Watch the pulse breathe.",
    "Citrus balanced on the head, services humming across five continents.",
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);

  const playZenChime = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      // Pentatonic warm chime: E4 (330Hz) -> G4 (392Hz) -> C5 (523Hz)
      [330, 392, 523].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);

        gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.38);
      });
    } catch {
      // Audio safety
    }
  };

  const handleToggle = () => {
    playZenChime();
    if (!isOpen) {
      setQuoteIndex((prev) => (prev + 1) % zenQuotes.length);
    }
    setIsOpen(!isOpen);
  };

  return (
    <aside aria-label="Zen SRE Companion" className="fixed bottom-5 left-5 z-40 flex flex-col items-start pointer-events-none select-none">
      {/* Speech Bubble */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-76 p-4 rounded-2xl bg-black/85 border border-emerald-500/30 shadow-2xl backdrop-blur-xl space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span>🦫</span> MOCHI // ZEN DOCTRINE
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-200 font-sans italic leading-relaxed">
            &ldquo;{zenQuotes[quoteIndex]}&rdquo;
          </p>
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>SRE Uptime: 99.99%</span>
            </span>
            <a
              href="https://craft.anuraaggrao.com/companions"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Companions Lab</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* Main Beacon Capsule */}
      <button
        onClick={handleToggle}
        className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/80 hover:bg-black/95 border border-emerald-500/30 text-white shadow-xl hover:scale-105 transition-all backdrop-blur-xl group cursor-pointer"
        title="Mochi the Zen Capybara - Click for uptime wisdom"
      >
        <span className="text-sm">🦫</span>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-mono font-bold leading-tight group-hover:text-emerald-300 transition-colors">
            Mochi
          </span>
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest leading-none">
            NOMINAL
          </span>
        </div>
      </button>
    </aside>
  );
}
