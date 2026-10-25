---
slug: ty-le-listing-khu-vuc-gop
at: 2026-10-25T04:16:57Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ ghi máy quyết ô S02 dòng Listing hiện tổng; câu giao chỉ chốt mẫu số của tỉ lệ, còn số hiện ở ô và câu chú thích là chữ cho người vận hành | Mạnh duyệt tưởng chỉ đổi tỉ lệ; thẻ Cần Thơ hiện 13 cạnh ADR, công suất của market đại diện, người vận hành đọc 13 thành số của một market | Câu hỏi ở Cổng Phạm vi: ô hiện tổng, «tổng (a + b)», hay số market đại diện, kèm nguyên văn câu chú thích | human-gate1: dòng sổ chi-nguoi thay d-20261025T041341Z-1, hợp đồng soạn theo khuyến nghị (A) |
| P1 | evals | E7 không ghim tỉ lệ thẻ lấy từ đầu ra thật của hàm dựng thẻ; một bên null không tính lệch | Script tự cộng bằng SQL riêng nên khớp Độ phủ hiển nhiên trong khi hàm thật lệch | Ghim nguồn getAirdnaComparison; null một bên là lệch, liệt tên | fixed: AC-7 và E7 expected ghim nguồn và luật null |
| P1 | evals | Không ca nào so tập market và kỳ mới nhất của thẻ với Độ phủ khi các market khác kỳ | Thẻ lấy kỳ chung còn Độ phủ lấy kỳ từng market, fixture cùng kỳ nên vẫn xanh | Ca market không đại diện chỉ có số kỳ cũ | fixed: AC-3 + E3 thêm khu vực «lệch kỳ» (2 + 9 = 11, bằng Độ phủ) |
| P1 | contract | AC-5 «một market có số» nhưng E5 chỉ đo khu vực một market; AC-6 không nói k đếm gì | Hai market một null: ô S02 null hoặc câu sai mà không eval nào đỏ | Ca hai market một null chạy hàm thật; chốt k | fixed: AC-5 tách ba dạng, E5 thêm ca null + 5; AC-6 chốt k = số market S02 của khu vực |
| P2 | evals | Đối chứng âm E6 dựng tay ofMarkets = 1; ca dương chỉ k = 2 | Thẻ suy «gộp» từ trường khác, câu hiện sai ở khu vực một market mà E6 vẫn xanh | Đối chứng từ kết quả thật khu vực một market; thêm ca ba market | fixed: E6 vẽ kết quả thật khu vực một market và khu vực ba market |
