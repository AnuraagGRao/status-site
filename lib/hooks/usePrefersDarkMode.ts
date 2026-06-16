import { useEffect, useState } from "react";

/**
 * Hook that detects the user's prefers-color-scheme preference and provides
 * a value that can be used to auto-enable dark mode.
 */
export function usePrefersDarkMode() {
  const [prefersDark, setPrefersDark] = useState<boolean>(false);

  useEffect(() => {
    // Check initial preference
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(darkModeQuery.matches);

    // Listen for changes
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
