# Bảng phủ ca — so-nguon-kho-khai-bao (S1, 21/11)

Đếm trên DB máy thu `:5433/oneinvest`, phiên `default_transaction_read_only = on`, khoảng 06:55Z 21/11. Nguồn gọi bằng mã; không in
`real_name`, `source_ids`. Mã đọc: `origin/main` 3c529c0b4.

## Sổ nguồn hôm nay

15 dòng (S01–S08, S10–S16), không có S09, S17. Cột: code, real_name, label_vi, status, since, retired_at, source_ids, note, reason,
resume_when, match_whole. Chỉ S16 có `match_whole = true`. Nhịp là hằng trong mã: S01 192 · S02 840 · S03 72 · S05 96 · S06 36 ·
S08 192 · S10 192 · S11 192.

## Bảng (mã × trục)

| Mã | status hôm nay | dữ liệu đếm được | độ tươi hôm nay | đích sau hàng | ai đọc phía sau |
|---|---|---|---|---|---|
| S01 | active | snapshot theo `source_ids`: hanoi 149 (cuối 15/11 13:03Z) · hcmc 42 (cuối 07/11) · vn 1 (23/10) | hanoi đạt; hcmc, vn đỏ vĩnh viễn | `flow`, 192, `measured_markets {hanoi}` → chỉ hàng hanoi | CLI, `/ops`, `/ops/collections`, `/api/v1/ops/coverage`, `bao-cao-ngay`, `push-ops-facts` → cloud |
| S02 | active | `airdna_markets` | «đạt» (xanh giả, ngoài phạm vi: NK2) | `flow`, 840, số không đổi | như S01 |
| S03 | active | `stg_zalo_posts` (luồng chính) | đạt | `flow`, 72, số không đổi | như S01 |
| S04 | completed | `stg_osm_boundaries` | không đo | `stock`, cadence NULL, không đo | `/ops/sources` |
| S05 | paused | 0 lượt từ 24/10 | không đo | `flow`, 96, vẫn paused | `/ops/sources` |
| S06 | active | `stg_chotot_ads` | đạt | `flow`, 36, số không đổi | như S01 |
| S07 | draft | 0 snapshot theo `source_ids`; `stg_s07_*` 0 dòng | không đo | `stock`, cadence NULL, `stg_tables` ba bảng `stg_s07_*`, giữ draft | `/ops/sources` |
| S08 | active | `stg_s08_inventory` 80.471 · `stg_s08_project` 357 | đạt | `stock`, 192, số không đổi (probe riêng giữ nguyên) | như S01 |
| S09 | **không dòng** | `stg_s09_item` 345 dòng, 1 snapshot 13/11 12:09Z, city `vn` | vô hình | dòng mới `stock`, `active`, 192 giữ chỗ, `stg_tables {stg_s09_item}`, tầng A điền trên máy | CLI, `/ops`, `/ops/collections`, cloud, bộ soát tầng A |
| S10 | active | 0 snapshot theo `source_ids`; `stg_s10_*` 0 dòng | «chưa có dữ liệu» (đúng) | `stock`, 192, `stg_tables` hai bảng `stg_s10_*`, probe riêng giữ nguyên | như S01 |
| S11 | active | 0 snapshot, không bảng stg | «chưa có dữ liệu» | `stock`, 192, `paused` + reason «hoãn nạp S11 — ROADMAP §3 mục 53» → rời tập đo | `/ops/sources` |
| S12–S15 | draft | 0 | không đo | `stock`, cadence NULL | `/ops/sources` |
| S16 | active | `stg_s16_can` 186.108 · `stg_s16_can_chi_tiet` 95.798 · `stg_s16_item` 251 · `stg_s16_khu` 170 · `stg_s16_toa` 544; snapshot có dòng: mới nhất 18/11 00:30Z, city `vn`; 0 snapshot khớp `source_ids` | «chưa khai SLO» | `stock`, 192 giữ chỗ, năm bảng → tuổi từ 18/11 00:30Z | như S01 |
| S17 | **không dòng** | không bảng stg | vô hình | dòng mới `stock`, `draft`, cadence NULL, tầng A điền trên máy | bộ soát tầng A, `/ops/sources` |

## Ô ngoài phạm vi

- `universe` mọi mã: để `{}` — ngoài phạm vi, vì chưa có số nguồn tự công bố kèm mốc và nơi lấy (Mạnh câu 3).
- Xanh giả S02, tồn đọng nạp S07, S10 (snapshot chờ nạp) — ngoài phạm vi, vì thuộc NK2 và làn thu.
- Lịch thu hcmc của S01 — ngoài phạm vi, vì là việc làn thu; hàng này chỉ thôi đo thị trường không có lịch.

## Đường cloud — tên S09, S17 trúng bao nhiêu ô (đo 26/11, GS giao)

Probe `probes/duong-cloud.mjs`. Danh sách tên đọc từ hai tệp cục bộ, theo cùng luật đọc với `tang-a.mjs`: S09 3 mục, S17 7 mục. Quét
bằng `findSourceNames` trên DB máy thu, phiên READ ONLY, một luồng, 133–199 s. Phạm vi gồm hai nguồn:

- `sync-cloud`: 22 bảng `FILL`, đúng các cột lên cloud (`selectList`) và bộ lọc dòng (`localReadSql`), kể cả khoá jsonb; tổng 1.024.308 dòng.
- Bản tin `push-ops-facts`: bắt bằng `captureOpsFacts`, HOME tạm, máy chủ thu 127.0.0.1, không lên cloud.

Probe chỉ in mã, bảng.cột và số đếm, không in tên hay giá trị.

| Cờ `match_whole` | S09 | S17 | S17 theo bảng.cột |
|---|---|---|---|
| không (hành vi khi dòng thiếu cờ) | 0 | 17.853 | `sellers.flags` 13.855 · `dq_check_results.detail` 1.860 · `dq_check_results.check_name` 1.844 · `sale_offers.seller_name` 284 · `ref_calib_listings.metrics` 4 · `ref_calib_listings.photo_urls` 4 · bản tin `jobs[].label` 1 · `blocks.reviewQueue.byType[].type` 1 |
| có, cho S17 (bước điền đặt cho cả S09, S17) | 0 | **0** | — |

Ở lượt không cờ, độ dài chỗ trúng là 5 ký tự ở 13.855/13.855 ô `sellers.flags`, 1.844/1.844 ô `check_name` và 280/284 ô
`seller_name`; 4 ô còn lại trúng 6 ký tự. Nguồn của các chỗ trúng này là bốn mục S17 sinh biến thể ngắn 5–6 ký tự, tức nhãn tên miền
sau khi bỏ đuôi, mà nhãn ấy là từ thường. Kết luận: không có rò thật của S17 trên đường cloud. Bước điền phải giữ
`match_whole = true` (đã có trong `ap-may-thu/tra-s09-s17.mjs`). Bước kiểm sau (`ap-may-thu.md` bước 5) chạy lại probe với ngưỡng
S09 0, S17 0.

Giới hạn: bản tin `push-ops-facts` dựng với log job rỗng, nên dòng log thật của máy thu nằm ngoài phép đo này.
