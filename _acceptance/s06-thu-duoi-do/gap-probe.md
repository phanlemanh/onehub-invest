---
slug: s06-thu-duoi-do
at: 2026-11-25T03:52:32Z
verdict: findings
p0: 0
p1: 2
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | AC-6, AC-9 đọc thư mục phép đo ngoài kho (worktree ZT) không ghim băm, mà E6, E9 ghim cứng 288/231/1215/1180 | ZT nối thêm vào nhật ký → đỏ oan; ZT sửa tệp → bản độc lập và báo cáo cùng lệch, xanh trên dữ liệu khác dữ liệu đã trình | Ghi sha256 nhật ký, báo cáo, danh sách manifest; lệch → PHEP DO DA DOI, thoát khác 0 | fixed: phu-ca.mjs ghim ba băm, lệch thì «PHEP DO DA DOI» thoát 3, kèm tự kiểm «BAM LECH»; Notes ghi |
| P1 | evals | E9 chỉ tính lại độ trễ; tỉ lệ bắt được và bị chặn chép từ báo cáo của chính mã đang duyệt; 1072/1180/1215 không định nghĩa | Lỗi đếm làm tỉ lệ luôn 1 → E9 vẫn xanh, cổng duyệt «bắt 100%» không có phép đo độc lập | Tính lại tỉ lệ từ tập mã lượt quét đủ giao snapshot | fixed một phần: bị chặn đếm thẳng từ nhật ký; ba số được định nghĩa trong Notes; AC-9 nói rõ tỉ lệ là CHÉP. deferred: tính lại độc lập tỉ lệ (tập lượt quét đủ không đóng băng được) — dòng descope + revisit trong sổ |
| P2 | evals | E10a không đòi ca DB không bị bỏ qua; dòng sổ d-5 viện CI làm lưới chặn trong khi CI bỏ qua ca DB | Hỏng BEGIN READ ONLY → CI xanh, nửa B mất DATABASE_URL vẫn xanh | E10a should-NOT-fire SKIP trên ca DB thật; sửa cost_if_wrong của d-5 | fixed: E10a đòi năm ca «DB thật:» chạy; dòng sổ mới supersedes d-5 |
| P2 | contract | het-trang và gap-da-co có trên trục Coverage mà không AC, eval nào ghim | Xoá hay đổi tên hai ca → E1 vẫn xanh | Thêm vào AC-1 và ghim tên ca ở E1 | fixed: AC-1 thêm hai câu, E1 ghim tên hai ca |
| P2 | evals | Chiều đỏ của E1 mượn lời làn thu; E2, E3 không có chiều đỏ | Ca «0 lời gọi» không nối vào đường gọi thật vẫn xanh khi bỏ cổng | Probe đột biến trên bản chép: bỏ docTrangThai, bỏ dừng gặp tin đã có | fixed: probes/dot-bien.mjs (E1b, E2b, E3b) — đối chứng lành 0 đỏ, ba đột biến đều bị bắt đúng nhánh |
