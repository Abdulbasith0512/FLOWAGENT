"""Runs untrusted Python in a locked-down Docker container.

Isolation: no network, read-only root, dropped capabilities, memory/cpu/pid limits,
non-root user, hard timeout with container removal. Falls back to a restricted
subprocess only when Docker is unavailable (clearly logged, not for production).
"""

from __future__ import annotations

import asyncio
import shutil

from app.logging_config import get_logger
from app.settings import get_settings

log = get_logger("flowagent.sandbox")


class SandboxError(Exception):
    pass


_DOCKER_AVAILABLE: bool | None = None


def _docker_available() -> bool:
    global _DOCKER_AVAILABLE
    if _DOCKER_AVAILABLE is None:
        _DOCKER_AVAILABLE = shutil.which("docker") is not None
    return _DOCKER_AVAILABLE


def _docker_args(image: str, timeout: int) -> list[str]:
    return [
        "docker",
        "run",
        "--rm",
        "--interactive",
        "--network",
        "none",
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--user",
        "65534:65534",
        "--memory",
        "256m",
        "--memory-swap",
        "256m",
        "--cpus",
        "1",
        "--pids-limit",
        "64",
        image,
        "python",
        "-I",
        "-",
    ]


async def run_python(code: str, timeout: int) -> str:
    settings = get_settings()
    if _docker_available():
        return await _run_docker(code, timeout, settings.sandbox_image)
    log.warning("sandbox.no_docker_fallback_subprocess")
    return await _run_subprocess(code, timeout)


async def _run_docker(code: str, timeout: int, image: str) -> str:
    proc = await asyncio.create_subprocess_exec(
        *_docker_args(image, timeout),
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(code.encode()), timeout=timeout + 5
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        log.warning("sandbox.timeout", timeout=timeout)
        return f"[error] timed out after {timeout}s"
    log.info("sandbox.done", exit=proc.returncode)
    if proc.returncode != 0:
        raise SandboxError(stderr.decode().strip() or "code exited non-zero")
    return stdout.decode().strip()


async def _run_subprocess(code: str, timeout: int) -> str:
    proc = await asyncio.create_subprocess_exec(
        "python",
        "-I",
        "-c",
        code,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        raise SandboxError(f"timed out after {timeout}s") from None
    if proc.returncode != 0:
        raise SandboxError(stderr.decode().strip() or "code exited non-zero")
    return stdout.decode().strip()
