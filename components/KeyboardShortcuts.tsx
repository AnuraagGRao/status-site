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
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-colors shadow-lg cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Show keyboard shortcuts"
      >
        <span className="text-white/80 font-mono text-sm font-semibold">?</span>
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
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
            >
              <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-white/80 text-sm">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-2 py-1 min-w-[2rem] text-center bg-white/10 border border-white/20 rounded text-xs font-mono text-white/90 shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer tip */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white/70">Esc</kbd> to close
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
