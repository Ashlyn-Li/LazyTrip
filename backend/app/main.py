from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.modules.trips.router import router as trips_router
from app.system.router import router as system_router

app = FastAPI(title="LazyTrip API", version="0.1.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_frontend_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)

app.include_router(system_router, prefix="/api/v1")
app.include_router(trips_router, prefix="/api/v1")
