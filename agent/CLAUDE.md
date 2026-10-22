# agent/ — onehub-ai-agent

Nền tảng agentic (ADR-0012). Kiến trúc chốt: ROADMAP §3.5–3.6, chi tiết
`docs/research/agent-harness-survey.md` + `agent-memory-survey.md`.

## Cấu trúc

```
src/runtime/   loop.ts (ReAct + step budget + hooks + trace JSONL), models.ts, context.ts
src/agents/    judge-entity, enrich-text, context-resolver — agents-as-config
src/tools/     native.ts (sau này: MCP-first, A3)
src/memory/    store.ts — user_events / user_profile (memory là TOOL của runtime)
scripts/       enrich-run.ts
traces/        *.jsonl — gitignored
```

## Lệnh

```bash
npx tsc --noEmit      # lưu ý: loop.ts/models.ts đang có 2 lỗi TS tồn đọng (AI SDK đổi type)
npm test              # node --test tests/
npm run smoke         # vòng chạy thật qua MTPLX
```

## Luật

- **LLM-off-data-path**: agent chỉ gate/judge/extract, ghi kết quả kèm evidence vào
  bảng đề xuất/review — KHÔNG UPDATE dữ liệu canonical trực tiếp.
- **Local-first**: Qwen 27B qua MTPLX (`MTPLX_URL`, mặc định `http://127.0.0.1:8000/v1`,
  chỉ chat completions); Kev-4B gate :8009. Cloud model chỉ cho dữ liệu phi-PII.
- Không LangGraph; không thêm graph/vector store trước khi đo thấy cần (M5).
- Mọi bước runtime phải để lại trace JSONL.
- Agent không bao giờ có tool gửi tin vào Zalo/nhóm xã hội.
