"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "@/components/canvas/node-types";
import type { NodeStatus } from "@/components/canvas/base-node";
import { SCENARIOS, type ScenarioId } from "@/components/marketing/scenarios";

export type HeroCanvasHandle = {
  play: (id: ScenarioId) => void;
};

const DEFAULT_SCENARIO: ScenarioId = "research";

const HeroCanvasInner = forwardRef<HeroCanvasHandle>(function HeroCanvasInner(
  _props,
  ref,
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();
  const interacted = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)),
    [setEdges],
  );

  const setStatus = useCallback(
    (id: string, status: NodeStatus) =>
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, status } } : n,
        ),
      ),
    [setNodes],
  );

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const refit = useCallback(() => {
    timers.current.push(
      setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 60),
    );
  }, [fitView]);

  const play = useCallback(
    (id: ScenarioId) => {
      const scene = SCENARIOS[id];
      if (!scene) return;
      clearTimers();
      setNodes([]);
      setEdges([]);

      let t = 200;
      scene.nodes.forEach((n) => {
        timers.current.push(
          setTimeout(() => {
            setNodes((nds) => [...nds, { ...n, data: { ...n.data, status: "idle" } }]);
            refit();
          }, t),
        );
        t += 220;
      });

      scene.edges.forEach((e) => {
        timers.current.push(
          setTimeout(() => setEdges((eds) => [...eds, { ...e, animated: true }]), t),
        );
        t += 160;
      });

      t += 250;
      scene.sequence.forEach((nodeId) => {
        timers.current.push(setTimeout(() => setStatus(nodeId, "running"), t));
        t += 550;
        timers.current.push(setTimeout(() => setStatus(nodeId, "done"), t));
        t += 250;
      });
    },
    [clearTimers, refit, setEdges, setNodes, setStatus],
  );

  useImperativeHandle(
    ref,
    () => ({
      play: (id) => {
        interacted.current = true;
        play(id);
      },
    }),
    [play],
  );

  const stopAutoplay = useCallback(() => {
    interacted.current = true;
  }, []);

  useEffect(() => {
    play(DEFAULT_SCENARIO);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStart={stopAutoplay}
      onPointerDown={stopAutoplay}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      nodesDraggable
      nodesConnectable
      elementsSelectable
      zoomOnScroll={false}
      panOnScroll={false}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={["Backspace", "Delete"]}
    >
      <Background variant={BackgroundVariant.Cross} gap={28} color="var(--color-grid)" />
      <Controls showInteractive={false} className="border-border! bg-surface!" />
    </ReactFlow>
  );
});

export const HeroCanvas = forwardRef<HeroCanvasHandle>(function HeroCanvas(_p, ref) {
  return (
    <ReactFlowProvider>
      <HeroCanvasInner ref={ref} />
    </ReactFlowProvider>
  );
});
