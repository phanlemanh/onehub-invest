# resolve-thu-lai-deadlock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** resolve-properties chạy lại đúng câu bị Postgres huỷ vì deadlock (40P01), tối đa 3 lần, không đổi logic.

**Architecture:** Bộ bọc `boc(client, opts)` ở `pipeline/lib/thu-lai-deadlock.mjs` thử lại từng câu; `resolve-properties.mjs` tách thân `main` thành `chayResolve(c, opts)` và gửi mọi câu qua bộ bọc.

**Tech Stack:** Node ESM (.mjs), node:test, pg, PostgreSQL/PostGIS :5433.

**Spec:** `docs/superpowers/specs/2026-10-31-resolve-thu-lai-deadlock-design.md` · hồ sơ `_acceptance/resolve-thu-lai-deadlock/` (AC-1..AC-9, E1..E9).

## Global Constraints

- Chỉ mã `40P01` được thử lại; `MAC_DINH = { lan: 3, nhip: [500, 1000, 2000] }`.
- Dòng stderr: `resolve-properties: deadlock (40P01) ở «<40 ký tự đầu câu đã gộp khoảng trắng>», thử lại <k>/3 sau <ms>ms` — không in tham số.
- Dòng stdout tổng kết (chỉ khi n > 0): `resolve-properties: thử lại sau deadlock <n> lần`.
- Chữ SQL của resolve không đổi (bản chụp `pipeline/lib/thu-lai-deadlock.sql-base.json`, 9 câu, từ `82a53e0a`).
- Test DB: `oneinvest_p3_rtld_<pid>` ở :5433, tạo đầu tệp, xoá cuối tệp; không đọc, không ghi `oneinvest`.
- Vùng: `pipeline/resolve-properties.mjs`, `pipeline/lib/thu-lai-deadlock*`, `pipeline/tests/resolve-properties*`.

## Review Focus

- Lỗi không có `code` (lỗi kết nối) không được coi là 40P01.
- Lượt không thử lại lần nào: stdout giữ đúng hai dòng Stage A/B.
- Hết lượt ném đúng đối tượng lỗi cuối (không bọc lại), để `main` in và thoát 1 như trước.
- CLI (`isMain`) vẫn chạy `main()` với mặc định thật (chờ bằng `setTimeout`, ghi `process.stderr`/`stdout`).
- Vũ đạo itest phải là deadlock thật (đối chứng `lan: 0` ném 40P01).

---

### Task 1: bộ thử lại + unit (independent: false)

**Files:** Create `pipeline/lib/thu-lai-deadlock.mjs`, `pipeline/lib/thu-lai-deadlock.test.mjs`.

**Interfaces — Produces:** `export const MAC_DINH` · `export function boc(client, { lan, nhip, cho, ghiLoi } = {})` → `{ query(sql, params), soLanThuLai, soCauGui }` (getter) · `export function nhanCau(sql)` (40 ký tự đầu đã gộp khoảng trắng).

- [ ] Viết ca RTLD-AC-1..4 và RTLD-AC-7 theo E1–E4, E7 (ma trận viết trước + đối chứng đỏ) — chạy, đỏ.
- [ ] Viết `thu-lai-deadlock.mjs` — `node --test pipeline/lib/thu-lai-deadlock.test.mjs`: RTLD-AC-7 còn đỏ tới Task 2.

### Task 2: resolve qua bộ thử lại + itest (independent: false)

**Files:** Modify `pipeline/resolve-properties.mjs` · Create `pipeline/tests/resolve-properties-deadlock.itest.mjs`.

**Interfaces — Consumes:** `boc` của Task 1. **Produces:** `export async function chayResolve(c, { lan, nhip, cho, ghiLoi, ghi } = {})` → `{ soLanThuLai }`; `main()` gọi nó với mặc định.

- [ ] Viết ca RTLD-AC-5, 6, 8, 9 theo E5, E6, E8, E9 — chạy, đỏ.
- [ ] Sửa `resolve-properties.mjs` — unit + itest xanh; `cd pipeline && npm test` xanh.
- [ ] Commit.
