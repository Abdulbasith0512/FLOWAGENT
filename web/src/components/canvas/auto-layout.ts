import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

const NODE_WIDTH = 224;
const NODE_HEIGHT = 88;
const NOTE_WIDTH = 240;
const NOTE_HEIGHT = 160;

function sizeFor(node: Node): { width: number; height: number } {
  if (node.type === "note") {
    return {
      width: typeof node.width === "number" ? node.width : NOTE_WIDTH,
      height: typeof node.height === "number" ? node.height : NOTE_HEIGHT,
    };
  }
  return { width: NODE_WIDTH, height: NODE_HEIGHT };
}

export function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", ranksep: 110, nodesep: 48, marginx: 24, marginy: 24 });

  for (const node of nodes) {
    const { width, height } = sizeFor(node);
    graph.setNode(node.id, { width, height });
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const positioned = graph.node(node.id);
    if (!positioned) return node;
    return {
      ...node,
      position: {
        x: positioned.x - positioned.width / 2,
        y: positioned.y - positioned.height / 2,
      },
    };
  });
}
