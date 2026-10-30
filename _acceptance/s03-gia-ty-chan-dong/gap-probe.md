---
slug: s03-gia-ty-chan-dong
at: 2026-10-30T02:44:10Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn chỗ sửa ghi máy đã quyết bằng câu trích chỉ tả lỗi; còn lối khác sống (sửa PHONE_RE dùng chung, regex riêng cho gatSo, đọc giá trước khi gạt), và sửa PHONE_RE dùng chung đổi cả danh sách SĐT người bán. | «LH 0901234567,0912345678» chỉ còn trích một số; người duyệt không thấy đánh đổi này. | Nêu ba lối và hệ quả lên danh sách SĐT, hoặc chọn lối không đổi danh sách. | fixed: đổi cách sửa — giữ nguyên PHONE_RE và extractPhones, chỉ trong gatSo bỏ qua khớp có dạng đuôi nhóm nghìn; dòng sổ mới mang supersedes, căn cứ một-lối (hai lối kia để SĐT nối SĐT lọt vào bước đọc số — điều kiện CHẾT của ô). |
| P1 | contract + evals | Trục B thiếu SĐT nối SĐT và SĐT sau «m2,» — đúng dạng mà điều kiện mới chặn thêm. | Số thứ hai không bị gạt, «678 T.Lan» đọc thành 678 tỷ, E2/E3 vẫn xanh. | Thêm các dòng ấy vào AC-2, AC-3 với đáp án viết trước. | fixed: AC-2 thêm 3 dòng (nối bằng phẩy, nối bằng chấm, sau «m2,»), AC-3 đòi dòng nối SĐT ra cả hai số; ca đỏ E2 ghim «0901234567,0912345678». |
| P1 | contract + evals | «Không lùi trên dữ liệu thật» chỉ dựa vào ngưỡng bảy thước N1, không so đầu ra cũ với mới. | Vài chục bài đổi giá hay đổi danh sách SĐT vẫn dưới ngưỡng, E5b xanh. | Eval so đầu ra bản nền với bản cây trên toàn bộ bài thật, liệt kê bài đổi. | fixed: thêm AC-6 + E6 (so-gia-ty-chan-dong.mjs, backend-effect): 0 bài đổi SĐT, mọi bài đổi giá phải mang dạng giá tỷ chẵn; đối chứng đột biến + bài tổng hợp. |
| P2 | contract | Giá tỷ chẵn nhóm bằng dấu cách («3 000 000 000 đ») không có trong ma trận cũng không ở Out of scope. | Người duyệt tưởng mọi dạng giá tỷ chẵn đã được phủ. | Thêm dòng hoặc ghi Out of scope. | fixed: ghi Out of scope (ngưỡng ô cơ hội áp cho nhóm bằng dấu chấm), design doc mục Không làm. |
| P2 | contract + evals | AC-3 nói «dòng AC-1 ra mảng rỗng» (8 dòng) nhưng E3 đo 5; E3 không có ca đỏ. | Bên chấm thấy 3 dòng không được đo; nửa AC-1 của E3 không phân biệt được bản sửa với bản lỗi. | Thống nhất số dòng, thêm ca đỏ. | fixed: AC-3 ghi rõ năm dòng giá tỷ chẵn + bảy dòng AC-2; E3 thêm ca đỏ (điều kiện vào PHONE_RE dùng chung → dòng nối SĐT chỉ còn một số). |
