# KC1 nhan-bac-model-lon-s03 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps dùng checkbox (`- [ ]`).

**Goal:** Lệnh nhãn bạc S03 với ba backend (Qwen local, Claude Haiku 5.5 và OpenAI Decisions qua Vercel AI Gateway) ghi vào bảng riêng `silver_labels`, kèm chế độ đo trên tập vàng — không ghi canonical.

**Spec:** `docs/superpowers/specs/2026-10-31-nhan-bac-model-lon-s03-design.md` · hợp đồng AC-1..10 (Mạnh duyệt 01/11; sửa ở Gate 1.5: đi qua Gateway, dùng lại AI SDK của `agent/`).

**Tech:** TypeScript trong `agent/` (tsx, `node --test`), AI SDK `ai` 7.0.105 đã cài (`gateway`, `experimental_evaluate`), `pg`. Không thêm phụ thuộc.

## Dùng lại (không viết mới)

- `agent/src/runtime/models.ts` `getModel` — thêm `haiku`, `decisions` vào switch sẵn có.
- `agent/src/runtime/ai-call-log.ts` `taoRecordCallDb`, `tenLop`, `soToken` — sổ `ai_calls` cho mỗi lần gọi.
- Khuôn lệnh `agent/scripts/enrich-run.ts` / `judge-run.ts` (cờ, DATABASE_URL, LIMIT, tổng kết).
- `stripPII`, prompt, `parseReply` từ nhánh ZCode `zcode/classify-s03` @ce75ba2e (ghi nguồn).
- Tầng sổ từ vựng: `agent/src/vocab.generated.ts` cho `listing_intent`, `kind`.

## Global Constraints

- Không ghi canonical/stg; chỉ `INSERT … ON CONFLICT DO NOTHING` vào `silver_labels`.
- Chữ gửi Gateway = `stripPII(text)` — không `group_name`, `sender_name`, `conversation_id`, tên nguồn.
- Khoá chỉ `AI_GATEWAY_API_KEY` qua `process.env`; không đọc `.env` bằng tay; test dùng máy chủ giả, không gọi mạng.
- Test DB đặt đuôi `.itest.ts`, BEGIN … ROLLBACK, chỉ in số.

### Task 1: Migration 065 `silver_labels` (AC-1)

**Files:** Create `db/migrations/065_silver_labels.sql` (skill `/new-migration`); Create `agent/tests/nhan-bac-s03-db.itest.ts` (NB-AC-1).
**Phục vụ:** E1. **Verify:** `cd agent && node --import tsx --test tests/nhan-bac-s03-db.itest.ts`.

- [ ] Ca NB-AC-1 (nạp 065 hai lần, cột, khoá duy nhất, CHECK + ref_field_lookup của listing_intent, không trong FILL sync-cloud, chiều đỏ) → đỏ; 065 → xanh; áp DB local; commit.

### Task 2: Lõi + ba backend qua lớp có sẵn (AC-4, AC-5, AC-6, AC-7)

**Files:** Modify `agent/src/runtime/models.ts` (+`haiku`, `decisions`); Create `agent/src/agents/nhan-bac-s03.ts`; Create `agent/tests/nhan-bac-s03.test.ts`.
**Phục vụ:** E4–E7. **Verify:** `cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts && npx tsc --noEmit`.

- [ ] `hoi(model, text)`: Qwen/Haiku qua `generateText`, Decisions qua `experimental_evaluate` (câu hỏi choice `intent`, `kind`); mỗi lần ghi `ai_calls`; `docNhan` chuẩn hoá về một hình nhãn; chi phí lấy `providerMetadata.gateway.cost`.
- [ ] Ma trận NB-AC-4..7 với máy chủ Gateway/MTPLX giả + chiều đỏ → đỏ trước, xanh sau; commit.

### Task 3: Lệnh `agent/scripts/nhan-bac-run.ts` (AC-2, AC-3, AC-8, AC-9)

**Files:** Create `agent/scripts/nhan-bac-run.ts`; Modify hai tệp test trên.
**Phục vụ:** E2, E3, E8, E9. **Verify:** hai tệp test + `cd agent && npm test`.

- [ ] Cờ `--model`, `--limit`, `--since`, `--thu`, `--tran-usd` (mặc định 5), `--gold`; ghi một dòng/bài; tổng kết lỗi; `--gold` in bảng đo không chữ bài.
- [ ] Ca DB (ROLLBACK) chạy lại 0 dòng, đổi chữ +1, `--thu` 0, băm sáu bảng không đổi + chiều đỏ; ca trần chi phí, ca đo; commit; hợp đồng `implemented`.

### Task 4: Đo thật ba backend (AC-10)

**Cần trước:** `research-local/s03-gold-61.jsonl` (ZCode, Hỏi-1) và `AI_GATEWAY_API_KEY` trong `.env`. Thiếu → AC-10 khai chưa chạy, không chặn Task 1–3.

- [ ] `tsx agent/scripts/nhan-bac-run.ts --model <qwen|haiku|decisions> --gold research-local/s03-gold-61.jsonl --thu` (ước < 1 USD tổng); ghi `docs/research/s03-nhan-bac-do-3-backend.md` (bảng số + băm post_id + ba ô đạt/không); commit.
