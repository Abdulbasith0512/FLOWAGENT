import { z } from "zod";

export const NODE_TYPES = [
  "llm",
  "search",
  "code",
  "http",
  "email",
  "condition",
  "approve",
  "subworkflow",
  "loop",
  "merge",
  "delay",
  "transform",
  "rag",
  "trigger",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const nodeConfigSchemas = {
  llm: z.object({
    systemPrompt: z.string().default("You are a helpful assistant."),
    promptTemplate: z.string().default("{{input}}"),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().positive().default(1024),
    outputVar: z.string().default("llm"),
  }),
  search: z.object({
    queryTemplate: z.string().default("{{input}}"),
    maxResults: z.number().int().min(1).max(20).default(5),
    searchDepth: z.enum(["basic", "advanced"]).default("basic"),
    outputVar: z.string().default("search"),
  }),
  code: z.object({
    code: z.string().default("print('hello')"),
    timeoutSec: z.number().int().min(1).max(30).default(10),
    outputVar: z.string().default("code"),
  }),
  http: z.object({
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
    urlTemplate: z.string().default("https://api.example.com"),
    headers: z.string().default("{}"),
    bodyTemplate: z.string().default(""),
    outputVar: z.string().default("http"),
  }),
  email: z.object({
    to: z.string().default(""),
    subject: z.string().default("Message from FlowAgent"),
    bodyTemplate: z.string().default("{{input}}"),
  }),
  condition: z.object({
    expression: z.string().default("True"),
  }),
  approve: z.object({
    approverEmail: z.string().default(""),
    message: z.string().default("A workflow is waiting for your approval."),
    timeoutHours: z.number().int().min(1).max(168).default(24),
  }),
  subworkflow: z.object({
    workflowSlug: z.string().default(""),
    inputTemplate: z.string().default("{{input}}"),
    outputVar: z.string().default("subworkflow"),
  }),
  loop: z.object({
    itemsVar: z.string().default("input"),
    workflowSlug: z.string().default(""),
    outputVar: z.string().default("loop"),
  }),
  merge: z.object({
    sources: z.string().default(""),
    strategy: z.enum(["object", "concat", "first"]).default("object"),
    outputVar: z.string().default("merge"),
  }),
  delay: z.object({
    seconds: z.number().int().min(1).max(3600).default(5),
  }),
  transform: z.object({
    template: z.string().default("{{ input }}"),
    outputVar: z.string().default("transform"),
  }),
  rag: z.object({
    mode: z.enum(["store", "retrieve"]).default("retrieve"),
    namespace: z.string().default("default"),
    textTemplate: z.string().default("{{input}}"),
    topK: z.number().int().min(1).max(20).default(3),
    outputVar: z.string().default("rag"),
  }),
  trigger: z.object({
    kind: z.enum(["manual", "cron", "webhook", "mcp"]).default("manual"),
    cron: z.string().default(""),
  }),
} satisfies Record<NodeType, z.ZodTypeAny>;

export type NodeConfig<T extends NodeType> = z.infer<
  (typeof nodeConfigSchemas)[T]
>;

export const workflowGraphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.enum(NODE_TYPES),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.object({
        label: z.string().optional(),
        config: z.record(z.string(), z.unknown()).default({}),
      }),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().nullish(),
      targetHandle: z.string().nullish(),
    }),
  ),
});

export type WorkflowGraph = z.infer<typeof workflowGraphSchema>;
