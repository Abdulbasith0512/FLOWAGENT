"""SQLAlchemy Core tables mirroring web/src/db/schema.ts (Drizzle owns migrations)."""

from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    MetaData,
    Numeric,
    Table,
    Text,
)
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID

metadata = MetaData()

run_status = ENUM(
    "pending",
    "running",
    "paused",
    "done",
    "error",
    name="run_status",
    create_type=False,
)

run_event_type = ENUM(
    "node_start",
    "node_finish",
    "node_error",
    "run_status",
    "interrupt",
    "approved",
    "denied",
    "log",
    name="run_event_type",
    create_type=False,
)

users = Table(
    "user",
    metadata,
    Column("id", Text, primary_key=True),
    Column("name", Text, nullable=False),
    Column("email", Text, nullable=False, unique=True),
)

workspaces = Table(
    "workspaces",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("name", Text, nullable=False),
    Column("slug", Text, nullable=False, unique=True),
    Column("owner_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("personal", Boolean, nullable=False),
    Column("monthly_budget_usd", Numeric(12, 2)),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

memberships = Table(
    "memberships",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("workspace_id", UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("role", Text, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

workflow_permissions = Table(
    "workflow_permissions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("workflow_id", UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("role", Text, nullable=False),
)

comments = Table(
    "comments",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("workflow_id", UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("body", Text, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

workflows = Table(
    "workflows",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("workspace_id", UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("name", Text, nullable=False),
    Column("slug", Text, nullable=False),
    Column("description", Text, nullable=False),
    Column("graph", JSONB, nullable=False),
    Column("published_graph", JSONB),
    Column("published_at", DateTime(timezone=True)),
    Column("mcp_key", Text),
    Column("mcp_inputs", JSONB),
    Column("is_public", Boolean, nullable=False),
    Column("source_workflow_id", UUID(as_uuid=True)),
    Column("schema_version", Integer, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

credentials = Table(
    "credentials",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("name", Text, nullable=False),
    Column("slug", Text, nullable=False),
    Column("type", Text, nullable=False),
    Column("ciphertext", Text, nullable=False),
    Column("scope", Text, nullable=False),
    Column("workspace_id", UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("last_used_at", DateTime(timezone=True)),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

runs = Table(
    "runs",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("workflow_id", UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("workspace_id", UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("status", run_status, nullable=False),
    Column("input", JSONB),
    Column("output", JSONB),
    Column("error", Text),
    Column("idempotency_key", Text),
    Column("cost_usd", Numeric(12, 6)),
    Column("tokens_total", Integer),
    Column("started_at", DateTime(timezone=True), nullable=False),
    Column("finished_at", DateTime(timezone=True)),
)

run_events = Table(
    "run_events",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("run_id", UUID(as_uuid=True), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False),
    Column("node_id", Text, nullable=False),
    Column("type", run_event_type, nullable=False),
    Column("payload", JSONB),
    Column("duration_ms", Integer),
    Column("cost_usd", Numeric(12, 6)),
    Column("tokens", Integer),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

failed_runs = Table(
    "failed_runs",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("run_id", UUID(as_uuid=True), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False),
    Column("workflow_id", UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False),
    Column("node_id", Text, nullable=False),
    Column("error", Text, nullable=False),
    Column("retry_count", Integer, nullable=False),
    Column("state", JSONB),
    Column("resolved", Boolean, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

memories = Table(
    "memories",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("namespace", Text, nullable=False),
    Column("content", Text, nullable=False),
    Column("embedding", Text),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

triggers = Table(
    "triggers",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("workflow_id", UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", Text, ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
    Column("type", Text, nullable=False),
    Column("cron", Text),
    Column("webhook_secret", Text),
    Column("enabled", Boolean, nullable=False),
    Column("last_fired_at", DateTime(timezone=True)),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

mcp_tool_invocations = Table(
    "mcp_tool_invocations",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("workflow_id", UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False),
    Column("tool_name", Text, nullable=False),
    Column("status", Text, nullable=False),
    Column("duration_ms", Integer),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

node_output_cache = Table(
    "node_output_cache",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("cache_key", Text, nullable=False, unique=True),
    Column("output", JSONB, nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)
