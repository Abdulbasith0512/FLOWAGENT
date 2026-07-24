FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

EXPOSE 8001

ENV FASTMCP_SHOW_SERVER_BANNER=false
CMD ["uv", "run", "--no-dev", "python", "-m", "server"]
