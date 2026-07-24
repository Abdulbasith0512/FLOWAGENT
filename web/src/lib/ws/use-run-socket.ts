"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NodeStatus } from "@/components/canvas/base-node";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

const MAX_RECONNECT_ATTEMPTS = 6;
const MAX_RECONNECT_DELAY_MS = 5000;

export interface RunEvent {
  id?: string;
  nodeId: string;
  type: string;
  payload: Record<string, unknown> | null;
}

export type RunStatus = "idle" | "running" | "paused" | "done" | "error";

function isTerminal(status: RunStatus): boolean {
  return status === "done" || status === "error";
}

export interface RunError {
  message: string;
  nodeId?: string;
}

export function useRunSocket() {
  const [statuses, setStatuses] = useState<Record<string, NodeStatus>>({});
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runError, setRunError] = useState<RunError | null>(null);
  const [outputs, setOutputs] = useState<Record<string, unknown>>({});
  const [runDegraded, setRunDegraded] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runStatusRef = useRef<RunStatus>("idle");
  const intentionalCloseRef = useRef(false);

  const setRunStatusTracked = useCallback((status: RunStatus) => {
    runStatusRef.current = status;
    setRunStatus(status);
  }, []);

  const applyEvent = useCallback(
    (event: RunEvent) => {
      if (event.type === "run_status") {
        const status = (event.payload?.status as RunStatus) ?? "running";
        setRunStatusTracked(status);
        if (status === "error") {
          const message = (event.payload?.error as string) ?? "The run failed.";
          setRunError({ message });
        }
        return;
      }
      if (event.type === "node_error") {
        const message = (event.payload?.error as string) ?? "Node failed.";
        setRunError({ message, nodeId: event.nodeId });
      }
      const degraded = event.payload?.degraded === true;
      if (event.type === "node_finish") {
        const vars = event.payload?.vars as Record<string, unknown> | undefined;
        if (vars && Object.keys(vars).length > 0) {
          setOutputs((prev) => ({ ...prev, ...vars }));
        }
        if (degraded) setRunDegraded(true);
      }
      const next: NodeStatus | null =
        event.type === "node_start"
          ? "running"
          : event.type === "node_finish"
            ? degraded
              ? "warning"
              : "done"
            : event.type === "node_error"
              ? "error"
              : event.type === "interrupt"
                ? "pending"
                : null;
      if (next) {
        setStatuses((prev) => ({ ...prev, [event.nodeId]: next }));
      }
    },
    [setRunStatusTracked],
  );

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(
    (id: string) => {
      intentionalCloseRef.current = true;
      socketRef.current?.close();
      intentionalCloseRef.current = false;

      const cursor = lastEventIdRef.current;
      const url = cursor
        ? `${WS_URL}/ws/runs/${id}?after=${encodeURIComponent(cursor)}`
        : `${WS_URL}/ws/runs/${id}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data?.type === "ping") {
          return;
        }
        if (typeof data?.id === "string") {
          lastEventIdRef.current = data.id;
        }
        applyEvent(data as RunEvent);
      };

      ws.onclose = (event) => {
        if (intentionalCloseRef.current) {
          return;
        }
        if (isTerminal(runStatusRef.current)) {
          return;
        }
        if (event.code === 1000) {
          return;
        }
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          return;
        }
        const attempt = reconnectAttemptsRef.current;
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(500 * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => connect(id), delay);
      };

      socketRef.current = ws;
    },
    [applyEvent, clearReconnectTimer],
  );

  const startRun = useCallback(
    async (workflowId: string, input: string) => {
      clearReconnectTimer();
      reconnectAttemptsRef.current = 0;
      lastEventIdRef.current = null;
      setStatuses({});
      setRunError(null);
      setOutputs({});
      setRunDegraded(false);
      setRunStatusTracked("running");
      const res = await fetch(`${API_URL}/run/${workflowId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const detail =
          res.status === 429
            ? "Monthly budget exceeded for this workspace."
            : `Could not start the run (${res.status}).`;
        setRunStatusTracked("error");
        setRunError({ message: detail });
        return null;
      }
      const data = await res.json();
      setRunId(data.run_id);
      connect(data.run_id);
      return data.run_id as string;
    },
    [connect, clearReconnectTimer, setRunStatusTracked],
  );

  useEffect(
    () => () => {
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      socketRef.current?.close();
    },
    [clearReconnectTimer],
  );

  return { statuses, runStatus, runError, runDegraded, outputs, runId, startRun };
}
