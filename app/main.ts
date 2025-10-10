import { Hono } from "hono";
import { streamSSE } from 'hono/streaming'
import "@std/dotenv/load";
import {
  AnthropicModelProvider,
  LoopInterceptorManager,
  McpServerManager,
  ToolExecutionInterceptor,
  ZypherAgent,
} from "@corespeed/zypher";
import { RunTerminalCmdTool } from "@corespeed/zypher/tools";
import { eachValueFrom } from "rxjs-for-await";

export function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

const ANTHROPIC_API_KEY = getRequiredEnv("ANTHROPIC_API_KEY");
const model_options = {
  apiKey: ANTHROPIC_API_KEY,
};
const mcpServerManager = new McpServerManager();
mcpServerManager.registerTool(RunTerminalCmdTool);
const loopInterceptorManager = new LoopInterceptorManager();
loopInterceptorManager.register(
  new ToolExecutionInterceptor(mcpServerManager),
);

const zypher = new ZypherAgent(
  new AnthropicModelProvider(model_options),
  mcpServerManager,
  loopInterceptorManager,
);
zypher.init()

const app = new Hono();

app.get("/health", (c) => {
  return c.text("ok");
});

app.post("/run-task", async (c) => {
  const body = await c.req.json();
  const task = body.task;
  const events = zypher.runTask(task, "claude-sonnet-4-20250514");
  let counter = 0;
  return streamSSE(c, async (stream) => {
    for await (const taskEvent of eachValueFrom(events)) {
      await stream.writeSSE({
        data: JSON.stringify(taskEvent),
        event: taskEvent.type,
        id: `${Date.now()}-${counter++}`,
      })
    }
  })
});

Deno.serve(app.fetch);
