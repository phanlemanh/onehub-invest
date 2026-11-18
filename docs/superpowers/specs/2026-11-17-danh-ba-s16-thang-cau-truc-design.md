# DA37 danh-ba-s16-thang-cau-truc — thiết kế

Hàng nối tiếp DA33. Cổng Đáng: «build» theo lời Mạnh «Theo khuyến nghị cả ba câu» (07:57Z 17/11; ROADMAP §3 mục 54, Q-B, Q-C;
`docs/architecture/mo-hinh-danh-ba-du-an.md` §1.3, §1.3a). Hợp đồng: `_acceptance/danh-ba-s16-thang-cau-truc/contract.md`.

## 1. Hiện trạng đo trên DB máy thu (sau DA33 áp, 17/11, chỉ đọc)

| Dự án S16 | Khu trong danh sách | Toà mang bí danh S16 | Toà đúng 1 khu (bản có danh sách) | Toà cũng có S09 | Toà cũng có S08 | Nút phân khu sẵn |
|---|---|---|---|---|---|---|
| Grand Park | 12 | 72 | 72 | 60 | 34 | 6 |
| Ocean Park 1 | 16 | 88 | 88 | 49 | 11 | 13 |
| Ocean Park 2 | 13 | 14 | 14 | 0 | 0 | 0 |
| Ocean Park 3 | 9 | 7 | 7 | 0 | 0 | 0 |
| Smart City | 11 | 37 | 37 | 0 | 0 | 0 |
| **Cộng** | **61** | **218** | **218** | 109 | 45 | 19 |

Nút vùng hiệu lực hiện tại của 218 toà (view 097): gốc = dự án 109 · cụm S09 68 · phân khu S09 35 · nút `building` cũ 6.
Thẻ S16: 38 «một mã căn dưới nhiều toà», 20 «toà S16 trùng tên», 2 «căn S08 cùng mã nằm ở toà khác» — đều `pending`.
Khẳng định do bộ dựng ghi (run_id `dbv-…`) 30 ngày: 69.

## 2. Bảng phủ ca (chiều × giá trị, số từ DB máy thu; «ai đọc đầu ra» ở cột cuối)

| Chiều | Giá trị | Số | Xử lý | Ai đọc đầu ra |
|---|---|---|---|---|
| Khu của toà | đúng 1 khu (bản có danh sách) | 218 | tầng S16 | view → trang danh bạ (N1) |
| | 0 khu | 0 | tầng dưới, đếm | — |
| | > 1 khu | 0 | tầng dưới, đếm | — |
| Khu ↔ nút | trùng tên nút phân khu sẵn | ≤ 19 | nút sẵn nhận khu S16 (bí danh) | thẻ luật |
| | không trùng | ≥ 42 | đúc nút `subzone` mới qua thẻ luật | thẻ luật |
| Toà có S09 | có | 109 | S16 thắng (Q-B) | view |
| Căn S08 cùng mã khác toà | có | 2 | căn S08 gộp vào căn S16, thẻ cho nghỉ | review_queue, đếm lệch |
| S16 tự mâu thuẫn | mơ hồ / trùng tên | 38 / 20 | giữ thẻ chờ người (Hỏi-1) | /ops/review |
| Khẳng định của lượt | có | 69/30 ngày | đường lùi rút, không xoá | lùi |
| Tin S03 làm nguồn cấu trúc | — | — | ngoài phạm vi, vì Mạnh chưa xếp S03 | — |

## 3. Thiết kế

### 3.1 Migration 111 — `v_toa_nut_vung` thêm tầng S16
`CREATE OR REPLACE VIEW v_toa_nut_vung` giữ ba cột (`building_key`, `region_node_id`, `region_node_id_goc`, `nguon`). Thêm CTE:
- `s16`: bí danh `ma_nguon` nguồn S16 trên toà (`value = <du_an>/<toa_id>`) → `stg_s16_toa` chỉ ở bản thu có `khu_id` trong
  `stg_s16_khu` cùng bản → giữ toà có đúng một `khu_id` khác nhau;
