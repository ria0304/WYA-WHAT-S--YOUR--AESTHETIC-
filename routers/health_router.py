from fastapi import APIRouter
from datetime import datetime
import time

router = APIRouter(prefix="/health", tags=["health"])

# Track startup time
startup_time = time.time()

@router.get("")
async def health_check():
    """Liveness probe - returns if the app is running"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/ready")
async def readiness_check():
    """Readiness probe - checks if the app is ready to serve traffic"""
    # Add database check here if needed
    return {
        "status": "ready",
        "database": "connected"
    }

@router.get("/info")
async def health_info():
    """Returns build and deployment information"""
    uptime_seconds = int(time.time() - startup_time)
    return {
        "version": "1.0.0",
        "uptime_seconds": uptime_seconds,
        "environment": "production"
    }
