# onehub-ai-agent

Nền tảng agentic cho onehub-invest (ADR-0012). Hai vai:

1. **Pipeline agents** (dọn dần từ one-invest/pipeline + ~/dev/kev):
   - `kev-gate` — gate phân loại is_bds 81ms (đang chạy :8009, repo ~/dev/kev;
     wrapper về đây khi ổn định hoá)
   - `judge-entity` — LLM judge property_candidates (G-3, 124 cặp needs_llm)
   - `vision-gates` — Kev-V media-only, classify ảnh, VLM collage (G-3)
2. **Advisor service** (tương lai) — lõi tư vấn cá nhân cho onehub-invest-app:
   đọc data-api, đề xuất thị trường/deal theo pipeline 4 giai đoạn.

Nguyên tắc: LLM-off-data-path (agent không sửa dữ liệu — chỉ gate/judge/
extract có audit). Local-first: Qwen 27B (MTPLX :8000) + Kev-4B pattern;
cloud chỉ cho phi-PII (docs/research/decision-models-landscape.md).

Trạng thái: SKELETON 2026-10-22 — service đầu tiên (judge-entity) dựng ở G-3.

## Kiến trúc harness (survey 10/2026 → đề xuất)

Xem `docs/research/agent-harness-survey.md`: 5 xu hướng hội tụ (harness>prompt,
context-rot, fs-as-memory, MCP chuẩn hoá, Vercel AI SDK dẫn dắt TS) → đề xuất
"3 tầng + 1 hợp đồng": runtime loop TS duy nhất (AI SDK) + MCP tools + agents
dạng config; trace JSONL mọi bước. Lộ trình A1-A6 (judge-entity là case đầu).

## Bộ nhớ cá nhân (survey 10/2026 → đề xuất)

Xem `docs/research/agent-memory-survey.md`: 4 triết lý memory (Letta/Mem0/
Graphiti/Cognee) + xu hướng personal (dual-process, user-owned). Đề xuất
"Postgres-first, 3 lớp": episodic (user_events) → semantic bi-temporal
(user_profile, consolidation đêm) → procedural (sau); memory là 1 TOOL của
runtime harness; KHÔNG graph/vector trước khi đo được nhu cầu (bài học
Mem0 bỏ graph). Lộ trình M1-M5.
