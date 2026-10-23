---
slug: leak-gate-kiem-anon
at: 2026-10-23T10:52:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

# Gap-probe — leak-gate-kiem-anon

Phản biện context sạch (tác tử tươi, chỉ đọc design + contract + evals + sổ + claims + opportunity).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract + sổ | Không phép đo nào chứng danh sách chừa ba quan hệ PostGIS là đủ trên prod sau 037; Đường đo không ghi PROXY; việc không đo prod là lựa chọn của người | Mô phỏng xanh, merge, prod còn quan hệ lạ anon đọc được → mọi lượt sync đêm dừng đỏ | Dòng sổ chỉ-người; Đường đo ghi PROXY; điều kiện merge bằng lượt chỉ đọc trên prod | human-gate1: Hỏi-1 (chỉ-người, khó-đảo) + AC-11 chế độ --kiem-anon chỉ đọc + Đường đo ghi PROXY + Notes điều kiện merge |
| P1 | evals E2, E7 | Hai chỗ kiểm cùng thông điệp; E2 không phân biệt dừng trước khi gửi với dừng sau tráo khi fixture local trùng cloud | Quên chỗ gọi trước khi gửi mà E2 vẫn xanh | Dấu (trước khi gửi)/(sau tráo); fixture lệch cloud có tiền điều kiện; đối chứng đỏ bỏ chỗ kiểm | fixed: AC-2/E2 thêm tiền điều kiện md5 khác + dấu + bản đột biến bỏ chỗ kiểm; AC-7/E7 đòi dấu (sau tráo) |
| P1 | design + E4, E8, E18 | Thông điệp ghi cứng anon cho cả authenticated, không nói đường cấp; AC-8 chỉ đo một ô gỡ | REVOKE FROM anon khi quyền đến qua PUBLIC → đỏ mãi hoặc người tắt gate | Thông điệp role + đường cấp + lệnh gỡ; ma trận gỡ số ô = số ô đỏ | fixed: khuôn «<role> đọc được … (<loại>, <đường>; gỡ: …)»; E4 ghim token role; AC-8/E8 ma trận áp nguyên văn lệnh gỡ; E18 hỏi khớp khuôn |
| P2 | contract + E2 | Vế báo đỏ (SYNC FAIL [gate] + exit 1 của main) chỉ là khẳng định | Chỗ kiểm ném Error thường, log không có dòng gate mà E2 vẫn xanh | Chạy đường main thật trên cloud mô phỏng, assert mã + dòng | fixed: tách runMain(deps), AC-11/E19 đo mã thoát và dòng in, kèm đối chứng cloud sạch |
