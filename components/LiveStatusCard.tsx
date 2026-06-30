"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Music, GitCommit, Gamepad2, Radio } from "lucide-react";
import { LiveStatus } from "@/lib/hooks/useStatusPolling";

interface LiveStatusCardProps {
  liveStatus: LiveStatus | null;
  isConnected?: boolean;
}

/**
 * Display live status information from backend API
 * Shows Spotify, GitHub, gaming activity, etc.
 */
export default function LiveStatusCard({ liveStatus, isConnected }: LiveStatusCardProps) {
  if (!liveStatus) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col gap-3"
    >
      {/* Connection indicator */}
      {isConnected !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="opacity-60">
            {isConnected ? "Live" : "Polling"}
          </span>
        </div>
      )}

      {/* Spotify */}
      {liveStatus.spotify && (
        <motion.a
          href={liveStatus.spotify.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 hover:opacity-80 transition-opacity"
        >
          <Music size={16} className="mt-1 opacity-60" />
          <div className="flex-1">
            <p className="text-sm font-medium">{liveStatus.spotify.track}</p>
            <p className="text-xs opacity-60">{liveStatus.spotify.artist}</p>
          </div>
        </motion.a>
      )}

      {/* GitHub */}
      {liveStatus.github && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-3"
        >
          <GitCommit size={16} className="mt-1 opacity-60" />
          <div className="flex-1">
            <p className="text-sm font-medium">{liveStatus.github.repo}</p>
            <p className="text-xs opacity-60 truncate">
              {liveStatus.github.message}
            </p>
          </div>
        </motion.div>
      )}

      {/* Gaming */}
      {liveStatus.gaming && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3"
        >
          <Gamepad2 size={16} className="mt-1 opacity-60" />
          <div className="flex-1">
            <p className="text-sm font-medium">{liveStatus.gaming.game}</p>
            <p className="text-xs opacity-60">{liveStatus.gaming.status}</p>
          </div>
        </motion.div>
      )}

      {/* Generic activity fallback */}
      {liveStatus.activity && !liveStatus.spotify && !liveStatus.github && !liveStatus.gaming && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Radio size={16} className="opacity-60" />
          <p className="text-sm">{liveStatus.activity}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
