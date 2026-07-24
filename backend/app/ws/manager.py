"""WebSocket connection manager keyed by run_id, bridged across processes via Redis pub/sub."""

from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

from app.logging_config import get_logger
from app.settings import get_settings

log = get_logger("flowagent.ws")

HEARTBEAT_INTERVAL_SECONDS = 15


def _channel(run_id: str) -> str:
    return f"flowagent:run:{run_id}"


class RunSocketManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._subscribers: dict[str, asyncio.Task[None]] = {}
        self._heartbeats: dict[WebSocket, asyncio.Task[None]] = {}
        self._lock = asyncio.Lock()
        self._redis = None

    def _get_redis(self):
        settings = get_settings()
        if not settings.use_queue:
            return None
        if self._redis is None:
            from redis import asyncio as aioredis

            self._redis = aioredis.from_url(settings.queue_redis_url)
        return self._redis

    async def connect(self, run_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[run_id].add(websocket)
            if run_id not in self._subscribers and self._get_redis() is not None:
                self._subscribers[run_id] = asyncio.create_task(self._subscribe(run_id))
            self._heartbeats[websocket] = asyncio.create_task(
                self._heartbeat(run_id, websocket)
            )

    async def disconnect(self, run_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[run_id].discard(websocket)
            heartbeat = self._heartbeats.pop(websocket, None)
            if not self._connections[run_id]:
                self._connections.pop(run_id, None)
                task = self._subscribers.pop(run_id, None)
                if task:
                    task.cancel()
        if heartbeat:
            heartbeat.cancel()

    async def _heartbeat(self, run_id: str, websocket: WebSocket) -> None:
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    await self.disconnect(run_id, websocket)
                    return
        except asyncio.CancelledError:
            pass

    async def broadcast(self, run_id: str, event: dict[str, Any]) -> None:
        redis = self._get_redis()
        if redis is not None:
            try:
                await redis.publish(_channel(run_id), json.dumps(event))
                return
            except Exception as exc:
                log.warning("ws.redis_publish_failed", error=str(exc))
        await self._deliver_local(run_id, event)

    async def _deliver_local(self, run_id: str, event: dict[str, Any]) -> None:
        async with self._lock:
            targets = list(self._connections.get(run_id, set()))
        dead: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(event)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(run_id, ws)

    async def _subscribe(self, run_id: str) -> None:
        redis = self._get_redis()
        if redis is None:
            return
        pubsub = redis.pubsub()
        await pubsub.subscribe(_channel(run_id))
        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                event = json.loads(message["data"])
                await self._deliver_local(run_id, event)
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(_channel(run_id))
            await pubsub.aclose()


manager = RunSocketManager()
