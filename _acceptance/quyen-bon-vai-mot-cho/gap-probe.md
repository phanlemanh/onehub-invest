---
slug: quyen-bon-vai-mot-cho
at: 2026-10-27T00:15:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | hai lựa chọn «ai được làm gì» máy đã quyết: OPS_EMAILS tính ops (mất quyền quản trị hôm nay), vai ops mất tạm dừng trực tiếp tới TV4 dù §3.5 cấp source.pause | người vào bằng OPS_EMAILS bấm công tắc nhận 403 sau gộp, E1–E10 vẫn xanh; Mạnh ký vì tưởng chỉ áp lại portals.md | hai câu hỏi ở Cổng Phạm vi | human-gate1: Hỏi-1 (OPS_EMAILS = ops), Hỏi-2 (unit.toggle admin tới TV4, supersedes dòng -3); thêm Hỏi-3 áp 049 lên prod (khó-đảo) |
| P1 | evals | đối chứng E1, E4, E5, E6 đọc bản route ở merge-base lúc chạy [cong-tac-test-ghim-ban-cu#F1] | sau gộp đối chứng chạy trên route mới, ca đỏ trên main; clone nông không tìm thấy commit | ghim route 39c660ca thành fixture | fixed: 11 fixture ở app/tests/fixtures/ops-routes-truoc-tv1/, expected không còn merge-base; dòng sổ approach |
| P1 | evals | E2 chỉ thử một route đại diện mỗi hành động; phần lớn 21 ô route · phương thức không có phép đo hành vi | DELETE zalo/accounts gọi kiemQuyen nhưng không trả 403, viewer xoá được tài khoản | ma trận 21 × 7 = 147 ô | fixed: AC-2 + E2 thành 147 ô, đối chứng dương bỏ nhánh trả Response ở zalo/accounts DELETE |
| P1 | contract | không AC nào đo thứ tự «audit trước việc» ở việc ngoài DB khi audit hỏng | cấu hình Zalo đổi mà không dòng audit, E5 vẫn xanh | ca audit hỏng với zalo POST | fixed: AC-5 thêm vế audit hỏng; E5 thêm ca QV-AC-5b (tệp cấu hình và nhật ký openclaw giả trước = sau) |
| P1 | evals | không đo lại khẳng định «chỉ push-ops-facts gọi ingest bằng bearer» trên cây; E10 chưa chắc đi qua writer thật | một script khác gọi route ghi bằng bearer gãy sau gộp; đường nạp số thật gãy mà E10 xanh | quét git ls-files mọi chỗ đọc OPS_API_TOKEN + gọi /api/v1/ops/ | fixed: AC-10 + ca QV-AC-10b có đối chứng dương; E10 ghi rõ captureOpsFacts chạy tiến trình push-ops-facts.mjs thật |
