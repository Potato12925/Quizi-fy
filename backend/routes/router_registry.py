from fastapi import FastAPI

from routes.database_route import router as database_router
from routes.health_route import router as health_router


def register_routes(app: FastAPI) -> None:
    app.include_router(health_router, prefix="/api/v1", tags=["Health"])
    app.include_router(database_router, prefix="/api/v1", tags=["Database"])
