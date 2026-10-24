# deals-loai-tin-phi-ly (ON11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Căn giá tốt bỏ tin phi lý (luật xác định ở pipeline, có audit), đọc số giảm tính sẵn, đẩy tin giảm > 35% xuống cuối với nhãn «cần xác minh», thẻ ghi «đăng n lần».

**Architecture:** Hàm thuần `implausibleReason` (pipeline/lib) + `loaiTinPhiLy(c, rows)` chạy sau bước người bán trong `refreshBaitGap`; app `dealsSql({cloud})` đọc `bait_gap_pct`, sắp nhóm trong SQL trước LIMIT; thẻ tách thành `DealCard`.

**Tech Stack:** Node ESM + pg (pipeline, `node --test`), Next 16 app (`node --import tsx --test`, jsdom).

**Spec:** `docs/superpowers/specs/2026-10-24-deals-loai-tin-phi-ly-design.md` · hợp đồng `_acceptance/deals-loai-tin-phi-ly/contract.md` (Mạnh duyệt 24/10: Hỏi-1 = 20 m²/phòng, Hỏi-2 = giữ + đẩy cuối, 35%).

## Global Constraints

- Ngưỡng: diện tích 10–1000 m², ≤ 10 phòng ngủ, ≥ 20 m²/phòng ngủ; nghi ngờ > 35%; guard 5–50%.
- Lý do (khoá audit): `thieu-dien-tich` · `dien-tich-ngoai-khoang` · `phong-ngu-ngoai-khoang` · `phong-qua-nho`.
- Audit: `ops_audit` actor `refresh-bait-gap`, action `bait-gap:loai-phi-ly`, detail `{total, by_reason, offer_ids}`.
- Test DB: BEGIN…ROLLBACK + `pg_advisory_xact_lock(33033)`; không skip khi thiếu thước — FAIL có tên.
- UI theo ReUI: `Badge variant="warning-light"` cho «cần xác minh», không cỡ chữ dưới `text-xs`.

## Review Focus

1. Sắp sau LIMIT → E4 ca 31+1 tin.
2. Bản cloud còn chạm bảng/cột vắng → E5 xoá thật trong giao dịch.
3. Luật chạy trước bước người bán → E2 so median/n_good.
4. Lượt không loại gì vẫn ghi audit → E2 chiều âm.
5. Phép đo dữ liệu thật để lại dòng → E7 so băm trước/sau.

---

### Task 1: Luật loại ở pipeline — phục vụ E1, E2 · independent: false
**Files:** Create `pipeline/lib/deal-plausibility.mjs`, `pipeline/scripts/deals-phi-ly.test.mjs`; Modify `pipeline/refresh-bait-gap.mjs` (bước 3b sau người bán).
**Produces:** `PLAUSIBILITY`, `implausibleReason({areaM2, bedrooms})`; `loaiTinPhiLy(c, rows) -> {total, by_reason, offer_ids}`.
**Verify:** `cd pipeline && npm test` (có lượt phá: gọi luật trước bước người bán → ca registry đỏ).

### Task 2: Trang đọc số tính sẵn + thẻ — phục vụ E3–E6 · independent: false
**Files:** Modify `app/src/lib/deals.ts` (`NGHI_NGO_PCT`, `dealsSql({cloud})`, `suspect`, `repostLabel`); Create `app/src/components/ops/deal-card.tsx`, `app/tests/deals-phi-ly.test.tsx`; Modify `app/src/app/ops/deals/page.tsx`.
**Verify:** `cd app && npx tsc --noEmit && npm run lint && npm test`.

### Task 3: Phép đo dữ liệu thật — phục vụ E7 · independent: false
**Files:** Create `scripts/deals-phi-ly-do.mjs`; Modify `_acceptance/config.yaml` (`executors.script.deals_phi_ly_do`).
**Verify:** `node scripts/deals-phi-ly-do.mjs` exit 0, DB không đổi.

### Task 4: Từ điển — phục vụ E8 · independent: true
**Files:** Modify `CONTEXT.md` (mục «Tin cần xác minh»).
