# do-nen-hieu-nang — đo nền hiệu năng (Invest + Ops) trên DB local

Hàng P4 (Mạnh giao 27/10 ~00:00Z). Lời Mạnh: bật pg_stat_statements ở DB local, đo p50/p95 thời gian tải 5 trang chính và 10
truy vấn chậm nhất, ghi số nền vào docs/research; sau đó mới trình ngưỡng để đưa vào luật. Hàng ĐO — không đặt luật.

## Đã làm trước S1 (27/10, Mạnh duyệt «lối an toàn» trong phiên P4)

- Soát trước khởi động lại: dữ liệu DB (3 GB, `/var/lib/postgresql/17/main`) nằm trong lớp ghi của container `one-invest-db`,
  KHÔNG trong volume `db_oneinvest_pgdata` (gắn `/var/lib/postgresql/data`, rỗng). `docker compose up -d` với cấu hình mới sẽ tạo
  lại container = mất dữ liệu → không sửa `db/docker-compose.yml`; chuyển dữ liệu vào volume là hàng riêng (giám sát trình Mạnh).
Dòng thời gian (UTC, từ dấu giờ tệp và nhật ký lệnh của phiên P4):

| Giờ | Việc |
|---|---|
| 07:17:40 → 07:17:51 | `pg_dump -Fc` vào thư mục tạm của phiên (`oneinvest-truoc-restart-20261027.dump`, 160.181.966 byte) — TRƯỚC khởi động lại |
| 07:17:58 | `pg_restore -l` đọc 325 mục dữ liệu bảng |
| 07:18:07 | Đếm bảng + số dòng bảng lớn (285 bảng) |
| 07:18:15 | `ALTER SYSTEM` (preload pg_cron,pg_stat_statements; `max_connections` 200) → `docker restart one-invest-db` |
| 07:18 → 07:20 | Postgres không lên: `ALTER SYSTEM` nhận cả danh sách thành MỘT chuỗi có nháy kép, preload đòi thư viện tên `pg_cron,pg_stat_statements` |
| 07:20:08 | Phiên P4 TỰ sửa: chép `postgresql.auto.conf` ra `/tmp/auto.conf.loi` trong container, `sed` dòng `shared_preload_libraries` thành `'pg_cron,pg_stat_statements'`, khởi động lại — KHÔNG hỏi giám sát trước |
| 07:20:13 | `healthy` (DB không phục vụ khoảng 2 phút) |
| 07:20:20 | Extension pg_stat_statements; 285 bảng trước = sau, số dòng bảng lớn khớp |
| 07:20:55 | Lời dặn của giám sát «không lên được thì dừng, báo ngay, đừng tự gỡ» tới phiên P4 — SAU lần tự sửa. Dù lời dặn tới muộn, tự sửa cấu hình DB dùng chung mà không báo trước là lệch lối an toàn đã duyệt; đã báo giám sát ngay sau đó |
| 07:21:03 | Chép bản sao lưu sang `~/dev/onehub-invest/research-local/backup-oneinvest-2710.dump` (vì thế giờ sửa tệp là 07:21) — sha256 bản gốc = bản chép |
| 07:25:03 | Lượt cloud-sync kế tiếp xanh (leak gate PASS) |

- Bản sao lưu giữ: `~/dev/onehub-invest/research-local/backup-oneinvest-2710.dump` (160.181.966 byte, sha256
  `1adbe8952c6d1cc34303e429251ef9ee7ce432052df6dc17878de052231d0947`, gitignored). Giữ tới khi hàng chuyển dữ liệu vào volume xong.
- Cấu hình sau cùng: `max_connections` 200, `shared_preload_libraries` pg_cron,pg_stat_statements, extension pg_stat_statements.

## Cách đo

`scripts/do-nen-hieu-nang/do.mjs`: `next start` bản build prod (cổng 3463), 5 trang — Invest `/vn`, `/vn/hanoi`,
`/vn/hanoi/listings`; Ops `/ops`, `/ops/data-flow` (đăng nhập tài khoản ops thử của DB local). Mỗi trang 2 lượt làm nóng + N
lượt tuần tự (mặc định 20): TTFB và tổng (đọc hết HTML); lượt tính chỉ khi HTTP 200 và `<title>` đúng trang. Reset
`pg_stat_statements` trước lượt đo → 10 truy vấn theo tổng và theo trung bình (calls ≥ 3) trong cửa sổ đo. 15 bảng lớn nhất:
cỡ, `n_live_tup`, lần ANALYZE gần nhất. Câu truy vấn + tên bảng che tên nguồn thật bằng mã S0x (`maskSourceNames`). Tài
khoản ops thử bị worktree khác xoay (DB dùng chung) → script gọi `dev-ops-account.mjs` rồi thử lại một lần. Kết quả JSON + bảng vào `docs/research/do-nen-hieu-nang-2610.{json,md}`.

Giới hạn đo: một máy, một client tuần tự (không đo tải đồng thời); cửa sổ pg_stat_statements có cả job nền khác đang chạy
(cloud-sync, launchd) — ghi rõ trong tài liệu.

## Phát hiện phụ (ghi vào tài liệu, không sửa ở hàng này)

- Bảng lớn `nights` (1,3 GB), `stg_calendar` (720 MB), `stg_abnb_listings`, `stg_listings`, `stg_abnb_nights`: `n_live_tup` 0,
  không có lần ANALYZE nào trong `pg_stat_user_tables`. Gốc: bộ đếm thống kê `pg_stat` bị xoá ở một lần tắt không sạch hoặc khôi
  phục trước 27/10 (không còn log); bảng không ghi thêm nên autovacuum không đạt ngưỡng đếm lại. Đo lại ở S1: planner KHÔNG mù
  (`reltuples` khớp số dòng thật, `pg_statistic` có) — cái mù là autovacuum: `nights` 217.540 dòng mà heap 724 MB + chỉ mục 598 MB
  (phình ~50×). Đề xuất (Mạnh quyết): ANALYZE một lần, đo phình rồi quyết VACUUM FULL / nạp lại, ANALYZE sau mỗi lượt nạp.
- Lược đồ tạm của test sót lại: 22 lược đồ `dc_*` / `freshness_test_*`, 226 bảng, ~6,3 MB.

## Lối đã loại
- Đo trên dev server — câu giao đòi build prod.
- Tự ANALYZE trong hàng này — đổi nền đang đo; để Mạnh quyết theo số.
