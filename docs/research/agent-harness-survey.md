# Khảo sát kiến trúc Agent Harness 10/2026 → đề xuất onehub-ai-agent

Ngày: 2026-10-22 · Trạng thái: **ĐÃ CHỐT 2026-10-22** — kiến trúc 3 tầng + 1 hợp đồng + lộ trình A1-A6 nhập ROADMAP v4 §4 Track 1
Nguồn: LangChain "Anatomy of an Agent Harness", Anthropic "Effective
Harnesses for Long-Running Agents" + "Context Engineering" (9/2025-4/2026),
Martin Fowler "Harness Engineering" (4/2026), Addy Osmani, Langfuse/Particula
framework comparisons 2026, MCP adoption 4/2026 (97M downloads/tháng).

## 1. BỨC TRANH LỚN — 5 xu hướng hội tụ 2026

**T1 — "Harness > Prompt"**: trường chuyển từ prompt engineering →
**harness engineering** — runtime layer quanh LLM quyết định độ tin cậy
tương đương model (LangChain: chỉ đổi harness đưa Terminal Bench 2.0 từ
Top 30 → Top 5; Opus 4.6 trong harness kém thua chính mình). Harness =
model + system prompt + tools + hạ tầng bundled (fs/sandbox/browser) +
orchestration + hooks deterministic + context management.

**T2 — Context là tài nguyên khan hiếm** ("context rot"): model suy hóa
khi context đầy → compaction (tóm tắt + context mới), tool-call offloading
(lưu output đầy ra filesystem, giữ head/tail), progressive disclosure
(tools nạp theo cần). Anthropic cookbook 3/2026 chuẩn hoá 3 chiến thuật.

**T3 — Filesystem là memory + ledger**: primitive nền tảng — workspace
bền qua context window, cộng tác người-agent, git làm rollback/branch.
"Ralph Loops": hooks chặn exit + reinject prompt ở context mới cho task
dài. Self-verification: hooks chạy test → feedback lỗi vào model.

**T4 — MCP thành chuẩn de-facto tool layer** (97M downloads/tháng,
5.800+ servers 4/2026): agent ↔ tools qua 1 protocol chuẩn; local-first
models (LocalAI) chạy MCP sẵn — phù hợp nguyên tắc local của ta.

**T5 — TS frameworks: Vercel AI SDK dẫn dắt** (2.8M weekly downloads —
flat API, 1 canonical way; Mastra tăng nhanh; LangGraph.js mạnh nhưng nặng
DX). Kev repo ta đã dùng **AI SDK 7 experimental_evaluate** — quen tay.

Phản xu hướng đáng chú ý (chuẩn cho ta): **"guides over workflows"** —
harness tốt bơm priors + môi trường đúng, KHÔNG pre-wire DAG cứng; và
deterministic-first: phần chắc làm code thường, LLM chỉ ở điểm cần判断
(chúng ta đã có nguyên tắc này: LLM-off-data-path).

## 2. ĐỐI CHIẾU — tài sản onehub hiện có vs harness chuẩn

| Thành phần harness chuẩn | onehub hiện có | Gap |
|---|---|---|
| Model layer | Qwen 27B local (MTPLX :8000 OpenAI-compat, 9s reasoning-low) + Kev-4B gate 81ms + OpenAI Decisions (phi-PII) | ✔ đủ, phân vai rõ |
| Tools cho agent | data-api 10 endpoints + app API + MCP tools C3-wrap (oneinvest_query_market…) | ✔ đã có dạng MCP |
| Hạ tầng bundled | collector :9210, kev :8009, DB Postgres+PostGIS, snapshots fs | ✔ |
| Hooks deterministic | zalo-watchdog (an toàn), fail-open handler, DQ checks | ✔ kiểu ops, chưa có dạng agent-loop hook |
| Context management | ❌ chưa cần (agents hiện 1-shot gate/judge — không loop dài) | gap chỉ đến khi advisor |
| Filesystem-as-memory | monorepo git (mới) + snapshots immutable | ✔ nền có sẵn |
| **Harness runtime thống nhất** | ❌ **rải rác**: kev-serve (Python/uv), handler.js (node), judge là kế hoạch — mỗi thứ một kiểu | **ĐÂY là gap chính** |
| Evals | bench-extraction (parser), kev suites đóng băng | ✔ pattern tốt, mở rộng ra agents |
| Audit | ops_audit + Evidence pattern | ✔ |

## 3. ĐỀ XUẤT KIẾN TRÚC — "3 tầng + 1 hợp đồng"

