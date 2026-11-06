---
slug: noi-du-an-s08-khu-do-thi
at: 2026-11-05T02:00:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Hai dòng sổ máy quyết việc chỉ người có: bỏ bí danh ngoài câu giao, kể cả `vuong` không nguồn; mã cấp tỉnh lên cloud. Contract không nói đường lên cloud, Out of scope ghi sai khu | Mạnh ký mà không biết mình duyệt xoá bí danh ngoài câu giao và tên, mã mới lên cloud | Chuyển thành câu hỏi, tách `vuong` có số, ghi đường lên cloud | human-gate1: thành Hỏi-1, Hỏi-2 trên thẻ, `kho_dao` true, `vuong` tách có số 5 bài, 0 nhóm. Fixed: AC-6 đo không mã cổng nào đọc `area_ids`, Notes ghi đường lên cloud, Out of scope ghi 16 cặp gồm một mã Grand Park |
| P0 | contract | AC-4 chỉ đếm 3 + 5 trên bảng tay, không đo quan hệ, không đo sót, không người duyệt, 142 viết cứng | Tráo hai dòng khác khu vẫn xanh, DB1 dựng toà vào sai khu | Tín hiệu độc lập từng dòng, quét sót theo từ khoá, người duyệt, băm tệp, đổi 142 thành số lúc đo | fixed: thêm AC-9, E10, băm `bang-noi.sha256`. human-gate1: Hỏi-3 Mạnh duyệt tám cặp ở tệp local. Tín hiệu do chính người viết bảng chọn nên không hoàn toàn độc lập, chỗ đó dựa vào Hỏi-3 |
| P1 | evals | E8 có hai nhánh xanh, băm không bao quanh bước áp 074, thiếu `asset_nodes` | Probe lấy nhầm DATABASE_URL, 074 chạy trên DB thật mà E8 vẫn xanh | Băm trước, sau cùng lượt, từ chối DB khác, đối chứng | fixed: E8 chuyển vào `nap.mjs`, băm bao quanh, từ chối DB khác có đối chứng |
| P1 | evals | AC-2 chỉ đo unit, `--thu` chưa định nghĩa, bảng rỗng, slug lạ, git thật, thiếu CHECK thứ ba | Lệnh ghi trước rồi kiểm mà E2 vẫn xanh; check-ignore trả 128 bị coi là qua | Eval lệnh thật trên DB thử, git thật ba trạng thái | fixed: thêm E9, định nghĩa `--thu`, thêm `ok check chua_noi co nut`. rejected phần tag (cross-layer): tag dành cho luồng giao diện đi qua backend, E9 đã khai `layer: backend-effect` |
| P1 | evals | E5, E7 tuyên quét lớp nhưng không ghim chuẩn hoá, đầu ra lỗi và hồ sơ không quét, không đối chứng tập rỗng | Lỗi CHECK in dòng kèm mã rồi lên kho công khai mà E7 đã xanh | Ma trận viết trước, luật chuẩn hoá, quét hồ sơ và nhánh lỗi, kiểm thực tế đường đẩy | fixed: E5 ma trận trong probe, E7 ghim luật, quét hồ sơ và mọi nhánh, chỉ ba tệp được nhắc bảng, đối chứng tập rỗng và sync. deferred: quét lại evidence sau lượt chấm thành một bước trước khi trình Cổng Bằng chứng |
