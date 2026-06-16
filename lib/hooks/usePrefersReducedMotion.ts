import { useEffect, useState } from "react";

/**
 * Hook that detects the user's prefers-reduced-motion preference.
 * Returns true if the user has requested reduced motion.
 */
export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    reducedMotionQuery.addEventListener("change", handleChange);
    return () => {
      reducedMotionQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReduced;
}
