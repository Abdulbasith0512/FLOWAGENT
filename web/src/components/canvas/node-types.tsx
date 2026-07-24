"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode, type NodeStatus } from "./base-node";
import { NODE_TYPES, type NodeType } from "@/lib/workflow/types";
import { NODE_SPECS } from "@/lib/workflow/registry";
import { NoteNode } from "./note-node";

export interface FlowNodeData {
  config: Record<string, unknown>;
  status?: NodeStatus;
  disabled?: boolean;
  colorLabel?: string;
  [key: string]: unknown;
}

const SUMMARY_FIELDS: Partial<Record<NodeType, string[]>> = {
  llm: ["promptTemplate", "systemPrompt"],
  search: ["queryTemplate"],
  code: ["code"],
  http: ["urlTemplate"],
  email: ["to"],
  condition: ["expression"],
  approve: ["message"],
  subworkflow: ["workflowSlug"],
  loop: ["itemsVar"],
  transform: ["template"],
};

const REQUIRED_FIELD: Partial<Record<NodeType, string>> = {
  llm: "promptTemplate",
  search: "queryTemplate",
  code: "code",
  http: "urlTemplate",
  email: "to",
  condition: "expression",
  subworkflow: "workflowSlug",
  transform: "template",
};

function summarize(type: NodeType, config: Record<string, unknown>): string {
  const keys = SUMMARY_FIELDS[type] ?? [NODE_SPECS[type].fields[0]?.key];
  for (const key of keys) {
    const value = key ? config[key] : undefined;
    if (typeof value === "string" && value.trim()) return value;
  }
  return NODE_SPECS[type].description;
}

function needsSetup(type: NodeType, config: Record<string, unknown>): boolean {
  const key = REQUIRED_FIELD[type];
  if (!key) return false;
  const value = config[key];
  return typeof value !== "string" || value.trim() === "";
}

function makeNodeComponent(type: NodeType) {
  function NodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as FlowNodeData;
    return (
      <BaseNode
        type={type}
        selected={selected}
        status={nodeData.status}
        summary={summarize(type, nodeData.config)}
        needsSetup={needsSetup(type, nodeData.config)}
        outputVar={
          typeof nodeData.config.outputVar === "string"
            ? nodeData.config.outputVar
            : undefined
        }
        disabled={nodeData.disabled}
        colorLabel={nodeData.colorLabel}
      />
    );
  }
  NodeComponent.displayName = `${type}Node`;
  return memo(NodeComponent);
}

export const nodeTypes = {
  ...Object.fromEntries(NODE_TYPES.map((type) => [type, makeNodeComponent(type)])),
  note: NoteNode,
};
