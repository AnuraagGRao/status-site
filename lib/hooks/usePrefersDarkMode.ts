import { useEffect, useState } from "react";

/**
 * Hook that detects the user's prefers-color-scheme preference and provides
 * a value that can be used to auto-enable dark mode.
 */
export function usePrefersDarkMode() {
  const [prefersDark, setPrefersDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    // Listen for changes
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);
    };

    darkModeQuery.addEventListener("change", handleChange);
    return () => {
      darkModeQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersDark;
}
