// A1 smoke — chạy agent "echo" thật qua model của agent smoke-echo trong agent/config/model-agent.json (Haiku 5.5, Gateway), 1 tool get_time.
// Verify: model trả lời + tool gọi + trace JSONL ghi đúng.
import { tool } from "ai";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { runAgent } from "../src/runtime/loop.js";

const echoAgent = {
  name: "smoke-echo",
  systemPrompt: `Bạn là trợ lý thử nghiệm. Khi được hỏi giờ, PHẢI gọi tool get_time trước rồi trả lời dựa trên kết quả. Trả lời ngắn gọn tiếng Việt.`,
  tools: {
    get_time: tool({
      description: "Lấy thời gian hiện tại",
      inputSchema: z.object({}),
      execute: async () => ({ now: new Date().toISOString() }),
    }),
  },
  budget: 3,
};

console.log("── chạy smoke (model theo agent/config/model-agent.json)...");
const result = await runAgent(echoAgent, "Bây giờ là mấy giờ?");

console.log("── output:", result.output.slice(0, 200));
console.log("── steps:", result.steps, "| toolCalls:", result.toolCalls.length);
console.log("── trace:", result.tracePath);

// verify trace đọc được
const traceContent = await readFile(result.tracePath, "utf8");
const lines = traceContent.trim().split("\n");
console.log("── trace lines:", lines.length);
const first = JSON.parse(lines[0]);
const last = JSON.parse(lines[lines.length - 1]);
console.log("  đầu:", first.type, "| cuối:", last.type);

if (result.toolCalls.length === 0) {
  console.error("❌ tool get_time KHÔNG được gọi");
  process.exit(1);
}
if (!lines.some((l) => JSON.parse(l).type === "tool-call")) {
  console.error("❌ trace thiếu tool-call");
  process.exit(1);
}
console.log("✅ A1 SMOKE PASS");
