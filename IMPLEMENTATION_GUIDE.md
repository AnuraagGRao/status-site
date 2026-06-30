# Production Upgrade Implementation Guide

## Overview
This guide provides step-by-step implementation for three major upgrades:
1. **Dynamic Backend Integration** (FastAPI + WebSocket)
2. **Performance Optimization** (Web Workers)
3. **Testing Implementation** (Vitest + React Testing Library)

---

## 1. Dynamic Backend Integration

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│  Next.js Frontend (Static Export)                       │
│  ├── React Components                                   │
│  ├── WebSocket Client / Polling Hook                    │
│  └── Real-time Status Updates                           │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────▼──────────────────────────────────────┐
│  FastAPI Backend (Python)                               │
│  ├── /api/status (REST endpoint)                        │
│  ├── /ws/status (WebSocket endpoint)                    │
│  ├── Integration Services                               │
│  │   ├── Spotify API (currently playing)               │
│  │   ├── GitHub API (recent commits)                   │
│  │   └── Discord/Steam (gaming status)                 │
│  └── Redis Cache (optional)                             │
└─────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Install Frontend Dependencies
```bash
npm install --save socket.io-client swr
npm install --save-dev @types/socket.io-client
```

#### Step 2: Backend Setup (FastAPI)

**File: `backend/requirements.txt`**
```txt
fastapi==0.110.0
uvicorn[standard]==0.27.1
python-socketio==5.11.1
redis==5.0.1
httpx==0.26.0
python-dotenv==1.0.0
pydantic==2.6.1
pydantic-settings==2.1.0
```

**File: `backend/main.py`**
```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional
import asyncio
import httpx
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Models
class StatusResponse(BaseModel):
    status: str  # "working" | "away"
    activity: Optional[str] = None
    spotify: Optional[dict] = None
    github: Optional[dict] = None
    gaming: Optional[dict] = None
    timestamp: str

class ConnectionManager:
    """Manages WebSocket connections"""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except:
                await self.disconnect(connection)

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background task
    task = asyncio.create_task(broadcast_status_updates())
    yield
    # Shutdown: Cancel background task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Service Integration Functions ──────────────────────────

async def get_spotify_status(token: Optional[str]) -> Optional[dict]:
    """Fetch currently playing track from Spotify"""
    if not token:
        return None
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.spotify.com/v1/me/player/currently-playing",
                headers={"Authorization": f"Bearer {token}"},
                timeout=3.0
            )
            if response.status_code == 200:
                data = response.json()
                if data and data.get("is_playing"):
                    return {
                        "track": data["item"]["name"],
                        "artist": data["item"]["artists"][0]["name"],
                        "album": data["item"]["album"]["name"],
                        "url": data["item"]["external_urls"]["spotify"],
                    }
        except Exception as e:
            print(f"Spotify API error: {e}")
    return None

async def get_github_activity(username: str) -> Optional[dict]:
    """Fetch recent commit activity from GitHub"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://api.github.com/users/{username}/events/public",
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=3.0
            )
            if response.status_code == 200:
                events = response.json()
                push_events = [e for e in events if e["type"] == "PushEvent"]
                if push_events:
                    latest = push_events[0]
                    return {
                        "repo": latest["repo"]["name"],
                        "commits": len(latest["payload"]["commits"]),
                        "message": latest["payload"]["commits"][0]["message"] if latest["payload"]["commits"] else "",
                        "timestamp": latest["created_at"],
                    }
        except Exception as e:
            print(f"GitHub API error: {e}")
    return None

async def get_current_status() -> StatusResponse:
    """Aggregate status from all sources"""
    # Determine if working based on time of day (9am-6pm)
    hour = datetime.now().hour
    is_working = 9 <= hour < 18
    
    # Fetch integrations (replace with your actual tokens/usernames)
    spotify_data = await get_spotify_status(None)  # Add token from env
    github_data = await get_github_activity("your-username")  # Add username
    
    # Determine activity
    activity = None
    if spotify_data:
        activity = f"Listening to {spotify_data['track']}"
    elif github_data:
        activity = f"Committed to {github_data['repo']}"
    
    return StatusResponse(
        status="working" if is_working else "away",
        activity=activity,
        spotify=spotify_data,
        github=github_data,
        gaming=None,  # Implement gaming integration
        timestamp=datetime.now().isoformat()
    )

# ── REST Endpoint ──────────────────────────────────────────

@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    """REST endpoint for status polling"""
    return await get_current_status()

# ── WebSocket Endpoint ─────────────────────────────────────

@app.websocket("/ws/status")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        # Send initial status
        status = await get_current_status()
        await websocket.send_json(status.model_dump())
        
        # Keep connection alive
        while True:
            await websocket.receive_text()  # Wait for ping
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ── Background Task ────────────────────────────────────────

async def broadcast_status_updates():
    """Background task to broadcast status updates every 30 seconds"""
    while True:
        await asyncio.sleep(30)
        status = await get_current_status()
        await manager.broadcast(status.model_dump())

# ── Health Check ───────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
```

