# Pointing FlowAgent at Supabase Postgres

FlowAgent ships with a local Docker Postgres (`pnpm db:up`). To run against a
Supabase-hosted Postgres instead, you only need to change `DATABASE_URL`. The
schema, migrations, and application code stay the same.

## 1. Get the connection string

In the Supabase dashboard open Project Settings, then Database, then Connection
string. Use the Transaction pooler string (port 6543), which looks like:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

The transaction pooler is recommended for serverless and short-lived
connections. The web client in `web/src/db/index.ts` already passes
`prepare: false` to `postgres-js`, which the transaction pooler requires
because it does not support prepared statements.

The backend connects with asyncpg using the same `DATABASE_URL`, so no
backend changes are needed.

## 2. Set the environment variable

In your `.env`, replace the local value:

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

## 3. Run migrations

Apply the Drizzle migrations against Supabase:

```
pnpm db:migrate
```

This runs `drizzle-kit migrate` in the web workspace and creates all tables in
the Supabase database.

## 4. Redis is still separate

Supabase provides Postgres only. The run queue and live WebSocket event bridge
still require Redis. Point `REDIS_URL` and `QUEUE_REDIS_URL` at a managed Redis
such as Upstash:

```
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379
QUEUE_REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379
```

If you leave Redis unset and set `USE_QUEUE=false`, FlowAgent falls back to
in-process execution with an in-memory checkpointer, which is fine for a local
demo but not for durable production runs.
