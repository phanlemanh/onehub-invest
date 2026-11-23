# agent/ — onehub-ai-agent

Nền tảng agentic (ADR-0012). Kiến trúc chốt: ROADMAP §3.5–3.6, chi tiết
`docs/research/agent-harness-survey.md` + `agent-memory-survey.md`.

## Cấu trúc

```
src/runtime/   loop.ts (ReAct + step budget + hooks + trace JSONL), models.ts, context.ts
src/agents/    judge-entity, enrich-text, context-resolver — agents-as-config
src/tools/     native.ts (sau này: MCP-first, A3)
src/memory/    store.ts — user_events / user_profile (memory là TOOL của runtime)
scripts/       enrich-run.ts, doc-toan-bo-s03.ts (đọc toàn bộ chữ S03; `--xu-lai-trich` xét lại đề xuất bỏ vì `khong-tu-khoa`, không gọi model; xem ROADMAP §2.2, LS1)
traces/        *.jsonl — gitignored
```

## Lệnh

```bash
npx tsc --noEmit      # lưu ý: loop.ts/models.ts đang có 2 lỗi TS tồn đọng (AI SDK đổi type)
npm test              # node --test tests/
npm run smoke         # vòng chạy thật qua Vercel AI Gateway (model của smoke-echo trong config/model-agent.json)
```

## Luật

- **LLM-off-data-path**: agent chỉ gate/judge/extract, ghi kết quả kèm evidence vào
  bảng đề xuất/review — KHÔNG UPDATE dữ liệu canonical trực tiếp.
- **Model cloud, chọn bằng cấu hình** (MH1, Mạnh 21/11 «Dùng toàn bộ sang cloud model haiku 5.5, không mang sang»): agent chạy
  qua `runAgent` lấy model ở `config/model-agent.json` theo tên agent (mặc định Haiku 5.5 qua Vercel AI Gateway, mã thuộc danh
  sách duyệt của PL30, cờ không giữ dữ liệu, trần tiền mỗi lượt). Không còn model máy (MTPLX :8000). Dữ liệu gửi model theo
  luật 6 (AGENTS.md) — không hồ sơ user app, định danh tài khoản thu, phiên/khoá.
- Không LangGraph; không thêm graph/vector store trước khi đo thấy cần (M5).
- Mọi bước runtime phải để lại trace JSONL.
- Agent không bao giờ có tool gửi tin vào Zalo/nhóm xã hội.
