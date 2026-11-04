# Kế hoạch: kiem-do-sau-ap-070-sua

Hợp đồng `_acceptance/kiem-do-sau-ap-070-sua/contract.md`. Các task làm tuần tự, cùng một phiên.

## Task 1: N3 đếm số đáng có dòng sellers

- `independent: false`. Phục vụ E1, E2.
- Files: `pipeline/lib/danh-ba-nguoi.mjs` (hằng `TIN_VAO_DANH_BA`), `pipeline/do-danh-ba-sdt.mjs` (`SQL_N3`), `pipeline/scripts/kiem-do-sau-070.test.mjs`.
- Verify: `node --test pipeline/scripts/kiem-do-sau-070.test.mjs`.

## Task 2: Nạp lại migration cũ sau 070

- `independent: false`. Phục vụ E3, E4.
- Files: `pipeline/lib/nap-view-song.mjs`, `pipeline/lib/nap-061.mjs`, `pipeline/scripts/nap-lai-db.itest.mjs`, `pipeline/scripts/phat-bieu-db.itest.mjs`.
- Verify: `node --test pipeline/scripts/kiem-do-sau-070.test.mjs`.

## Task 3: Phép đo trên bản chép

- `independent: false`. Phục vụ E4, E5.
- Files: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`, `_acceptance/config.yaml`.
- Verify: `node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`, chỉ dùng DB thử.