**File: `backend/.env.example`**
```env
SPOTIFY_ACCESS_TOKEN=your_spotify_token
GITHUB_USERNAME=your_github_username
DISCORD_USER_ID=your_discord_id
REDIS_URL=redis://localhost:6379
```

**File: `backend/Dockerfile`**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Step 3: Frontend Integration

**File: `lib/hooks/useStatusWebSocket.ts`**
```typescript
import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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

interface UseStatusWebSocketOptions {
  enabled?: boolean;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

/**
 * Hook to connect to live status updates via WebSocket with polling fallback
 */
export function useStatusWebSocket(
  wsUrl: string,
  options: UseStatusWebSocketOptions = {}
) {
  const {
    enabled = true,
    fallbackToPolling = true,
    pollingInterval = 30000,
  } = options;

  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling fallback
  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(wsUrl.replace("/ws/", "/api/"));
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [wsUrl]);

  useEffect(() => {
    if (!enabled) return;

    // Try WebSocket first
    try {
      const socket = io(wsUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setError(null);
        // Clear polling if it was running
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      });

      socket.on("status", (data: LiveStatus) => {
        setStatus(data);
      });

      socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        // Fall back to polling
        if (fallbackToPolling && !pollingRef.current) {
          console.log("Falling back to polling");
          pollStatus(); // Initial fetch
          pollingRef.current = setInterval(pollStatus, pollingInterval);
        }
      });

      socket.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err);
        setError(err.message);
        
        // Fall back to polling
        if (fallbackToPolling && !pollingRef.current) {
          pollStatus();
          pollingRef.current = setInterval(pollStatus, pollingInterval);
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error("Failed to initialize WebSocket:", err);
      
      // Fall back to polling immediately
      if (fallbackToPolling) {
        pollStatus();
        pollingRef.current = setInterval(pollStatus, pollingInterval);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enabled, wsUrl, fallbackToPolling, pollingInterval, pollStatus]);

  return { status, isConnected, error };
}
```

**File: `lib/hooks/useStatusPolling.ts`**
```typescript
import { useEffect, useState } from "react";
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
    }
  );

  return {
    status: data || null,
    isLoading,
    error: error ? "Failed to fetch status" : null,
  };
}
```

