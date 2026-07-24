"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import { nodeTypes } from "./node-types";
import type { FlowNodeData } from "./node-types";
import { Palette } from "./palette";
import { ConfigSidebar } from "./config-sidebar";
import { RunOutputPanel } from "./run-output-panel";
import { RunHistory } from "./run-history";
import { RightSidebar, type SidebarTab } from "./right-sidebar";
import { isErrorValue } from "./ui";
import { OnboardingChecklist } from "./onboarding-checklist";
import { PublishDialog } from "./publish-dialog";
import { CanvasToolbar } from "./canvas-toolbar";
import { CommandPalette, type CommandActions } from "./command-palette";
import { ContextMenu, type ContextMenuState } from "./context-menu";
import { NodeSearch } from "./node-search";
import { useUndoRedo } from "./use-undo-redo";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { layoutGraph } from "./auto-layout";
import { zoomToNode } from "./zoom-to-node";
import { defaultConfig, NODE_SPECS } from "@/lib/workflow/registry";
import type { NodeType } from "@/lib/workflow/types";
import { useRunSocket, type RunError, type RunStatus } from "@/lib/ws/use-run-socket";

interface Props {
  workflowId: string;
  slug: string;
  initialName: string;
  initialDescription: string;
  initialPublished: boolean;
  initialUnpublishedChanges: boolean;
  initialHasRuns: boolean;
  initialNodes: Node[];
  initialEdges: Edge[];
}

const PASTE_OFFSET = 32;

