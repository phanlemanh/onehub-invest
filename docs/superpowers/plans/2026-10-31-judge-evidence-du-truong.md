# judge-evidence-du-truong Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thẻ `entity_match` do judge-run sinh ghi đủ mười khoá của bảng so (thêm street, block, floor, bathrooms) cho cả Tin A và Tin B.

**Architecture:** `queryPair` chọn thêm bốn cột của `sale_offers` và nhận client tuỳ chọn; `PairData` thêm bốn trường; `evidenceThe` ghi đủ mười khoá với null tường minh. Thẻ cũ không đổi (`SQL_CAP_NHAT` giữ nguyên). Đo trên DB thử: fixture, queryPair thật, bảng so thật của app, và lô `needs_llm` thật chép chỉ-SELECT.

**Tech Stack:** TypeScript (tsx), node:test, pg, PostgreSQL :5433.

**Spec:** `docs/superpowers/specs/2026-10-31-judge-evidence-du-truong-design.md` · hồ sơ `_acceptance/judge-evidence-du-truong/` (contract AC-1..AC-6, evals E1..E6).

## Global Constraints

- Không ghi vào DB `oneinvest`; mọi test dùng DB thử riêng `oneinvest_p3_*_<pid>` tạo đầu tệp, xoá cuối tệp. Đọc `oneinvest` chỉ bằng SELECT.
- Tên khoá evidence theo `BenGhepCan`: `street`, `block`, `floor`, `bathrooms` (không phải `*_raw`).
- Không đổi `apNguong`, `buildJudgeInput`, `SQL_CAP_NHAT`.
- Thông điệp đối chứng đỏ đúng nguyên văn trong `evals.yaml`.
- Vùng tệp: `agent/scripts/judge-run.ts`, `agent/src/tools/native.ts`, `agent/tests/judge-run.test.ts`, `agent/tests/judge-pair.test.ts`, `agent/tests/judge-chung.ts`, `agent/tests/judge-lo-that.itest.ts`.

## Review Focus

- Cột `bathrooms` (int) trả số; `floor_raw` là text — giữ chuỗi, không ép số (E2 kiểm kiểu).
- Chuỗi rỗng ở `block_raw` trên kho thật: ghi nguyên (bảng so tự coi rỗng là «Thiếu»); E6 so với cột nguyên văn.
- Cặp hỏi theo chiều ngược (offer_b, offer_a): giá trị phải theo đúng tin (E2 giá trị khác nhau giữa hai bên).
- Lô thật có thẻ đang chờ cho mọi cặp → lượt 1 sinh 0 thẻ; lượt gieo lại mới đo khuôn (E6 hai lượt).
- `queryPair` gọi không truyền client vẫn tự mở/đóng kết nối như cũ (script `main` không đổi lời gọi).

---

### Task 1: queryPair + PairData + evidenceThe

**Files:**
- Modify: `agent/src/tools/native.ts` · `agent/scripts/judge-run.ts` · `agent/tests/judge-chung.ts`
- Test: `agent/tests/judge-pair.test.ts` (mới) · `agent/tests/judge-run.test.ts`

**Interfaces:**
- Produces: `queryPair(offerA: string, offerB: string, client?: pg.Client): Promise<PairData | null>`; `PairData.a/b` thêm `street: string | null; block: string | null; floor: string | null; bathrooms: number | null`. `evidenceThe` ghi `offer_id, source, price_vnd, area_m2, price_perm2, phuong, bedrooms, bathrooms, property_type, street, block, floor` + `text`/`subject`.
- `cap(a, b)` ở judge-chung.ts thêm bốn trường null (Tin có thể mang `street?, block?, floor?, bathrooms?`).

- [ ] Viết `judge-pair.test.ts` ca «JE-AC-2 queryPair đọc bốn trường» theo E2 (16 ô giá trị + 8 assert kiểu, ba đối chứng đỏ) — chạy, đỏ.
- [ ] Thay ca «AC-6 sinh thẻ» bằng «JE-AC-1 sinh thẻ đủ mười trường» (E1, khuôn = seed 029 ∪ khoá `key:` rút từ review-can-cu.ts, bốn đối chứng đỏ); thêm «JE-AC-3 thẻ mang giá trị bốn trường» (E3: 16 ô evidence + 16 ô bảng so qua bản chép tạm `soTruongGhepCan`, hai đối chứng đỏ) và «JE-AC-4 thẻ cũ giữ khuôn» (E4) — chạy, đỏ.
- [ ] Sửa native.ts, judge-run.ts, judge-chung.ts — chạy `cd agent && npm test`, xanh (E5).
- [ ] Commit.

### Task 2: lô thật

**Files:** Create `agent/tests/judge-lo-that.itest.ts`

**Interfaces:** Consumes `queryPair(a, b, client)`, `chamMotLuot(db, { queryPair, recordCall, khongLlm: true })`.

- [ ] Viết ca «JE-AC-6 lô thật» theo E6 (chép chỉ-SELECT, hai lượt, hai đối chứng đỏ, in số đếm).
- [ ] Chạy `cd agent && node --import tsx --test tests/judge-lo-that.itest.ts` — xanh; commit.
