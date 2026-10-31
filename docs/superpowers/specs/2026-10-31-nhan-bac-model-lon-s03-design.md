# KC1 — Lệnh nhãn bạc S03 bằng model lớn (nhan-bac-model-lon-s03)

Ngày 2026-10-31 · Hạng T3 (migration 065) · Dãy U1 · Hàng KC1 của `docs/plan/lo-trinh.json`.

## Mục tiêu

Mạnh 31/10: «dùng một model lớn vừa phân loại vừa gắn nhãn để cải thiện Kev». Lệnh mới đọc bài S03 (`stg_zalo_posts`, gạt
bài thử bằng `loadStgPosts`), hỏi model, và ghi **nhãn bạc** — ý định tin (`listing_intent`: offer · inquiry · not_listing
· unknown), loại (`sale` · `rent_lt` · rỗng), xác suất, câu trích nguyên văn — vào **bảng riêng** `s03_silver_labels`
(migration 065). Không ghi dữ liệu canonical (luật 7): nhãn bạc là đề xuất, dữ liệu huấn luyện KC2 và nguồn đề xuất PL5.

## Đầu vào có sẵn

- Nhánh ZCode `zcode/classify-s03` @ce75ba2e (Mạnh giao thẳng 31/10): prompt, `stripPII`, `parseReply` kiểm trích so
  chuỗi, backend Qwen (MTPLX :8000), đo 61 bài: Qwen ý định 98%, bán/thuê 97%, Yêu cầu 11/11, JSON hỏng 1/61, trích giả
  1/60, p50 11,6 s. Vòng này chép phần lõi ấy vào `pipeline/lib/nhan-bac.mjs` (ghi nguồn), không gộp nhánh ZCode.
- RM1 (`s03-nhan-loai-tin-rong`, đã gộp) là lớp luật sàn; KC1 không thay RM1 trong transform — thay là việc PL5 khi tập
  nhãn vàng xác nhận.

## Thiết kế

**Bảng `s03_silver_labels` (065, chỉ máy thu — không lên cloud):** `label_id` · `post_id` · `text_hash` (băm chữ đã
chuẩn hoá — bài đổi chữ thì nhãn mới) · `model` (vd `anthropic:claude-haiku-5-5`, `openai:gpt-6-luna`,
`mtplx:qwen3.8-27b-local`) · `prompt_version` · `listing_intent` (FK `ref_listing_intent` theo sổ từ vựng) · `kind` ·
`probability` · `probabilities jsonb` · `quote` · `quote_ok` (null khi backend không trả trích) · `json_ok` ·
`error_kind` · `latency_ms` · `cost_usd` · `run_id` · `labeled_at`. Khoá duy nhất (`post_id`, `text_hash`, `model`,
`prompt_version`) — chạy lại 0 dòng thêm. Bảng chỉ-thêm (không UPDATE/DELETE trong lệnh). `sync-cloud` không đẩy bảng.

**`pipeline/lib/nhan-bac.mjs`:** ba backend sau một giao diện `hoi(text) → {raw | answers, ms, usage}`:
- `qwen` — MTPLX chat completions local (như ZCode); chữ không rời máy.
- `anthropic` — SDK chính thức `@anthropic-ai/sdk`, model `claude-haiku-5-5`, effort `low`, đầu ra một dòng JSON;
  chữ gửi đi đã qua `stripPII`. Đường Batch API (giảm 50%) để vòng sau.
- `decisions` — `POST /v1/decisions` model `gpt-6-luna`, hai câu hỏi `choice` (intent 3 lớp, kind 2 lớp) → `choice` +
  `probabilities`; **không trả câu trích** → `quote` null, `quote_ok` null (Hỏi-4).
Chung: `stripPII` (SĐT, email, link) trước mọi backend cloud; chỉ gửi chữ bài — không gửi `group_name`, `sender_name`,
`conversation_id`, tên nguồn; `parseReply` kiểm JSON + giá trị lạ + trích so chuỗi; lỗi mạng/timeout/từ chối → dòng
`unknown` + `error_kind`, lượt chạy tiếp.

**Khuôn tệp vàng (giao diện với ZCode, Hỏi-1):** JSONL, mỗi dòng `{"post_id":"…","listing_intent":"offer|inquiry|not_listing","kind":"sale|rent_lt|null"}`, đặt ở máy thu, không commit.

**`pipeline/nhan-bac-s03.mjs`:** `--model <qwen|haiku|decisions> [--limit n] [--since ngày] [--thu] [--tran-usd x]
[--gold tệp.jsonl]`. Ghi ON CONFLICT DO NOTHING; `--thu` không ghi; `--tran-usd` ước token trước khi gửi, dừng trước
khi vượt; `--gold` = chế độ đo: chạy trên các `post_id` của tệp vàng (local, không commit), in bảng độ đúng — không in
chữ bài.

## Chi phí (giá 31/10)

~38k bài × ~600 token vào: Haiku 5.5 ≈ $2,3 vào + ~$1,1 ra (Batch, vòng sau, ≈ một nửa); Decisions ≈ $2,3 vào, ra không tính.
Hằng ngày ~2.000 bài: dưới $0,2 với cloud, 0 đồng với Qwen local (~50 phút).

## Ngoài phạm vi

- Ghi nhãn vào `stg_zalo_posts`/canonical, thay RM1 trong transform (PL5).
- Huấn luyện lại Kev (KC2), đọc ảnh (KC3), bài chỉ ảnh (KC4).
- Lịch chạy đêm (launchd) — vòng sau khi số đo chọn backend.
