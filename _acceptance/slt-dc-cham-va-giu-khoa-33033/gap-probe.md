---
slug: slt-dc-cham-va-giu-khoa-33033
at: 2026-11-20T12:05:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | AC-4/E4 chỉ đo nhánh signal bị huỷ tay, không đo đường node:test tự hết trần thật | Mã nối nhầm signal hay Node trên CI không huỷ t.signal khi hết trần, ca 7/9 hết trần vẫn giữ 33033 | Ca con trần nhỏ để node:test tự hết trần, đếm khoá rảnh, chiều đỏ không signal, in process.version | fixed: thêm ca «SLT-DC-KHOA hết trần thật» chạy tệp test tạm trần 2 s qua moGiaoDichGiuKhoa (lib/nap-045.mjs), kèm chiều đỏ, in phiên bản Node; AC-4 (b) |
| P1 | contract | AC-2/AC-3/AC-7 không đo S06 (~796k) và S05 cùng gọi replaceOwn | Câu mới ở mảng S06 tràn bộ nhớ hay lệch tập rút, mọi eval vẫn xanh | Thêm lượt S06, S05 vào phép so tương đương kèm thời gian; AC-7 thêm bước transform-chotot sau gộp | fixed: probe E2 chạy thêm transform-chotot (S06) và transform-fb (S05), so cả mảng nhiễu, câu mới dưới 60 s mỗi lần; AC-7 thêm bước transform-chotot ≤ 400 s |
| P1 | contract | kho_dao false trong khi câu chạy trên đường ghi sản xuất, thiếu sao lưu và lệnh kiểm sau | Rút nhầm sau gộp, revert không khôi phục dòng đã rút | Đổi kho_dao true, thêm ảnh chụp trước và lệnh kiểm sau | fixed một phần + rejected một phần: thêm lệnh kiểm sau đếm rút thay-boi-luot theo nguồn 2 giờ trước/sau (san-xuat.mjs, AC-7) và cách lùi trong ap-may-thu.md; giữ kho_dao false — dòng rút nhầm tự chèn lại sống ở lượt kế sau revert vì S03, S06 ghi lại trọn phát biểu mỗi lượt (sổ dòng revisit) |
| P2 | evals | AC-1 không có ca «bộ chỉ ở bảng» rõ, đối chứng dương không có dòng ✔ ghim | LEFT JOIN + COALESCE rút sạch bộ không có trong lượt mà E1 vẫn xanh | Ca thứ bảy, chiều đỏ thứ hai, ghim dòng ✔ đối chứng dương | fixed: ca thứ bảy «bộ chỉ ở bảng», ca đối chứng dương riêng (ca một rút 1, chỉ ở bảng rút 0, cả cũ lẫn mới), chiều đỏ thứ hai bỏ điều kiện phương pháp; E1 ghim các dòng ✔ |
| P2 | evals | transaction_timeout không được đo; d-2 «một lối» chưa loại lối chỉ dùng timeout máy chủ | Lưới máy chủ quên hay sai đơn vị mà vẫn xanh | SHOW transaction_timeout trong giao dịch ca 7/9 và ca 10 | fixed: ca «SLT-DC-KHOA lưới máy chủ» so SHOW transaction_timeout = trần + 30 s cho cả hai trần; dòng sổ mới supersedes d-2 nêu vì sao lối chỉ máy chủ chết |
