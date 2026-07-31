"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * VisitorCounter - Animated visitor counter with localStorage persistence
 */
export default function VisitorCounter() {
  const [count, setCount] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get or initialize visitor count
    const storedCount = localStorage.getItem('visitor-count');
    const currentCount = storedCount ? parseInt(storedCount, 10) : 0;
    const newCount = currentCount + 1;
    
    localStorage.setItem('visitor-count', newCount.toString());
    setCount(newCount);
    
    // Show counter after a brief delay
    setTimeout(() => setIsVisible(true), 500);
  }, []);

  // Split count into digits for animation
  const digits = count.toString().padStart(6, '0').split('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg">
        <span className="text-xs text-white/60 font-medium">VISITORS</span>
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
              className="w-6 h-8 flex items-center justify-center bg-white/5 rounded border border-white/10"
            >
              <span className="text-sm font-mono font-bold text-white/90">
                {digit}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
