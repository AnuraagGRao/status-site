import { useEffect, useRef, useState } from "react";
import type { GenerateRequest, GenerateResponse } from "@/workers/sceneGenerator.worker";

/**
 * Hook to use Web Worker for procedural scene generation
 * Offloads heavy PRNG and coordinate calculations to worker thread
 */
export function useSceneWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Initialize worker
      workerRef.current = new Worker(
        new URL("@/workers/sceneGenerator.worker.ts", import.meta.url),
        { type: "module" }
      );

      workerRef.current.onerror = (err) => {
        console.error("Worker error:", err);
        setError("Worker failed to initialize");
      };

      setIsReady(true);
    } catch (err) {
      console.error("Failed to create worker:", err);
      setError("Web Workers not supported");
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const generate = <T,>(
    elementType: GenerateRequest["elementType"],
    seed: number,
    options?: { count?: number; colors?: string[] }
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const handleMessage = (e: MessageEvent<GenerateResponse>) => {
        if (e.data.type === "generated" && e.data.elementType === elementType) {
          workerRef.current?.removeEventListener("message", handleMessage);
          resolve(e.data.data as T);
        }
      };

      const handleError = (err: ErrorEvent) => {
        workerRef.current?.removeEventListener("error", handleError);
        reject(new Error(`Worker error: ${err.message}`));
      };

      workerRef.current.addEventListener("message", handleMessage);
      workerRef.current.addEventListener("error", handleError);

      const request: GenerateRequest = {
        type: "generate",
        elementType,
        seed,
        ...options,
      };

      workerRef.current.postMessage(request);

      // Timeout after 5 seconds
      setTimeout(() => {
        workerRef.current?.removeEventListener("message", handleMessage);
        workerRef.current?.removeEventListener("error", handleError);
        reject(new Error("Worker timeout"));
      }, 5000);
    });
  };

  return { generate, isReady, error };
}
