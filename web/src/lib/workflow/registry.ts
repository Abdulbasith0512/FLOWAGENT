import {
  Bot,
  Search,
  Code2,
  Globe,
  Mail,
  GitBranch,
  UserCheck,
  Workflow,
  Repeat,
  Merge,
  Clock,
  Wand2,
  Database,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { nodeConfigSchemas, type NodeType } from "./types";

type FieldKind = "text" | "textarea" | "number" | "select";

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
}

export interface NodeSpec {
  type: NodeType;
  label: string;
  icon: LucideIcon;
  description: string;
  fields: FieldSpec[];
  outputs: string[];
}

export const NODE_SPECS: Record<NodeType, NodeSpec> = {
  llm: {
    type: "llm",
    label: "LLM",
    icon: Bot,
    description: "Call Claude with a prompt",
    fields: [
      { key: "systemPrompt", label: "System prompt", kind: "textarea" },
      { key: "promptTemplate", label: "Prompt", kind: "textarea" },
      { key: "temperature", label: "Temperature", kind: "number" },
      { key: "maxTokens", label: "Max tokens", kind: "number" },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  search: {
    type: "search",
    label: "Search",
    icon: Search,
    description: "Web search via Tavily",
    fields: [
      { key: "queryTemplate", label: "Query", kind: "textarea" },
      { key: "maxResults", label: "Max results", kind: "number" },
      {
        key: "searchDepth",
        label: "Depth",
        kind: "select",
        options: ["basic", "advanced"],
      },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  code: {
    type: "code",
    label: "Code",
    icon: Code2,
    description: "Run sandboxed Python",
    fields: [
      { key: "code", label: "Python code", kind: "textarea" },
      { key: "timeoutSec", label: "Timeout (s)", kind: "number" },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  http: {
    type: "http",
    label: "HTTP",
    icon: Globe,
    description: "Make an HTTP request",
    fields: [
      {
        key: "method",
        label: "Method",
        kind: "select",
        options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      },
      { key: "urlTemplate", label: "URL", kind: "text" },
      { key: "headers", label: "Headers (JSON)", kind: "textarea" },
      { key: "bodyTemplate", label: "Body", kind: "textarea" },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  email: {
    type: "email",
    label: "Email",
    icon: Mail,
    description: "Send an email via Resend",
    fields: [
      { key: "to", label: "To", kind: "text" },
      { key: "subject", label: "Subject", kind: "text" },
      { key: "bodyTemplate", label: "Body", kind: "textarea" },
    ],
    outputs: ["out"],
  },
  condition: {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    description: "Branch on a Python expression",
    fields: [{ key: "expression", label: "Expression", kind: "text" }],
    outputs: ["true", "false"],
  },
  approve: {
    type: "approve",
    label: "Human approve",
    icon: UserCheck,
    description: "Pause for email approval",
    fields: [
      { key: "approverEmail", label: "Approver email", kind: "text" },
      { key: "message", label: "Message", kind: "textarea" },
      { key: "timeoutHours", label: "Timeout (hours)", kind: "number" },
    ],
    outputs: ["true", "false"],
  },
  subworkflow: {
    type: "subworkflow",
    label: "Sub-workflow",
    icon: Workflow,
    description: "Run another workflow",
    fields: [
      { key: "workflowSlug", label: "Workflow slug", kind: "text" },
      { key: "inputTemplate", label: "Input", kind: "textarea" },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  loop: {
    type: "loop",
    label: "Loop",
    icon: Repeat,
    description: "Map a workflow over a list",
    fields: [
      { key: "itemsVar", label: "Items variable", kind: "text" },
      { key: "workflowSlug", label: "Workflow slug", kind: "text" },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  merge: {
    type: "merge",
    label: "Merge",
    icon: Merge,
    description: "Combine several inputs",
    fields: [
      { key: "sources", label: "Source variables (comma)", kind: "text" },
      {
        key: "strategy",
        label: "Strategy",
        kind: "select",
        options: ["object", "concat", "first"],
      },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  delay: {
    type: "delay",
    label: "Delay",
    icon: Clock,
    description: "Wait a number of seconds",
    fields: [{ key: "seconds", label: "Seconds", kind: "number" }],
    outputs: ["out"],
  },
  transform: {
    type: "transform",
    label: "Transform",
    icon: Wand2,
    description: "Reshape data with Jinja",
    fields: [
      { key: "template", label: "Jinja template", kind: "textarea" },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  rag: {
    type: "rag",
    label: "Memory",
    icon: Database,
    description: "Store or retrieve by similarity",
    fields: [
      {
        key: "mode",
        label: "Mode",
        kind: "select",
        options: ["store", "retrieve"],
      },
      { key: "namespace", label: "Namespace", kind: "text" },
      { key: "textTemplate", label: "Text", kind: "textarea" },
      { key: "topK", label: "Top K", kind: "number" },
      { key: "outputVar", label: "Output variable", kind: "text" },
    ],
    outputs: ["out"],
  },
  trigger: {
    type: "trigger",
    label: "Trigger",
    icon: Zap,
    description: "Start on cron, webhook, or MCP",
    fields: [
      {
        key: "kind",
        label: "Kind",
        kind: "select",
        options: ["manual", "cron", "webhook", "mcp"],
      },
      { key: "cron", label: "Cron expression", kind: "text" },
    ],
    outputs: ["out"],
  },
};

export function defaultConfig(type: NodeType): Record<string, unknown> {
  return nodeConfigSchemas[type].parse({});
}
