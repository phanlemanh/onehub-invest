---
slug: che-tim-bi-danh-viewer
at: 2026-10-30T16:14:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng sổ chặn ở máy chủ ghi mục-tiêu, nhưng câu trích chỉ quyết viewer không thấy bí danh — không quyết viewer còn tìm được gì (bỏ q lặng lẽ, báo, hay tìm theo mã pty_); đây là đánh đổi khả năng dùng chỉ người chọn | Mạnh duyệt tưởng chỉ đóng lỗ dò; viewer mất mọi cách tìm, gõ ?q= nhận cả danh sách không dấu hiệu | Câu Hỏi ở Cổng 1, dòng sổ mới supersedes | human-gate1: Hỏi-1 (d-20261030T155816Z-5 supersedes d-20261030T155640Z-2); nháp theo khuyến nghị bỏ q kèm dòng báo, AC-1 và E1 đo dòng báo; lối khác ghi ở Notes |
| P1 | contract | Chốt đặt ở PeopleContent, không AC nào liệt các chỗ gọi khác của hàm danh sách | Một route khác gọi danhSachNguoi với q cho viewer vẫn dò được | Quét chỗ gọi hoặc dời chốt vào lớp truy vấn | fixed: AC-1 và E1 thêm quét app/src — chỗ gọi danhSachNguoi( duy nhất là people-content.tsx (đã đo 30/10: đúng một chỗ) |
| P2 | evals | AC-3 đo chuỗi có mặt, thiếu tag cross-layer và chiều đỏ | Bỏ luôn source cho viewer mà E3 vẫn xanh | So quan hệ hai tập, chiều đỏ ghim | fixed: AC-3 so tập với viewer source=S05 không q, tag (cross-layer), E3 layer backend-effect, chiều đỏ «CTV-AC-3 viewer mất lọc nguồn» |
| P2 | evals | E4 chỉ đo exit 0 của cả tệp | Một ca DBN bị bỏ qua mà E4 vẫn xanh | Ghim tên từng ca DBN | fixed: E4 đòi đầu ra liệt đủ mười ca DBN đều ✔ |
