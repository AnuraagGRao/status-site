import useSWR from "swr";

export interface LiveStatus {
  status: "working" | "away";
  activity?: string | null;
  spotify?: {
    track: string;
    artist: string;
    album: string;
    url: string;
  } | null;
  github?: {
    repo: string;
    commits: number;
    message: string;
    timestamp: string;
  } | null;
  gaming?: {
    game: string;
    status: string;
  } | null;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook for polling status updates (lightweight alternative to WebSocket)
 * Works with static export - fetches from external API
 */
export function useStatusPolling(apiUrl: string, refreshInterval: number = 30000) {
  const { data, error, isLoading } = useSWR<LiveStatus>(
    apiUrl,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      // Don't throw on error, just return null
      shouldRetryOnError: false,
    }
  );

  return {
    status: data || null,
    isLoading,
    error: error ? "Failed to fetch status" : null,
  };
}
