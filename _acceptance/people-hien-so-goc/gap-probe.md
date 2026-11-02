---
slug: people-hien-so-goc
at: 2026-11-02T05:47:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng tìm số gói cả khớp nguyên số, số nghỉ và người nhiều số dưới một câu trích chỉ quyết chuẩn hoá [the-duyet-nguoi-nhieu-nhieu#F1] | Gõ số cũ ra trống, gõ một phần không ra, người hai số thì hàng hiện số khác số vừa tìm mà eval vẫn xanh | Tách dòng, thêm ca hai số sống và ca chỉ có số nghỉ, assert quan hệ số hiện và số tìm | fixed: tách sổ, Hỏi-2 hỏi khớp một phần, mã hiện đúng số vừa tìm, E4 và E7 thêm ca |
| P0 | contract | Out of scope thu hẹp lời hứa với vai Người xem mà sổ không ghi; E12 không quét các trang sau; dòng liên hệ gói việc giữ ảnh và chữ bài [seller-ref-theo-nguoi-gui#F1] | Bề mặt khác hay trang 2 đưa số tới vai Người xem mà mọi eval xanh; vai Vận hành gọi mà không biết tin nói gì | Chốt ngưỡng ba bề mặt có dòng descope hoặc ma trận mọi route; đưa ảnh và chữ bài vào Hỏi-n | fixed: sửa ngưỡng và thêm descope có tên; E12 quét trang 2 và sáu dạng; human-gate1: Hỏi-1 về ảnh và chữ bài |
| P0 | decisions | Chỗ đặt số là lựa chọn nhìn chưa có dòng sổ và chưa có design-pass; ở 390 px cột thứ tư cần vuốt mới chạm được [the-duyet-hien-nguoi-dang#F3] | Mạnh duyệt bằng chữ rồi mở bản chạy mới thấy; điện thoại không còn một chạm mà E10 vẫn xanh | Dòng sổ kèm ảnh design-pass; E10 đo liên kết trong khung nhìn khi chưa cuộn | fixed: dời số lên cột đầu, ghi sổ, có design-pass.md, E10 đo khung nhìn, bỏ nhãn judgment của AC-9 |
| P1 | evals | E6 dùng getDeals giả; E12 không assert ops ở /ops/deals; bốn AC thiếu tag cross-layer | Loader thật bỏ trường liên hệ với vai ops mà ba eval xanh; DB không có căn nào thì vế viewer đạt suông | E12 assert ops và admin, thất bại khi không có tin mang số; thêm tag | fixed: E12 assert ba trang và đòi có tin mang số; thêm tag bốn AC. Ca round-trip dealsSql: rejected, E12 đã đi loader thật trên DB máy thu |
| P1 | evals | Luồng gõ số trên bản chạy không có eval; E12 không gọi ?q= | Form làm hỏng dạng +84… mà E4 xanh; payload RSC của vai Người xem mang số vừa gõ | E10 gõ qua ô thật hai dạng; E12 viewer đủ sáu dạng | fixed: E10 bước gõ thật có expected; E12 quét sáu dạng ở ba vai |
