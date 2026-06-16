import { useCallback, useRef, useState } from "react";
import { SCENE_WIDTH, SCENE_HEIGHT } from "@/lib/sceneConstants";

export interface SaveSceneryState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that handles saving the SVG scenery as a PNG with error handling,
 * fallbacks for different browsers, and loading state feedback.
 */
export function useSaveScenery(
  svgRef: React.RefObject<SVGSVGElement | null>,
  timeOfDay: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
) {
  const [state, setState] = useState<SaveSceneryState>({ isLoading: false, error: null });
  const abortControllerRef = useRef<AbortController | null>(null);

  const save = useCallback(async () => {
    const svgEl = svgRef.current;
    if (!svgEl) {
      const err = "SVG element not found";
      setState({ isLoading: false, error: err });
      onError?.(err);
      return;
    }

    setState({ isLoading: true, error: null });
    abortControllerRef.current = new AbortController();

    try {
      // Serialize SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create image to render SVG onto canvas
      const img = new window.Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load SVG image"));
        // Add timeout to catch stuck loads
        const timeoutId = setTimeout(() => reject(new Error("SVG load timeout")), 5000);
        img.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        img.src = svgUrl;
      });

      // Render SVG to canvas
      const canvas = document.createElement("canvas");
      canvas.width = SCENE_WIDTH;
      canvas.height = SCENE_HEIGHT;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      ctx.drawImage(img, 0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      URL.revokeObjectURL(svgUrl);

      // Convert canvas to PNG blob
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(
          () => reject(new Error("Canvas to blob conversion timeout")),
          5000
        );

        canvas.toBlob(
          (blob) => {
            clearTimeout(timeoutId);
            if (!blob) {
              reject(new Error("Failed to create PNG blob"));
              return;
            }

            try {
              // Trigger download
              const blobUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = `scenery-${timeOfDay}-${Date.now()}.png`;

              // Append to DOM briefly (required on some browsers)
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Cleanup
              URL.revokeObjectURL(blobUrl);

              setState({ isLoading: false, error: null });
              onSuccess?.();
              resolve();
            } catch (err) {
              reject(new Error("Download failed: " + String(err)));
            }
          },
          "image/png"
        );
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setState({ isLoading: false, error: errorMsg });
      onError?.(errorMsg);
    }
  }, [svgRef, timeOfDay, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);

  return { ...state, save, reset };
}
