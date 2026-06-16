import { useEffect, useState } from "react";

/**
 * Hook that detects the user's prefers-reduced-motion preference.
 * Returns true if the user has requested reduced motion.
 */
export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(false);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(reducedMotionQuery.matches);

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
