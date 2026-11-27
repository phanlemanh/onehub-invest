# Nút S08 trùng khoá nhóm — số đo và đề xuất (DA55 vòng 2, GS 26/11)

Nguồn của mục «lượt áp sau đúc nút S08 thứ hai cho cùng khoá nhóm» (S4 vòng 1, `pipeline/lib/noi-du-an-s08-lop.mjs:49`). Thẻ Cổng
Bằng chứng và `review-findings.md` của vòng 2 chép nguyên số dưới đây.

- Đo chỉ đọc DB máy thu 26/11 (giao dịch READ ONLY, `dungTheLuat`): thẻ đúc **163 dự án → 158 nhóm**; **5 nhóm nhiều dự án (10 dự án)**.
- **3 snapshot S08, 06→20/11**: không nhóm nào có thành viên về ở ngày thu khác nhau → lượt áp đầu sinh **0 nút trùng** hôm nay.
- Lỗi **phát sinh khi S08 thu thêm dự án vào nhóm đã đúc**: lượt áp sau không tìm nút S08 cùng khoá nhóm, đúc nút thứ hai. S08 đang
  được thu toàn bộ (lời 22/11), nên điều kiện này sắp xảy ra thật.
- **Đề xuất máy: mở hợp đồng mới** (không phải known-limits) — hàng sửa «đúc theo khoá nhóm, áp lại không sinh nút», mã **DA65**
  (GS cấp 27/11), xếp trước lượt nạp S08 kế.
- Rào áp và phép đếm kiểm sau áp: design doc `docs/superpowers/specs/2026-11-22-soat-noi-s08-danh-ba-design.md` §7.
