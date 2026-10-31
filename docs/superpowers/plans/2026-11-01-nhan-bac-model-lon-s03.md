# KC1 nhan-bac-model-lon-s03 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps dùng checkbox (`- [ ]`).

**Goal:** Lệnh nhãn bạc S03 với ba backend (Qwen local, Claude Haiku 5.5, OpenAI Decisions) ghi vào bảng riêng `s03_silver_labels`, kèm chế độ đo trên tập vàng — không ghi canonical.

**Spec:** `docs/superpowers/specs/2026-10-31-nhan-bac-model-lon-s03-design.md` · hợp đồng AC-1..10 (Mạnh duyệt 01/11, Hỏi-1…5 theo khuyến nghị).

**Tech:** Node ESM, `node --test`, `pg`, `@anthropic-ai/sdk` (mới), fetch cho MTPLX và Decisions.

## Global Constraints

- Không ghi canonical/stg; chỉ `INSERT … ON CONFLICT DO NOTHING` vào `s03_silver_labels`.
- Chữ gửi cloud = `stripPII(text)` — không `group_name`, `sender_name`, `conversation_id`, tên nguồn.
- Không đọc `.env` bằng tay: lệnh đọc khoá qua `process.env` (người chạy nạp `.env`); test dùng backend giả, không gọi mạng.
- Test DB: BEGIN … ROLLBACK, chỉ in số; mồi nguồn viết tay.
- Vocab: `listing_intent`, `kind` dùng hằng của `lib/vocab.generated.mjs`.

### Task 1: Migration 065 `s03_silver_labels` (AC-1) — independent: false

**Files:** Create `db/migrations/065_s03_silver_labels.sql` (skill `/new-migration`); Create `pipeline/scripts/nhan-bac-s03-db.test.mjs` (ca NB-AC-1).
**Phục vụ:** E1. **Verify:** `cd pipeline && node --test scripts/nhan-bac-s03-db.test.mjs`; áp 065 hai lần trên DB local trong giao dịch.

- [ ] Viết ca NB-AC-1 (nạp 065 hai lần, cột, khoá duy nhất, CHECK listing_intent, ref_field_lookup, không trong FILL của sync-cloud + chiều đỏ) → đỏ; viết 065 → xanh; áp lên DB local; commit.

### Task 2: `pipeline/lib/nhan-bac.mjs` — lõi + ba backend (AC-4, AC-5, AC-6, AC-7) — independent: false

**Files:** Create `pipeline/lib/nhan-bac.mjs`; Create `pipeline/scripts/nhan-bac-s03.test.mjs` (ca NB-AC-4..7); Modify `pipeline/package.json` (+`@anthropic-ai/sdk`).
**Phục vụ:** E4, E5, E6, E7. **Verify:** `cd pipeline && node --test scripts/nhan-bac-s03.test.mjs`.

- [ ] `stripPII`, `SYSTEM` prompt, `parseReply` chép từ `zcode/classify-s03` @ce75ba2e (ghi nguồn); `hoiQwen`, `hoiHaiku` (SDK, `claude-haiku-5-5`, effort low), `hoiDecisions` (`POST /v1/decisions`, `gpt-6-luna`, câu hỏi choice `intent`, `kind`); `docNhan` chuẩn hoá về `{listing_intent, kind, probability, probabilities, quote, quote_ok, json_ok, error_kind}`.
- [ ] Ma trận NB-AC-4..7 với máy chủ HTTP giả + chiều đỏ từng ca → đỏ trước, xanh sau; commit.

### Task 3: Lệnh `pipeline/nhan-bac-s03.mjs` (AC-2, AC-3, AC-8, AC-9) — independent: false

**Files:** Create `pipeline/nhan-bac-s03.mjs`; Modify `pipeline/scripts/nhan-bac-s03.test.mjs` (NB-AC-8, NB-AC-9); Modify `pipeline/scripts/nhan-bac-s03-db.test.mjs` (NB-AC-2, NB-AC-3).
**Phục vụ:** E2, E3, E8, E9. **Verify:** hai tệp test trên + `cd pipeline && npm test`.

- [ ] `--model`, `--limit`, `--since`, `--thu`, `--tran-usd` (mặc định 5), `--gold <tệp>`; đọc bài bằng `loadStgPosts`; `text_hash = textHash`; ghi một dòng/bài; tổng kết lỗi theo loại; `--gold` in bảng đo không chữ bài.
- [ ] Ca DB (ROLLBACK) chạy lại 0 dòng, bài đổi chữ +1, `--thu` 0, băm sáu bảng không đổi + chiều đỏ; ca trần chi phí, ca đo; commit; hợp đồng `implemented` sau Task 4.

### Task 4: Đo thật ba backend (AC-10) — independent: false

**Files:** Create `docs/research/s03-nhan-bac-do-3-backend.md`.
**Cần trước:** tệp vàng ZCode ở `research-local/s03-gold-61.jsonl` (Hỏi-1) và hai khoá trong `.env` (Hỏi-2). Thiếu → AC-10 khai chưa chạy, không chặn Task 1–3.

- [ ] `node pipeline/nhan-bac-s03.mjs --model <qwen|haiku|decisions> --gold research-local/s03-gold-61.jsonl --thu` cho từng backend (chi phí ước < 1 USD tổng); ghi bảng số + băm post_id + ba ô đạt/không; commit.
