import { useEffect, useRef } from "react";

/**
 * Hook that handles Page Visibility API to catch up the clock when a tab
 * becomes visible again after being hidden for an extended period.
 */
export function usePageVisibility(onVisibilityChange: () => void) {
  const timeHiddenRef = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is now hidden; record the timestamp
        timeHiddenRef.current = Date.now();
      } else {
        // Page is now visible; trigger a refresh if it was hidden for >1s
        if (timeHiddenRef.current && Date.now() - timeHiddenRef.current > 1000) {
          onVisibilityChange();
        }
        timeHiddenRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onVisibilityChange]);
}