- `pk16`: nút `asset_nodes` mang `meta -> 's16_khu_ids' ? '<du_an>/<khu_id>'`.
`region_node_id = COALESCE(pk16.id, cum.id, pk.id, b.region_node_id)`; `nguon` thêm `'s16_phan_khu'` đứng đầu. Toà không có bí
danh S16 cho đúng dòng như 097 (AC-1). Đường lùi: áp lại phần view của 097.
Thêm view `v_lech_cau_truc_s16` (dự án, cặp nguồn, loại lệch, số): toà S16 có S09 xếp vào phân khu khác; căn S08 đã gộp vào căn
S16 (lệch toà); tên toà S08/S09 khác tên S16.

### 3.2 Lệnh thẻ luật `pipeline/phan-khu-s16.mjs`
Theo khuôn `pipeline/noi-du-an-s06.mjs`:
- `--the <tệp>`: chỉ đọc; theo dự án: tên khu (công khai — thông tin dự án, ROADMAP §3 mục 38) → nút sẵn trùng tên chuẩn hoá
  (`chuanHoaTenToa`) hay «nút mới», số toà; dòng cuối «băm: <hex>» băm trên nội dung kế hoạch. Không in `toa_id`, `khu_id`, mã căn,
  tên nguồn thật.
- `--ap --bam <hex> --nguoi <tên>`: dựng lại kế hoạch, băm khác → thoát, 0 ghi. Một giao dịch: nút sẵn nhận `<du_an>/<khu_id>`
  vào `meta.s16_khu_ids`; khu không có nút → đúc `asset_nodes` (`node_type='subzone'`, `parent_id` = nút dự án, `name` = tên khu,
  `catalog_tier='xac_minh'`, `meta.s16_khu_ids`, `meta.s16_rule_id`); một dòng `project_link_rules` (source `S16`, `mau_bam`,
  `so_ma` = số khu). Áp lại cùng băm: 0 nút mới.
- `--dao <id> --nguoi <tên>`: gỡ khu của dòng luật khỏi `meta.s16_khu_ids` mọi nút; nút do luật đúc ghi `meta.nghi = true`;
  `dao_by`, `dao_at` vào dòng luật. View trả toà về tầng dưới.
Áp lên DB máy thu là lời riêng của Mạnh («Áp thẻ luật S16 <băm>»), như DA32.

### 3.3 Bước S16 của lệnh dựng (Q-B)
`pipeline/lib/s16-dung.mjs`, nhánh «căn S08 cùng mã nằm ở toà khác» (DA33: 0 căn + thẻ) đổi thành: đúc căn S16 trong toà S16 (trục,
tầng như DA33), căn S08 `status='merged'`, `merged_into` = căn mới (rào 082 cho phép), thẻ `can-lech-toa` `pending` của mã ấy →
`rejected`, `decision_note = 'S16 thắng cấu trúc (DA37)'`. Bước S08 (`theLechS16`) khi S08 đi sau S16: cùng cách. Hai thứ tự
cho cùng tập (AC-5). Không đụng thẻ mơ hồ, trùng tên (Hỏi-1).

### 3.4 Job đêm (Ngoài-6 DA33)
`buocVatTheDem` giữ tập khu = `khuDaDung` (sau DA33 là năm khu). Bước S16 trả thêm `moc` (now() của giao dịch) và số khoá mới;
job in một dòng «S16: khoá mới <n>, mốc <ISO>» — đủ cho `ghi-khoa.sh` của đường lùi chạy sau với cửa sổ ấy.

### 3.5 Đường lùi (Ngoài-5 DA33)
Bộ lùi của hàng ở `_acceptance/danh-ba-s16-thang-cau-truc/lui/`: tệp khoá ghi `# db`, mốc, khoá theo bảng; lùi trong một giao
dịch: khẳng định của lượt → `retracted_at = now()`, `retract_reason = 'lui-da37'` (rào 045 cho rút); căn S08 đã gộp → `status
active`, `merged_into NULL`; căn, trục, bí danh S16 mới của lượt → gỡ (tạm tắt rào chỉ-thêm bốn bảng như DA33 — chạy chỉ khi
Mạnh gõ lời lùi); `phan-khu-s16.mjs --dao`; áp lại view 097. Tệp khoá thiếu `# db` hay của DB khác → thoát 4.

## 4. Không làm
Xem Out of scope của hợp đồng. Trang `/ops/registry` đọc view và hiện số lệch là hàng N1.
