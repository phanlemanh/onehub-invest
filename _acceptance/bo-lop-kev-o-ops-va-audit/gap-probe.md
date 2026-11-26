---
slug: bo-lop-kev-o-ops-va-audit
at: 2026-11-26T03:00:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | AC-6 chỉ đo bộ đếm phễu của app; bản tin đẩy lên có bộ đếm riêng (parseLog của push-ops-facts) không AC nào đo | Máy thu hết đếm đôi mà trang cloud vẫn hiện số tin thấy gấp đôi; E7 vẫn xanh | Ca dựng funnel bằng parseLog trên cùng nhật ký E7, so deepEqual với readGateFunnel; chiều đỏ ghim «bản tin đếm đôi» | fixed: AC-6 mở rộng sang bộ đếm bản tin, ca KEV2-AC-6-GHI thêm vào E4, design mục 6 |
| P1 | evals | Nhật ký hook của E7 viết tay theo khuôn bên đọc, không rút từ bên ghi thật | Hook thật ghi dòng khác khuôn mẫu, luật lọc không khớp, số vẫn lệch mà E7 xanh | Rút khuôn dòng từ handler.js, ma trận loại dòng viết trước | fixed: E7 dựng nhật ký từ khuôn dòng log đọc trong collector/openclaw/handler.js, ma trận loại dòng viết trước |
| P1 | evals | Bản tin CŨ của E5 là fixture viết tay | Bộ lọc dò theo nhãn fixture, bản tin thật khác nhãn nên lọt; cloud vẫn hiện Kev | Sinh bản tin cũ bằng push-ops-facts ở 04b9ddc3b | fixed: E5 sinh bản tin cũ bằng push-ops-facts.mjs ở commit 04b9ddc3b, ghi sha nguồn |
| P1 | design | Bớt dòng ở khối Khoá an toàn chạm vùng luật an toàn Zalo mà không có căn cứ trong sổ | Người ký tưởng chỉ đổi chữ; nếu Kev là một lớp khoá thì máy tự hạ một lớp | Dòng sổ S1 trích runtime-map | fixed: dòng sổ S1 trích docs/ops/runtime-map.md («Hạ tầng phụ thuộc hook»), design thêm đoạn căn cứ an toàn |
| P2 | evals | Phủ định «không URL 8009» ở E1, E2 thiếu đối chứng dương | Lời dò :8009 đi đường khác fetch, danh sách URL rỗng, phủ định vẫn xanh | Assert URL ghi được chứa 127.0.0.1:9210 trước khi assert không 8009 | fixed: E1, E2 thêm đối chứng dương :9210 |
