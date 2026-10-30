---
slug: man-gan-nhan-mu
at: 2026-10-30T01:30:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Hai dòng sổ máy quyết mà căn cứ không đứng: định nghĩa lát theo tên nhóm ghi một-lối trong khi lối lọc theo chữ tin còn sống; tỉ lệ dev/test nửa-nửa trích câu không quyết tỉ lệ. Cùng lớp [noi-design-floor#F1], [lb-ac-1-map-files-mot-nguon#F1] | Mạnh duyệt định nghĩa lát như lối duy nhất; mẫu masteri kéo nhóm dự án khác, tin OCP1 ở nhóm chung rơi ra; PL9 đo trên tập lệch lát | Dòng sổ mới supersedes: định nghĩa lát thành câu hỏi; dev/test trích câu quyết | human-gate1: định nghĩa lát thành Hỏi-5 (dòng sổ supersedes d-3); fixed: dev/test trích §3.5 «Dev / test tách đôi» (dòng supersedes d-4) |
| P0 | contract | Ô cơ hội đã ký nói lát khoảng 200 tin và 100 cặp; sổ máy tự cắt cặp G3 và S05/S06; với n=200 chỉ có 40 cặp gắn trùng; Đường đo không đối chiếu 100 cặp | Phút công đo trên 200 tin không có cặp nên ngưỡng 6 giờ chấm quá dễ; đồng thuận dựa 40 cặp | Đường đo ghi rõ 100 cặp ứng với gì; dòng chỉ-người xác nhận cắt và co ngưỡng | human-gate1: thành Hỏi-6 (dòng sổ supersedes d-8, khuyên co về khoảng 4 giờ); fixed: Đường đo nêu 200 tin S03, 40 cặp gắn trùng, cặp G3 ngoài vòng |
| P1 | evals | AC-5/E6 chỉ thử ghi tuần tự, không có bất biến khi hai người ghi đồng thời | Hai giao dịch cùng thấy chưa ai gắn rồi cùng ghi; tin đơn có hai người, tin trùng ba người; đồng thuận đếm sai mà E6 vẫn xanh | Ca hai client pg song song; đối chứng đỏ bỏ FOR UPDATE | fixed: AC-5 thêm vế đồng thời; E6 thêm ca hai giao dịch song song + đối chứng 'GHI DOI KHI DONG THOI'; design khoá dòng tin FOR UPDATE |
| P1 | evals | E7 tự viết dòng theo khuôn bên đọc, không khứ hồi qua bộ ghi thật; phut_cong không có trong AC-6, không có kỳ vọng | 4,35 tỷ và 4350 triệu lưu lệch do số thực, NFC/NFD coi là khác nên đồng thuận giả thấp; phút công sai mà E7 vẫn xanh | Ca khứ hồi qua hàm chuẩn hoá của route; ma trận labeled_at viết trước | fixed: AC-6 thêm vế phut_cong và khứ hồi; E7 thêm ma trận labeled_at (A = 8 phút) + khứ hồi ba ca + đối chứng 'PHUT CONG CONG KHOANG NGHI'; design chuẩn hoá số nguyên VND và chữ NFC |
| P1 | evals | E2/E7 mồi trong giao dịch ROLLBACK rồi chạy lệnh ở tiến trình riêng không thấy dữ liệu chưa commit | Probe chuyển sang gọi hàm nên đường CLI thật (cờ, mẫu nhóm, --thu) không được đo | Chạy lệnh thật bằng tiến trình con trên lát thử đã commit, dọn sau | fixed: E2, E7 commit lát thử mgn-thu, chạy tiến trình con, DELETE sau đo; --thu đếm qua kết nối thứ hai |