function CanvasInner({
  workflowId,
  slug,
  initialName,
  initialDescription,
  initialPublished,
  initialUnpublishedChanges,
  initialHasRuns,
  initialNodes,
  initialEdges,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [unpublishedChanges, setUnpublishedChanges] = useState(
    initialUnpublishedChanges,
  );
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("inspector");
  const [published, setPublished] = useState(initialPublished);
  const [publishOpen, setPublishOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const clipboard = useRef<Node[]>([]);
  const runRef = useRef<(() => void) | null>(null);

  const { screenToFlowPosition, fitView, setCenter } = useReactFlow();
  const { statuses, runStatus, runError, runDegraded, outputs, runId, startRun } =
    useRunSocket();

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const baselineRef = useRef(serializeGraph(initialNodes, initialEdges));
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    if (serializeGraph(nodes, edges) !== baselineRef.current) {
      setDirty(true);
      setUnpublishedChanges(true);
    }
  }, [nodes, edges]);

  const { takeSnapshot, undo, redo } = useUndoRedo({
    getGraph: () => ({ nodes: nodesRef.current, edges: edgesRef.current }),
    setGraph: ({ nodes: n, edges: e }) => {
      setNodes(n);
      setEdges(e);
    },
  });

  const styledNodes = useMemo(
    () =>
      nodes.map((n) =>
        n.type === "note"
          ? n
          : { ...n, data: { ...n.data, status: statuses[n.id] ?? "idle" } },
      ),
    [nodes, statuses],
  );

  const styledEdges = useMemo(
    () =>
      edges.map((e) =>
        statuses[e.source] === "running"
          ? { ...e, animated: true, style: { stroke: "var(--color-run)" } }
          : e,
      ),
    [edges, statuses],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, takeSnapshot],
  );

  const insertNode = useCallback(
    (type: NodeType, position: { x: number; y: number }) => {
      takeSnapshot();
      const newNode: Node = {
        id: nanoid(8),
        type,
        position,
        data: { config: defaultConfig(type) },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedId(newNode.id);
    },
    [setNodes, takeSnapshot],
  );

  const centerPosition = useCallback(() => {
    const bounds = wrapper.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return screenToFlowPosition({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    });
  }, [screenToFlowPosition]);

  const addNoteNode = useCallback(() => {
    takeSnapshot();
    const noteNode: Node = {
      id: nanoid(8),
      type: "note",
      position: centerPosition(),
      width: 220,
      height: 140,
      data: { kind: "note", text: "", color: "amber" },
    };
    setNodes((nds) => nds.concat(noteNode));
  }, [centerPosition, setNodes, takeSnapshot]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(
        "application/flowagent-node",
      ) as NodeType;
      if (!type) return;
      insertNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [screenToFlowPosition, insertNode],
  );

  const updateConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      takeSnapshot();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
        ),
      );
    },
    [setNodes, takeSnapshot],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
      setSelectedId((current) => (current === nodeId ? null : current));
    },
    [setNodes, setEdges, takeSnapshot],
  );

  const deleteSelected = useCallback(() => {
    const selectedNodeIds = new Set(
      nodesRef.current.filter((n) => n.selected).map((n) => n.id),
    );
    if (selectedId) selectedNodeIds.add(selectedId);
    if (selectedNodeIds.size === 0) return;
    takeSnapshot();
    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
      ),
    );
    setSelectedId(null);
  }, [selectedId, setNodes, setEdges, takeSnapshot]);

  const duplicateNodes = useCallback(
    (sources: Node[]) => {
      if (sources.length === 0) return;
      takeSnapshot();
      const copies = sources.map((n) => ({
        ...n,
        id: nanoid(8),
        position: { x: n.position.x + PASTE_OFFSET, y: n.position.y + PASTE_OFFSET },
        selected: false,
        data: { ...n.data },
      }));
      setNodes((nds) =>
        nds.map((n) => ({ ...n, selected: false })).concat(copies),
      );
    },
    [setNodes, takeSnapshot],
  );

  const copySelected = useCallback(() => {
    const selected = nodesRef.current.filter(
      (n) => n.selected || n.id === selectedId,
    );
    clipboard.current = selected.map((n) => ({ ...n, data: { ...n.data } }));
  }, [selectedId]);

  const pasteClipboard = useCallback(() => {
    duplicateNodes(clipboard.current);
  }, [duplicateNodes]);

  const duplicateSelected = useCallback(() => {
    duplicateNodes(
      nodesRef.current.filter((n) => n.selected || n.id === selectedId),
    );
  }, [duplicateNodes, selectedId]);

  const selectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  const deselect = useCallback(() => {
    setSelectedId(null);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    setMenu(null);
    setCommandOpen(false);
    setSearchOpen(false);
  }, [setNodes]);

  const applyAutoLayout = useCallback(() => {
    takeSnapshot();
    setNodes(layoutGraph(nodesRef.current, edgesRef.current));
    requestAnimationFrame(() => fitView({ duration: 400, padding: 0.2 }));
  }, [setNodes, takeSnapshot, fitView]);

  const focusNode = useCallback(
    (node: Node) => {
      setSelectedId(node.id);
      setNodes((nds) =>
        nds.map((n) => ({ ...n, selected: n.id === node.id })),
      );
      zoomToNode(setCenter, node);
    },
    [setNodes, setCenter],
  );

  const toggleDisabled = useCallback(
    (node: Node) => {
      takeSnapshot();
      const next = !(node.data as FlowNodeData).disabled;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, disabled: next } } : n,
        ),
      );
    },
    [setNodes, takeSnapshot],
  );

  const setColorLabel = useCallback(
    (node: Node, colorLabel: string | undefined) => {
      takeSnapshot();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, colorLabel } }
            : n,
        ),
      );
    },
    [setNodes, takeSnapshot],
  );

  const addNodeAtScreen = useCallback(
    (type: NodeType, screenX: number, screenY: number) => {
      insertNode(type, screenToFlowPosition({ x: screenX, y: screenY }));
    },
    [insertNode, screenToFlowPosition],
  );

  const runWorkflow = useCallback(() => {
    runRef.current?.();
  }, []);

  const saveWorkflow = useCallback(() => {
    document
      .querySelector<HTMLButtonElement>("[data-canvas-save]")
      ?.click();
  }, []);

  const commandActions = useMemo<CommandActions>(
    () => ({
      onAddNode: (type) => insertNode(type, centerPosition()),
      onAddNote: addNoteNode,
      onRun: runWorkflow,
      onSave: saveWorkflow,
      onFitView: () => fitView({ duration: 400, padding: 0.2 }),
      onAutoLayout: applyAutoLayout,
    }),
    [insertNode, centerPosition, addNoteNode, runWorkflow, saveWorkflow, fitView, applyAutoLayout],
  );

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onCopy: copySelected,
    onPaste: pasteClipboard,
    onDuplicate: duplicateSelected,
    onDelete: deleteSelected,
    onSelectAll: selectAll,
    onDeselect: deselect,
    onFitView: () => fitView({ duration: 400, padding: 0.2 }),
    onCommandPalette: () => setCommandOpen((v) => !v),
    onSearch: () => setSearchOpen(true),
    onRun: runWorkflow,
  });

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setMenu({ x: event.clientX, y: event.clientY, node });
    },
    [],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      setMenu({ x: event.clientX, y: event.clientY, node: null });
    },
    [],
  );

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const inspectorNode = selectedNode?.type === "note" ? null : selectedNode;

  return (
    <div className="flex h-full flex-col">
      <CanvasToolbar
        workflowId={workflowId}
        initialName={initialName}
        initialDescription={initialDescription}
        getGraph={() => ({ nodes, edges })}
        runStatus={runStatus}
        dirty={dirty}
        onSaved={() => setDirty(false)}
        published={published}
        unpublishedChanges={unpublishedChanges}
        onToggleHistory={() => setSidebarTab("history")}
        onPublish={() => setPublishOpen(true)}
        onRun={(input) => {
          setSidebarTab("output");
          startRun(workflowId, input);
        }}
        registerRun={(fn) => {
          runRef.current = fn;
        }}
      />
      <RunStatusBanner
        status={runStatus}
        error={runError}
        degraded={runDegraded || Object.values(outputs).some(isErrorValue)}
        nodes={nodes}
      />
      <div className="flex flex-1 overflow-hidden">
        <Palette onAddNote={addNoteNode} onAutoLayout={applyAutoLayout} />
        <div
          ref={wrapper}
          className="relative flex-1"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedId(node.id);
              setSidebarTab("inspector");
            }}
            onPaneClick={() => setSelectedId(null)}
            onNodeDragStart={() => takeSnapshot()}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onSelectionContextMenu={onPaneContextMenu}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Cross} gap={28} color="var(--color-grid)" />
            <Controls className="border-border! bg-surface!" />
            <MiniMap
              className="border! border-border! bg-surface!"
              maskColor="color-mix(in oklch, var(--color-bg) 70%, transparent)"
              nodeColor="var(--color-accent)"
            />
          </ReactFlow>
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-fg-muted">
                Drag a node from the left to start building.
              </p>
              <p className="text-xs text-fg-muted/70">
                or press <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">⌘K</kbd> for the command palette
              </p>
            </div>
          )}
          <OnboardingChecklist
            hasNode={nodes.length > 0}
            hasRun={initialHasRuns || runStatus !== "idle"}
            published={published}
          />
          <NodeSearch
            open={searchOpen}
            nodes={nodes}
            onClose={() => setSearchOpen(false)}
            onPick={focusNode}
          />
        </div>
        <RightSidebar
          tab={sidebarTab}
          onTabChange={setSidebarTab}
          runPhase={runStatus}
          hasSelection={!!inspectorNode}
        >
          {sidebarTab === "inspector" && (
            <ConfigSidebar
              node={inspectorNode}
              onChange={updateConfig}
              onDelete={deleteNode}
            />
          )}
          {sidebarTab === "output" && (
            <RunOutputPanel
              vars={outputs}
              status={runStatus}
              error={runError?.message ?? null}
              runId={runId}
            />
          )}
          {sidebarTab === "history" && <RunHistory workflowId={workflowId} />}
        </RightSidebar>
      </div>

      {publishOpen && (
        <PublishDialog
          workflowId={workflowId}
          slug={slug}
          published={published}
          onClose={() => setPublishOpen(false)}
          onPublished={() => {
            setPublished(true);
            setUnpublishedChanges(false);
          }}
        />
      )}

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        actions={commandActions}
      />
      <ContextMenu
        state={menu}
        onClose={() => setMenu(null)}
        actions={{
          onEdit: (node) => {
            setSelectedId(node.id);
            setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
          },
          onDuplicate: (node) => duplicateNodes([node]),
          onToggleDisabled: toggleDisabled,
          onSetColorLabel: setColorLabel,
          onDelete: (node) => deleteNode(node.id),
          onAddNode: addNodeAtScreen,
          onFitView: () => fitView({ duration: 400, padding: 0.2 }),
          onSelectAll: selectAll,
        }}
      />
    </div>
  );
}

