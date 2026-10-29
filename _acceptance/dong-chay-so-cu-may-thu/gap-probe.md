---
slug: dong-chay-so-cu-may-thu
at: 2026-10-27T07:35:00Z
verdict: findings
p0: 1
p1: 1
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ -3 ghi máy quyết chữ Alert và việc giữ vùng số bằng câu giao «như trên cloud» — câu ấy không quyết chữ (chữ máy thu khác cloud) | Người duyệt ký «như trên cloud», code ra chữ khác, E2 xanh vì ghim chữ máy tự đặt | Tách chữ thành câu hỏi; giữ vùng số trỏ căn cứ quyết được | human-gate1: Hỏi-1 (chữ Alert, dòng S1 mới thay -3); phần giữ vùng số thành dòng S1 mới căn cứ DF1 AC-7 «kèm số cũ» |
| P1 | evals | E2 chỉ kiểm có mặt đường ống và tiêu đề lưới, không so số với bảng | Nhánh stale vẽ ô «—» hay 0 mà E2 vẫn xanh | So từng chặng trên DOM với facts của bảng + đột biến bỏ số + thứ tự DOM | fixed: E2 so dòng đường ống và năm ô lưới với facts, Alert trước đường ống, đột biến view bỏ vùng số đỏ |
| P2 | design | Không nói lấy computed_at của dòng nào khi các dòng lệch | Một cửa sổ cũ, cửa sổ đang xem tươi: cloud báo cũ, máy thu không | Ghi luật chọn dòng + ca hai dòng lệch | fixed: computed_at cũ nhất của bảng (dòng S1 mới, căn cứ DF1 AC-4); E2 thêm ca chỉ dòng 30d cũ |
| P2 | evals | E3 quét chuỗi số vừa đỏ giả vừa lọt, đột biến 60′ không ghim chỗ | Hằng 2_700_000 thứ hai lọt; chú thích chứa 45 đỏ giả | Đột biến FACTS_STALE_MS ở ops-facts.ts, bỏ quét chuỗi | fixed: E3 thành phép đo hành vi trên bản sao ops-facts 60′ + chiều đỏ bản sao mang hằng riêng |
| P2 | evals | E4 paths thiếu ops-facts.ts, data-flow-content.tsx; AC đi qua DB thiếu cross-layer | Sửa ageState sau này không làm bằng chứng cloud hết hạn | Thêm paths, tag cross-layer | fixed: E4 paths thêm hai tệp; AC-2 gắn (cross-layer), E2 layer backend-effect |
