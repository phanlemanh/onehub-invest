---
slug: khu-vuc-vung-moi-s06
at: 2026-10-31T08:20:00Z
verdict: findings
p0: 0
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | binh-duong vừa là mã lạ ở AC-1 vừa có thể làm đỏ AC-2; hợp đồng không liệt khoá S06 trên DB | Có ảnh chụp S06 binh-duong thì /ops in chữ thô, E2 đỏ, AC-1 và AC-2 mâu thuẫn | Ghi khoá S06 trên DB, xếp nhóm từng khoá | fixed: Context ghi đo 31/10 (da-nang=1, hanoi=13, hcmc=13; hai-phong/khanh-hoa/binh-duong chưa có ảnh chụp) và xếp binh-duong vào mã lạ có chủ đích (ánh xạ thuộc ma-thi-truong-ngan) |
| P1 | evals | E2 không có tiền đề dữ liệu, không ghi chiều đỏ | DB không còn ảnh chụp vùng mới thì ON12-AC-7 xanh mà hàm chưa được thử | Đếm ảnh chụp theo khoá + đỏ trên main | fixed: E2 chạy rang/on12-tien-de.mjs — in số ảnh chụp theo khoá, không có khoá vùng mới thì thoát 2; chiều đỏ ghi lúc thiết kế (main a404af39: S06 · da-nang (chưa có tên Việt)) |
| P2 | evals | Ma trận 12 mã không liệt kê, thiếu đối chứng thứ tự ưu tiên và khớp mờ | Bản hàm tra mã dài trước mã ngắn hoặc khớp mờ danang vẫn xanh | Liệt mã, cặp ngắn/dài cùng gốc, ca đỏ thứ tự | fixed: E1 liệt đủ 12 mã; fixture có vn-khanh-hoa ngắn + vn-tinh-khanh-hoa dài; chiều đỏ 2 ghim thứ tự; danang đòi đúng «(chưa có tên Việt)» |
| P2 | contract | Không đặc tả đầu vào là mã dài đầy đủ | Bản hàm ghép thành vn-thanh-pho-thanh-pho-da-nang | Thêm ca mã dài làm đầu vào | fixed: AC-1 và ma trận có vn-thanh-pho-da-nang và vn-tinh-khanh-hoa làm đầu vào |
