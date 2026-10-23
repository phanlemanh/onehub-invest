# Hình tại điểm quyết định — canonical-khong-tin-gia

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — khi nào dọn thật | 4 bước nối tiếp (merge → lượt 00:00 → sync 15′ → cloud) + 2 nhánh (dọn trong vòng / sau merge) | `don-khi-nao.html` |
| Hỏi-2 — xoá người bán mồ côi | dưới ngưỡng: 1 bước, 2 nhánh không nối tiếp | — |
| Hỏi-3 — không xoá stg | dưới ngưỡng: 1 bước | — |

## Đề bài `don-khi-nao`

- Loại: dòng thời gian hai nhánh (swimlane ngang).
- Nút: «Nhánh khuyên: đo mô phỏng (ROLLBACK) trong vòng» → «Mạnh ký, merge» → «Lượt 00:00 code mới: transform rút 1.020 tin giả qua đối soát + ops_audit» → «refresh-bait-gap: tính lại gap, xoá 989 người bán mồ côi» → «sync 15′: cloud thay toàn bảng».
- Nhánh khác: «Dọn thật ở S3 (trước ký)» → «Lượt 00:00 code CŨ nạp lại tin giả» → «lặp tới khi merge».
- Nhãn chữ tiếng Việt; AC liên quan: AC-4, AC-7, AC-8.

| Hỏi-4 — chặn tụt sync cloud | 3 bước nối tiếp (dọn sellers 1.043 → 54 → sync soát tụt 5% < 50% → dừng mọi bảng) + 3 nhánh | `chan-tut.html` |

## Đề bài `chan-tut`

- Loại: luồng một trục + rẽ ba nhánh.
- Nút: «Lượt 00:00: refresh-bait-gap xoá 989 người bán mồ côi, ghi ops_audit {deleted, remaining=54}» → «sync 00:15: sellers local 54 < 50% của 1.043 trên cloud» → rẽ: (khuyên) «có dòng audit khớp remaining trong 24h → cho qua, cloud sạch» · «cờ một lần: sync đứng mọi bảng tới khi làn merge chạy tay» · «tách sellers ra hàng riêng: không xoá, cloud giữ 989 băm giả».
- AC liên quan: AC-7, AC-10.