function serializeGraph(nodes: Node[], edges: Edge[]): string {
  const n = nodes
    .map((node) => ({
      id: node.id,
      type: node.type,
      config: (node.data as { config?: unknown })?.config ?? null,
      disabled: (node.data as { disabled?: boolean })?.disabled ?? false,
      colorLabel: (node.data as { colorLabel?: string })?.colorLabel ?? null,
      text: (node.data as { text?: string })?.text ?? null,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const e = edges
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? null,
    }))
    .sort((a, b) => `${a.source}${a.target}`.localeCompare(`${b.source}${b.target}`));
  return JSON.stringify({ nodes: n, edges: e });
}

function RunStatusBanner({
  status,
  error,
  degraded,
  nodes,
}: {
  status: RunStatus;
  error: RunError | null;
  degraded: boolean;
  nodes: Node[];
}) {
  if (status === "error" && error) {
    const node = error.nodeId ? nodes.find((n) => n.id === error.nodeId) : null;
    const label = node ? NODE_SPECS[node.type as NodeType]?.label : null;
    return (
      <div className="flex items-start gap-2 border-b border-err/40 bg-err/10 px-4 py-2 text-sm text-err">
        <span className="font-medium">{label ? `${label} node failed` : "Run failed"}</span>
        <span className="text-err/80">{error.message}</span>
      </div>
    );
  }
  if (status === "paused") {
    return (
      <div className="border-b border-run/40 bg-run/10 px-4 py-2 text-sm text-fg">
        Waiting for approval. Approve or deny it in the Output panel, or use the signed link from
        the email.
      </div>
    );
  }
  if (status === "done" && degraded) {
    return (
      <div className="border-b border-accent/40 bg-accent-tint/40 px-4 py-2 text-sm text-fg">
        <span className="font-medium text-accent">Finished with warnings.</span>{" "}
        Some nodes returned errors, see the output panel.
      </div>
    );
  }
  if (status === "done") {
    return (
      <div className="border-b border-ok/40 bg-ok/10 px-4 py-2 text-sm text-ok">
        Run finished.
      </div>
    );
  }
  return null;
}

export function Canvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
