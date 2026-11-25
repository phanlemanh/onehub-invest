# Kế hoạch: ban-chep-da-loc-cho-may-phat-trien (HT18)

Hợp đồng: `_acceptance/ban-chep-da-loc-cho-may-phat-trien/contract.md` (AC-1…AC-10). Thiết kế: `docs/superpowers/specs/2026-11-25-ban-chep-da-loc-cho-may-phat-trien-design.md`.
Vùng tệp: chỉ `scripts/ban-chep-da-loc*` (+ khoá `bcl_*` đã có trong `_acceptance/config.yaml`). Không sửa `pipeline/sync-cloud.mjs` — chỉ import.
Luật máy: DB máy thu `oneinvest` chỉ đọc; không ghi cloud; không in giá trị tầng A; không chạy suite nặng (npm test toàn bộ) khi dãy khác giữ s4.

## Task 1 — Lõi thuần (independent: false)
Files: `scripts/ban-chep-da-loc.mjs` (export hàm thuần), `scripts/ban-chep-da-loc.test.mjs`.
- `keHoachCot(table, localCols, tokens)` → dùng `selectList(table, cols, [], tokens)` của sync-cloud (geoCols rỗng: COPY giữ kiểu gốc).
- Hằng: `BANG_CAM` (users, sessions, machine_tokens, user_events, user_profile, saved_markets, review_queue, airbnb_snapshots + mẫu `^stg_`),
  `NGOAI_FILL_CO_DONG` = [source_registry, spatial_ref_sys]; `TEN_DICH_RE = /^oneinvest_m5_[0-9]{8}$/`; mẫu ngày sinh/giới tính.
- Câu SQL soát DDL (mười loại: hàm, view, COMMENT, DEFAULT, CHECK, enum, tên ràng buộc, tên chỉ mục + dữ liệu text/json/mảng text) và
  hàm bỏ định danh lược đồ có sẵn (tên bảng, tên cột từ catalog đích) trước khi dò bằng `findSourceNames`.
Verify: `node --test scripts/ban-chep-da-loc.test.mjs` (E2 bcl_cot: ma trận cột ba bảng người bán + ca đỏ «SELECT *»).

## Task 2 — Chép (independent: false, sau Task 1)
Files: `scripts/ban-chep-da-loc.mjs`.
- Từ chối đích sai khuôn / `oneinvest` (mã 2). Xoá mọi `oneinvest_m5_*` cũ trước khi dựng (trần một bản sống); lỗi bất kỳ → xoá đích.
- Lược đồ: `docker exec one-invest-db pg_dump --schema-only -n public` | psql vào đích (bỏ pg_cron); PostGIS có trên đích.
- Bảng FILL là VIEW ở máy thu (sale_offers, listings): trên đích đổi thành bảng cùng kiểu cột (CREATE TABLE … AS SELECT … WITH NO DATA,
  DROP VIEW CASCADE, dựng lại view phụ thuộc từ định nghĩa đã lưu). Cột bị loại có NOT NULL → bỏ NOT NULL ở đích.
- Dữ liệu: một phiên nguồn `REPEATABLE READ READ ONLY` + `pg_export_snapshot()`; mỗi bảng một ống
  `psql nguồn (SET TRANSACTION SNAPSHOT; COPY (SELECT <cột đã lọc> FROM t <childFilterSql>) TO STDOUT)` → `psql đích COPY t(<cột>) FROM STDIN`.
- `source_registry`: chỉ mã + vai trò, cột khác NULL. `airdna_*` → `ALTER TABLE RENAME` thành `ref_calib_*`.
- Đầu ra: `pg_dump -Fc` → `state/ban-chep-m5/oneinvest-m5-<ngày>.dump` + `ke.json` (số dòng mỗi bảng, sha256, sha mã, giờ snapshot).
Verify: E1, E7, E10 trên DB của lượt (`bash db/db-thu.sh oneinvest_suite_bcl --chay …`, itest cắt bớt dòng nguồn trong DB của lượt).

## Task 3 — Bộ soát đích + --kiem (independent: false, sau Task 2)
Files: `scripts/ban-chep-da-loc.mjs`, `scripts/ban-chep-da-loc.itest.mjs`.
- Soát sau chép, trước dump: token (từ `docSourceNameEntries` của nguồn, không in), bảng cấm, source_registry, ngày sinh/giới tính, schema lạ.
  Trúng → thoát 1 nêu chỗ, xoá đích, không dump. Mọi dòng in ra không chứa token (ca kiểm stdout/stderr).
- `--kiem <dump>` (khôi phục vào DB tạm, sha, số dòng = ke.json, soát) và `--khong-tu-dien`; `--don`.
Verify: E3, E4, E5, E6, E8 — ca BCL-n trong itest, mỗi phép đo mới có cặp xanh/đỏ cùng fixture, thông điệp ghim.

## Task 4 — Ca dữ liệu thật (independent: false, sau Task 3)
Files: `scripts/ban-chep-da-loc-that.mjs`.
- Chép từ DB máy thu thật (chỉ đọc), soát, dump; dựng data-api và app (`RENAME_REFCALIB=1`) trên bản chép ở cổng riêng, gọi
  `/v1/listings` và trang Invest khu Hà Nội, in số; dọn DB đích và tiến trình.
Verify: E9 — chỉ chạy trong lượt s4 (nặng).

## Thứ tự / phụ thuộc
1 → 2 → 3 → 4, tuần tự (cùng một tệp mã). Không task nào independent → không fan-out.
