# ADR-0012: onehub-ai-agent-invest — nền tảng agentic cho onehub-invest

Ngày: 2026-10-22 · Trạng thái: accepted (user duyệt 22/10 — "Cả hai")

## Bối cảnh

Monorepo onehub-invest (ADR mới: private + subtree-push public) gom 4 mảnh.
Lớp agentic hiện rải rác: Kev gate :8009 (repo ~/dev/kev, chạy cho one-invest),
LLM judge G-3 (kế hoạch "Một Căn Nhà"), VLM gates (Kev-V), và tham vọng tư
vấn cá nhân cho người dùng onehub-invest-app. User đề xuất repo chuyên:
**onehub-ai-agent-invest** = "lõi tư vấn cá nhân" + nhà cho pipeline agents.

## Quyết định

1. **Vị trí**: thư mục `agent/` trong monorepo onehub-invest (private).
   "Repo" = ranh giới logic module (README + CHANGELOG riêng khi tách cần).
2. **Hai vai theo lộ trình**:
   - **Ngắn hạn — pipeline agents**: dọn dần Kev gate wrapper, LLM judge
     (G-3 phán quyết property_candidates), VLM gates về `agent/` dạng
     service có API (không đứt chuỗi thu thập — chuyển từng cái khi ổn).
   - **Dài hạn — advisor service**: nhân tư vấn cá nhân đọc qua
     data-api + app API (chưa xây; ADR riêng khi bắt đầu).
3. **Nguyên tắc kế thừa** (unified-property-pipeline.md §5): LLM-off-
   data-path — agent chỉ gate/judge/extract có audit, không sửa dữ liệu.
4. **LLM**: local-first (Qwen 27B MTPLX, Kev-4B pattern 81ms) — decision
   models theo landscape docs/research/decision-models-landscape.md;
   cloud (OpenAI Decisions) chỉ cho dữ liệu phi-PII.
5. **Giao tiếp**: qua HTTP API nội bộ (mẫu kev-serve :8009 /v1/systemone,
   hình dạng questions[] typed = contract bền vững).

## Quan hệ thư mục monorepo

```
onehub-invest/
├── app/        # Invest + Ops portal (source of truth đầy đủ — private)
├── data-api/   # public standalone API (subtree → onehub-data-api)
├── collector/  # thu thập đa nguồn (hooks, CCP, source_groups)
├── agent/      # MỚI: onehub-ai-agent-invest (ADR này)
├── pipeline/ db/ docs/ scripts/   # data platform
└── tools/      # sync-public (overlay sanitise app → repo public)
```
