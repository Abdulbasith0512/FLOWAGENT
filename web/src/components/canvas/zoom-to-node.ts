import type { Node } from "@xyflow/react";

interface CenterFn {
  (x: number, y: number, options?: { zoom?: number; duration?: number }): void;
}

export function zoomToNode(setCenter: CenterFn, node: Node, zoom = 1.4) {
  const width = typeof node.width === "number" ? node.width : 224;
  const height = typeof node.height === "number" ? node.height : 88;
  setCenter(node.position.x + width / 2, node.position.y + height / 2, {
    zoom,
    duration: 400,
  });
}