**File: `components/LiveStatusCard.tsx`**
```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Music, GitCommit, Gamepad2, Radio } from "lucide-react";
import { LiveStatus } from "@/lib/hooks/useStatusPolling";

interface LiveStatusCardProps {
  liveStatus: LiveStatus | null;
  isConnected?: boolean;
}

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
              isConnected ? "bg-green-400" : "bg-gray-400"
            }`}
          />
          <span className="opacity-60">
            {isConnected ? "Live" : "Polling"}
          </span>
        </div>
      )}

      {/* Spotify */}
      {liveStatus.spotify && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3"
        >
          <Music size={16} className="mt-1 opacity-60" />
          <div className="flex-1">
            <p className="text-sm font-medium">{liveStatus.spotify.track}</p>
            <p className="text-xs opacity-60">{liveStatus.spotify.artist}</p>
          </div>
        </motion.div>
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

      {/* Generic activity */}
      {liveStatus.activity && !liveStatus.spotify && !liveStatus.github && (
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
```

**Update: `components/StatusCard.tsx` (Integration)**
```typescript
// Add to imports
import LiveStatusCard from "./LiveStatusCard";
import { LiveStatus } from "@/lib/hooks/useStatusPolling";

// Add to StatusCardProps interface
interface StatusCardProps {
  time: string;
  date: string;
  status: StatusType;
  palette?: PaletteConfig;
  liveStatus?: LiveStatus | null;  // Add this
  isLiveConnected?: boolean;        // Add this
}

// Inside the component, after the cycling text section:
{/* Live status integration */}
{liveStatus && (
  <div className="mt-4 pt-4 border-t border-white/10">
    <LiveStatusCard 
      liveStatus={liveStatus} 
      isConnected={isLiveConnected} 
    />
  </div>
)}
```

**Update: `app/page.tsx` (Enable live status)**
```typescript
// Add to imports
import { useStatusPolling } from "@/lib/hooks/useStatusPolling";
// OR for WebSocket:
// import { useStatusWebSocket } from "@/lib/hooks/useStatusWebSocket";

// Inside Home component:
// Option 1: Polling (simpler, works with static export)
const { status: liveStatus, error: liveError } = useStatusPolling(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/status",
  30000 // Poll every 30 seconds
);

// Option 2: WebSocket (real-time, requires connection)
// const { status: liveStatus, isConnected, error: liveError } = useStatusWebSocket(
//   process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/status"
// );

// Pass to StatusCard:
<StatusCard
  time={formatTime(now)}
  date={formatDate(now)}
  status={getStatus(now, visualTimeOverride)}
  palette={effectiveDarkMode ? palette : paletteConfig}
  liveStatus={liveStatus}
  isLiveConnected={isConnected}
/>
```

**File: `.env.local.example`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/status
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/status
```

---

## 2. Performance Optimization: Web Workers

### Architecture
```
Main Thread                    Worker Thread
─────────────────────────────────────────────────
Component requests theme  ──→  Generate elements
                               ├─ makePRNG(seed)
                               ├─ generateStars()
                               ├─ generateClouds()
                               ├─ generateBirds()
                               └─ Calculate coords
                          ←──  Return serialized data
Render SVG elements
```

### Implementation

**File: `workers/sceneGenerator.worker.ts`**
```typescript
/**
 * Web Worker for heavy procedural generation
 * Offloads PRNG calculations and coordinate generation from main thread
 */

// ── PRNG (duplicated from theme files for worker context) ──
function makePRNG(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed / 2147483648) % 1;
  };
}

// ── Generator Functions ──

export interface Star {
  id: number;
  cx: string;
  cy: string;
  r: number;
  duration: number;
  delay: number;
}

export interface Cloud {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  opacity: number;
  duration: number;
}

export interface Bird {
  id: number;
  startX: string;
  startY: string;
  endX: string;
  endY: string;
  duration: number;
  delay: number;
  size: number;
}

export interface Rock {
  id: number;
  x: string;
  y: string;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
}

export interface Nebula {
  id: number;
  cx: string;
  cy: string;
  r: number;
  color: string;
  duration: number;
  delay: number;
}

function generateStars(seed: number, count: number = 60): Star[] {
  const rng = makePRNG(seed);
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      cx: `${rng() * 100}%`,
      cy: `${rng() * 40}%`,
      r: rng() * 1.5 + 0.5,
      duration: rng() * 2 + 2,
      delay: rng() * 3,
    });
  }

  return stars;
}

function generateClouds(seed: number, count: number = 8): Cloud[] {
  const rng = makePRNG(seed);
  const clouds: Cloud[] = [];

  for (let i = 0; i < count; i++) {
    clouds.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 30 + 5}%`,
      width: rng() * 120 + 80,
      height: rng() * 40 + 30,
      opacity: rng() * 0.4 + 0.3,
      duration: rng() * 40 + 60,
    });
  }

  return clouds;
}

