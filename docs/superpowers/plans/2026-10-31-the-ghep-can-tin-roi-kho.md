# the-ghep-can-tin-roi-kho Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** judge-run rút thẻ `entity_match` đang chờ có tin rời kho (lý do «tin rời kho» + `ops_audit`) và trả lại thẻ máy đã rút khi tin quay lại.

**Architecture:** Trong `chamMotLuot`, sau bước bỏ qua cặp người đã quyết, kiểm tin sống bằng `sale_offers`; rời kho → `SQL_RUT_ROI_KHO`; sống mà có thẻ máy đã rút → `SQL_TRA_LAI` rồi chấm. Hai câu khoá mọi thẻ của cặp như `SQL_CAP_NHAT` và ghi `ops_audit` trong cùng câu.

**Tech Stack:** TypeScript (tsx), node:test, pg, PostgreSQL :5433.

**Spec:** `docs/superpowers/specs/2026-10-31-the-ghep-can-tin-roi-kho-design.md` · hồ sơ `_acceptance/the-ghep-can-tin-roi-kho/` (AC-1..AC-11, E1..E11).

## Global Constraints

- Không ghi `oneinvest`; test dùng DB thử `oneinvest_p3_*_<pid>`; đọc `oneinvest` chỉ SELECT.
- Không ghi `property_candidates`, `sale_offers` (luật 7). Không đổi `apNguong`, `SQL_CAP_NHAT`, `evidenceThe`.
- `decided_by = 'machine:judge-run'`; action `review-queue:rut-roi-kho` · `review-queue:tra-lai-tin-ve-kho`; `ly_do = 'tin rời kho'`; `decision_note` mở bằng `tin rời kho: `.
- Thông điệp đối chứng đỏ nguyên văn như `evals.yaml`.
- Vùng: `agent/scripts/judge-run.ts`, `agent/tests/judge-run.test.ts`, `agent/tests/judge-roi-kho.itest.ts`, `agent/tests/judge-chung.ts`.

## Review Focus

- Thẻ người `deferred` (decided_by ≠ machine) không bao giờ bị trả lại hay rút (AC-4, E11 ô đối chiếu).
- Khoá tin chứa `|` (khoá S05 mới) — cặp lấy từ `property_candidates`; tách `item_id` giữ regex cũ.
- Cặp có hai thẻ (hai chiều) đều chờ: rút cả hai, mỗi thẻ một dòng audit.
- Ca đã ký: fixture `nap` luôn chèn `sale_offers` hai bên; thẻ chèn tay không kèm tin sống sẽ bị rút — rà các ca cũ.
- `main` vẫn in các dòng cũ, chỉ thêm một dòng.

---

### Task 1: rút + trả lại trong chamMotLuot (independent: false)

**Files:** Modify `agent/scripts/judge-run.ts` · Test `agent/tests/judge-run.test.ts` (thêm `018_ops_audit.sql` vào `before`, TRUNCATE thêm `ops_audit`).

**Interfaces — Produces:** `export const SQL_RUT_ROI_KHO` ($1 id[], $2 decision_note, $3 roi_kho jsonb; trả dòng thẻ rút) · `export const SQL_TRA_LAI` ($1 id[]; trả dòng thẻ trả lại) · `chamMotLuot` trả `{ sinh, capNhat, boQua, loi, roiKho, rut, traLai }` · `main` in `cặp có tin rời kho <roiKho> · thẻ rút <rut> · thẻ trả lại <traLai>`.

- [ ] Viết ca RK-AC-1..8, 10, 11 theo E1..E8, E10, E11 (ma trận viết trước + đối chứng đỏ) — chạy, đỏ. Phục vụ E1–E8, E10, E11.
- [ ] Sửa `judge-run.ts` — `cd agent && npm test` xanh (E10).
- [ ] Commit.

### Task 2: lô thật (independent: false)

**Files:** Create `agent/tests/judge-roi-kho.itest.ts` (dùng `dungSaleOffers` của judge-chung.ts).

- [ ] Viết ca RK-AC-9 theo E9 (nhánh a nguyên trạng, nhánh b dựng, đối chứng đỏ) — chạy `cd agent && node --import tsx --test tests/judge-roi-kho.itest.ts` xanh; commit. Phục vụ E9.
