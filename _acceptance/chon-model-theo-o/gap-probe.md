---
slug: chon-model-theo-o
at: 2026-11-06T20:45:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design + contract | Sổ ghi máy quyết chỗ đặt bảng chọn (tệp trong kho) theo câu chặn của hàng, nhưng câu ấy không chọn giữa tệp trong kho, bảng DB hay màn Ops; chữ «dễ dàng» chỉ Mạnh phán được. E1 so băm mã trong cùng một lượt là phép đo hằng đúng. | Mạnh ký mà tưởng đổi model dễ; thực tế đổi một ô phải qua PR và CI còn đòi hồ sơ nghiệm thu, E1 vẫn xanh. | Câu hỏi chỉ-người cho chỗ đặt bảng; E1 đo bằng hai bảng qua cùng mã và kiểm tệp bảng nằm trong t1_skip_globs. | fixed: thêm Hỏi-3 (chi-nguoi, thay dòng sổ máy quyết); AC-1/E1 đổi sang hai tệp bảng qua --cau-hinh cùng mã, thêm ca DGS-AC-1-T1 kiểm t1_skip_globs có đối chứng; bỏ phép so băm. |
| P0 | contract + evals | Không AC nào đo cờ gửi ra ngoài: ZDR, không huấn luyện, DeepSeek chỉ qua Baseten. | Bộ đọc quên cờ gửi; Mạnh đổi một ô sang DeepSeek, chữ bài đi tới endpoint không ZDR; mọi eval vẫn xanh. | Gateway giả ghi tuỳ chọn mỗi lời gọi, ma trận ba mã × cờ, chiều đỏ ghim thông điệp. | fixed: cờ gửi chuyển vào mã theo mã Gateway (bảng không tắt được); AC-4 thêm vế cờ gửi; E4 thêm ca DGS-AC-4-CO với ma trận ba mã và chiều đỏ 'DEEPSEEK KHONG QUA BASETEN', 'THIEU ZDR'. |
| P1 | contract + evals | Phép khẳng định âm cho source_registry không phân biệt được vì chuỗi cài vào cũng có trong chữ bài; không cài định danh tài khoản thu. | Bộ đọc chèn tên miền nguồn hay ID tài khoản thu vào tin nhắn; E4 vẫn xanh. | Cài chuỗi riêng không có trong chữ bài cho tên miền, source_ids, agent_id; chiều đỏ ghim. | fixed: E4 cài MIEN_THAT_W, SID_V, TK_THU_U, SENDER_ID_T không có trong chữ bài; chiều đỏ 'LO SOURCE_REGISTRY', 'LO TAI KHOAN THU'. |
| P1 | contract | Ngưỡng 90–92% không có đường; độ đúng gộp chưa định nghĩa khi WC giao người. | Thẻ 9991 mất ảnh URL kéo số xuống khoảng 91,7%; E10 đỏ dù ô cơ hội chưa chết, hoặc so sai mốc. | Định nghĩa công thức, ghi mẫu số, nhánh vùng xám. | fixed: AC-10 định nghĩa dung_gop trên ô giao model (16 ô), mốc 07/11 tính lại 96,7%; vùng 90–92% đỏ với thông điệp 'VUNG XAM — MANH PHAN' để Mạnh phán; tóm tắt ghi anh_thieu theo thẻ và dung_gop_bo_9991; dòng sổ approach ghi công thức. |
| P1 | evals | E10 chỉ đọc tệp tóm tắt, không ghim băm mã bộ đọc và bộ chấm. | Sửa bộ chấm sau lượt chấm; băm prompt và bảng vẫn khớp, E10 xanh trên bằng chứng cũ. | Ghim ma_sha, chiều đỏ ghim thông điệp. | fixed: tóm tắt có ma_sha (src/enrich/doc-gop-s03/** + lệnh); E10 so ma_sha, chiều đỏ 'TOM TAT KHONG KHOP MA'. Đối chiếu sổ chi phí research-local: rejected — tệp gitignored, CI không đọc được. |
