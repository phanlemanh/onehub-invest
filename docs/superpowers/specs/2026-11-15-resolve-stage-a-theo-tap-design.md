# Stage A của resolve-properties chạy theo tập — thiết kế

Hàng `resolve-stage-a-theo-tap` (giám sát giao 15/11, đường găng nhịp 1). Làn Claude, `pipeline/`.

## Vấn đề (đo 15/11)

Lượt `scripts/chotot-daily.sh` 22:30Z 14/11 (55.371 tin S06 mới) kẹt ở `resolve-properties.mjs` hơn 3 giờ 28 phút: Stage A gửi
mỗi cụm một câu `INSERT INTO property_offers … JOIN stg_chotot_ads … WHERE <khoá cụm> = $2`, mỗi câu nối lại cả `stg_chotot_ads`
(110.168 dòng) và tính sha256 từng dòng. 90.523 cụm × cả bảng stg là bình phương; `property_offers` chỉ tăng ~1.200 dòng/giờ. Các
bước sau resolve (300/400 metrics, `xep-hang-gia`) không kịp chạy trước lượt 07:00Z.

## Bảng phủ ca (đếm chỉ đọc trên DB máy thu, 15/11 ~02:45Z, lượt resolve đang chạy)

| Chiều | Giá trị | Số | Bản mới xử thế nào | Ai đọc đầu ra phía sau |
|---|---|---|---|---|
| Cụm | khớp căn có sẵn (stable_key) | 84.926 | UPDATE last_seen, n_evidence theo tập | 300/400 metrics, màn «gom cụm» |
| Cụm | mới, có tin chưa gắn | 4.987 | INSERT căn pending theo tập, xếp theo khoá cụm | 300/400, `xep-hang-gia`, cloud-sync |
| Cụm | mới, mọi tin đã gắn (DA6) | 610 | bỏ qua, không sinh căn | — |
| Cụm | khớp căn, còn tin chưa gắn | 430 | link tin chưa gắn vào căn khớp | `xep-hang-gia` |
| Tin | nối stg được (S06) | 104.646 | — | — |
| Tin | thiếu toạ độ | 30 | loại (như cũ) | — |
| Tin | thiếu m² / giá ≤ 0 | 0 / 0 | loại (như cũ) | — |
| Tin | cấp thị trường (`KHONG_CAP_THI_TRUONG`) | 0 | loại (như cũ) | — |
| Tin | đã có trong `property_offers` | 98.947 | không chèn lại (NOT EXISTS + ON CONFLICT) | — |
| Tin | `list_id` trùng qua nhiều snapshot | 0 (list_id là khoá của stg: 110.168 dòng = 110.168 mã) | mỗi tin đúng một cụm | — |
| Tin | thuộc ≥ 2 cụm | 0 | thứ tự vòng cũ không còn ảnh hưởng | — |
| Lượt | chạy lại lần hai | — | 0 căn mới, 0 link mới (đo E1, E3) | — |

Người đọc phía sau (300/400 metrics, `xep-hang-gia`, màn chặng «gom cụm», `sync-cloud`) đọc `properties` và `property_offers`;
bản mới cho ra cùng tập dòng nên không người đọc nào đổi. Khác duy nhất: `properties.id` của căn mới cấp theo thứ tự khoá cụm thay
thứ tự băm của GROUP BY (vòng cũ vốn không tất định); không người đọc nào dựa vào thứ tự id.

## Thiết kế

Một lượt Stage A = bảy câu thay ~2 × 90 nghìn câu:

1. `CREATE TEMP TABLE stage_a_tin` — nối `sale_offers` × `stg_chotot_ads` MỘT lần, tính khoá cụm và cờ `chua_gan`.
2. `CREATE TEMP TABLE stage_a_cum` — gom theo khoá cụm như câu cũ (n, fs, ls, area/kind/pt mới nhất, toạ độ trung bình,
   n_chua_gan), thêm `co_can` = có căn mang stable_key đó. Mốc giờ cắt về mili giây như đường cũ (giá trị đi qua `Date` của JS).
3. Chỉ mục + ANALYZE bảng tạm; một câu đếm cho dòng log (giữ đúng khuôn dòng `Stage A: … clusters → …`).
4. `UPDATE properties … FROM stage_a_cum` (cụm khớp) · `INSERT INTO properties … SELECT` (cụm mới có tin chưa gắn) ·
   `INSERT INTO property_offers … SELECT` (tin chưa gắn → căn của cụm, chỉ cụm khớp hoặc mới) · DROP bảng tạm.

Bảng tạm sống trong phiên — không DDL lên lược đồ, không migration. Mọi câu vẫn qua bộ thử lại deadlock `boc`. Stage B vẫn
đóng băng; `goSdtKhoiCan`, `dienDuongCan` không đổi.

## Lựa chọn đã loại

- Chỉ mục biểu thức trên `stg_chotot_ads` (migration 107): vẫn giữ vòng mỗi cụm, cần lời áp DDL; bảng tạm đủ.
- Gói cả Stage A trong một giao dịch: lỗi 40P01 làm hỏng cả giao dịch, phá luật thử lại từng câu của `boc`.

## Đo

`pipeline/scripts/resolve-so-stage-a.sh`: dựng bản chép DB máy thu (`db/db-thu.sh`), chạy bản cũ (rút từ git) và bản mới trên
hai bản chép cùng dữ liệu, so tập theo khoá nghiệp vụ. Bản cũ chạy hàng giờ trên đủ dữ liệu nên phép so trong lượt chấm dùng mẫu
`list_id % K = 0`; một lượt đủ dữ liệu chạy một lần làm bằng chứng phụ.
