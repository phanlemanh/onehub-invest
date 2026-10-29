---
slug: rao-db-local-do-nen
at: 2026-10-29T09:20:00Z
verdict: findings
p0: 0
p1: 1
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | AC-5 không lường việc đổi do.mjs làm hồ sơ đã ký do-nen-hieu-nang hoá cũ (do.mjs nằm trong paths eval của hồ sơ ấy); sổ S1 không chọn đường xử lý ghim cũ | Lưới trước-gộp báo do-nen-hieu-nang hoá cũ, PR bị chặn; ghim lại thì chạm tệp ngoài danh sách AC-5 nên E5 đỏ | Dòng sổ chọn đường ghim lại; AC-5 liệt đích danh tệp ghim; eval chạy lưới trước-gộp của do-nen-hieu-nang | fixed: dòng sổ ghim lại bằng làn máy; AC-5 cho phép đúng run-log.jsonl + evidence-report.md của do-nen-hieu-nang và đòi lưới trước-gộp của nó xanh (E5); khai vùng _acceptance/do-nen-hieu-nang |
| P2 | contract | AC-5 không nói ROADMAP và docs/plan/lo-trinh.json được đổi hay không | Người làm cập nhật ROADMAP theo AGENTS.md hoặc lệnh khai vùng ghi lo-trinh.json, E5 đỏ NGOAI PHAM VI | AC-5 ghi rõ hai tệp ấy | rejected: lệnh hang vung ghi hang-viec.json trong thư mục đợt ngoài kho, không ghi lo-trinh.json; hàng sửa rào nhỏ không cập nhật ROADMAP (hàng do-nen-hieu-nang cũng không) — AC-5 giữ danh sách đóng |
| P2 | evals | Đột biến của E3 chỉ kiểm vế âm, không ghim lỗi thay thế ENOTFOUND | Bản chép chết vì cú pháp hay thiếu module, vẫn in RAO VANG, E3 xanh suông | Bản chép phải ra ENOTFOUND/getaddrinfo, không thì DOT BIEN KHONG AP DUOC | fixed: AC-3 và expected E3 ghim ENOTFOUND/getaddrinfo |
| P2 | evals | Soát thứ tự so chuỗi văn bản, không bỏ comment, chỉ khớp new pg.Client | Comment nhắc token phía trên rào làm đỏ giả; new pg.Pool trước rào lọt | Bỏ comment, khớp rộng, cặp đối chứng chèn Pool | fixed: AC-3 bỏ comment, khớp new pg.Client/Pool, new Client/Pool, .connect(; thêm bản chép chèn new pg.Pool( trước rào → THU TU SAI; design ghi rõ đây là soát văn bản |
| P2 | design | AC-2 chỉ đo một dạng URL local; postgresql:// và 127.0.0.1 chưa đo | Rào chặn nhầm postgresql://127.0.0.1, E4 vẫn xanh | AC-2 thêm 127.0.0.1 và postgresql:// | fixed: AC-2 ba dạng localhost, 127.0.0.1, postgresql:// |
