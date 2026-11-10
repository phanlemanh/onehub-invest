---
slug: the-gan-nhan-nguoi-dang
at: 2026-11-05T23:15:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn người đăng của tin chữ trích docstring docThe, câu đó chỉ quyết chữ, không quyết người đăng; E2 chỉ thử ghép cùng người | Ghép bài ảnh về tin chữ của người khác thì thẻ hiện sai người, E2 vẫn xanh | Căn cứ trích luật ghép cùng sender_id; E2 thêm ca hai người | fixed: dòng sổ mới supersedes d-20261105T223516Z-3 trích luật ghép cùng người gửi ở pipeline/lib/gop-anh.mjs; E2 thêm ca bài ảnh người B cạnh tin chữ người A không ghép, thông điệp KHONG GHEP KHAC NGUOI |
| P1 | evals | E3 thiếu nhánh danh sách tên nguồn không đọc được và sender_name NULL; chiều đỏ chỉ một đột biến | Lỗi đọc bảng nguồn làm cả màn 500, hoặc mã rơi về tên gốc khi bộ che trả null, E3 vẫn xanh | Ca bảng nguồn vắng → route 200, nguoiDang null; ca NULL; đột biến ?? tên gốc | fixed: E3 thêm ca bảng source_registry vắng, ca sender_name NULL, đột biến LO TEN KHI KHONG CHE |
| P2 | evals | E2 không nói đi qua route GET; không ghim tin chữ ngoài lát | Đường nạp tin chữ thiếu cột, ca thuần vẫn xanh | E2 chạy qua route GET thật, thêm ca tin chữ không thuộc lát | fixed: E2 đọc JSON route GET thật, thêm ca tin chữ ngoài lát |
| P2 | contract | AC-5 không liệt kê danh sách tệp được phép; vế lược đồ tạm đo tĩnh | Người ký duyệt danh sách không thấy | Liệt kê trong AC-5; phép đo hiệu ứng | fixed: AC-5 liệt kê nguyên văn danh sách, E8 thêm kiểm tệp đổi không ghim 'public.'; rejected phần đo hiệu ứng: getSourceNameEntries đọc source_registry không ghi lược đồ, test đặt DATABASE_URL về lược đồ tạm trước mọi import |
