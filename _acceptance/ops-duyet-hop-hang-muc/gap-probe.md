---
slug: ops-duyet-hop-hang-muc
at: 2026-11-08T10:52:38Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ bỏ ô «Loại thẻ» ghi máy quyết với câu trích chỉ ủng hộ việc có hộp, không quyết việc bỏ ô; hộp chỉ liệt hạng mục còn thẻ chờ nên mất lọc thẻ đã quyết theo loại; cùng dòng quyết chỗ đặt Kbd lệch AC-4 và E4 | Người soát lại thẻ Bổ sung tin đã quyết khi hạng mục hết thẻ chờ: không còn đường lọc; làm theo sổ thì E4 đỏ, làm theo E4 thì ngược sổ | Hộp giữ trọn việc lọc của ô cũ; AC-4, E4, sổ cùng một chỗ đặt Kbd; khai test cũ bị sửa | fixed: hộp liệt mọi hạng mục có thẻ (mục hết thẻ chờ ghi «hết thẻ chờ»), AC-2 và E2 thêm ca hạng mục 0 thẻ chờ + Đã quyết; AC-4, E4 ghi Kbd cạnh nút + aria-keyshortcuts; dòng sổ mới thay d-15 với căn cứ một-lối; Notes của hợp đồng liệt test cũ đã sửa và AC đã ký bị chạm |
| P1 | evals | E7 không phủ hết nút: thiếu Giữ tách, thẻ xung đột, Loại khác | Nút Giữ tách hay nút thẻ xung đột còn bắt lý do mà E7 vẫn xanh | Ma trận viết trước mọi nút mọi dáng, số assert = số nút; ca DB thẻ xung đột | fixed: E7 ma trận 15 nút + Loại khác 0 nút, ca DB thẻ xung đột qua route thật, chiều đỏ GIU TACH CON BAT LY DO |
| P1 | contract | Chỉ xả lệnh chờ lúc pagehide; chuyển route trong app không phát pagehide | Bấm Hoãn rồi bấm nav sang trang khác trong 5 giây: lệnh mất | AC-5 thêm vế gỡ thành phần; E5 ca unmount | fixed: HangGuiProvider xả mọi lệnh chờ bằng keepalive khi bị gỡ; AC-5 và E5 thêm ca unmount, chiều đỏ MAT LENH KHI CHUYEN ROUTE |
| P1 | evals | Không đo Hoàn tác bấm sau khi lệnh đã gửi (toast sonner dừng đếm khi chuột đè) | Chuột đè toast 7 giây, bấm Hoàn tác: thẻ quay về như chưa quyết dù đã ghi | E5 ca hoàn tác ở t=7000 sau khi gửi | fixed: hàm hoàn tác trả false khi lệnh đã gửi, thẻ không trở lại và toast báo đã ghi; AC-5, E5 thêm ca, chiều đỏ HOAN TAC SAU KHI GUI |
| P1 | evals | E2 dựng pace bằng tay theo khuôn bên đọc, không rút từ loadReviewPace thật; E8 có thể qua với mọi mục «—» | loadReviewPace đổi khoá, hộp hiện «—» khắp nơi mà E2, E8 vẫn xanh | Ca DB: route decide thật → loadReviewPace thật → hộp hiện trung vị | fixed: E2 thêm ca OD2-AC-2-DB (3 lượt unit_match qua route thật, trung vị 50 giây), layer backend-effect, chiều đỏ HOP DOC PACE SAI KHUON; E8 đòi ít nhất một mục có trung vị là số |
