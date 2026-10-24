---
slug: db-tu-khoi-dong
at: 2026-10-23T09:38:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

# Gap-probe — db-tu-khoi-dong

Phản biện context sạch (tác tử tươi, chỉ đọc design + contract + evals + sổ + claims + opportunity).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract + sổ d-2 | Bỏ diễn tập thật để dùng dind làm bằng chứng ngưỡng sống là lựa chọn của người, sổ ghi máy quyết nguồn mot-loi | Mạnh ký tưởng ngưỡng đã đo trên máy thật; colima thật khôi phục khác dind thì L7 lặp lại khi E3 xanh | Dòng sổ chỉ-người supersede d-2; Đường đo ghi rõ là proxy | human-gate1: dòng sổ mới (chỉ-người) supersede d-2; contract mục Đường đo ghi PROXY; câu hỏi lên thẻ Cổng Phạm vi |
| P1 | evals E6 + AC-6 | Dọn dind và StartedAt không có chiều đỏ; lời hứa dọn khi lỗi chỉ đo trên lượt trơn | Trap thiếu, lượt chết giữa chừng để sót container privileged; StartedAt đọc rỗng bằng rỗng nên PASS | Lượt ép lỗi + lượt SIGTERM phải dọn sạch; StartedAt không rỗng; đối chứng dương StartedAt của dind đổi | fixed: AC-6 viết lại; E6 đổi sang chế độ cleanup (ép lỗi AU7_FAIL_AFTER, SIGTERM, StartedAt parse được, đối chứng dương dind) |
| P1 | evals E1 + AC-1 | Vế khoá khác giữ nguyên không có chiều đỏ, mốc so là danh sách gõ tay | Thêm restart làm lệch healthcheck/biến/ảnh, E1 vẫn xanh | So JSON gộp với commit trước vòng; đột biến đổi cổng phải đỏ | fixed: E8 mới (diff với f3cff1f, jq -S); E2 thêm đột biến cong-5434 với thông điệp ghim riêng |
| P1 | evals E5 | live không có chiều đỏ, có nguy cơ đo chuỗi có mặt | Grep RunAtLoad vẫn PASS khi giá trị false; grep unless-stopped khớp nhầm | Bộ đọc giá trị chạy trên bản chép vật thật đã làm hỏng | fixed: E5 đọc giá trị (plutil -extract, jq RestartPolicy.Name); E9 mới live-selftest trên bản chép plist + inspect thật |
| P2 | evals E7 | Câu hỏi bắt phán sai sự thật nhưng inputs không có tệp đối chiếu; tiêu chí không bảo colima restart không có trong question | Tài liệu ghi sai lệnh/policy vẫn PASS | Thêm compose + script vào inputs; đưa tiêu chí (5) vào question | fixed: inputs thêm db/docker-compose.yml + scripts/check-db-autostart.sh; question thêm điều (5) |

Ghi chú của tác tử: ngưỡng CHẾT của opportunity dựa vào timebox còn để «…» — ô cơ hội đã được Mạnh quyết ở thẻ khởi tạo đợt; vòng không sửa ô cơ hội.
