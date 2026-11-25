---
schema_version: 1
feature: Trần 50 của transform S06 đếm cái lượt thật sự đổi, nên giá trị mang tên nguồn còn nằm trong dữ liệu thu của các đêm trước không làm job dừng mọi đêm
slug: street-raw-tran-dem-tren-phat-bieu-song
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-25T22:24:08Z
approved_by:
approved_at:
---

# Acceptance Contract: street-raw-tran-dem-tren-phat-bieu-song

## Context

Hàng PL41, GS cắt 25/11 từ finding t3 của S4 r2 PL39 (Ngoài-3, «mở hợp đồng mới»). PL39 đặt trần 50 ô mang tên nguồn mỗi
lượt transform S06 (vượt thì job dừng, không rút, không ghi), nhưng đếm trên MỌI dòng `stg_chotot_ads` — bảng giữ mọi tin từng
thu. Giá trị bị bỏ ghi vẫn nằm trong stg và được đếm lại mỗi đêm: trần thành cộng dồn, tích đủ 51 giá trị thật (25/11 có 1) là
transform S06 dừng mọi đêm dù sổ nguồn không đổi. Xếp chồng trên PL39 (PR #544).

Luật mới: trần đếm (a) phát biểu sống của S06 ở đường, toà mà giá trị trúng — cái lượt sẽ rút; cộng (b) giá trị trúng ở tin MỚI
— tin chưa có bản ghi `sale_offer_records`, lượt sẽ bỏ ghi lần đầu. Giá trị trúng của tin đã có bản ghi không vào trần (các
lượt trước đã xử: không còn phát biểu sống trúng). Mọi giá trị trúng vẫn bị bỏ ghi như PL39; dòng log không đổi.

## Bảng phủ ca

| Ca | Phát biểu sống trúng | Giá trị trúng ở tin mới | Giá trị trúng ở tin cũ | Bản PL39 | Bản PL41 | Ai đọc phía sau |
|---|---|---|---|---|---|---|
| Đêm thường 25/11 (DB máy thu) | 0 | 0 | 1 | chạy | chạy | transform S06 đêm |
| Tích dần qua nhiều đêm (ca 1) | 0 | 0 | 51 | DỪNG mọi đêm | chạy, vẫn bỏ ghi 51 | transform S06 đêm, số trên cổng |
| Sổ nguồn có token chung chung, tin cũ | > 50 | — | — | dừng | dừng | người soát sổ |
| Một lượt nhiều tin mới mang tên (ca 2) | 0 | 51 | — | dừng | dừng | người soát sổ |

## Acceptance Criteria

- **AC-1** Given bản chép DB máy thu, 51 tin S06 đã có bản ghi nhận đường mang tên nguồn trong stg và không phát biểu sống nào
  mang giá trị ấy, When chạy transform S06, Then bản PL41 chạy trọn và vẫn bỏ ghi cả 51 (log bỏ ghi street_raw ≥ 51); bản PL39
  (đếm trên stg) trên cùng trạng thái dừng ở «vượt trần 50» trước mọi lần ghi.
- **AC-2** Given cùng bản chép thêm 51 tin mới có quận mang tên nguồn, When chạy transform S06 bản PL41, Then lượt dừng với
  «vượt trần 50 — dừng, không rút, không ghi» trước mọi lần ghi: số tin, phát biểu, phát biểu đã rút không đổi.
- **AC-3** Given test đơn vị của luật PL39, When chạy, Then vẫn xanh (trần 50 đi tiếp, 51 dừng; luật trúng đúng chỗ bộ soát).

## Coverage

- Bảng phủ ca ở trên: nguồn trúng (phát biểu sống · tin mới · tin cũ) × bản mã (PL39 · PL41).

## Đường đo

- Hàng nền chặn rủi ro (không đổi số trên màn): transform S06 không dừng vì giá trị cũ. Lệnh đo: `probes/tran.sh`.

## Out of scope

- Tin cũ mà nguồn đổi đường sang giá trị mang tên nguồn trong lượt này: không vào trần (phát biểu sạch cũ vẫn sống, không có
  gì để rút); vì: không phải ca token chung chung — ca ấy làm phát biểu sống trúng hàng loạt và bị (a) bắt.
- Số «rút K chủ thể» đếm theo danh sách đọc trước (finding t1 PL39): ghi Known limits ở PL39.

## Notes
- S3 25/11, phép đo trên bản chép (`probes/tran.sh`, tải 1′ 16,3): ca 1 bản PL39 dừng «52 giá trị chữ … vượt trần 50» trước
  mọi lần ghi (51 cấy + 1 ô thật của sự cố 24/11 còn trong stg); bản PL41 chạy trọn 310 s, log bỏ ghi street_raw 52; ca 2 (51 tin
  mới mang quận tên nguồn) bản PL41 dừng «51 ô chữ mới (tin mới + phát biểu sống) … vượt trần 50», số tin, phát biểu, lượt rút
  không đổi.
