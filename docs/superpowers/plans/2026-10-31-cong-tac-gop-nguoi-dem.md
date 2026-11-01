# cong-tac-gop-nguoi-dem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bước gộp Người theo SĐT của HD13 chỉ ghi khi công tắc `ops_audit` `danh-ba:gop-sdt` bật; mặc định tắt.

**Architecture:** Hàm thuần `docCongTac(rows)` + `SQL.congTac`/`SQL.ghiCongTac` + `congTacGop(c)` (to_regclass trước,
không bắt lỗi) trong `pipeline/lib/danh-ba-nguoi.mjs`; `dungNguoi({ gop })` dùng công tắc khi `gop` vắng; CLI
`--cong-tac-gop`; thước đêm trong `nap-lai-nguoi.mjs` chạy lượt 0 tắt rồi bật trong giao dịch.

**Tech Stack:** Node ESM, pg, node:test. **Spec:** `docs/superpowers/specs/2026-10-31-cong-tac-gop-nguoi-dem-design.md`
+ `_acceptance/cong-tac-gop-nguoi-dem/contract.md` + `evals.yaml`.

## Global Constraints

- Hằng: `CONG_TAC_GOP = "danh-ba:gop-sdt"`, actor `dung-nguoi` (`NGUOI_LAM`), `env = 'local'`, `detail = {bat, ly_do}`.
- Không migration. Không ghi `oneinvest` (DB thử `oneinvest_p3_nguoi`). Mã chạy thật không truyền `gop`.

## Review Focus

1. DB không có `ops_audit` → tắt, giao dịch không hỏng (E1 ca không bảng).
2. `detail.bat` là chuỗi `"true"` → tắt (E3).
3. Công tắc tắt sau khi đã gộp → người gộp giữ nguyên, lượt sau ổn định (E4).
4. `tachNguoi` khi công tắc tắt vẫn tách được và lượt dựng kèm không gộp lại (HD13 E6 chạy với công tắc bật; tắt → 0 gộp hiển nhiên).
5. `--cong-tac-gop` đi cùng `--tach` → thoát 2 trước DB (E6).

### Task 1: lõi + CLI (E3, E8, E1, E2, E4, E5, E6, E9) — independent: false

**Files:** `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/dung-nguoi.mjs`, `pipeline/refresh-bait-gap.mjs` (buocDem nhận `gop`
chỉ để thước đối chứng), `pipeline/scripts/danh-ba-nguoi.test.mjs`, `pipeline/scripts/danh-ba-nguoi.itest.mjs`.

**Produces:** `docCongTac(rows: {id, detail}[]) → "bat"|"tat"`; `congTacGop(c) → Promise<"bat"|"tat">`;
`dungNguoi(c, { gop?: boolean })` trả thêm `cong_tac_gop`, `gop_cho`; `ghiCongTac(c, { bat, lyDo })`.

- [ ] Test thuần E3 (ma trận 7 dòng) + E8 (quét ops_audit + lời gọi dungNguoi không mang `gop`, đối chứng dương). Đỏ.
- [ ] Cài lõi; `cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs` xanh.
- [ ] Itest: `batCongTac(db)` cho ca HD13 E3–E7, E9 cũ; ca mới CTG E1 (tắt + không bảng), E2 (bật, vế đêm), E4, E5, E6, E9. Đỏ rồi xanh với executor `nguoi_db`.
- [ ] Commit.

### Task 2: thước đêm (E7) — independent: false

**Files:** `pipeline/scripts/nap-lai-nguoi.mjs`, `pipeline/CLAUDE.md`.

- [ ] Lượt 0 qua buocDem (công tắc tắt trong giao dịch: gỡ dòng công tắc sẵn có) → gop 0, gop_cho theo nguồn = N1 (tinhSo, tập gộp rỗng); chèn công tắc bat → lượt 1 qua buocDem gộp = N1; giữ các kiểm HD13; đối chứng buocDem({gop: true}) lượt 0 trong SAVEPOINT → thước đỏ.
- [ ] Chạy executor `nguoi_nap_lai` trên DB thử, exit 0. Commit.
