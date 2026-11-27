---
slug: yeu-cau-khong-thanh-tin-thue
at: 2026-11-26T09:15:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract AC-5 · evals E5 | Định nghĩa đếm thước mơ hồ (tin nghỉ, cửa sổ nhãn), không buộc tái lập mốc, data-flow chỉ in | Script đếm lệch định nghĩa nên ra số không so được với mốc 264 | Khối «trước» tái lập mốc ±2; định nghĩa ghi rõ; kiểm tin thuê sau = trước − rút | fixed: AC-5 định nghĩa đếm, khối trước/sau, «mốc lệch», kiểm phép trừ, đơn vị data-flow |
| P1 | contract AC-4 · evals E4 | Fixture từ DB sạch không chứng dọn tin đã lọt và cách lùi | Transform mới không nghỉ tin cũ; lùi không sống lại | Ba pha luật cũ → mới → cũ | fixed: AC-4 ba pha, tiêm luật cũ qua tham số khai trong test |
| P1 | contract AC-5, AC-6 · evals E6 | Mẫu chấm theo tin, có thể rỗng; bài rút ở tin gom không ai kiểm | Mẫu rỗng nên E6 đạt suông; bài rao bị gỡ khỏi tin gom không lộ | Mẫu theo bài, ngưỡng trên bài nhãn khác inquiry, 20 bài ngẫu nhiên, «mẫu thiếu» | fixed: AC-5 mẫu theo bài + ngưỡng ≤ 10 bài + 20 bài ngẫu nhiên hạt giống cố định |
| P2 | contract AC-2, AC-7 | Thiếu câu rao gần giống mỗi mẫu; không cấm sửa ca test cũ | «tìm gấp khách thuê» bị kéo vào mà ma trận vẫn xanh | Cặp gần giống có/không giá; diff test cũ rỗng | fixed: AC-2 cặp gần giống; AC-7 + lệnh pl42_loai_tin git diff --exit-code origin/main |
| P2 | design · decisions | Lệnh áp không đúng một chuỗi, không dòng sổ cho việc áp, kho_dao | Áp sai chuỗi hay quên 420 | Một chuỗi lệnh, dòng sổ áp | fixed: không có lượt áp riêng — lượt đêm zalo-import-daily (transform rồi 420); dòng sổ mới; lùi được chứng ở AC-4 pha 3 |
