from fastapi import FastAPI

from controllers.auth_controller import router as auth_router
from controllers.database_controller import router as database_router
from controllers.health_controller import router as health_router


def register_routes(app: FastAPI) -> None:
    app.include_router(
        health_router,
        prefix="/api/v1",
    )

    app.include_router(
        database_router,
        prefix="/api/v1",
    )

    app.include_router(
        auth_router,
        prefix="/api/v1",
    )