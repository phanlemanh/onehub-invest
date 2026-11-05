# Nối dự án S08 của lát vào khu đô thị Implementation Plan

> **For agentic workers:** thực thi tuần tự trong phiên chính, mỗi task có lệnh kiểm riêng.

**Goal:** Bảng local nối dự án S08 của lát vào khu đô thị, sổ dự án hết bí danh trùng mã toà, mã vùng OCP1–3 có thật.

**Architecture:** Migration 074 thêm bảng và sửa `asset_nodes` theo slug. Lệnh `pipeline/noi-du-an-s08.mjs` kiểm tệp bảng nối rồi ghi trong một giao dịch. Tệp bảng nối nằm ở máy thu, kho chỉ giữ băm.

**Tech Stack:** Node .mjs, `node:test`, PostgreSQL :5433.

**Spec:** `docs/superpowers/specs/2026-11-05-noi-du-an-s08-khu-do-thi-design.md`

## Global Constraints

- Không ghi DB `oneinvest`, không ghi tên hay mã dự án S08 vào kho.
- S4 chạy dưới khoá của dãy P4, tránh 13:50 tới khi job 14:00 xong.

## Review Focus

- Tráo hai dòng khác khu: tín hiệu không thuộc từ khoá của khu mới thì đỏ.
- Dự án mới của đợt thu sau: thành `chua_noi`, không làm lệnh đỏ.
- `git check-ignore` thoát 128 với tệp ngoài kho: không được coi là qua.
- Lỗi CHECK của Postgres in cả dòng: lệnh chỉ in tên ràng buộc.
- `DATABASE_URL` đang export sẵn trỏ `oneinvest`: phép đo từ chối.

---

### Task 1: Phép đo (independent: false)

**Files:** Create `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`, `kin.mjs`, `bang-noi.sha256`. Phục vụ E3–E10.

### Task 2: Hàm kiểm và lệnh nối (independent: false)

**Files:** Create `pipeline/noi-du-an-s08.mjs`, `pipeline/noi-du-an-s08.test.mjs`. Phục vụ E1, E2, E9.

**Interfaces:** Produces `kiemBangNoi({ bang, duAn, nut }): { loi: string[], dong: {project_id, slug, status, ly_do}[] }`, `boDau(s: string): string`.

### Task 3: Migration và mappings (independent: false)

**Files:** Create `db/migrations/074_noi_du_an_s08.sql`. Modify `pipeline/mappings.yaml`. Phục vụ E3, E5, E6, E8. Kiểm: chạy `nap.mjs`, `kin.mjs`.
