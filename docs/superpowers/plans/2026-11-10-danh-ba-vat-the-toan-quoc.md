# DA1 — danh bạ vật thể dựng toà ở cả 34 tỉnh · kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toà ở cả 34 tỉnh nhận mã ISO qua bảng tra trong migration 088; ISO của toà suy từ khu vực của khu; chủ đầu tư ghi `source_field`.

**Architecture:** Migration 088 (bảng `iso_regions` 34 dòng + FK, nới CHECK `upi`) · bản chụp `pipeline/data/iso-3166-2-vn.json` làm
nguồn rút bảng vàng · lõi thuần `isoCuaKhu` ở `pipeline/lib/danh-ba-vat-the.mjs` · `dung()` đọc bảng (vắng 088 → đường cũ chỉ
cho khu đã có toà) · test thuần + itest trên DB của riêng lượt chép máy thu.

**Tech Stack:** PostgreSQL (migration idempotent), Node ESM, `pg`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-10-danh-ba-vat-the-toan-quoc-design.md` · hợp đồng + evals `_acceptance/danh-ba-vat-the-toan-quoc/`.

## Global Constraints

- Migration 088 idempotent: `CREATE TABLE IF NOT EXISTS`, `INSERT … ON CONFLICT DO NOTHING`, ràng buộc thêm trong khối `DO`
  có kiểm `pg_constraint`; không đổi dữ liệu toà, không đổi UPI. Không áp lên DB `oneinvest` trong vòng.
- Mã lỗi `isoCuaKhu`: `khong-co-tinh` · `nhieu-tinh` · `tinh-khong-co-iso`. Thông điệp: «chưa áp 088 — ISO theo meta.city»,
  «chưa áp 088 — chỉ dựng lại khu đã có toà», `LoiGoi("khu <slug>: <mã>")`.
- Chủ đầu tư: `method 'source_field'`, `evidence {tu_dien:'chu-dau-tu', ban, tep}`.

## Review Focus

1. Khu có cả mã cấp tỉnh lẫn mã xã của cùng tỉnh (`vn-hung-yen` + `vn-hung-yen-nghia-tru`) → một tỉnh, không phải hai (E4 thêm ô).
2. Chạy 088 trên DB đã có `iso_regions` một phần (thiếu dòng) → bổ sung dòng thiếu, không lỗi (E3).
3. `buocVatTheDem` trên DB đã áp 088 → đi đường mới, không in dòng «chưa áp 088» (E7 đối chứng).

---

### Task 1: Bản chụp ISO + migration 088

**Files:** Create `pipeline/data/iso-3166-2-vn.json` (63 mã + tên + ngày đọc + nguồn), `db/migrations/088_iso_tinh.sql` · evals E1, E2, E3 · independent: false

- [ ] Chụp 63 dòng ISO 3166-2:VN (bản 2020-11-24); 088 tạo `iso_regions` + 34 dòng (bảng thiết kế §2), đổi ràng buộc `buildings`.
- [ ] `/new-migration`: áp hai lần trên DB thử (db-thu), không áp `oneinvest`.

### Task 2: Lõi + lệnh dựng

**Files:** Modify `pipeline/lib/danh-ba-vat-the.mjs`, `pipeline/danh-ba-vat-the.mjs` · Test `pipeline/lib/danh-ba-vat-the.test.mjs` · evals E4, E6 · independent: false

**Interfaces — Produces:** `isoCuaKhu(khu: {slug, area_ids}, { vung: Map<id,{region_type,parent_id}>, isoCuaThiTruong: Map<marketId,iso> }): {iso}|{loi}`;
`napBangIso(c): Promise<{vung, isoCuaThiTruong} | null>` (null khi chưa áp 088); `dung(c, { …, isoTheo })` (isoTheo chỉ test).

- [ ] Ca «DA1-AC-4» (E4) + «DA1-AC-8» (E8) đỏ → viết lõi → xanh.
- [ ] `dung()`: có bảng → `isoCuaKhu` mọi khu, lỗi → `LoiGoi`; không bảng → khu chưa có toà → `LoiGoi`, còn lại theo `meta.city` + log.
- [ ] Chủ đầu tư ghi `source_field`.

### Task 3: itest DB

**Files:** Create `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs` · evals E1–E3, E4b, E4c, E5, E5b, E6, E7 · independent: false

- [ ] Thứ tự ca: E7 (chưa áp) trước; các ca còn lại áp 088 trong giao dịch ROLLBACK (E5 COMMIT trên DB lượt).
- [ ] Chạy `bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs` → xanh; phá thử (bỏ FK, đọc meta.city) → đỏ đúng thông điệp.

### Task 4: Tài liệu + verify

**Files:** `pipeline/CLAUDE.md`, `docs/ROADMAP.md` · evals E8, E8b · independent: false

- [ ] Ghi 088, `iso_regions`, cách suy ISO; `/verify` pipeline; commit.
