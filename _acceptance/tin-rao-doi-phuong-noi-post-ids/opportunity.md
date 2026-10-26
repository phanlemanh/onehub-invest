---
schema_version: 1
slug: tin-rao-doi-phuong-noi-post-ids
feature: Thước «không tin nào mất hay đổi phường» của phép đo tin rao nối tin S03/S05 qua bài đăng, đo được cả khi mã tin đổi
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo Mạnh ký tin-rao-gan-khu-vuc-dung Ngoài-4/6 26/10
decided_at: 2026-10-26T10:16:27Z
prototype:
  base_commit: fdfb657c
  disposition: archive
---

## Vấn đề & ai gặp

Ngoài-4/6 của `tin-rao-gan-khu-vuc-dung` (Mạnh chọn «mở hợp đồng mới» khi ký 26/10). Thước `lech` của
`scripts/kiem-tin-rao-gan-khu-vuc.mjs` nối tin trước/sau một lượt transform theo `offer_id`. Mã tin S03/S05 là băm của
`kind|phường|giá|diện tích|phòng ngủ`, nên tin đổi hay mất phường sinh mã mới và mã cũ bị đối soát loại — thước không
thấy tin đó và báo «0 tin bị gỡ hay đổi khu vực» dù có. Người gặp: người ký Cổng Bằng chứng của mọi hàng đổi bước gán
khu vực tin rao (tin xanh oan), người vận hành đọc phép đo.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Một bài đăng (post_id) chỉ thuộc một tin S03/S05 sau dedup, nên nối theo bài là nối 1-1 | Một bài sinh nhiều tin, nối nhầm | Đếm trên DB local số post_id thuộc >1 tin của cùng nguồn | Đã thử 26/10: 0 post_id thuộc >1 tin S03/S05 — đúng |

## Ngưỡng chết / ngưỡng UAT

Không đo được — việc nội bộ của phép đo đường dữ liệu, không có người dùng cuối.

## Kết quả prototype

Không dựng prototype.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Phép đo AC-8 | `scripts/kiem-tin-rao-gan-khu-vuc.mjs` (trong kho) | triết-lý/logic | có | — |

## Cổng 0

- **decision = build** Căn cứ: Mạnh ký `tin-rao-gan-khu-vuc-dung` 26/10 với «Ngoài-4: mở hợp đồng mới; Ngoài-6: mở hợp đồng mới»; giám sát giao hàng cho dãy P3.
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** không đo được (việc nội bộ).

## Thước đo thành công → ứng viên criterion

- Một tin S03/S05 có phường hợp lệ mà lượt sau mất hay đổi phường thì thước báo đỏ gọi bài/tin đó.
- Trên dữ liệu thật hiện tại, thước mới báo 0 tin lệch.

## Out of scope từ khám phá

- Khoá tin bền của PL14 — chưa có; khi PL14 xong thì thước đổi sang khoá đó ở việc riêng.
- Đối chứng dương của phép đo dựa vào tin sai sẵn trong DB (Ngoài-5, Mạnh đã chọn ghi Known limits).
