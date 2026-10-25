---
slug: yield-dong-tien-von-vay
at: 2026-10-25T01:16:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ để máy quyết bỏ ô tự nhập giá/đêm và công suất của bộ mô phỏng cũ; câu trích «Nhận phần của /dau-tu» không chọn giữa hai mô hình doanh thu | Mạnh ký mà tưởng gộp chỉ đổi giao diện; sau ship người biết giá căn mình không còn chỗ nhập; E5 xanh trên lựa chọn chưa ai duyệt [trang-chu-methodology#F2] | Dòng chỉ-người mới thay dòng cũ, thành câu hỏi ở Cổng 1 | human-gate1: d-20261025T011829Z-11 thay d-…-3 thành Hỏi-4 (khuyến nghị chỉ dùng số ước tính; lối khác thêm ô ghi đè); design doc «Câu hỏi cho người»; bỏ dòng tương ứng ở «Phương án đã loại» |
| P1 | design | Căn cứ một-lối của mặc định vay 30/9/20 («link cũ thấy cùng số») đã vỡ vì nguồn doanh thu và cách tính tiền mặt đổi | Mạnh duyệt mặc định vì tin nó giữ số cũ; lãi 9% lệch mặt bằng làm lệch mọi ô lợi nhuận | Đổi sang chỉ-người | human-gate1: d-20261025T011829Z-12 thay d-…-5 thành Hỏi-5 (khuyến nghị giữ 30/9/20, chú thích lưới nói là giả định sửa được) |
| P1 | evals | AC-6 hứa server dùng và kẹp cả eq/rate/term nhưng E8 chỉ đo eq | Trang bỏ qua rate/term trên URL hoặc không kẹp mà E7/E8 vẫn xanh | Thêm ca quan hệ cho rate/term vào E8 | fixed: E8 thêm rate=0.12 > mặc định, rate=0.5 = rate=0.3, term=100 = term=35, term=1 = term=5 (quan hệ trên HTML, thông điệp ghim tham số) |
| P1 | evals | AC-4 hứa số lưới BẰNG số ước tính cùng trang nhưng E5 chỉ đo hàm thuần trên estimate mẫu | page.tsx truyền estimate khác cho lưới (vd chi phí mặc định thay vì chi phí trên URL) — lưới và ô KPI hai số | So số lưới với ô KPI trên trang dựng thật | fixed: E8 thêm so doanh thu năm 1 và thu nhập ròng năm 1 của lưới với ô KPI cùng trang, với hai bộ tham số (mặc định; mgmt=0.1&fixed=2000000) |
| P1 | contract | AC-7 đi qua backend mà thiếu tag cross-layer; E9 đo chuỗi-có-mặt; E3 grep href thay vì dựng nút thật | Route/agent không nhận payload mới mà E9 xanh; nút Insight nội suy sai mã mà E3 xanh | Tag cross-layer, ca POST thật, dựng nút thật | fixed: AC-7 gắn (cross-layer) + lời hứa nói rõ ghi một dòng user_events; thêm E19 (backend-effect: POST /api/v1/user-events với phiên thử → 200 + 1 dòng payload đủ 5 khoá; không phiên → 204; kind lạ → 400); E3 vẽ InsightActions với vn-hanoi và một mã phường, so href ĐÚNG BẰNG. Bộ nhớ agent không đọc khoá payload nào (grep agent/src) nên không cần ca parse |
