---
slug: do-nen-hieu-nang
at: 2026-10-27T08:10:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng d-3 để máy tự định nghĩa «thời gian tải» là HTML phía server, kho_dao false. Đây là lựa chọn chỉ người quyết được. Tập 5 trang «chính» không có dòng sổ nào. | Mạnh duyệt ngưỡng p95 HTML server rồi đưa vào luật; hồi quy JS, hydrate hay bản đồ không bao giờ chạm ngưỡng; tập trang do máy chọn thành tập ngưỡng mà không ai ký | Dòng sổ Hỏi thay d-3 với kho_dao true, nêu hai lối và 5 trang; Gate 1 không qua khi chưa có câu trả lời của người | human-gate1: dòng Hỏi-1 (chi-nguoi, supersedes d-3) đưa thước đo và 5 trang cho Mạnh ở Cổng Phạm vi, kèm khuyến nghị; hồ sơ không đi làn V |
| P0 | decisions | Lối chết của d-5 tự mâu thuẫn: lối được chọn cũng ghi vào users của DB dùng chung và xoay mật khẩu ops-test mà worktree khác dùng. Cùng lớp với [wanted-thanh-inquiry#F1] | Lượt đo E2 xoay ops-test giữa lúc worktree khác đang đăng nhập thử; hai bên giành xoay; lượt đo mất 20/20 | Tài khoản đo riêng; AC-2 thêm điều kiện băm mật khẩu ops-test trước = sau | fixed: do.mjs đăng nhập bằng perf-test@local.test (ensureAccount, mật khẩu chỉ trong bộ nhớ); dòng sổ mới supersedes d-5; trang.sh so băm password_hash của ops-test trước/sau lượt đo (đo tay 07:36Z: không đổi) |
| P1 | contract | «10 truy vấn chậm nhất» chỉ được đo bằng độ khớp tài liệu với JSON; phía sinh số (reset, thứ tự, đủ 10) không được kiểm; danh sách theo trung bình không AC nào chạm | do.mjs quên reset hoặc xếp sai khoá; tài liệu chép đúng JSON; E3 vẫn xanh | Mốc reset trong JSON trước lượt làm nóng; hai danh sách đủ 10 dòng, giảm dần; đột biến đảo thứ tự, bỏ reset phải đỏ | fixed: do.mjs ghi do_luc.reset_pg_stat_statements; tai-lieu.mjs kiểm reset ≤ bắt đầu, đủ 10 dòng, giảm dần theo khoá, gọi ≥ 3, số gọi là bội của lượt + 2; tài liệu đối chiếu cả danh sách T; đột biến đảo thứ tự và bỏ reset đỏ có thông điệp ghim |
| P1 | evals | E4 đọc tập bảng thiếu thống kê từ DB sống, nên sau đêm nạp tập co lại; AC-4 không kiểm kết luận planner không mù và nights phình | Chấm sau đêm nạp, tập rỗng; tài liệu bỏ tên bảng hay ghi planner mù vẫn xanh | So với ảnh chụp trong JSON; kiểm kết luận khớp reltuples; đột biến planner mù đỏ | fixed: do.mjs chụp reltuples vào JSON; thong-ke.mjs đọc ảnh chụp, tập rỗng thì CA KHONG DO, kiểm reltuples > 0 khớp câu «Planner không mù» và nights phình; đột biến bỏ tên bảng và đổi thành planner mù đều đỏ |
| P1 | contract | AC-5 chỉ quét tầng A trên tài liệu và JSON, không quét script, đầu dò, design doc trên nhánh | do.mjs hoặc đầu dò chứa tên bảng mang tên nguồn thật; E5 xanh; PR đẩy tầng A lên kho công khai | Quét mọi tệp nhánh đổi; đối chứng dương lấy tên lúc chạy; đột biến chèn tên vào bản chép do.mjs | fixed: khong-luat.mjs quét dòng nhánh thêm ở mọi tệp đổi so merge-base (tệp có sẵn trên base như config.yaml chỉ quét dòng thêm) cộng tài liệu và JSON; đối chứng dương chèn tên từ source_registry vào bản chép do.mjs, nêu tệp, không in tên |