function generateBirds(seed: number, count: number = 6): Bird[] {
  const rng = makePRNG(seed);
  const birds: Bird[] = [];

  for (let i = 0; i < count; i++) {
    const startX = rng() * 100;
    const startY = rng() * 30 + 10;
    birds.push({
      id: i,
      startX: `${startX}%`,
      startY: `${startY}%`,
      endX: `${(startX + rng() * 40 - 20)}%`,
      endY: `${(startY + rng() * 10 - 5)}%`,
      duration: rng() * 15 + 20,
      delay: rng() * 10,
      size: rng() * 8 + 12,
    });
  }

  return birds;
}

function generateRocks(seed: number, count: number = 12, colors: string[]): Rock[] {
  const rng = makePRNG(seed);
  const rocks: Rock[] = [];

  for (let i = 0; i < count; i++) {
    rocks.push({
      id: i,
      x: `${rng() * 100}%`,
      y: `${rng() * 25 + 65}%`,
      width: rng() * 30 + 20,
      height: rng() * 25 + 15,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 1.5 + 3.5,
      delay: rng() * 2,
    });
  }

  return rocks;
}

function generateNebulae(seed: number, count: number = 7, colors: string[]): Nebula[] {
  const rng = makePRNG(seed);
  const nebulae: Nebula[] = [];

  for (let i = 0; i < count; i++) {
    nebulae.push({
      id: i,
      cx: `${rng() * 100}%`,
      cy: `${rng() * 100}%`,
      r: rng() * 150 + 100,
      color: colors[Math.floor(rng() * colors.length)],
      duration: rng() * 4 + 6,
      delay: rng() * 3,
    });
  }

  return nebulae;
}

// ── Message Handler ──

export interface GenerateRequest {
  type: "generate";
  elementType: "stars" | "clouds" | "birds" | "rocks" | "nebulae";
  seed: number;
  count?: number;
  colors?: string[];
}

export interface GenerateResponse {
  type: "generated";
  elementType: string;
  data: Star[] | Cloud[] | Bird[] | Rock[] | Nebula[];
}

self.onmessage = (e: MessageEvent<GenerateRequest>) => {
  const { type, elementType, seed, count, colors } = e.data;

  if (type !== "generate") return;

  let data: Star[] | Cloud[] | Bird[] | Rock[] | Nebula[];

  switch (elementType) {
    case "stars":
      data = generateStars(seed, count);
      break;
    case "clouds":
      data = generateClouds(seed, count);
      break;
    case "birds":
      data = generateBirds(seed, count);
      break;
    case "rocks":
      data = generateRocks(seed, count || 12, colors || []);
      break;
    case "nebulae":
      data = generateNebulae(seed, count || 7, colors || []);
      break;
    default:
      return;
  }

  const response: GenerateResponse = {
    type: "generated",
    elementType,
    data,
  };

  self.postMessage(response);
};

export {};
```

**File: `lib/hooks/useSceneWorker.ts`**
```typescript
import { useEffect, useRef, useState } from "react";
import type { GenerateRequest, GenerateResponse } from "@/workers/sceneGenerator.worker";

export function useSceneWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(
      new URL("@/workers/sceneGenerator.worker.ts", import.meta.url),
      { type: "module" }
    );

    setIsReady(true);

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

      workerRef.current.addEventListener("message", handleMessage);

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
        reject(new Error("Worker timeout"));
      }, 5000);
    });
  };

  return { generate, isReady };
}
```

**Example Usage in Theme: `lib/themes/lushLake.worker.tsx`**
```typescript
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSceneWorker } from "@/lib/hooks/useSceneWorker";
import type { Star, Cloud, Bird, Rock } from "@/workers/sceneGenerator.worker";

