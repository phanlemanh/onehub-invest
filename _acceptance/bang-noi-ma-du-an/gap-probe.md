---
slug: bang-noi-ma-du-an
at: 2026-11-13T05:40:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ ghi máy tự quyết thẻ nối chỉ ở Ops máy thu, viện review_queue thuộc TIER_A_TABLES; nhưng luật 6 (Mạnh 26/10) cho thẻ duyệt lên cloud qua ADR-0015 — lối cloud chưa chết, là lựa chọn của người | Gộp xong, đội ops ở cloud không thấy hạng mục Nối dự án; chỉ người ngồi máy thu duyệt được | Sổ thay bằng dòng chỉ-người có khuyến nghị và lối khác; Out of scope ghi rõ | human-gate1: dòng sổ mới Hỏi-3 thay dòng cũ (supersedes); Out of scope thêm «Duyệt thẻ nối dự án từ Ops ở cloud» |
| P1 | contract | Vòng đời sau khi đảo luật chưa có AC (thẻ mở lại, nối lại sau khi bí danh cũ retired); AC-7 ghi 12 cặp trong khi E9 đo 11 | 11 cặp kẹt ở de_xuat không hiện ở đâu; nối lại gặp ràng buộc duy nhất; người chấm thấy 12 khác 11 | Thêm ca thẻ mở lại và nối lại vào AC-7, E9; sửa chữ 11 cộng 1 | fixed: AC-7 và E9 thêm thẻ mở lại sau đảo, nối lại tạo bí danh mới (chỉ mục ma_nguon đã lọc retired_at IS NULL — đo 13/11), sửa 12 thành 11 cộng 1 cặp từ chối |
| P1 | design | Chưa đo phủ vùng của điểm S08 và số cặp K3 thật | E5 đỏ do điểm ngoài vùng; AC-10 không có thẻ luật để nhìn | Đo chỉ đọc trước Cổng Phạm vi; E5 tách điểm ngoài vùng; AC-10 khai giới hạn | fixed: đo 13/11 — 172/174 điểm trong xã đã nạp, K3 thật 3 cặp (2 đã noi) → 1 đề xuất mới; ghi design mục 1; AC-3/E5 tách ngoai-vung, khong-diem; AC-10/E12 nạp 12 đề xuất mẫu, thẻ luật chỉ dựng khi loạt từ 2 cặp |
| P1 | evals | Fixture S07, S11 viết tay theo khuôn hợp đồng, không qua bảng phía ghi | Bộ chuyển S07 lệch tên cột bảng 093, lần nạp thật đầu tiên ra null; E10 xanh trên bảng không có | S07: INSERT vào stg_s07_project thật rồi đọc; S11: khai giới hạn | fixed: ca S07 chuyển sang E5 (DB thử, bảng thật của 093, kiểm tập cột là tập con của information_schema); E10 khai S11 chưa có bảng phía ghi |
| P2 | contract | «Để sau» và vai viewer trên màn chưa có ca | Để sau đóng nhầm thẻ; viewer thấy nút Nối mà không eval nào bắt | Thêm vào AC-9, E11 | fixed: AC-9 và E11 thêm Để sau giữ de_xuat, thẻ về cuối hàng; phiên viewer 0 nút, đối chứng đỏ 'viewer' |
