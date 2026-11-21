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
