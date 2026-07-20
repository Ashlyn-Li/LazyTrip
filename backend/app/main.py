from fastapi import FastAPI

from app.modules.trips.router import router as trips_router
from app.system.router import router as system_router

app = FastAPI(title="LazyTrip API", version="0.1.0")

app.include_router(system_router, prefix="/api/v1")
app.include_router(trips_router, prefix="/api/v1")
