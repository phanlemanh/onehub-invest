---
slug: s03-len-cong
at: 2026-11-02T16:17:05Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Ca nhóm khai một thị trường mà chữ nói phường thị trường khác được chốt ngầm trong ma trận AC-1 | Bài ghi phường nơi khác lên trang của thị trường nhóm mà Gate 1 không biết bao nhiêu tin | Hỏi riêng kèm số tin thật | human-gate1: Hỏi-2, đã đo 2/740 tin |
| P0 | contract | Lựa chọn không có căn cứ: bỏ design-pass; tin cấp thị trường ngoài lọc phường; hạ T3 xuống T2; thẻ 16 nhóm không có bên đọc; câu trích của dòng Cổng Đáng | Mạnh duyệt bằng chữ, tưởng đã có căn cứ; thẻ lặng lẽ không tác dụng | Dòng sổ có căn cứ hoặc Hỏi; AC đếm 30 đơn vị, 16 tên nhóm có thẻ | fixed: thêm năm dòng sổ S1 mang supersedes hoặc can_cu; AC-6 đếm 30 đơn vị, 16 tên nhóm có thẻ |
| P1 | contract | Thiếu quan hệ phát biểu → cột → VISIBLE; ngưỡng CHẾT ở ô cơ hội cãi kế hoạch; E11 luôn exit 0 | Mọi eval xanh mà cổng vẫn gần như không có tin S03 | Ca cross-layer qua VISIBLE; sàn 50 thoát khác 0 | fixed: AC-5, AC-8, AC-9, opportunity.md, E11. Cloud đọc ở báo cáo 07:30, ghi ở Out of scope |
| P1 | evals | expected hẹp hơn AC; âm tính thiếu đối chứng; quét bên đọc không có ma trận, bỏ data-api; E10 thiếu tổ hợp | Lọc 500 sai làm mất dòng phường mà E2 xanh; chặng B hỏng vẫn ra 0 cặp | Băm dòng phường, cặp đối chứng, ma trận toàn kho, đủ bốn tổ hợp | fixed: E1, E2, E3, E10, E12, thêm E13, E14 |
| P1 | contract | Không đo độ đúng loại hình suy từ nhóm; sai nặng không định nghĩa, không cách lấy mẫu | Nhóm 85% căn hộ gán sai nhà phố lên cổng; người chấm tự định nghĩa sau khi thấy số | Tách số chữ và nhóm, đối chứng giữ lại, định nghĩa trước khi đo | fixed: đã đo 93% và 92% đưa vào thiết kế và Hỏi-1; AC-4, AC-9 |
