"""FlowAgent execution-engine FastAPI app."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import asyncio

from app.logging_config import configure_logging, get_logger
from app.routes.approve import router as approve_router
from app.routes.generate import router as generate_router
from app.routes.replay import router as replay_router
from app.routes.run import router as run_router
from app.routes.runs_extra import router as runs_extra_router
from app.routes.triggers import router as triggers_router
from app.settings import get_settings
from app.triggers.scheduler import scheduler_loop

configure_logging()
log = get_logger("flowagent.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    log.info(
        "backend.startup",
        checkpointer="redis" if settings.use_redis_checkpointer else "memory",
        search_enabled=settings.search_enabled,
        email_enabled=settings.email_enabled,
    )
    scheduler_task = asyncio.create_task(scheduler_loop())
    yield
    scheduler_task.cancel()
    log.info("backend.shutdown")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.service_name, version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, object]:
        return {
            "ok": True,
            "service": "backend",
            "service_name": settings.service_name,
            "environment": settings.environment_name,
            "checkpointer": "redis" if settings.use_redis_checkpointer else "memory",
        }

    app.include_router(run_router)
    app.include_router(approve_router)
    app.include_router(replay_router)
    app.include_router(runs_extra_router)
    app.include_router(triggers_router)
    app.include_router(generate_router)
    return app


app = create_app()
