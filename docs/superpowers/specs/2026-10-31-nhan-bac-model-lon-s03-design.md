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

**Đường gọi model — dùng lại lớp có sẵn của `agent/` (Mạnh 01/11: «Đi qua Gateway và dùng các AI SDK của Vercel đã xây dựng, ưu tiên dùng lại không được viết mới»):**
- Lớp model là `agent/src/runtime/models.ts` (`getModel`, AI SDK `ai` 7.0.105 đã cài). Thêm hai mục vào `getModel` chứ không dựng lớp mới: `haiku` → `gateway("anthropic/claude-haiku-5.5")` (provider `gateway` của AI SDK, gọi qua `generateText`); `decisions` → `gateway.evaluationModel("openai/gpt-6-luna")` gọi qua `experimental_evaluate` (bí danh tài liệu Gateway ghi cho `ai` < 7.0.128), hai câu hỏi `choice`: `intent`, `kind`. Qwen giữ `getModel("qwen27b")` (MTPLX local).
- **Một khoá** `AI_GATEWAY_API_KEY` trong `.env` (Mạnh đặt) thay hai khoá nhà cung cấp; ngân sách và nhật ký cuộc gọi ở Gateway; không phí cộng thêm trên giá token (tài liệu Vercel 14/09/2026).
- **Sổ cuộc gọi:** mỗi lần gọi ghi một dòng `ai_calls` bằng `taoRecordCallDb` của `agent/src/runtime/ai-call-log.ts` (PL29, migration 052), `viec = "nhan-bac-s03"`, `khach = "pipeline"`.
- **Chi phí thật:** Gateway trả `providerMetadata.gateway.cost` mỗi lần gọi — trần `--tran-usd` cộng số thật này, ước trước bằng token khi chưa có. Ngân sách Gateway là trần mềm nên lệnh vẫn giữ trần của mình.
- **Lõi bài:** `stripPII`, prompt, `parseReply` kiểm trích so chuỗi chép từ nhánh ZCode `zcode/classify-s03` @ce75ba2e sang `agent/src/agents/nhan-bac-s03.ts` (ghi nguồn); lệnh chạy là `agent/scripts/nhan-bac-run.ts` theo khuôn `enrich-run.ts`/`judge-run.ts`.
Chung: chữ gửi Gateway = `stripPII(text)` — không `group_name`, `sender_name`, `conversation_id`, tên nguồn; lỗi mạng/quá giờ/từ chối → dòng `unknown` + `error_kind`, lượt chạy tiếp.

**Khuôn tệp vàng (giao diện với ZCode, Hỏi-1):** JSONL, mỗi dòng `{"post_id":"…","listing_intent":"offer|inquiry|not_listing","kind":"sale|rent_lt|null"}`, đặt ở máy thu, không commit.

**`agent/scripts/nhan-bac-run.ts`:** `--model <qwen|haiku|decisions> [--limit n] [--since ngày] [--thu] [--tran-usd x]
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
