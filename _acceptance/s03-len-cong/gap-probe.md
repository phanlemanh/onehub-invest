---
slug: s03-len-cong
at: 2026-11-02T21:45:00Z
verdict: findings
p0: 2
p1: 7
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Ngả B: bảng bên đọc cột thiếu bộ chấm ghép căn | Loại suy làm cặp ra `yes`, `no` không có căn cứ | Ca AC-12, ca đỏ bản đọc cột thô | Đã thêm AC-12, E16, dòng bảng |
| P1 | contract | Ngả B: ô `inferred` thành trống mở luôn cho E1 | E1 suy từ tên nhóm đi `direct` thành `observed`, vượt lớp | Ca E1 trong AC-11 | Chốt: ô `inferred` chỉ mở cho LLM; thêm vào AC-11, E15 |
| P1 | contract | Ngả B: không có ca hoàn tác đề xuất | Hoàn tác xong cột không rõ về đâu, có thể rút nhầm phát biểu suy | Ma trận hoàn tác ba ca | Chốt: về giá trị suy; thêm vào AC-11, E15, design |
| P1 | contract | Ngả B: thiếu ca nhóm đổi đa số và tin hai bài | Tin rớt khỏi cổng hoặc mang hai giá trị | Ba ca trong E6 | Đã thêm vào AC-5, E6 |
| P2 | evals | E15 không ràng mẫu, ca đỏ chỉ chạm `route.ts` | Mẫu thiếu đường, WC nên xanh dù `run.ts` chưa sửa | Mẫu đủ trường, ca đỏ riêng `run.ts` | Đã sửa E15 |
| P2 | evals | Bảng bên đọc của ngả B không có thước | Bên đọc mới không làm đỏ | E13 quét thêm hai cột và `db/migrations` | Đã sửa E13 |
| P0 | design | Ca nhóm khai một thị trường mà chữ nói phường thị trường khác được chốt ngầm trong ma trận AC-1 | Bài ghi phường nơi khác lên trang của thị trường nhóm mà Gate 1 không biết bao nhiêu tin | Hỏi riêng kèm số tin thật | human-gate1: Hỏi-2, đã đo 2/740 tin |
| P0 | contract | Lựa chọn không có căn cứ: bỏ design-pass; tin cấp thị trường ngoài lọc phường; hạ T3 xuống T2; thẻ 16 nhóm không có bên đọc; câu trích của dòng Cổng Đáng | Mạnh duyệt bằng chữ, tưởng đã có căn cứ; thẻ lặng lẽ không tác dụng | Dòng sổ có căn cứ hoặc Hỏi; AC đếm 30 đơn vị, 16 tên nhóm có thẻ | fixed: thêm năm dòng sổ S1 mang supersedes hoặc can_cu; AC-6 đếm 30 đơn vị, 16 tên nhóm có thẻ |
| P1 | contract | Thiếu quan hệ phát biểu → cột → VISIBLE; ngưỡng CHẾT ở ô cơ hội cãi kế hoạch; E11 luôn exit 0 | Mọi eval xanh mà cổng vẫn gần như không có tin S03 | Ca cross-layer qua VISIBLE; sàn 50 thoát khác 0 | fixed: AC-5, AC-8, AC-9, opportunity.md, E11. Cloud đọc ở báo cáo 07:30, ghi ở Out of scope |
| P1 | evals | expected hẹp hơn AC; âm tính thiếu đối chứng; quét bên đọc không có ma trận, bỏ data-api; E10 thiếu tổ hợp | Lọc 500 sai làm mất dòng phường mà E2 xanh; chặng B hỏng vẫn ra 0 cặp | Băm dòng phường, cặp đối chứng, ma trận toàn kho, đủ bốn tổ hợp | fixed: E1, E2, E3, E10, E12, thêm E13, E14 |
| P1 | contract | Không đo độ đúng loại hình suy từ nhóm; sai nặng không định nghĩa, không cách lấy mẫu | Nhóm 85% căn hộ gán sai nhà phố lên cổng; người chấm tự định nghĩa sau khi thấy số | Tách số chữ và nhóm, đối chứng giữ lại, định nghĩa trước khi đo | fixed: đã đo 93% và 92% đưa vào thiết kế và Hỏi-1; AC-4, AC-9 |