export function LushLakeWorkerRenderer(props: ThemeComponentProps) {
  const { variantSeed, prefersReducedMotion, palette, viewW, viewH } = props;
  const { generate, isReady } = useSceneWorker();

  const [stars, setStars] = useState<Star[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    setLoading(true);

    // Generate all elements in parallel
    Promise.all([
      generate<Star[]>("stars", variantSeed + 1, { count: 60 }),
      generate<Cloud[]>("clouds", variantSeed + 2, { count: 8 }),
      generate<Bird[]>("birds", variantSeed + 3, { count: 6 }),
      generate<Rock[]>("rocks", variantSeed + 4, {
        count: 12,
        colors: [palette.primary, palette.secondary],
      }),
    ])
      .then(([starsData, cloudsData, birdsData, rocksData]) => {
        setStars(starsData);
        setClouds(cloudsData);
        setBirds(birdsData);
        setRocks(rocksData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Worker generation failed:", error);
        setLoading(false);
      });
  }, [variantSeed, isReady, palette, generate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-white opacity-60">Loading scene...</div>
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-full">
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </linearGradient>
      </defs>

      <rect width={viewW} height={viewH} fill="url(#sky-gradient)" />

      {/* Stars */}
      {stars.map((star) => (
        <motion.circle
          key={`star-${star.id}`}
          cx={star.cx}
          cy={star.cy}
          r={star.r}
          fill="white"
          initial={{ opacity: 0.3 }}
          animate={
            prefersReducedMotion
              ? { opacity: 0.6 }
              : { opacity: [0.3, 0.9, 0.3] }
          }
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}

      {/* Clouds */}
      {clouds.map((cloud) => (
        <motion.ellipse
          key={`cloud-${cloud.id}`}
          cx={cloud.x}
          cy={cloud.y}
          rx={cloud.width / 2}
          ry={cloud.height / 2}
          fill="white"
          opacity={cloud.opacity}
          animate={
            prefersReducedMotion
              ? {}
              : { x: ["-10%", "110%"] }
          }
          transition={{
            duration: cloud.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Birds */}
      {birds.map((bird) => (
        <motion.path
          key={`bird-${bird.id}`}
          d={`M 0,0 L ${bird.size * 0.6},${bird.size * 0.3} L ${bird.size},0 L ${bird.size * 0.6},${bird.size * 0.3} Z`}
          fill="rgba(0,0,0,0.4)"
          initial={{ x: bird.startX, y: bird.startY }}
          animate={
            prefersReducedMotion
              ? { x: bird.startX, y: bird.startY }
              : { x: bird.endX, y: bird.endY }
          }
          transition={{
            duration: bird.duration,
            repeat: Infinity,
            repeatType: "reverse",
            delay: bird.delay,
          }}
        />
      ))}

      {/* Rocks */}
      {rocks.map((rock) => (
        <motion.ellipse
          key={`rock-${rock.id}`}
          cx={rock.x}
          cy={rock.y}
          rx={rock.width / 2}
          ry={rock.height / 2}
          fill={rock.color}
          animate={
            prefersReducedMotion
              ? {}
              : { y: [`${parseFloat(rock.y as string) - 1}%`, `${parseFloat(rock.y as string) + 1}%`], opacity: [0.7, 1, 0.7] }
          }
          transition={{
            duration: rock.duration,
            repeat: Infinity,
            repeatType: "reverse",
            delay: rock.delay,
          }}
        />
      ))}
    </svg>
  );
}
```

**File: `next.config.ts` (Enable Web Workers)**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  
  webpack: (config, { isServer }) => {
    // Enable Web Workers
    if (!isServer) {
      config.output.globalObject = "self";
    }

    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: "worker-loader" },
    });

    return config;
  },
};

export default nextConfig;
```

**Install worker-loader:**
```bash
npm install --save-dev worker-loader
```

---

## 3. Testing Implementation

### Setup

**File: `vitest.config.ts`**
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "out/",
        "**/*.config.*",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

**File: `vitest.setup.ts`**
```typescript
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**Install dependencies:**
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

**Update `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Test Suites

**File: `__tests__/lib/timeUtils.test.ts`**
```typescript
import { describe, it, expect, vi } from "vitest";
import {
  getTimeOfDay,
  getStatus,
  formatTime,
  formatDate,
  type TimeOfDay,
} from "@/lib/timeUtils";

describe("timeUtils", () => {
  describe("getTimeOfDay", () => {
    it("returns 'day' for morning hours", () => {
      const date = new Date("2024-01-01T10:00:00");
      expect(getTimeOfDay(date)).toBe("day");
    });

    it("returns 'afternoon' for afternoon hours", () => {
      const date = new Date("2024-01-01T14:00:00");
      expect(getTimeOfDay(date)).toBe("afternoon");
    });

    it("returns 'evening' for evening hours", () => {
      const date = new Date("2024-01-01T18:30:00");
      expect(getTimeOfDay(date)).toBe("evening");
    });

    it("returns 'night' for night hours", () => {
      const date = new Date("2024-01-01T23:00:00");
      expect(getTimeOfDay(date)).toBe("night");
    });
  });

  describe("getStatus", () => {
    it("returns 'working' during work hours", () => {
      const date = new Date("2024-01-01T14:00:00"); // Monday 2pm
      expect(getStatus(date)).toBe("working");
    });

    it("returns 'away' outside work hours", () => {
      const date = new Date("2024-01-01T22:00:00"); // Monday 10pm
      expect(getStatus(date)).toBe("away");
    });

    it("respects visual time override", () => {
      const date = new Date("2024-01-01T14:00:00");
      expect(getStatus(date, "night")).toBe("away");
    });
  });

  describe("formatTime", () => {
    it("formats time correctly", () => {
      const date = new Date("2024-01-01T14:05:30");
      expect(formatTime(date)).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe("formatDate", () => {
    it("formats date correctly", () => {
      const date = new Date("2024-01-15T14:00:00");
      expect(formatDate(date)).toMatch(/\w+\s+\d{1,2},\s+\d{4}/);
    });
  });
});
```

**File: `__tests__/lib/themes/index.test.ts`**
```typescript
import { describe, it, expect } from "vitest";
import {
  getTheme,
  getThemeNames,
  isValidTheme,
  getAllThemes,
  THEME_REGISTRY,
} from "@/lib/themes";

describe("Theme System", () => {
  describe("THEME_REGISTRY", () => {
    it("contains all expected themes", () => {
      const expectedThemes = [
        "lush_lake",
        "tropical_beach",
        "crimson_desert",
        "cyber_alpine",
        "deep_cosmos",
      ];

      expectedThemes.forEach((themeName) => {
        expect(THEME_REGISTRY).toHaveProperty(themeName);
      });
    });

    it("each theme has required properties", () => {
      Object.values(THEME_REGISTRY).forEach((theme) => {
        expect(theme).toHaveProperty("id");
        expect(theme).toHaveProperty("name");
        expect(theme).toHaveProperty("palettes");
        expect(theme).toHaveProperty("renderer");
        
        // Check palettes
        expect(theme.palettes).toHaveProperty("day");
        expect(theme.palettes).toHaveProperty("afternoon");
        expect(theme.palettes).toHaveProperty("evening");
        expect(theme.palettes).toHaveProperty("night");
      });
    });
  });

  describe("getTheme", () => {
    it("returns correct theme", () => {
      const theme = getTheme("lush_lake");
      expect(theme.id).toBe("lush_lake");
      expect(theme.name).toBe("Lush Lake");
    });
  });

  describe("isValidTheme", () => {
    it("returns true for valid themes", () => {
      expect(isValidTheme("lush_lake")).toBe(true);
      expect(isValidTheme("deep_cosmos")).toBe(true);
    });

    it("returns false for invalid themes", () => {
      expect(isValidTheme("invalid_theme" as any)).toBe(false);
      expect(isValidTheme("" as any)).toBe(false);
    });
  });

  describe("getThemeNames", () => {
    it("returns array of theme IDs", () => {
      const names = getThemeNames();
      expect(names).toBeInstanceOf(Array);
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain("lush_lake");
    });
  });

  describe("getAllThemes", () => {
    it("returns array of theme objects", () => {
      const themes = getAllThemes();
      expect(themes).toBeInstanceOf(Array);
      expect(themes[0]).toHaveProperty("id");
      expect(themes[0]).toHaveProperty("name");
    });
  });

  describe("Dark Mode / AMOLED", () => {
    it("night palettes have AMOLED variants", () => {
      Object.values(THEME_REGISTRY).forEach((theme) => {
        expect(theme.palettes.night).toHaveProperty("amoled");
        
        const amoled = theme.palettes.night.amoled;
        if (amoled) {
          expect(amoled).toHaveProperty("sky");
          expect(amoled).toHaveProperty("horizon");
          expect(amoled).toHaveProperty("ground");
        }
      });
    });
  });
});
```

**File: `__tests__/components/StatusCard.test.tsx`**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import StatusCard from "@/components/StatusCard";

describe("StatusCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders time and date", () => {
    render(
      <StatusCard
        time="14:30:00"
        date="January 15, 2024"
        status="working"
      />
    );

    expect(screen.getByText("14:30:00")).toBeInTheDocument();
    expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
  });

  it("displays working status correctly", () => {
    render(
      <StatusCard
        time="14:30:00"
        date="January 15, 2024"
        status="working"
      />
    );

    expect(screen.getByText(/working/i)).toBeInTheDocument();
  });

  it("displays away status correctly", () => {
    render(
      <StatusCard
        time="22:00:00"
        date="January 15, 2024"
        status="away"
      />
    );

    expect(screen.getByText(/away/i)).toBeInTheDocument();
  });

  it("cycles through activity items", async () => {
    render(
      <StatusCard
        time="14:30:00"
        date="January 15, 2024"
        status="working"
      />
    );

    const initialText = screen.getByText(/Debugging|Diving into new repos|Deploying code/);
    expect(initialText).toBeInTheDocument();

    // Advance time by 3 seconds
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      const afterText = screen.queryByText(initialText.textContent!);
      // Text should have changed or may be animating
      expect(screen.getByRole("heading")).toBeInTheDocument();
    });
  });

  it("applies custom palette colors", () => {
    const customPalette = {
      sky: ["#FF0000", "#00FF00"],
      horizon: "#0000FF",
      ground: "#FFFF00",
      primary: "#FF00FF",
      secondary: "#00FFFF",
    };

    const { container } = render(
      <StatusCard
        time="14:30:00"
        date="January 15, 2024"
        status="working"
        palette={customPalette}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
```

**File: `__tests__/components/Controls.test.tsx`**
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Controls from "@/components/Controls";

describe("Controls", () => {
  const mockProps = {
    visualTimeOverride: null,
    onVisualTimeChange: vi.fn(),
    onSaveScenery: vi.fn(),
    onRandomizeScenery: vi.fn(),
    onRandomizeAll: vi.fn(),
    darkModeEnabled: false,
    onToggleDarkMode: vi.fn(),
    currentTheme: "lush_lake" as const,
    onThemeChange: vi.fn(),
  };

  it("renders scene controls header", () => {
    render(<Controls {...mockProps} />);
    expect(screen.getByText(/scene controls/i)).toBeInTheDocument();
  });

  it("toggles controls panel", () => {
    render(<Controls {...mockProps} />);
    
    const toggleButton = screen.getByRole("button", { name: /toggle scene controls/i });
    fireEvent.click(toggleButton);

    // Panel should expand and show controls
    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  it("calls onVisualTimeChange when preset is selected", () => {
    render(<Controls {...mockProps} />);
    
    // Open panel
    const toggleButton = screen.getByRole("button", { name: /toggle scene controls/i });
    fireEvent.click(toggleButton);

    // Click morning preset
    const morningButton = screen.getByRole("button", { name: /morning/i });
    fireEvent.click(morningButton);

    expect(mockProps.onVisualTimeChange).toHaveBeenCalledWith("day");
  });

  it("calls onSaveScenery when save button is clicked", () => {
    render(<Controls {...mockProps} />);
    
    // Open panel
    fireEvent.click(screen.getByRole("button", { name: /toggle scene controls/i }));

    // Click save button
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockProps.onSaveScenery).toHaveBeenCalled();
  });

  it("calls onRandomizeScenery when randomize button is clicked", () => {
    render(<Controls {...mockProps} />);
    
    fireEvent.click(screen.getByRole("button", { name: /toggle scene controls/i }));

    const randomizeButton = screen.getByRole("button", { name: /randomize scenery/i });
    fireEvent.click(randomizeButton);

    expect(mockProps.onRandomizeScenery).toHaveBeenCalled();
  });

  it("calls onToggleDarkMode when dark mode button is clicked", () => {
    render(<Controls {...mockProps} />);
    
    fireEvent.click(screen.getByRole("button", { name: /toggle scene controls/i }));

    const darkModeButton = screen.getByRole("button", { name: /dark mode/i });
    fireEvent.click(darkModeButton);

    expect(mockProps.onToggleDarkMode).toHaveBeenCalled();
  });

  it("shows loading state when saving", () => {
    render(<Controls {...mockProps} onSaveLoading={true} />);
    
    fireEvent.click(screen.getByRole("button", { name: /toggle scene controls/i }));

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it("shows error state when save fails", () => {
    render(<Controls {...mockProps} onSaveError="Failed to save" />);
    
    fireEvent.click(screen.getByRole("button", { name: /toggle scene controls/i }));

    expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
  });
});
```

**File: `__tests__/hooks/usePageVisibility.test.ts`**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePageVisibility } from "@/lib/hooks/usePageVisibility";

describe("usePageVisibility", () => {
  let visibilityCallback: () => void;

  beforeEach(() => {
    visibilityCallback = vi.fn();
  });

  it("calls callback when page becomes visible", () => {
    renderHook(() => usePageVisibility(visibilityCallback));

    // Simulate visibility change
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(visibilityCallback).toHaveBeenCalled();
  });

  it("does not call callback when page becomes hidden", () => {
    renderHook(() => usePageVisibility(visibilityCallback));

    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: true,
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(visibilityCallback).not.toHaveBeenCalled();
  });
});
```

**File: `__tests__/integration/theme-switching.test.tsx`**
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/app/page";

describe("Theme Switching Integration", () => {
  it("switches themes correctly", async () => {
    render(<Home />);

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByText(/scene controls/i)).toBeInTheDocument();
    });

    // Open controls
    fireEvent.click(screen.getByRole("button", { name: /toggle scene controls/i }));

    // Should render with default theme (lush_lake)
    expect(screen.getByText(/lush lake/i)).toBeInTheDocument();

    // Open theme selector
    const themeButton = screen.getByRole("button", { name: /lush lake/i });
    fireEvent.click(themeButton);

    // Select different theme
    const deepCosmosOption = screen.getByText(/deep cosmos/i);
    fireEvent.click(deepCosmosOption);

    // Wait for theme to change
    await waitFor(() => {
      expect(screen.getByText(/deep cosmos/i)).toBeInTheDocument();
    });
  });

  it("randomizes theme and scenery", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/scene controls/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /toggle scene controls/i }));

    // Click randomize all
    const randomizeButton = screen.getByRole("button", { name: /randomize all/i });
    fireEvent.click(randomizeButton);

    // Component should re-render with new theme/variant
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
```

**File: `.github/workflows/test.yml`**
```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20.x"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Summary

### Dependencies to Install

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend - Backend integration
npm install socket.io-client swr

# Frontend - Web Workers
npm install --save-dev worker-loader

# Frontend - Testing
npm install --save-dev vitest @vitest/ui @testing-library/react \
  @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

### Directory Structure After Implementation

```
status-site/
├── app/
│   └── page.tsx (updated with live status)
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── components/
│   ├── LiveStatusCard.tsx (new)
│   ├── StatusCard.tsx (updated)
│   └── Controls.tsx
├── lib/
│   ├── hooks/
│   │   ├── useStatusPolling.ts (new)
│   │   ├── useStatusWebSocket.ts (new)
│   │   ├── useSceneWorker.ts (new)
│   │   └── ...
│   └── themes/
│       ├── lushLake.worker.tsx (new - optional)
│       └── ...
├── workers/
│   └── sceneGenerator.worker.ts (new)
├── __tests__/
│   ├── components/
│   ├── hooks/
│   ├── integration/
│   └── lib/
├── vitest.config.ts (new)
├── vitest.setup.ts (new)
└── IMPLEMENTATION_GUIDE.md (this file)
```

### Next Steps

1. **Backend**: Set up FastAPI backend with integrations
2. **Frontend**: Integrate live status hooks into StatusCard
3. **Workers**: Migrate heavy generation to Web Workers
4. **Testing**: Add test suites and CI integration
5. **Deploy**: Deploy backend (Railway/Fly.io) and update frontend env vars
