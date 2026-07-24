# Deployment

## Environments

- Local: Docker Compose with Postgres and Redis.
- Staging: same stack with non-production secrets.
- Production: managed Postgres, Redis, and a hosted app runtime.

## Checklist

- Configure environment variables.
- Run database migrations.
- Verify the web app, backend, and MCP server start correctly.
