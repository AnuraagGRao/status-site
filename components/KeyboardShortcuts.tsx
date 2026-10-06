"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close modals" },
  { keys: ["s"], description: "Save scenery" },
  { keys: ["d"], description: "Toggle AMOLED dark mode" },
  { keys: ["r"], description: "New landscape seed" },
  { keys: ["t"], description: "Cycle scene theme" },
  { keys: ["←", "→"], description: "Cycle scene lighting (visual only)" },
];

interface KeyboardShortcutsProps {
  onSaveScenery?: () => void;
  onToggleDarkMode?: () => void;
  onRandomizeScenery?: () => void;
  onCycleTheme?: () => void;
  onNextTimePreset?: () => void;
  onPrevTimePreset?: () => void;
}

export default function KeyboardShortcuts({
  onSaveScenery,
  onToggleDarkMode,
  onRandomizeScenery,
  onCycleTheme,
  onNextTimePreset,
  onPrevTimePreset,
}: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent triggering in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      } else if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onSaveScenery?.();
      } else if ((e.key === "d" || e.key === "D") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onToggleDarkMode?.();
      } else if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onRandomizeScenery?.();
      } else if ((e.key === "t" || e.key === "T") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onCycleTheme?.();
      } else if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onNextTimePreset?.();
      } else if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onPrevTimePreset?.();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onSaveScenery, onToggleDarkMode, onRandomizeScenery, onCycleTheme, onNextTimePreset, onPrevTimePreset]);

  return (
    <>
      {/* Help button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors shadow-xl cursor-pointer"
        style={{
          background: "rgba(15, 16, 18, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Show keyboard shortcuts"
      >
        <span className="text-[#ECEDEE] font-mono text-sm font-semibold">?</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md px-4"
            >
              <div
                className="rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
                style={{
                  background: "rgba(15, 16, 18, 0.94)",
                  backdropFilter: "blur(28px) saturate(180%)",
                  WebkitBackdropFilter: "blur(28px) saturate(180%)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  boxShadow:
                    "0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/10">
                  <h2 className="text-lg font-bold text-[#ECEDEE] tracking-tight">Keyboard Shortcuts</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 flex items-center justify-center text-[#889096] hover:text-[#ECEDEE] hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-lg"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {/* Shortcuts list */}
                <div className="space-y-3">
                  {SHORTCUTS.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-[#ECEDEE]/85 text-xs font-medium">{shortcut.description}</span>
                      <div className="flex gap-1.5">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-2 py-1 min-w-[2rem] text-center bg-white/[0.08] border border-white/15 rounded-md text-xs font-mono text-[#ECEDEE] shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer tip */}
                <div className="mt-5 pt-3.5 border-t border-white/10">
                  <p className="text-xs text-[#889096] text-center font-mono">
                    Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] border border-white/15 rounded text-[#ECEDEE]/80">Esc</kbd> to close
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
