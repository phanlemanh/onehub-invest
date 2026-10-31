---
slug: do-danh-ba-sdt
at: 2026-10-31T00:30:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ ghi máy quyết việc thay ngưỡng «đúng sáu số audit 30/10» đã ký ở Cổng Đáng bằng câu đo độc lập | Lệnh và câu độc lập cùng hiểu sai một định nghĩa, E2 xanh, người ký tưởng đã chứng đúng số audit | Dòng Hỏi thay dòng cũ, hoặc chạy trên bản sao cũ | human-gate1: Hỏi-2 (supersedes dòng cũ); bản sao 29/10 có trước khi dựng danh bạ nên không tái lập được |
| P0 | design | Bước chạy đêm sửa scripts/zalo-import-daily.sh (làn ZCode) và xoá dòng dq trên DB thật mà sổ ghi máy quyết | Xung đột làn với ZCode; số S05 lệch ngày | Dòng Hỏi nêu nhịp chạy, làn sở hữu | human-gate1: Hỏi-3 (supersedes); khuyến nghị chuyển sang scripts/cloud-sync.sh (làn Claude, tiền lệ bac-du-lieu); AC-4, AC-6, E4 viết lại |
| P1 | evals | E2 chỉ 4 fixture, không có N3, N4-rỗng, S05, không assert Δ = 0 ở ô khác; fixture chèn thẳng bảng | Lệnh đếm sai N3 hay riêng S05 mà E2 vẫn xanh | Ma trận Δ 11 ô, Δ = 0 ngoài ô đích | fixed: ma trận Δ 11 ô viết trước, Δ = 0 ngoài ô đích. Phần «fixture qua transform thật» rejected: transform đọc snapshot raw qua importer (làn ZCode); fixture chèn theo ràng buộc 055/044 |
| P1 | evals | E1 thiếu bí danh `sdt`, N2 không có đối chứng dương, N3 không có ca | Bản chỉ đọc `sdt_bam` thành pass giả sau SD3 | Thêm ca `sdt`, vai chưa rút, N3 hai chiều, đối chứng đỏ | fixed: E1 thêm các ca và đối chứng 'BO SOT BI DANH sdt' |
| P2 | evals | Ranh giới ngày giữa UTC và giờ máy thu chưa đo | Hai dòng cùng ngày giờ máy thu | Dòng cũ 23:30 UTC hôm trước, phiên UTC | fixed: E3 thêm ca múi giờ; design §3 ngày theo Asia/Ho_Chi_Minh |
