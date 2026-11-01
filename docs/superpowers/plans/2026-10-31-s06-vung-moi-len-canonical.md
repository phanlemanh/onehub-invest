# Kế hoạch thi công — s06-vung-moi-len-canonical (31/10/2026)

Hợp đồng: `_acceptance/s06-vung-moi-len-canonical/contract.md` (Mạnh duyệt Cổng 1 31/10, Hỏi-1/2/3 theo khuyến nghị).
Thiết kế: `docs/superpowers/specs/2026-10-31-s06-vung-moi-len-canonical-design.md`. Mọi ca DB chạy trên bản chép
`oneinvest_n1_svm` (`db/db-thu.sh`), không chạm `oneinvest`. Làm tuần tự trong vòng chính (các task dùng chung tệp
harness `scripts/s06-vung-moi/acceptance.mjs`).

## T1 — Migration 064 + lệnh đếm mã dài
- Files: `db/migrations/064_ma_thi_truong_ngan.sql`, `scripts/s06-vung-moi/dem-ma-dai.mjs`,
  `scripts/s06-vung-moi/acceptance.mjs` (mode `mig`, `rao`, `dem`).
- 064: một khối DO — tính cặp (mã dài → mã ngắn) bằng regexp; rào: va chạm mã ngắn, rồi từng khoá ngoại tới `areas`
  đọc từ `pg_constraint` (không danh sách tay) có dòng trỏ mã dài → RAISE gọi tên bảng; qua rào: UPDATE
  `area_sources`, `area_breakdowns`, `data_level_snapshot` rồi `areas.id`. Không mã dài → NOTICE, no-op.
- `dem-ma-dai.mjs`: chỉ đọc; liệt khoá ngoại tới `areas` từ catalog + cột chữ `area_id`/`market_id`; đếm dòng trỏ
  mã khớp `^vn-(thanh-pho|tinh)-`; mã 1 khi có. Hàm truy vấn tách để chạy được qua đường chỉ-đọc của sync-cloud.
- Verify per-task: `node scripts/s06-vung-moi/acceptance.mjs mig && … rao && … dem` + lượt phá-thử (bỏ UPDATE
  area_sources khỏi bản chép → đỏ ghim thông điệp).
- Phục vụ E1, E2, E12. independent: false.

## T2 — Một chỗ ánh xạ
- Files: `pipeline/lib/thi-truong.mjs`, `pipeline/lib/thi-truong.test.mjs`.
- `THANH_PHO` (khoá cities.ts → mã thị trường), `SAP_NHAP` (mã tỉnh cũ → mã mới), `thiTruongCua(cityCode)`,
  `khoaThanhPho()`; test ma trận viết trước + khoá ⊂ id cities.ts + quét /vn-[a-z-]+/ hai tệp đích + ca quan hệ.
- Verify: `node --test pipeline/lib/thi-truong.test.mjs` (+ phá-thử chèn chuỗi cứng → đỏ ghim tên tệp).
- Phục vụ E3. independent: false (T3, T4 dùng).

## T3 — reassign-areas đọc từ module
- Files: `pipeline/reassign-areas.mjs`.
- `MARKETS` dựng từ `THANH_PHO`; thành phố ngoài hanoi/hcmc chỉ chạy khi thị trường đã có trong `areas` (không chèn);
  khoá không có snapshot → một dòng gọi tên.
- Verify: `node --test pipeline/scripts/*reassign*` có sẵn + mode `reassign` của harness.
- Phục vụ E4, E5. independent: false.

## T4 — transform-chotot đọc từ DB
- Files: `pipeline/transform-chotot.mjs`.
- Tập thị trường = `docThiTruongCoPhuong`; `city_code` qua `thiTruongCua`; cuối lượt in `city_code lạ: <mã> (<n> tin)`.
- Verify: mode `transform` của harness (so bảng offer→area HN/HCM bằng transform main vs nhánh trên cùng bản chép).
- Phục vụ E6, E7. independent: false.

## T5 — Harness reassign/transform/real + scope
- Files: `scripts/s06-vung-moi/acceptance.mjs` (mode `reassign`, `transform`, `real`),
  `_acceptance/s06-vung-moi-len-canonical/probes/scope.sh`.
- Snapshot giả dựng đúng khuôn thư mục collector, nạp qua importer thật; `real` cần ranh giới S04 Đà Nẵng thật
  (claudedp-3110-17) — chưa có thì mode in một dòng và thoát 2 (BLOCKED có tên, không giả xanh).
- Verify: chạy từng mode; phá-thử E8 (xoá area_id 30% tin ĐN → đỏ).
- Phục vụ E4–E8, E11. independent: false.

## T6 — Hồi quy
- `cd pipeline && npm test`, `node --test scripts/*.test.mjs`; job-exit, au3 chotot (chạm transform-chotot qua bản giả).
- Phục vụ E9, E10.
