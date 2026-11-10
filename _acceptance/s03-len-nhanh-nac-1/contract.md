---
schema_version: 1
feature: S03 lên nhanh nấc 1 (phần Claude) — lượt nạp nhanh 15′ đặt lock_timeout ngắn cho ba bước transform, đụng khoá DB thì bỏ lượt và báo khi bỏ 8 lượt liền; bảy bước đo dời khỏi cloud-sync sang job mỗi giờ với cờ tự nhận
slug: s03-len-nhanh-nac-1
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [pipeline]
status: implemented
design_doc: docs/superpowers/specs/2026-11-10-s03-len-nhanh-nac-1-design.md
approved_by: Mạnh
approved_at: 2026-11-10T10:31:00Z
---

# Acceptance Contract: s03-len-nhanh-nac-1

## Context

Mạnh «Chuyển nấc 1» ngày 10/11 (báo cáo chạy liên tục): `zalo-import` thêm lượt nạp nhanh mỗi 15′ trong 7–22h. Phần nạp
nhanh do hàng `s03-nap-nhanh` (liên làn, nhánh `feat/s03-nap-nhanh`, gộp TRƯỚC hàng này) làm: cờ `--luot-nhanh` (biến
`S03_LUOT_NHANH=1`), plist `com.oneinvest.s03-nap-15phut`, khoá nạp bận thì bỏ lượt, lượt nhanh dừng sau
refresh-bait-gap (không đọc gộp, không enrich). Hàng này làm phần còn lại của làn Claude: `lock_timeout` cho ba bước
transform của lượt nhanh, cách xử khi đụng khoá DB, và dời các bước đo khỏi `cloud-sync.sh` để nhịp sync nhanh hơn.
Phần (b) viết trên main SAU khi `s03-nap-nhanh` gộp, dùng lại cờ ấy, không dựng cơ chế song song. Review của
`s03-nap-nhanh` (PR #404) chuyển sang hàng này rủi ro lượt nhanh chạy song song job S06 14:00, hai bên cùng UPDATE
`sale_offers` trong refresh-bait-gap mà không có khoá chung — tách thành hàng T2 `bait-gap-mot-giao-dich` đi trước (N1-58).
Số đo trước khi bật (DB thử 10/11, 114.569 bài): transform-zalo 62,4 s, transform-media 7,5 s, refresh-bait-gap 6,1 s —
tổng ≈ 76 s, dưới ngưỡng 5′, LT2 chưa cần. Đích: p95 đăng → `sale_offers` ≤ 20′, đăng → cloud ≤ 60′ trong 7–22h.

## Criteria

- AC-1: Given lượt nạp nhanh (`zalo-import-daily.sh --luot-nhanh`, `S03_LUOT_NHANH=1`), When phần nạp xong, Then ba bước
  transform-zalo, transform-media, refresh-bait-gap mỗi bước nhận `PGOPTIONS` chứa `-c lock_timeout=10s`
  (`S03_NHANH_LOCK_TIMEOUT=3s` thì `lock_timeout=3s`); bước nạp không có `lock_timeout`; lượt 00:00 (không cờ) không bước
  nào có `lock_timeout` và vẫn đủ sáu bước.
- AC-2: Given lượt nhanh, When một bước transform hỏng với đầu ra chứa `lock timeout` (hay `55P03`), Then theo Hỏi-2
  (khuyến nghị): in `BỎ LƯỢT [zalo-import-daily] bước <nhãn>: đụng khoá` lên stderr, các bước sau vẫn chạy, job thoát 0
  nếu không bước nào hỏng vì lý do khác; số lượt nhanh liền có bỏ lượt đếm ở `pipeline/logs/zalo-import-bo-luot.state` —
  lượt thứ 8 liền in `JOB FAIL [zalo-import-daily] đụng khoá 8 lượt liền` và thoát 75; lượt nhanh không bỏ bước nào hay
  lượt 00:00 đặt lại số đếm về 0. Bước hỏng vì lý do khác vẫn `JOB FAIL [zalo-import-daily] bước <nhãn> mã <n>` và thoát
  bằng mã ấy; ở lượt 00:00, hỏng vì khoá vẫn là `JOB FAIL` (không bỏ lượt).
- AC-3: (cross-layer) Given DB thử có dữ liệu S03 và một phiên khác giữ khoá ACCESS EXCLUSIVE trên `stg_zalo_posts`, When
  `zalo-import-daily.sh --luot-nhanh` thật chạy (node thật, transform thật, cây tạm không snapshot mới), Then
  transform-zalo dừng trong vòng 30 giây với `BỎ LƯỢT … transform-zalo`, job thoát 0 và số dòng `sale_offers` S03 không
  đổi; cùng DB không ai giữ khoá thì transform-zalo xong mã 0 và không có dòng `BỎ LƯỢT`.
- AC-4: Given `scripts/cloud-sync-do.sh`, When chạy, Then chạy đúng bảy bước theo thứ tự trang-thai-chao, bac-du-lieu
  --write, do-danh-ba-sdt --write, do-the-duyet --write, mau-soat-cuon-chieu, do-hang-ngay --write, do-lam-giau --write;
  thoát bằng mã hỏng đầu tiên với dòng `JOB FAIL [cloud-sync-do] bước <nhãn> mã <n>`; theo Hỏi-3 (khuyến nghị): ghi dấu
  `pipeline/logs/cloud-sync-do.last` (giây epoch) SAU bước cuối và CHỈ khi không bước nào lỗi chạy (mã thoát 0); khi khoá
  `pipeline/logs/cloud-sync-do.lock` đang giữ bởi một PID còn sống thì in `bỏ lượt: lượt đo trước còn chạy`, không chạy
  bước nào, thoát 0; khoá của PID đã chết thì gỡ và chạy.
- AC-5: Given dấu `cloud-sync-do.last` ghi cách đây dưới 7200 giây, When `cloud-sync.sh` chạy, Then chạy đúng bốn bước
  ha-bung-het-han, sync-cloud, refresh-data-flow, push-ops-facts, in một dòng `bước đo: job giờ chạy lúc` và không chạy
  bước nào trong bảy bước đo; dấu vắng, cũ từ 7200 giây hay không phải số → chạy đủ mười một bước theo thứ tự như trước
  vòng, bảy bước đo chạy dưới cùng khoá `cloud-sync-do.lock` — khoá đang giữ bởi PID sống thì bỏ bảy bước với dòng
  `bước đo: lượt đo khác đang chạy`.
- AC-6: Given các tệp bọc sau vòng, When chạy `scripts/job-exit.test.mjs` và bốn bộ test job nạp hiện có
  (`zalo-import-job.test.mjs`, `enrich-buoc-job.test.mjs`, `zalo-import-job-lan.test.mjs`, `s03-nap-nhanh.test.mjs`),
  Then đều xanh: phần nạp của `zalo-import-daily.sh` (trên dòng «Từ đây trở xuống là làn Claude») không đổi so với
  merge-base, và mã thoát của `cloud-sync.sh`, `cloud-sync-do.sh` là mã hỏng đầu tiên.

## Coverage

Trục (quét hình thái, preset test-matrix — thực thể «một lượt job»):
- Tệp bọc: `zalo-import-daily.sh` · `cloud-sync.sh` · `cloud-sync-do.sh` → AC-1…AC-3 · AC-5 · AC-4.
- Loại lượt nạp: nhanh (`--luot-nhanh`) · 00:00 (không cờ) → AC-1, AC-2.
- Biến tay: không đặt · `S03_NHANH_LOCK_TIMEOUT` → AC-1.
- Kết cục bước: xanh · hỏng vì khoá · hỏng lý do khác × lượt nhanh · lượt 00:00 → AC-2 (sáu ô).
- Số lượt bỏ liền: 0 · 7 · 8 · đặt lại → AC-2.
- Lớp đo: node giả (thứ tự, biến, mã) · DB thật có khoá → AC-1, AC-2, AC-4, AC-5 · AC-3.
- Dấu job giờ: vắng · tươi · cũ · rác → AC-5.
- Khoá job giờ: trống · PID sống · PID chết → AC-4, AC-5.
- Kết cục job giờ: chạy trọn · có bước lỗi chạy → AC-4 (dấu chỉ ghi khi chạy trọn).
- Không đổi: phần nạp làn ZCode, lượt nhanh của `s03-nap-nhanh`, mã thoát AU13 → AC-6.
Thước CE: số đo (a) ở design doc §2; hành vi trước vòng là lời hứa của `zalo-import-job.test.mjs` (sáu bước),
`s03-nap-nhanh.test.mjs` (lượt nhanh bốn bước) và `job-exit.test.mjs` (mười một bước cloud-sync).

## Out of scope

- OOS-1: Plist launchd cho job đo mỗi giờ (`StartInterval 3600` chạy `scripts/cloud-sync-do.sh`): GIAO ZCode qua liên
  làn sau gộp, triển khai theo tin GIAO riêng. Lượt nạp nhanh 15′ (cờ, plist, khoá bận thì bỏ lượt, bỏ đọc gộp và enrich)
  thuộc hàng `s03-nap-nhanh`.
- OOS-2: LT2 transform tăng dần, LT3 đường nóng 5′, LT4 sync tăng dần, LT5 đọc gộp lô 15′.
- OOS-3: Cảnh báo `/ops` khi bỏ lượt liên tục; trần thời gian mỗi lượt.
- OOS-4: Đo p95 đăng → `sale_offers` / cloud sau khi bật (LT8) — sau khi ZCode triển khai lịch 15′.
- OOS-6: Giao dịch và khoá chung cho phần bait gap của `refresh-bait-gap` — hàng `bait-gap-mot-giao-dich` (gộp trước).
- OOS-5: Gỡ hẳn bảy bước đo và cờ tự nhận khỏi `cloud-sync.sh` khi job giờ đã ổn — hàng sau, nếu cần.

## Notes

- Số đo (a) chạy trên DB thử lúc máy rảnh; dưới tải giờ sáng (resolve-properties lượt 05:30 gần 3 giờ) chưa đo — phần
  đụng khoá do AC-4, AC-5 lo.
