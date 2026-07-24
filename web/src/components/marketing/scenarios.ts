import type { Node, Edge } from "@xyflow/react";

export type ScenarioId = "research" | "leads" | "triage";

type Scenario = {
  label: string;
  prompt: string;
  nodes: Node[];
  edges: Edge[];
  sequence: string[];
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  research: {
    label: "Research summary",
    prompt: "Search the web, summarize, get sign-off, then email it",
    nodes: [
      { id: "search", type: "search", position: { x: 0, y: 40 }, data: { config: { queryTemplate: "{{input}}" } } },
      { id: "llm", type: "llm", position: { x: 300, y: 0 }, data: { config: { promptTemplate: "Summarize {{search}}" } } },
      { id: "approve", type: "approve", position: { x: 300, y: 180 }, data: { config: { message: "Send this?" } } },
      { id: "email", type: "email", position: { x: 600, y: 140 }, data: { config: { to: "you@team.com" } } },
    ],
    edges: [
      { id: "e1", source: "search", target: "llm" },
      { id: "e2", source: "llm", target: "approve" },
      { id: "e3", source: "approve", sourceHandle: "true", target: "email" },
    ],
    sequence: ["search", "llm", "approve", "email"],
  },
  leads: {
    label: "Lead enrichment",
    prompt: "Enrich each lead from an API, branch on size, write it back",
    nodes: [
      { id: "http", type: "http", position: { x: 0, y: 40 }, data: { config: { urlTemplate: "https://api.enrich.so/{{lead}}" } } },
      { id: "branch", type: "condition", position: { x: 300, y: 40 }, data: { config: { expression: "employees > 500" } } },
      { id: "llm", type: "llm", position: { x: 600, y: -20 }, data: { config: { promptTemplate: "Draft outreach for {{http}}" } } },
      { id: "code", type: "code", position: { x: 600, y: 160 }, data: { config: { code: "save(lead)" } } },
    ],
    edges: [
      { id: "e1", source: "http", target: "branch" },
      { id: "e2", source: "branch", sourceHandle: "true", target: "llm" },
      { id: "e3", source: "branch", sourceHandle: "false", target: "code" },
    ],
    sequence: ["http", "branch", "llm", "code"],
  },
  triage: {
    label: "Support triage",
    prompt: "Classify a message, route by intent, draft a reply for review",
    nodes: [
      { id: "llm", type: "llm", position: { x: 0, y: 40 }, data: { config: { promptTemplate: "Classify {{message}}" } } },
      { id: "branch", type: "condition", position: { x: 300, y: 40 }, data: { config: { expression: "intent == 'billing'" } } },
      { id: "approve", type: "approve", position: { x: 600, y: 0 }, data: { config: { message: "Approve reply?" } } },
      { id: "email", type: "email", position: { x: 600, y: 180 }, data: { config: { to: "support@team.com" } } },
    ],
    edges: [
      { id: "e1", source: "llm", target: "branch" },
      { id: "e2", source: "branch", sourceHandle: "true", target: "approve" },
      { id: "e3", source: "branch", sourceHandle: "false", target: "email" },
    ],
    sequence: ["llm", "branch", "approve", "email"],
  },
};

export const SCENARIO_ORDER: ScenarioId[] = ["research", "leads", "triage"];
