import type { WorkflowGraph, NodeType } from "./types";

export interface Template {
  slug: string;
  name: string;
  description: string;
  graph: WorkflowGraph;
}

function node(
  id: string,
  type: NodeType,
  x: number,
  config: Record<string, unknown>,
) {
  return { id, type, position: { x, y: 80 }, data: { config } };
}

export const TEMPLATES: Template[] = [
  {
    slug: "research-company",
    name: "Research a company",
    description: "Search the web, summarize with Claude, email the result.",
    graph: {
      nodes: [
        node("s", "search", 0, { queryTemplate: "{{input}}", maxResults: 5, searchDepth: "basic", outputVar: "search" }),
        node("l", "llm", 280, { systemPrompt: "Summarize the research.", promptTemplate: "{{search.text}}", temperature: 0.5, maxTokens: 600, outputVar: "summary" }),
        node("e", "email", 560, { to: "you@team.com", subject: "Research", bodyTemplate: "{{summary}}" }),
      ],
      edges: [
        { id: "e1", source: "s", target: "l" },
        { id: "e2", source: "l", target: "e" },
      ],
    },
  },
  {
    slug: "summarize-url",
    name: "Summarize a URL",
    description: "Fetch a page, summarize it with Claude.",
    graph: {
      nodes: [
        node("h", "http", 0, { method: "GET", urlTemplate: "{{input}}", headers: "{}", bodyTemplate: "", outputVar: "page" }),
        node("l", "llm", 280, { systemPrompt: "Summarize this page.", promptTemplate: "{{page}}", temperature: 0.5, maxTokens: 500, outputVar: "summary" }),
      ],
      edges: [{ id: "e1", source: "h", target: "l" }],
    },
  },
  {
    slug: "approve-before-send",
    name: "Approve before sending",
    description: "Draft with Claude, pause for human approval, then email.",
    graph: {
      nodes: [
        node("l", "llm", 0, { systemPrompt: "Draft a reply.", promptTemplate: "{{input}}", temperature: 0.7, maxTokens: 500, outputVar: "draft" }),
        node("a", "approve", 280, { approverEmail: "", message: "Approve this draft?", timeoutHours: 24 }),
        node("e", "email", 560, { to: "you@team.com", subject: "Reply", bodyTemplate: "{{draft}}" }),
      ],
      edges: [
        { id: "e1", source: "l", target: "a" },
        { id: "e2", source: "a", sourceHandle: "true", target: "e" },
      ],
    },
  },
];
