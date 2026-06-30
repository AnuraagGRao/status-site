from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional
import asyncio
import httpx
import os
from pydantic import BaseModel
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

# ── Models ──────────────────────────────────────────────────────────

class StatusResponse(BaseModel):
    status: str  # "working" | "away"
    activity: Optional[str] = None
    spotify: Optional[dict] = None
    github: Optional[dict] = None
    gaming: Optional[dict] = None
    timestamp: str

# ── WebSocket Connection Manager ───────────────────────────────────

class ConnectionManager:
    """Manages WebSocket connections"""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """Broadcast data to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                print(f"Error sending to client: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# ── Service Integration Functions ──────────────────────────────────

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

async def get_github_activity(username: str, token: Optional[str] = None) -> Optional[dict]:
    """Fetch recent commit activity from GitHub"""
    if not username:
        return None
        
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://api.github.com/users/{username}/events/public",
                headers=headers,
                timeout=3.0
            )
            if response.status_code == 200:
                events = response.json()
                push_events = [e for e in events if e["type"] == "PushEvent"]
                if push_events:
                    latest = push_events[0]
                    commits = latest["payload"].get("commits", [])
                    return {
                        "repo": latest["repo"]["name"],
                        "commits": len(commits),
                        "message": commits[0]["message"] if commits else "No message",
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
    
    # Get credentials from environment
    spotify_token = os.getenv("SPOTIFY_ACCESS_TOKEN")
    github_username = os.getenv("GITHUB_USERNAME")
    github_token = os.getenv("GITHUB_TOKEN")
    
    # Fetch integrations in parallel
    spotify_task = get_spotify_status(spotify_token)
    github_task = get_github_activity(github_username, github_token)
    
    spotify_data, github_data = await asyncio.gather(
        spotify_task, 
        github_task,
        return_exceptions=True
    )
    
    # Handle exceptions
    if isinstance(spotify_data, Exception):
        print(f"Spotify error: {spotify_data}")
        spotify_data = None
    if isinstance(github_data, Exception):
        print(f"GitHub error: {github_data}")
        github_data = None
    
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
        gaming=None,  # TODO: Implement gaming integration
        timestamp=datetime.now().isoformat()
    )

# ── Background Task ────────────────────────────────────────────────

async def broadcast_status_updates():
    """Background task to broadcast status updates every 30 seconds"""
    while True:
        await asyncio.sleep(30)
        if manager.active_connections:
            try:
                status = await get_current_status()
                await manager.broadcast(status.model_dump())
                print(f"Broadcasted status to {len(manager.active_connections)} clients")
            except Exception as e:
                print(f"Error broadcasting status: {e}")

# ── FastAPI App Setup ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background task
    print("Starting background broadcast task...")
    task = asyncio.create_task(broadcast_status_updates())
    yield
    # Shutdown: Cancel background task
    print("Stopping background broadcast task...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Status Site API",
    description="Backend API for live status updates",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Endpoints ──────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "Status Site API",
        "version": "1.0.0",
        "endpoints": {
            "status": "/api/status",
            "websocket": "/ws/status",
            "health": "/health"
        }
    }

@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    """REST endpoint for status polling"""
    return await get_current_status()

@app.websocket("/ws/status")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        # Send initial status
        status = await get_current_status()
        await websocket.send_json(status.model_dump())
        
        # Keep connection alive and handle pings
        while True:
            # Wait for client ping or message
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "connections": len(manager.active_connections)
    }

# ── Run with: uvicorn main:app --reload --port 8000 ───────────────