Nguyên tắc dẫn xuất: **đúng xu hướng nhưng KHÔNG build trước nhu cầu** —
harness trưởng thành (compaction, Ralph loops) chỉ đến khi advisor dài
hạn; giai đoạn này hợp nhất runtime + hợp đồng tools.

```
onehub-ai-agent/ (agent/ trong monorepo)
├── src/
│   ├── runtime/          # HỢP NHẤT — 1 harness loop TS duy nhất
│   │   ├── loop.ts       #   ReAct: reason→tool→observe; step budget,
│   │   │                 #   hooks trước/sau tool, trace JSONL mọi bước
│   │   ├── models.ts     #   router: kev-4b (gate 81ms) | qwen-27b (judge/
│   │   │                 #   extract 9s) | decisions-api (phi-PII, ảnh)
│   │   └── context.ts    #   budget token; offload output ra fs (chuẩn T2,
│   │                     #   chưa cần compaction — agent ngắn)
│   ├── tools/            # MCP-first (T4): 1 server MCP gom
│   │   ├── mcp.ts        #   tools: query_market/query_deals/resolve_pair/
│   │   │                 #   classify_image — tái dùng data-api + C3-wrap
│   │   └── native.ts     #   tool nội bộ gọi thẳng DB (nhanh, PII-safe)
│   ├── agents/           # Mỗi agent = config (model + tools + prompt +
│   │   │                 #   guard) KHÔNG phải code — "guides not workflows"
│   │   ├── gate-bds.ts   #   wrap Kev hiện có (không đụng :8009 đang chạy)
│   │   ├── judge-entity.ts  # G-3: phán quyết property_candidates (124 cặp)
│   │   │                 #   output = merge/reject + evidence → audit
│   │   ├── extract-text.ts # fallback tin regex-fail → structured (conf 'llm')
│   │   └── advisor.ts    #   (tương lai) conversational — dựng khi có demand
│   └── evals/            # suite đóng băng kiểu kev (620-mẫu pattern)
├── traces/               # JSONL trace mọi bước agent (gitignored, audit)
└── tests/
```

**Hợp đồng 1**: `questions[]` typed (predicate/choice/score) — model router
đổi tự do (decision-models-landscape.md §3.4 kiến trúc hội tụ).
**Hợp đồng 2**: MCP cho tools — advisor sau này cắm vào bất kỳ harness nào
(ZCode/OpenClaw/app) mà không viết lại.
**Hợp đồng 3**: trace JSONL + audit mọi phán quyết (LLM-off-data-path:
agent ghi NHÃN/evidence, không sửa dữ liệu trực tiếp).

**Stack quyết định**: TypeScript + Vercel AI SDK (T5: 2.8M downloads,
flat API, đã quen từ kev repo; chạy qua MTPLX OpenAI-compat endpoint).
KHÔNG dùng LangGraph (DAG cứng — trái nguyên tắc guides-over-workflows),
KHÔNG Python mới (kev-serve giữ nguyên như black-box model, agent gọi qua
HTTP như một "model" ).

## 4. LỘ TRÌNH (đề xuất)

| Bước | Việc | Đối chiếu xu hướng |
|---|---|---|
| A1 | runtime/ loop + trace JSONL (ngân sách bước, hooks) | T1 anatomy chuẩn |
| A2 | judge-entity trên 124 cặp needs_llm thật (case đầu, giá trị ngay) | dùng data có sẵn |
| A3 | MCP server tools (gom C3-wrap + data-api) | T4 |
| A4 | extract-text fallback (coverage parser 44-65% → tăng) | A2 pattern |
| A5 | evals suite agents (đóng băng, đo trước-sau) | pattern kev 620 mẫu |
| A6 (để sau) | advisor.ts + context.ts compaction khi agent dài xuất hiện | T2 đúng lúc |

## 5. Nguồn
- LangChain: langchain.com/blog/the-anatomy-of-an-agent-harness
- Anthropic: anthropic.com/research/effective-harnesses-for-long-running-agents;
  /engineering/effective-context-engineering-for-ai-agents; cookbook 3/2026
- Martin Fowler: martinfowler.com/articles/harness-engineering.html
- Addy Osmani: addyosmani.com/blog/agent-harness-engineering
- So sánh TS: langfuse.com/blog/2025-03-19-ai-agent-comparison; particula.tech (5/2026)
- MCP: digitalapplied.com MCP adoption 4/2026 (97M/tháng, 5.800+ servers)
