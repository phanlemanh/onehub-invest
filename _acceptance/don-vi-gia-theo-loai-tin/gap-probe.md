---
slug: don-vi-gia-theo-loai-tin
at: 2026-11-06T07:10:00Z
verdict: findings
p0: 0
p1: 6
p2: 7
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | E2 | Giá cao nhất lạ, giá thấp nhất thường không đo | Bản chỉ xét giá thấp vẫn xanh | Bước thấp 15 cao 15000 triệu; đột biến | fixed: bảng biên có thuê thấp 15 cao 15000 triệu và bán cao 50 triệu; đột biến «chỉ xét giá thấp nhất» đỏ |
| P1 | E2 / gia-la.ts | Ngưỡng 1 tỷ, 100 triệu không ghim | Đổi ngưỡng hay >= thành > vẫn xanh | Bảng biên | fixed: biên 999/1000 triệu, 0,999/1 tỷ, 99/100 triệu; đột biến >=→>, ngưỡng 10 tỷ, 60 triệu đều đỏ |
| P1 | E2 | Bán thường không đo | Hỏi mọi giá bán vẫn xanh | Bước bán 5 tỷ | fixed: bước bán 5 tỷ không hỏi, có gửi; biên bán 100 triệu, 5 tỷ không hỏi |
| P1 | E2 / khoá | Đổi giá sau xác nhận không đo | Khoá thô vẫn xanh | Đổi số sau xác nhận | fixed: bước đổi 12000 sau khi đã xác nhận 11000 thì hỏi lại; đột biến khoá chỉ Loại tin đỏ; khoá thêm itemId |
| P1 | E2 / AC-2 nêu giá | Không đọc chữ hộp | Câu chung chung, sai đơn vị vẫn xanh | Khẳng định chữ | fixed: chữ hộp có «11000 tỷ», «12000 tỷ», «50 triệu»; đột biến tên đơn vị đỏ (1500 triệu một tháng) |
| P1 | E3 / ma-the.tsx | Bảng tạm bị chặn không đo | Nuốt lỗi vẫn xanh | Ca từ chối, ca không có | fixed: ba kiểu chép · từ chối · không có; hai kiểu sau phải báo «Không chép được mã thẻ», nhãn giữ nguyên |
| P2 | E2 | Ô giá tick không suy ra được | Hỏi giá cũ, không gửi | Bước tick | fixed: tick ô giá thì không hỏi, gửi not_stated; đột biến đọc giá bỏ qua tick đỏ |
| P2 | AC-1 bỏ chọn | Không có Then | Bỏ chọn đưa về tỷ vẫn xanh | Then + đo | fixed: AC-1 thêm «bỏ chọn giữ nguyên», lượt A đo bỏ chọn Cho thuê giữ triệu |
| P2 | ToggleGroup | Bấm lại nút đang sáng không tính là tay | Loại tin ghi đè | Bước bấm lại | fixed: mã đặt donViTay cả khi bấm lại nút sáng; lượt B [tỷ, tỷ]; đột biến đỏ |
| P2 | LuuLoiAlert | Đường Thử lại không đo | Thử lại lách hộp | Bước mất kết nối | rejected: onRetry gọi luu() không cờ xác nhận, cùng đường với nút Lưu; khoá xác nhận theo giá trị nên đổi giá vẫn bị hỏi ở cả hai đường |
| P2 | AC-2 giá 0 | Ngoại lệ 0 không chốt | Bán 0 không hỏi | Chốt | fixed: bỏ ngoại lệ, bán 0 cũng hỏi; AC-2 ghi «kể cả 0»; biên có bán 0 |
| P2 | E3 vị trí | Chỉ so trước chuỗi đầu tiên, không đột biến | Mã ngoài dòng mô tả vẫn xanh | Con đầu của khối text-xs; đột biến | fixed: mã là con đầu của khối mô tả lớp text-xs ngay trước « · S03 · »; ba đột biến bỏ mã ở ba màn đỏ |
| P2 | labels-view key | Dựng lại khi sang thẻ khác | Khoá thẻ trước sang thẻ kế | Đo render lại | fixed một phần: khoá xác nhận chứa itemId nên thẻ khác luôn hỏi lại; không đo riêng việc dựng lại vì `key={tin.itemId}` có từ trước vòng này |
